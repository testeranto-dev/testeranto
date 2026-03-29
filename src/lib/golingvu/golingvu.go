package golingvu

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// Golingvu is the main test runner class (Go implementation of Tiposkripto)
type Golingvu struct {
	TestResourceRequirement ITTestResourceRequest
	Artifacts               []interface{}
	TestJobs                []ITestJob
	TestSpecification       ITestSpecification
	SuitesOverrides         map[string]interface{}
	GivenOverrides          map[string]interface{}
	WhenOverrides           map[string]interface{}
	ThenOverrides           map[string]interface{}
	Specs                   interface{}
	totalTests              int
	assertThis              func(t interface{}) interface{}
	testAdapter             ITestAdapter
	// For reverse integration with go test
	t *testing.T
	// Test configuration for native runner
	testConfig *TestConfig
	// Test resource configuration for artifactory
	TestResourceConfiguration *ITTestResourceConfiguration
}

// WriteFileSync writes a file synchronously
// This matches the abstract method in BaseTiposkripto.ts
func (gv *Golingvu) WriteFileSync(filename string, payload string) {
	// Get base path from test resource configuration
	basePath := "testeranto"
	if gv.TestResourceConfiguration != nil {
		basePath = gv.TestResourceConfiguration.Fs
	}

	// Ensure the directory exists
	dir := filepath.Dir(filename)
	if dir != "" && dir != "." {
		// Create the directory relative to basePath
		fullDir := filepath.Join(basePath, dir)
		if err := os.MkdirAll(fullDir, 0755); err != nil {
			fmt.Printf("[Golingvu.WriteFileSync] Error creating directory %s: %v\n", fullDir, err)
			return
		}
	}

	// Create the full path
	fullPath := filepath.Join(basePath, filename)

	// Write the file
	err := os.WriteFile(fullPath, []byte(payload), 0644)
	if err != nil {
		fmt.Printf("[Golingvu.WriteFileSync] Error writing to %s: %v\n", fullPath, err)
	} else {
		fmt.Printf("[Golingvu.WriteFileSync] Wrote to %s\n", fullPath)
	}
}

// TestConfig holds configuration for native test runner integration
type TestConfig struct {
	// Run tests in parallel
	Parallel bool
	// Skip test if true
	Skip bool
	// Test timeout
	Timeout time.Duration
	// Cleanup functions
	CleanupFuncs []func()
}

// NewTestConfig creates a new TestConfig with defaults
func NewTestConfig() *TestConfig {
	return &TestConfig{
		Parallel:     false,
		Skip:         false,
		Timeout:      30 * time.Second,
		CleanupFuncs: make([]func(), 0),
	}
}

// WithTestingT sets the testing.T instance for native integration
func (gv *Golingvu) WithTestingT(t *testing.T) *Golingvu {
	gv.t = t
	if gv.testConfig == nil {
		gv.testConfig = NewTestConfig()
	}
	return gv
}

// WithTestConfig sets the test configuration
func (gv *Golingvu) WithTestConfig(config *TestConfig) *Golingvu {
	gv.testConfig = config
	return gv
}

// RunAsGoTest runs the Golingvu instance as a Go test
// This enables reverse integration with `go test`
// 
// Usage with standard Go testing:
//   func TestMyFeature(t *testing.T) {
//       gv := NewGolingvu(...)
//       gv.WithTestingT(t).RunAsGoTest()
//   }
// 
// This method supports all `go test` features including:
//   - Parallel execution (via TestConfig.Parallel)
//   - Test skipping (via TestConfig.Skip)
//   - Timeouts (via TestConfig.Timeout)
//   - Cleanup functions (via RegisterCleanup())
//   - Verbose output (via `go test -v`)
func (gv *Golingvu) RunAsGoTest() bool {
	if gv.t == nil {
		// If no testing.T provided, create a dummy test
		// This allows the framework to be used without go test
		return gv.runTestsInternal(nil)
	}

	// Set up test based on configuration
	if gv.testConfig != nil {
		if gv.testConfig.Skip {
			gv.t.Skip("Test skipped via Golingvu configuration")
			return true
		}

		if gv.testConfig.Parallel {
			gv.t.Parallel()
		}

		// Set timeout if specified
		if gv.testConfig.Timeout > 0 {
			var cancel context.CancelFunc
			ctx := context.Background()
			ctx, cancel = context.WithTimeout(ctx, gv.testConfig.Timeout)
			defer cancel()

			// Run test with timeout
			done := make(chan bool)
			go func() {
				done <- gv.runTestsInternal(gv.t)
			}()

			select {
			case <-ctx.Done():
				gv.t.Error("Test timed out")
				return false
			case result := <-done:
				return result
			}
		}

		// Register cleanup functions
		for _, cleanup := range gv.testConfig.CleanupFuncs {
			gv.t.Cleanup(cleanup)
		}
	}

	return gv.runTestsInternal(gv.t)
}

