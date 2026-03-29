// Package golingvu - integration tests
package golingvu

import (
	"testing"
)

// TestIntegration verifies the main components work together
func TestIntegration(t *testing.T) {
	// Create a simple test
	adapter := &SimpleTestAdapter{}
	
	// Create implementation
	impl := ITestImplementation{
		Suites: map[string]interface{}{
			"TestSuite": "Integration Test Suite",
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
	
	// Create specification
	spec := func(suites, givens, whens, thens interface{}) interface{} {
		return []interface{}{
			map[string]interface{}{
				"key": "TestSuite",
				"givens": map[string]interface{}{
					"testGiven": map[string]interface{}{
						"features": []string{"integration"},
						"whens":    []interface{}{"testWhen"},
						"thens":    []interface{}{"testThen"},
					},
				},
			},
		}
	}
	
	// Create Golingvu
	gv := NewGolingvu(
		nil,
		spec,
		impl,
		DefaultTestResourceRequest,
		adapter,
		nil,
	)
	
	if gv == nil {
		t.Fatal("NewGolingvu returned nil")
	}
	
	// Run tests
	results, err := gv.RunTests()
	if err != nil {
		t.Errorf("RunTests failed: %v", err)
	}
	
	if results == nil {
		t.Error("RunTests returned nil results")
	}
	
	t.Log("Integration test passed")
}
