// Package golingvu - interoperability tests
package golingvu

import (
	"testing"
)

// TestInteropNativeToGolingvu tests converting native Go tests to Golingvu
func TestInteropNativeToGolingvu(t *testing.T) {
	// Create a simple native test implementation
	adapter := &SimpleTestAdapter{}
	
	impl := ITestImplementation{
		Suites: map[string]interface{}{
			"InteropSuite": "Interoperability Test Suite",
		},
		Givens: map[string]interface{}{
			"testInterop": func() interface{} { return "test subject" },
		},
		Whens: map[string]interface{}{
			"transform": func(payload interface{}) *BaseWhen {
				return &BaseWhen{
					Key: "transform",
					WhenCB: func(store, testResource, pm interface{}) (interface{}, error) {
						// Simple transformation
						return "transformed: " + store.(string), nil
					},
				}
			},
		},
		Thens: map[string]interface{}{
			"verify": func(payload interface{}) *BaseThen {
				expected := payload.(string)
				return &BaseThen{
					Key: "verify",
					ThenCB: func(store, testResource, pm interface{}) (interface{}, error) {
						if store.(string) != expected {
							return nil, &AssertionError{Message: "expected " + expected + ", got " + store.(string)}
						}
						return true, nil
					},
				}
			},
		},
	}
	
	spec := func(suites, givens, whens, thens interface{}) interface{} {
		return []interface{}{
			map[string]interface{}{
				"key": "InteropSuite",
				"givens": map[string]interface{}{
					"testInterop": map[string]interface{}{
						"features": []string{"interop"},
						"whens":    []interface{}{"transform"},
						"thens":    []interface{}{"verify:transformed: test subject"},
					},
				},
			},
		}
	}
	
	gv := NewGolingvu(
		nil,
		spec,
		impl,
		DefaultTestResourceRequest,
		adapter,
		nil,
	)
	
	// Test with go test integration
	gv.WithTestingT(t).RunAsGoTest()
}

// TestInteropGolingvuToNative tests that Golingvu tests work with native go test
func TestInteropGolingvuToNative(t *testing.T) {
	// This is a native Go test that verifies Golingvu integration works
	t.Run("Native test can call Golingvu", func(t *testing.T) {
		gv := NewGolingvu(
			nil,
			nil,
			ITestImplementation{},
			DefaultTestResourceRequest,
			&SimpleTestAdapter{},
			nil,
		)
		
		gv.RunSimpleTest(t, func() error {
			// Simple assertion
			if 2+2 != 4 {
				return &AssertionError{Message: "Math is broken"}
			}
			return nil
		})
	})
	
	t.Run("Golingvu RunTests returns valid structure", func(t *testing.T) {
		adapter := &SimpleTestAdapter{}
		
		impl := ITestImplementation{
			Suites: map[string]interface{}{
				"TestSuite": "Test Suite",
			},
			Givens: map[string]interface{}{
				"testGiven": func() interface{} { return "test" },
			},
			Whens: map[string]interface{}{
				"testWhen": func(payload interface{}) *BaseWhen {
					return &BaseWhen{
						Key: "testWhen",
						WhenCB: func(store, testResource, pm interface{}) (interface{}, error) {
							return store, nil
						},
					}
				},
			},
			Thens: map[string]interface{}{
				"testThen": func(payload interface{}) *BaseThen {
					return &BaseThen{
						Key: "testThen",
						ThenCB: func(store, testResource, pm interface{}) (interface{}, error) {
							return true, nil
						},
					}
				},
			},
		}
		
		spec := func(suites, givens, whens, thens interface{}) interface{} {
			return []interface{}{
				map[string]interface{}{
					"key": "TestSuite",
					"givens": map[string]interface{}{
						"testGiven": map[string]interface{}{
							"features": []string{"test"},
							"whens":    []interface{}{"testWhen"},
							"thens":    []interface{}{"testThen"},
						},
					},
				},
			}
		}
		
		gv := NewGolingvu(
			nil,
			spec,
			impl,
			DefaultTestResourceRequest,
			adapter,
			nil,
		)
		
		results, err := gv.RunTests()
		if err != nil {
			t.Errorf("RunTests failed: %v", err)
		}
		
		// Verify results structure
		if _, ok := results["givens"]; !ok {
			t.Error("Results missing 'givens' key")
		}
		
		if _, ok := results["fails"]; !ok {
			t.Error("Results missing 'fails' key")
		}
		
		// Should have 0 fails
		if fails, ok := results["fails"].(int); ok && fails != 0 {
			t.Errorf("Expected 0 fails, got %d", fails)
		}
	})
}

// TestInteropReceiveTestResourceConfig tests integration with Testeranto test runner
func TestInteropReceiveTestResourceConfig(t *testing.T) {
	adapter := &SimpleTestAdapter{}
	
	impl := ITestImplementation{
		Suites: map[string]interface{}{
			"ConfigSuite": "Configuration Test Suite",
		},
		Givens: map[string]interface{}{
			"configTest": func() interface{} { return "config test" },
		},
		Whens: map[string]interface{}{
			"noop": func(payload interface{}) *BaseWhen {
				return &BaseWhen{
					Key: "noop",
					WhenCB: func(store, testResource, pm interface{}) (interface{}, error) {
						return store, nil
					},
				}
			},
		},
		Thens: map[string]interface{}{
			"alwaysTrue": func(payload interface{}) *BaseThen {
				return &BaseThen{
					Key: "alwaysTrue",
					ThenCB: func(store, testResource, pm interface{}) (interface{}, error) {
						return true, nil
					},
				}
			},
		},
	}
	
	spec := func(suites, givens, whens, thens interface{}) interface{} {
		return []interface{}{
			map[string]interface{}{
				"key": "ConfigSuite",
				"givens": map[string]interface{}{
					"configTest": map[string]interface{}{
						"features": []string{"config"},
						"whens":    []interface{}{"noop"},
						"thens":    []interface{}{"alwaysTrue"},
					},
				},
			},
		}
	}
	
	gv := NewGolingvu(
		nil,
		spec,
		impl,
		DefaultTestResourceRequest,
		adapter,
		nil,
	)
	
	// Test with minimal configuration
	config := `{"Name":"interop-test","Fs":"./test-results"}`
	
	results, err := gv.ReceiveTestResourceConfig(config)
	if err != nil {
		t.Errorf("ReceiveTestResourceConfig failed: %v", err)
	}
	
	if results.Failed {
		t.Errorf("Expected test to pass, but it failed with %d fails", results.Fails)
	}
	
	if results.Tests == 0 {
		t.Error("Expected at least one test to run")
	}
}