// RunTests executes tests and returns results for interoperability
// This can be called directly from Go tests or other runners
func (gv *Golingvu) RunTests() (map[string]interface{}, error) {
	// Create a default test resource configuration
	config := ITTestResourceConfiguration{
		Name: "go-test-runner",
		Fs:   ".",
	}
	gv.TestResourceConfiguration = &config
	
	// Run tests and collect results
	return gv.runActualTests()
}

// runTestsInternal executes tests and reports results to testing.T
func (gv *Golingvu) runTestsInternal(t *testing.T) bool {
	// Run tests and collect results
	results, err := gv.RunTests()
	if err != nil {
		if t != nil {
			t.Errorf("Failed to run tests: %v", err)
		}
		return false
	}

	// Check for failures
	fails, _ := results["fails"].(int)
	passed := fails == 0

	if t != nil {
		if !passed {
			t.Errorf("Test failed with %d failures", fails)
		} else {
			t.Logf("Test passed with all %d assertions", gv.totalTests)
		}
	}

	return passed
}

// TestMainIntegration provides a TestMain function for package-level test setup
func (gv *Golingvu) TestMainIntegration(m *testing.M) int {
	// Global setup
	fmt.Println("Golingvu TestMain: Setting up test environment")

	// Run tests
	code := m.Run()

	// Global teardown
	fmt.Println("Golingvu TestMain: Cleaning up test environment")

	return code
}

// CreateGoTest creates a standard Go test function that can be used with `go test`
func (gv *Golingvu) CreateGoTest(name string) func(*testing.T) {
	return func(t *testing.T) {
		// Create a new instance with the testing.T context
		testInstance := &Golingvu{
			TestResourceRequirement: gv.TestResourceRequirement,
			TestSpecification:       gv.TestSpecification,
			testAdapter:             gv.testAdapter,
			t:                       t,
			testConfig:              gv.testConfig,
		}

		// Initialize from the parent instance
		testInstance.SuitesOverrides = gv.SuitesOverrides
		testInstance.GivenOverrides = gv.GivenOverrides
		testInstance.WhenOverrides = gv.WhenOverrides
		testInstance.ThenOverrides = gv.ThenOverrides
		testInstance.Specs = gv.Specs
		testInstance.totalTests = gv.totalTests
		testInstance.assertThis = gv.assertThis

		// Run the test
		testInstance.RunAsGoTest()
	}
}

// RunSimpleTest is a convenience method for running a simple test without complex setup
// This is useful for interoperability with standard Go testing
func (gv *Golingvu) RunSimpleTest(t *testing.T, testFunc func() error) {
	if t == nil {
		// Run without testing.T
		if err := testFunc(); err != nil {
			fmt.Printf("Test failed: %v\n", err)
		}
		return
	}
	
	// Run with testing.T
	if err := testFunc(); err != nil {
		t.Errorf("Test failed: %v", err)
	} else {
		t.Log("Test passed")
	}
}

// RegisterCleanup adds a cleanup function to be called after test execution
func (gv *Golingvu) RegisterCleanup(cleanupFunc func()) {
	if gv.testConfig == nil {
		gv.testConfig = NewTestConfig()
	}
	gv.testConfig.CleanupFuncs = append(gv.testConfig.CleanupFuncs, cleanupFunc)
}


