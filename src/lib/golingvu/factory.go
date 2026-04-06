package golingvu

import (
	"fmt"
)


// NewGolingvu creates a new Golingvu instance
func NewGolingvu(
	input interface{},
	testSpecification ITestSpecification,
	testImplementation ITestImplementation,
	testResourceRequirement ITTestResourceRequest,
	testAdapter ITestAdapter,
	uberCatcher func(func()),
) *Golingvu {
	// Ensure maps are not nil
	if testImplementation.Suites == nil {
		testImplementation.Suites = make(map[string]interface{})
	}
	if testImplementation.Givens == nil {
		testImplementation.Givens = make(map[string]interface{})
	}
	if testImplementation.Whens == nil {
		testImplementation.Whens = make(map[string]interface{})
	}
	if testImplementation.Thens == nil {
		testImplementation.Thens = make(map[string]interface{})
	}
	if testImplementation.Values == nil {
		testImplementation.Values = make(map[string]interface{})
	}
	if testImplementation.Shoulds == nil {
		testImplementation.Shoulds = make(map[string]interface{})
	}
	if testImplementation.Expecteds == nil {
		testImplementation.Expecteds = make(map[string]interface{})
	}
	if testImplementation.Describes == nil {
		testImplementation.Describes = make(map[string]interface{})
	}
	if testImplementation.Its == nil {
		testImplementation.Its = make(map[string]interface{})
	}
	if testImplementation.Confirms == nil {
		testImplementation.Confirms = make(map[string]interface{})
	}
	
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
	if testImplementation.Givens != nil {
		for key, givenFunc := range testImplementation.Givens {
			classyGivens[key] = givenFunc
		}
	}

	// BDD Pattern: Whens
	classyWhens := make(map[string]interface{})
	if testImplementation.Whens != nil {
		for key, whenFunc := range testImplementation.Whens {
			classyWhens[key] = whenFunc
		}
	}

	// BDD Pattern: Thens
	classyThens := make(map[string]interface{})
	if testImplementation.Thens != nil {
		for key, thenFunc := range testImplementation.Thens {
			classyThens[key] = thenFunc
		}
	}

	// TDT Pattern: Values
	classyValues := make(map[string]interface{})
	if testImplementation.Values != nil {
		for key, val := range testImplementation.Values {
			valueCB := val
			classyValues[key] = func(features []string, tableRows [][]interface{}, confirmCB interface{}, initialValues interface{}) *BaseValue {
				// Use the captured valueCB
				return NewBaseValue(features, tableRows, valueCB, initialValues)
			}
		}
	}

	// TDT Pattern: Shoulds
	classyShoulds := make(map[string]interface{})
	if testImplementation.Shoulds != nil {
		for key, shouldCB := range testImplementation.Shoulds {
			shouldKey := key
			cb := shouldCB
			classyShoulds[key] = func(args ...interface{}) *BaseShould {
				return NewBaseShould(shouldKey, cb)
			}
		}
	}

	// TDT Pattern: Expecteds
	classyExpecteds := make(map[string]interface{})
	if testImplementation.Expecteds != nil {
		for key, expectedCB := range testImplementation.Expecteds {
			expectedKey := key
			cb := expectedCB
			classyExpecteds[key] = func(args ...interface{}) *BaseExpected {
				return NewBaseExpected(expectedKey, cb)
			}
		}
	}

	// AAA Pattern: Describes
	classyDescribes := make(map[string]interface{})
	if testImplementation.Describes != nil {
		for key, desc := range testImplementation.Describes {
			describeCB := desc
			classyDescribes[key] = func(name string, features []string, its []interface{}, cb interface{}, initialValues interface{}) *BaseDescribe {
				// Use the captured describeCB
				return NewBaseDescribe(features, its, describeCB, initialValues)
			}
		}
	}

	// AAA Pattern: Its
	classyIts := make(map[string]interface{})
	if testImplementation.Its != nil {
		for key, itCB := range testImplementation.Its {
			itKey := key
			cb := itCB
			classyIts[key] = func(args ...interface{}) *BaseIt {
				return NewBaseIt(itKey, cb)
			}
		}
	}

	// TDT Pattern: Confirms
	classyConfirms := make(map[string]interface{})
	if testImplementation.Confirms != nil {
		for key, confirmCB := range testImplementation.Confirms {
			cb := confirmCB
			classyConfirms[key] = func(features []string, testCases [][]interface{}, _ interface{}, initialValues interface{}) *BaseConfirm {
				// Use the captured cb
				return NewBaseConfirm(features, testCases, cb, initialValues)
			}
		}
	}

	// Set up the overrides
	gv.SuitesOverrides = classySuites
	gv.GivenOverrides = classyGivens
	gv.WhenOverrides = classyWhens
	gv.ThenOverrides = classyThens
	gv.ValuesOverrides = classyValues
	gv.ShouldsOverrides = classyShoulds
	gv.ExpectedsOverrides = classyExpecteds
	gv.DescribesOverrides = classyDescribes
	gv.ItsOverrides = classyIts
	gv.ConfirmsOverrides = classyConfirms
	gv.TestResourceRequirement = testResourceRequirement
	gv.TestSpecification = testSpecification

	// Generate specs if testSpecification is not nil
	if testSpecification != nil {
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
	} else {
		// If testSpecification is nil, create empty specs
		gv.Specs = []interface{}{}
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

