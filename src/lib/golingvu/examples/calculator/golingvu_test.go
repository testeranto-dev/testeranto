// Golingvu test example for Calculator
package calculator_test

import (
	"testing"
	
	"github.com/testeranto-dev/testeranto/src/lib/golingvu"
	"github.com/testeranto-dev/testeranto/src/lib/golingvu/examples/calculator"
)

// Test implementation for Golingvu
func createTestImplementation() golingvu.ITestImplementation {
	return golingvu.ITestImplementation{
		Suites: map[string]interface{}{
			"CalculatorSuite": func(name string, givens map[string]*golingvu.BaseGiven) *golingvu.BaseSuite {
				return &golingvu.BaseSuite{
					Key:    name,
					Givens: givens,
				}
			},
		},
		Givens: map[string]interface{}{
			"testEmptyDisplay": func(name string, features []string, whens []*golingvu.BaseWhen, thens []*golingvu.BaseThen, givenCB interface{}, initialValues interface{}) *golingvu.BaseGiven {
				return golingvu.NewBaseGiven(name, features, whens, thens, givenCB, initialValues)
			},
			"testSingleDigit": func(name string, features []string, whens []*golingvu.BaseWhen, thens []*golingvu.BaseThen, givenCB interface{}, initialValues interface{}) *golingvu.BaseGiven {
				return golingvu.NewBaseGiven(name, features, whens, thens, givenCB, initialValues)
			},
		},
		Whens: map[string]interface{}{
			"press": func(payload interface{}) *golingvu.BaseWhen {
				button := payload.(string)
				return &golingvu.BaseWhen{
					Key: "press",
					WhenCB: func(store, testResource, pm interface{}) (interface{}, error) {
						if calc, ok := store.(*calculator.Calculator); ok {
							calc.Press(button)
							return calc, nil
						}
						return store, nil
					},
				}
			},
			"enter": func(payload interface{}) *golingvu.BaseWhen {
				return &golingvu.BaseWhen{
					Key: "enter",
					WhenCB: func(store, testResource, pm interface{}) (interface{}, error) {
						if calc, ok := store.(*calculator.Calculator); ok {
							calc.Enter()
							return calc, nil
						}
						return store, nil
					},
				}
			},
		},
		Thens: map[string]interface{}{
			"result": func(payload interface{}) *golingvu.BaseThen {
				expected := payload.(string)
				return &golingvu.BaseThen{
					Key: "result",
					ThenCB: func(store, testResource, pm interface{}) (interface{}, error) {
						if calc, ok := store.(*calculator.Calculator); ok {
							actual := calc.GetDisplay()
							if actual != expected {
								// Create a simple error
								return nil, &AssertionError{Message: "expected " + expected + ", got " + actual}
							}
							return true, nil
						}
						// Create a simple error
						return nil, &AssertionError{Message: "store is not a Calculator"}
					},
				}
			},
		},
	}
}

// Test specification for Golingvu
func createTestSpecification() golingvu.ITestSpecification {
	return func(suites, givens, whens, thens interface{}) interface{} {
		return []interface{}{
			map[string]interface{}{
				"key": "CalculatorSuite",
				"givens": map[string]interface{}{
					"testEmptyDisplay": map[string]interface{}{
						"features": []string{"basic", "display"},
						"whens":    []interface{}{},
						"thens":    []interface{}{"result:"},
					},
					"testSingleDigit": map[string]interface{}{
						"features": []string{"basic", "input"},
						"whens":    []interface{}{"press:2"},
						"thens":    []interface{}{"result:2"},
					},
				},
			},
		}
	}
}

// AssertionError for testing
type AssertionError struct {
	Message string
}

func (e *AssertionError) Error() string {
	return e.Message
}

// Test using Golingvu's RunAsGoTest
func TestCalculatorWithGolingvu(t *testing.T) {
	impl := createTestImplementation()
	spec := createTestSpecification()
	
	gv := golingvu.NewGolingvu(
		nil,
		spec,
		impl,
		golingvu.DefaultTestResourceRequest,
		&golingvu.SimpleTestAdapter{},
		nil,
	)
	
	gv.WithTestingT(t).RunAsGoTest()
}

// Test using Golingvu's CreateGoTest helper
func TestCalculatorCreateGoTest(t *testing.T) {
	impl := createTestImplementation()
	spec := createTestSpecification()
	
	gv := golingvu.NewGolingvu(
		nil,
		spec,
		impl,
		golingvu.DefaultTestResourceRequest,
		&golingvu.SimpleTestAdapter{},
		nil,
	)
	
	testFunc := gv.CreateGoTest("TestCalculator")
	testFunc(t)
}

// Test using RunSimpleTest
func TestCalculatorSimple(t *testing.T) {
	gv := golingvu.NewGolingvu(
		nil,
		nil,
		golingvu.ITestImplementation{},
		golingvu.DefaultTestResourceRequest,
		&golingvu.SimpleTestAdapter{},
		nil,
	)
	
	gv.RunSimpleTest(t, func() error {
		calc := calculator.NewCalculator()
		calc.Press("2")
		if calc.GetDisplay() != "2" {
			return &AssertionError{Message: "Expected '2'"}
		}
		return nil
	})
}