// NewGolingvu creates a new Golingvu instance
func NewGolingvu(
	input interface{},
	testSpecification ITestSpecification,
	testImplementation ITestImplementation,
	testResourceRequirement ITTestResourceRequest,
	testAdapter ITestAdapter,
	uberCatcher func(func()),
) *Golingvu {
	gv := &Golingvu{
		TestResourceRequirement: testResourceRequirement,
		Artifacts:               make([]interface{}, 0),
		SuitesOverrides:         make(map[string]interface{}),
		GivenOverrides:          make(map[string]interface{}),
		WhenOverrides:           make(map[string]interface{}),
		ThenOverrides:           make(map[string]interface{}),
		assertThis: func(t interface{}) interface{} {
			return testAdapter.AssertThis(t)
		},
		testAdapter:               testAdapter,
		TestResourceConfiguration: nil,
	}

	// Create classy implementations as functions that return instances
	// We need to handle multiple patterns: BDD (Given, When, Then), TDT (Value, Should, Expected), Describe-It (Describe, It)
	
	classySuites := make(map[string]interface{})
	for key := range testImplementation.Suites {
		classySuites[key] = func(somestring string, setups map[string]interface{}) *BaseSuite {
			// Convert setups to givens for BaseSuite
			givens := make(map[string]*BaseGiven)
			for setupKey, setup := range setups {
				if given, ok := setup.(*BaseGiven); ok {
					givens[setupKey] = given
				}
			}
			return &BaseSuite{
				Key:    somestring,
				Givens: givens,
				AfterAllFunc: func(store interface{}, artifactory func(string, interface{}), artifactoryObj interface{}) interface{} {
					return testAdapter.AfterAll(store, artifactoryObj)
				},
				AssertThatFunc: func(t interface{}) bool {
					return testAdapter.AssertThis(t)
				},
				SetupFunc: func(s interface{}, artifactory func(string, interface{}), tr ITTestResourceConfiguration, artifactoryObj interface{}) interface{} {
					result := testAdapter.BeforeAll(s, tr, artifactoryObj)
					if result == nil {
						return s
					}
					return result
				},
			}
		}
	}

	// BDD Pattern: Givens
	classyGivens := make(map[string]interface{})
	for key, g := range testImplementation.Givens {
		givenCB := g
		classyGivens[key] = func(key string, features []string, whens []*BaseWhen, thens []*BaseThen, gcb interface{}, initialValues interface{}) *BaseGiven {
			return NewBaseGiven(key, features, whens, thens, givenCB, initialValues)
		}
	}

	// BDD Pattern: Whens
	classyWhens := make(map[string]interface{})
	for key, whEn := range testImplementation.Whens {
		whenKey := key
		whenCB := whEn
		classyWhens[key] = func(payload ...interface{}) *BaseWhen {
			return NewBaseWhen(whenKey, whenCB)
		}
	}

	// BDD Pattern: Thens
	classyThens := make(map[string]interface{})
	for key, thEn := range testImplementation.Thens {
		thenKey := key
		thenCB := thEn
		classyThens[key] = func(args ...interface{}) *BaseThen {
			return NewBaseThen(thenKey, thenCB)
		}
	}

	// TDT Pattern: Values
	classyValues := make(map[string]interface{})
	// Check if Values exist in testImplementation
	if values, ok := testImplementation.Suites["Values"]; ok {
		// Handle TDT pattern
		if valueMap, ok := values.(map[string]interface{}); ok {
			for key, val := range valueMap {
				_ = val // valueCB is not used
				classyValues[key] = func(features []string, tableRows [][]interface{}, confirmCB interface{}, initialValues interface{}) *BaseValue {
					return NewBaseValue(features, tableRows, confirmCB, initialValues)
				}
			}
		}
	}

	// TDT Pattern: Shoulds
	// classyShoulds is not used, so we don't need to declare it

	// TDT Pattern: Expecteds
	// classyExpecteds is not used, so we don't need to declare it

	// Describe-It Pattern: Describes
	// classyDescribes is not used, so we don't need to declare it

	// Describe-It Pattern: Its
	// classyIts is not used, so we don't need to declare it

	// Set up the overrides
	gv.SuitesOverrides = classySuites
	gv.GivenOverrides = classyGivens
	gv.WhenOverrides = classyWhens
	gv.ThenOverrides = classyThens
	gv.TestResourceRequirement = testResourceRequirement
	gv.TestSpecification = testSpecification

	// Generate specs
	specs := testSpecification(
		gv.Suites(),
		gv.Given(),
		gv.When(),
		gv.Then(),
	)

	// Ensure specs is properly formatted as a slice
	if specsSlice, ok := specs.([]interface{}); ok {
		gv.Specs = specsSlice
	} else {
		// If it's not a slice, wrap it in one
		gv.Specs = []interface{}{specs}
	}

	// Calculate total number of tests (sum of all Givens across all Suites)
	// This needs to be implemented based on the actual structure
	// For now, we'll set a placeholder
	gv.totalTests = 0
	// Implementation to count Givens would go here

	// Create test jobs based on the specifications
	gv.TestJobs = make([]ITestJob, 0)
	gv.totalTests = 0

	// Parse the specs to create test jobs
	if specs, ok := gv.Specs.([]interface{}); ok {
		for _, suite := range specs {
			if suiteMap, ok := suite.(map[string]interface{}); ok {
				if givensMap, exists := suiteMap["givens"].(map[string]interface{}); exists {
					for key := range givensMap {
						gv.TestJobs = append(gv.TestJobs, &BaseTestJob{
							Name: key,
						})
						gv.totalTests++
					}
				}
			}
		}
	}

	// If no test jobs were created, add a default one
	if len(gv.TestJobs) == 0 {
		gv.TestJobs = append(gv.TestJobs, &BaseTestJob{
			Name: "DefaultTest",
		})
		gv.totalTests = 1
	}

	return gv
}

