package golingvu

import (
	"fmt"
)

// runActualTests executes the actual test jobs and returns results matching Node.js format
func (gv *Golingvu) runActualTests() (map[string]interface{}, error) {
	// Create the structure that matches the Node.js implementation exactly
	results := make(map[string]interface{})

	// Initialize the results structure with proper types
	results["givens"] = make([]interface{}, 0)
	results["features"] = make([]string, 0)
	results["key"] = "default"

	// Track total failures
	totalFails := 0

	// Parse the specs and actually execute the tests
	var specs []interface{}
	switch s := gv.Specs.(type) {
	case []interface{}:
		specs = s
	case []map[string]interface{}:
		// Convert to []interface{}
		specs = make([]interface{}, len(s))
		for i, v := range s {
			specs[i] = v
		}
	default:
		// According to SOUL.md, propagate errors rather than using fallbacks
		return nil, fmt.Errorf("invalid specs type: %T", gv.Specs)
	}

	for _, suite := range specs {
		suiteMap, ok := suite.(map[string]interface{})
		if !ok {
			// Try to see if it's a BaseSuite
			if suiteObj, ok := suite.(*BaseSuite); ok {
				// Convert BaseSuite to map
				suiteMap = suiteObj.ToObj()
			} else {
				// Skip non-map entries
				continue
			}
		}

		// Set the key from the suite
		if suiteName, exists := suiteMap["key"].(string); exists {
			results["key"] = suiteName
		}

		// Process givens
		var givensMap map[string]interface{}
		if g, exists := suiteMap["givens"].(map[string]interface{}); exists {
			givensMap = g
		} else if g, exists := suiteMap["givens"].(map[string]*BaseGiven); exists {
			// Convert to map[string]interface{}
			givensMap = make(map[string]interface{})
			for k, v := range g {
				givensMap[k] = v
			}
		} else {
			continue
		}

		for key, given := range givensMap {
			// Handle different test step types
			var processedStep map[string]interface{}
			var testFailed bool
			var err error
			
			switch step := given.(type) {
			case *BaseGiven:
				processedStep, testFailed, err = gv.executeTest(key, step)
			case *BaseDescribe:
				processedStep, testFailed, err = gv.executeTest(key, step)
			case *BaseConfirm:
				processedStep, testFailed, err = gv.executeTest(key, step)
			case *BaseValue:
				// Convert BaseValue to BaseConfirm for execution
				// This is a simplification for now
				confirm := &BaseConfirm{
					BaseSetup: step.BaseSetup,
					TestCases: step.TableRows,
				}
				processedStep, testFailed, err = gv.executeTest(key, confirm)
			case map[string]interface{}:
				// Convert map to BaseGiven for backward compatibility
				baseGiven, err := gv.convertMapToBaseGiven(key, step)
				if err != nil {
					return nil, fmt.Errorf("failed to convert map to BaseGiven for key %s: %v", key, err)
				}
				processedStep, testFailed, err = gv.executeTest(key, baseGiven)
			default:
				return nil, fmt.Errorf("unsupported test step type for key %s: %T", key, given)
			}
			
			if err != nil {
				return nil, err
			}

			if testFailed {
				totalFails++
			}

			// Add to results
			givensSlice := results["givens"].([]interface{})
			results["givens"] = append(givensSlice, processedStep)

			// Add features to overall features (deduplicated)
			if features, exists := processedStep["features"].([]string); exists {
				existingFeatures := results["features"].([]string)
				featureSet := make(map[string]bool)

				// Add existing features to set
				for _, feature := range existingFeatures {
					featureSet[feature] = true
				}

				// Add new features
				for _, feature := range features {
					if !featureSet[feature] {
						existingFeatures = append(existingFeatures, feature)
						featureSet[feature] = true
					}
				}
				results["features"] = existingFeatures
			}
		}
	}

	results["fails"] = totalFails

	return results, nil
}
