package golingvu

import (
	"fmt"
)

// executeTest actually runs a test and records its results to match Node.js format
// It now accepts different test step types: *BaseGiven, *BaseDescribe, *BaseConfirm
func (gv *Golingvu) executeTest(key string, testStep interface{}) (map[string]interface{}, bool, error) {
	// Create the test result structure that matches the Node.js format exactly
	processedStep := map[string]interface{}{
		"key":       key,
		"whens":     make([]map[string]interface{}, 0),
		"thens":     make([]map[string]interface{}, 0),
		"its":       make([]map[string]interface{}, 0),
		"error":     nil,
		"features":  []string{},
		"artifacts": make([]interface{}, 0),
		"status":    true, // Default to true, will be set to false if any step fails
	}

	// Track if the test failed
	testFailed := false

	// Use the adapter to create initial store
	// We need a test resource configuration - create a minimal one
	testResource := ITTestResourceConfiguration{
		Name: "test",
		Fs:   "./",
	}

	// Create artifactory for the test
	artifactoryObj := gv.CreateArtifactory(map[string]interface{}{
		"givenKey": key,
	})

	// Create initial subject using BeforeAll with artifactory
	store := gv.testAdapter.BeforeAll(nil, testResource, artifactoryObj)
	
	// For BaseGiven, we need to execute the given callback to get the actual subject
	if step, ok := testStep.(*BaseGiven); ok && step.GivenCB != nil {
		// Try to call the given callback
		if givenFunc, ok := step.GivenCB.(func() interface{}); ok {
			store = givenFunc()
		}
	}

	// Handle different test step types
	switch step := testStep.(type) {
	case *BaseGiven:
		// BDD pattern
		processedStep["features"] = step.Features
		
		// Process whens
		for whenIndex, when := range step.Whens {
			var whenError error = nil
			whenName := when.Key

			// Create artifactory for when context
			whenArtifactoryObj := gv.CreateArtifactory(map[string]interface{}{
				"givenKey":  key,
				"whenIndex": whenIndex,
			})

			// Execute the when callback using the adapter's AndWhen
			newStore := gv.testAdapter.AndWhen(store, when.WhenCB, testResource, whenArtifactoryObj)
			if newStore != nil {
				store = newStore
			}

			// Record the when step
			processedWhen := map[string]interface{}{
				"key":       whenName,
				"status":    whenError == nil,
				"error":     whenError,
				"artifacts": make([]interface{}, 0),
			}
			whensSlice := processedStep["whens"].([]map[string]interface{})
			processedStep["whens"] = append(whensSlice, processedWhen)
		}

		// Process thens
		for thenIndex, then := range step.Thens {
			var thenError error = nil
			thenName := then.Key
			thenStatus := true

			// Create artifactory for then context
			thenArtifactoryObj := gv.CreateArtifactory(map[string]interface{}{
				"givenKey":  key,
				"thenIndex": thenIndex,
			})

			// Execute the then callback using the adapter's ButThen
			result := gv.testAdapter.ButThen(store, then.ThenCB, testResource, thenArtifactoryObj)

			// Check the result
			success := gv.testAdapter.AssertThis(result)
			if !success {
				thenError = fmt.Errorf("assertion failed")
				thenStatus = false
				testFailed = true
				processedStep["status"] = false
				if processedStep["error"] == nil {
					processedStep["error"] = thenError
				}
			}

			// Record the then step
			processedThen := map[string]interface{}{
				"key":       thenName,
				"error":     thenError != nil,
				"artifacts": make([]interface{}, 0),
				"status":    thenStatus,
			}
			thensSlice := processedStep["thens"].([]map[string]interface{})
			processedStep["thens"] = append(thensSlice, processedThen)
		}

	case *BaseDescribe:
		// AAA pattern
		processedStep["features"] = step.Features
		
		// Process its
		for itIndex, it := range step.Its {
			var itError error = nil
			var itName string
			itStatus := true

			// Try to get the name from the it object
			if baseIt, ok := it.(*BaseIt); ok {
				itName = baseIt.Name
			} else if obj, ok := it.(map[string]interface{}); ok {
				if name, exists := obj["name"].(string); exists {
					itName = name
				} else {
					itName = fmt.Sprintf("it-%d", itIndex)
				}
			} else {
				itName = fmt.Sprintf("it-%d", itIndex)
			}

			// Create artifactory for it context
			itArtifactoryObj := gv.CreateArtifactory(map[string]interface{}{
				"givenKey": key,
				"itIndex":  itIndex,
			})

			// Convert itArtifactoryObj to func(string, interface{})
			var itArtifactoryFunc func(string, interface{})
			if obj, ok := itArtifactoryObj.(interface {
				WriteFileSync(filename string, payload string)
			}); ok {
				itArtifactoryFunc = func(filename string, payload interface{}) {
					var payloadStr string
					switch v := payload.(type) {
					case string:
						payloadStr = v
					default:
						payloadStr = fmt.Sprintf("%v", v)
					}
					obj.WriteFileSync(filename, payloadStr)
				}
			} else {
				// Fallback
				itArtifactoryFunc = func(filename string, payload interface{}) {
					// Do nothing
				}
			}

			// Execute the it callback
			// For AAA pattern, we need to handle It differently
			// Since BaseIt has a Test method
			if baseIt, ok := it.(*BaseIt); ok {
				_, err := baseIt.Test(store, testResource, itArtifactoryFunc)
				if err != nil {
					itError = err
					itStatus = false
					testFailed = true
					processedStep["status"] = false
					if processedStep["error"] == nil {
						processedStep["error"] = itError
					}
				}
			}

			// Record the it step
			processedIt := map[string]interface{}{
				"name":      itName,
				"error":     itError != nil,
				"artifacts": make([]interface{}, 0),
				"status":    itStatus,
			}
			itsSlice := processedStep["its"].([]map[string]interface{})
			processedStep["its"] = append(itsSlice, processedIt)
		}

	case *BaseConfirm:
		// TDT pattern
		processedStep["features"] = step.Features
		
		// Process test cases
		// For TDT, we need to handle test cases which are [Value, Should] pairs
		// This is more complex and would need proper implementation
		// For now, we'll just mark it as not implemented
		processedStep["error"] = "TDT pattern execution not fully implemented"
		testFailed = true
		processedStep["status"] = false

	default:
		return nil, true, fmt.Errorf("unsupported test step type: %T", testStep)
	}

	return processedStep, testFailed, nil
}