// NewGolingvuFromFlavored creates a new Golingvu instance from a flavored test specification
// This is a convenience function for integration with the flavored package
func NewGolingvuFromFlavored(
	description string,
	setupFunc func() interface{},
	whenSteps []interface{},
	thenSteps []interface{},
) *Golingvu {
	// Create a simple test adapter
	adapter := &SimpleTestAdapter{}

	// Create a test implementation that matches the flavored structure
	impl := ITestImplementation{
		Suites: map[string]interface{}{
			"FlavoredSuite": "Flavored Test Suite",
		},
		Givens: map[string]interface{}{
			description: func() interface{} {
				return setupFunc()
			},
		},
		Whens: make(map[string]interface{}),
		Thens: make(map[string]interface{}),
	}

	// Add when steps - these functions should match ITestImplementation.Whens signature
	for i := range whenSteps {
		stepName := fmt.Sprintf("WhenStep%d", i)
		// Store the step function directly
		impl.Whens[stepName] = whenSteps[i]
	}

	// Add then steps - these functions should match ITestImplementation.Thens signature
	for i := range thenSteps {
		stepName := fmt.Sprintf("ThenStep%d", i)
		// Store the step function directly
		impl.Thens[stepName] = thenSteps[i]
	}

	// Create a test specification that matches the flavored structure
	spec := func(suites, givens, whens, thens interface{}) interface{} {
		// Convert whenSteps to a slice of step names
		whenNames := make([]interface{}, len(whenSteps))
		for i := range whenSteps {
			whenNames[i] = fmt.Sprintf("WhenStep%d", i)
		}

		// Convert thenSteps to a slice of step names
		thenNames := make([]interface{}, len(thenSteps))
		for i := range thenSteps {
			thenNames[i] = fmt.Sprintf("ThenStep%d", i)
		}

		return []interface{}{
			map[string]interface{}{
				"key": description,
				"givens": map[string]interface{}{
					description: map[string]interface{}{
						"features": []string{"flavored"},
						"whens":    whenNames,
						"thens":    thenNames,
					},
				},
			},
		}
	}

	// Create the Golingvu instance
	return NewGolingvu(
		nil,
		spec,
		impl,
		DefaultTestResourceRequest,
		adapter,
		func(f func()) {
			defer func() {
				if r := recover(); r != nil {
					// Log the panic but don't fail since we don't have access to testing.T here
					fmt.Printf("Test panicked: %v\n", r)
				}
			}()
			f()
		},
	)
}

// ReceiveTestResourceConfig receives test resource configuration and executes tests
func (gv *Golingvu) ReceiveTestResourceConfig(partialTestResource string) (IFinalResults, error) {
	// Parse the test resource configuration
	var testResourceConfig ITTestResourceConfiguration
	err := json.Unmarshal([]byte(partialTestResource), &testResourceConfig)
	if err != nil {
		// If parsing fails, try with a minimal configuration
		// This helps with interoperability when the format isn't exact
		testResourceConfig = ITTestResourceConfiguration{
			Name: "interop-runner",
			Fs:   ".",
		}
	}

	// Store the test resource configuration for use in tests
	gv.TestResourceConfiguration = &testResourceConfig

	// Run the actual tests and capture results
	testResults, err := gv.runActualTests()

	if err != nil {
		return IFinalResults{
			Failed:       true,
			Fails:        -1,
			Artifacts:    []interface{}{},
			Features:     []string{},
			Tests:        0,
			RunTimeTests: -1,
		}, fmt.Errorf("failed to run tests: %v", err)
	}

	// Calculate total fails from test results
	totalFails := 0
	if fails, exists := testResults["fails"].(int); exists {
		totalFails = fails
	}

	// Only write tests.json if we have a valid filesystem path
	if testResourceConfig.Fs != "" && testResourceConfig.Fs != "." {
		data, err := json.MarshalIndent(testResults, "", "  ")
		if err != nil {
			return IFinalResults{
				Failed:       true,
				Fails:        -1,
				Artifacts:    []interface{}{},
				Features:     []string{},
				Tests:        0,
				RunTimeTests: -1,
			}, fmt.Errorf("failed to marshal tests.json: %v", err)
		}

		// Follow the same pattern as tiposkripto: write to ${testResourceConfig.Fs}/tests.json
		filePath := filepath.Join(testResourceConfig.Fs, "tests.json")

		// Ensure the directory exists
		dirPath := filepath.Dir(filePath)
		if dirPath != "" && dirPath != "." {
			if err := os.MkdirAll(dirPath, 0755); err != nil {
				return IFinalResults{
					Failed:       true,
					Fails:        -1,
					Artifacts:    []interface{}{},
					Features:     []string{},
					Tests:        0,
					RunTimeTests: -1,
				}, fmt.Errorf("failed to create directory %s: %v", dirPath, err)
			}
		}

		fmt.Printf("writing tests.json to ->: %s\n", filePath)

		// Write the file directly using the artifactory approach
		err = os.WriteFile(filePath, data, 0644)
		if err != nil {
			return IFinalResults{
				Failed:       true,
				Fails:        -1,
				Artifacts:    []interface{}{},
				Features:     []string{},
				Tests:        0,
				RunTimeTests: -1,
			}, fmt.Errorf("failed to write tests.json: %v", err)
		}
	}

	result := IFinalResults{
		Failed:       totalFails > 0,
		Fails:        totalFails,
		Artifacts:    []interface{}{},
		Features:     []string{},
		Tests:        gv.totalTests,
		RunTimeTests: gv.totalTests,
	}

	return result, nil
}

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
		// Handle case where specs might not be a slice
		if gv.Specs != nil {
			// Wrap single spec in a slice
			specs = []interface{}{gv.Specs}
		} else {
			specs = []interface{}{}
		}
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
			var givenObj *BaseGiven
			switch g := given.(type) {
			case *BaseGiven:
				givenObj = g
			case map[string]interface{}:
				// Try to convert map to BaseGiven
				// This is a simplified conversion - in reality, we'd need more logic
				continue
			default:
				continue
			}

			// Execute the test and record actual results
			processedGiven, testFailed, err := gv.executeTest(key, givenObj)
			if err != nil {
				return nil, err
			}

			if testFailed {
				totalFails++
			}

			// Add to results
			givensSlice := results["givens"].([]interface{})
			results["givens"] = append(givensSlice, processedGiven)

			// Add features to overall features (deduplicated)
			if features, exists := processedGiven["features"].([]string); exists {
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

// executeTest actually runs a test and records its results to match Node.js format
func (gv *Golingvu) executeTest(key string, given *BaseGiven) (map[string]interface{}, bool, error) {
	// Create the test result structure that matches the Node.js format exactly
	processedGiven := map[string]interface{}{
		"key":       key,
		"whens":     make([]map[string]interface{}, 0),
		"thens":     make([]map[string]interface{}, 0),
		"error":     nil,
		"features":  given.Features,
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

	// Create initial subject using BeforeAll
	store := gv.testAdapter.BeforeAll(nil, testResource, nil)

	// Process whens - execute each when step
	for _, when := range given.Whens {
		var whenError error = nil
		whenName := when.Key

		// Execute the when callback using the adapter's AndWhen
		// The adapter's AndWhen will handle calling the actual whenCB
		newStore := gv.testAdapter.AndWhen(store, when.WhenCB, testResource, nil)
		if newStore != nil {
			store = newStore
		}

		// Record the when step according to the Node.js format
		processedWhen := map[string]interface{}{
			"key":       whenName,
			"status":    whenError == nil,
			"error":     whenError,
			"artifacts": make([]interface{}, 0),
		}
		// Append to whens
		whensSlice := processedGiven["whens"].([]map[string]interface{})
		processedGiven["whens"] = append(whensSlice, processedWhen)
	}

	// Process thens - execute each then step
	for _, then := range given.Thens {
		var thenError error = nil
		thenName := then.Key
		thenStatus := true

		// Execute the then callback using the adapter's ButThen
		result := gv.testAdapter.ButThen(store, then.ThenCB, testResource, nil)

		// Check the result
		// The adapter's AssertThis can be used to validate
		success := gv.testAdapter.AssertThis(result)
		if !success {
			thenError = fmt.Errorf("assertion failed")
			thenStatus = false
			testFailed = true
			processedGiven["status"] = false
			if processedGiven["error"] == nil {
				processedGiven["error"] = thenError
			}
		}

		// Record the then step according to the Node.js format
		processedThen := map[string]interface{}{
			"key":       thenName,
			"error":     thenError != nil,
			"artifacts": make([]interface{}, 0),
			"status":    thenStatus,
		}
		// Append to thens
		thensSlice := processedGiven["thens"].([]map[string]interface{})
		processedGiven["thens"] = append(thensSlice, processedThen)
	}

	return processedGiven, testFailed, nil
}

// Suites returns the suites overrides
func (gv *Golingvu) Suites() map[string]interface{} {
	return gv.SuitesOverrides
}

// Given returns the given overrides
func (gv *Golingvu) Given() map[string]interface{} {
	return gv.GivenOverrides
}

// When returns the when overrides
func (gv *Golingvu) When() map[string]interface{} {
	return gv.WhenOverrides
}

// Then returns the then overrides
func (gv *Golingvu) Then() map[string]interface{} {
	return gv.ThenOverrides
}

// GetTestJobs returns the test jobs
func (gv *Golingvu) GetTestJobs() []ITestJob {
	return gv.TestJobs
}

// GetSpecs returns the generated specs
func (gv *Golingvu) GetSpecs() interface{} {
	return gv.Specs
}

// GetTotalTests returns the total number of tests
func (gv *Golingvu) GetTotalTests() int {
	return gv.totalTests
}

// CreateArtifactory creates an artifactory for writing files
func (gv *Golingvu) CreateArtifactory(context map[string]interface{}) interface{} {
	// Return an object with only WriteFileSync for Go context
	// Screenshot and screencast don't make sense in Go
	return struct {
		WriteFileSync func(filename string, payload string)
	}{
		WriteFileSync: func(filename string, payload string) {
			// Build the path based on context
			var path string

			// Add suite context if available
			if suiteIndex, ok := context["suiteIndex"].(int); ok {
				path += fmt.Sprintf("suite-%d/", suiteIndex)
			}

			// Add given context if available
			if givenKey, ok := context["givenKey"].(string); ok {
				path += fmt.Sprintf("given-%s/", givenKey)
			}

			// Add when or then context
			if whenIndex, ok := context["whenIndex"].(int); ok {
				path += fmt.Sprintf("when-%d ", whenIndex)
			} else if thenIndex, ok := context["thenIndex"].(int); ok {
				path += fmt.Sprintf("then-%d ", thenIndex)
			}

			path += filename

			// Ensure proper extension
			if !strings.Contains(path, ".") {
				path += ".txt"
			}

			// Get base path from test resource configuration
			basePath := "testeranto"
			if gv.TestResourceConfiguration != nil {
				basePath = gv.TestResourceConfiguration.Fs
			}

			// Prepend the base path, avoiding double slashes
			basePathClean := strings.TrimSuffix(basePath, "/")
			pathClean := strings.TrimPrefix(path, "/")
			fullPath := fmt.Sprintf("%s/%s", basePathClean, pathClean)

			// Use the WriteFileSync method
			gv.WriteFileSync(fullPath, payload)
		},
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// RunFlavoredTest is a convenience method to run a flavored test directly
func (gv *Golingvu) RunFlavoredTest(t *testing.T, description string, setupFunc func() interface{}) *Golingvu {
	// This is a simple wrapper that creates a test chain and converts it
	// For more complex tests, use the flavored package directly
	// chain := &struct{
	// 	t *testing.T
	// 	description string
	// 	setupFunc func() interface{}
	// }{
	// 	t: t,
	// 	description: description,
	// 	setupFunc: setupFunc,
	// }

	// In a real implementation, this would create a proper test chain
	// For now, return the current instance
	return gv
}

// Support for new unified patterns
func (gv *Golingvu) UseUnifiedPatterns() {
	// This method can be used to enable the new unified architecture
	// For now, it's a placeholder for future implementation
}

// CreateValue creates a TDT pattern test with Value, Should, Expected
func (gv *Golingvu) CreateValue(
	name string,
	features []string,
	tableRows [][]interface{},
	confirmCB interface{},
	initialValues interface{},
) *BaseValue {
	return NewBaseValue(features, tableRows, confirmCB, initialValues)
}

// CreateDescribe creates a Describe-It pattern test
func (gv *Golingvu) CreateDescribe(
	name string,
	features []string,
	its []interface{},
	describeCB interface{},
	initialValues interface{},
) *BaseDescribe {
	return NewBaseDescribe(features, its, describeCB, initialValues)
}

// CreateIt creates an It for Describe-It pattern
func (gv *Golingvu) CreateIt(
	name string,
	itCB interface{},
) *BaseIt {
	return NewBaseIt(name, itCB)
}

// AssertThis is a helper function for assertions
func (gv *Golingvu) AssertThis(t interface{}) interface{} {
	return gv.assertThis(t)
}

// BaseTestJob implements ITestJob for basic test execution
type BaseTestJob struct {
	Name string
}

func (bj *BaseTestJob) ToObj() map[string]interface{} {
	return map[string]interface{}{
		"key": bj.Name,
	}
}

func (bj *BaseTestJob) Runner(artifactory interface{}, tLog func(...string)) (interface{}, error) {
	// Log that we're running the test
	if tLog != nil {
		tLog("Running test:", bj.Name)
	}

	// For now, we'll return a result that matches the Node.js test structure
	// This should include detailed information about whens and thens
	// In a real implementation, this would execute the actual test steps

	// Based on the Node.js results, each test has:
	// key, whens, thens, error, features, artifacts
	result := map[string]interface{}{
		"key":       bj.Name,
		"whens":     []map[string]interface{}{},
		"thens":     []map[string]interface{}{},
		"error":     nil,
		"features":  []string{},
		"artifacts": []interface{}{},
	}

	return result, nil
}

func (bj *BaseTestJob) ReceiveTestResourceConfig() (IFinalResults, error) {

	fmt.Println("ReceiveTestResourceConfig")

	// Execute the test using the runner
	tLog := func(messages ...string) {
		// Simple logging function
		for _, msg := range messages {
			fmt.Println(msg)
		}
	}

	// Run the test
	result, err := bj.Runner(nil, tLog)
	if err != nil {
		return IFinalResults{
			Failed:       true,
			Fails:        1,
			Artifacts:    []interface{}{},
			Features:     []string{},
			Tests:        1,
			RunTimeTests: 1,
		}, err
	}

	// Check if the test passed or failed by looking at the thens
	failed := false
	if resultMap, ok := result.(map[string]interface{}); ok {
		// Check each then for errors
		if thens, exists := resultMap["thens"].([]map[string]interface{}); exists {
			for _, then := range thens {
				if thenError, exists := then["error"].(bool); exists && thenError {
					failed = true
					break
				}
			}
		}
	}

	return IFinalResults{
		Failed:       failed,
		Fails:        boolToInt(failed),
		Artifacts:    []interface{}{},
		Features:     []string{},
		Tests:        1,
		RunTimeTests: 1,
	}, nil
}

// Helper function to convert bool to int
func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

// Helper function to write a file directly (fallback)
func writeFileDirectly(path string, content string) error {
	// Create directory if it doesn't exist
	dir := filepath.Dir(path)
	err := os.MkdirAll(dir, 0755)
	if err != nil {
		return err
	}

	// Write the file
	return os.WriteFile(path, []byte(content), 0644)
}

// Helper function to read a file directly
func readFileDirectly(path string) (string, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(content), nil
}


