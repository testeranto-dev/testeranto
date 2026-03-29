// Package golingvu tests
package golingvu

import (
	"testing"
)

// TestNewGolingvu tests basic Golingvu creation
func TestNewGolingvu(t *testing.T) {
	// Create a simple test adapter
	adapter := &SimpleTestAdapter{}
	
	// Create a minimal test implementation
	impl := ITestImplementation{
		Suites: map[string]interface{}{
			"TestSuite": "Test Suite",
		},
		Givens: map[string]interface{}{
			"testGiven": func() interface{} { return "test subject" },
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
	
	// Create a simple specification
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
	
	// Create Golingvu instance
	gv := NewGolingvu(
		nil,
		spec,
		impl,
		DefaultTestResourceRequest,
		adapter,
		nil,
	)
	
	if gv == nil {
		t.Error("NewGolingvu returned nil")
	}
	
	// Test basic methods
	if gv.GetTotalTests() == 0 {
		t.Error("Expected at least one test")
	}
	
	// Test RunAsGoTest
	gv.WithTestingT(t).RunAsGoTest()
}

// TestSimpleTestAdapter tests the adapter
func TestSimpleTestAdapter(t *testing.T) {
	adapter := &SimpleTestAdapter{}
	
	// Test AssertThis with various inputs
	if !adapter.AssertThis(true) {
		t.Error("AssertThis(true) should return true")
	}
	
	if adapter.AssertThis(false) {
		t.Error("AssertThis(false) should return false")
	}
	
	if !adapter.AssertThis("non-empty string") {
		t.Error("AssertThis('non-empty string') should return true")
	}
	
	// Test BeforeAll
	result := adapter.BeforeAll("input", ITTestResourceConfiguration{}, nil)
	if result != "input" {
		t.Error("BeforeAll should return the input")
	}
}

// TestBaseClasses tests basic class functionality
func TestBaseClasses(t *testing.T) {
	// Test BaseAction
	action := NewBaseAction("test", nil)
	if action.Name != "test" {
		t.Error("BaseAction name not set correctly")
	}
	
	// Test BaseCheck
	check := NewBaseCheck("test", nil)
	if check.Name != "test" {
		t.Error("BaseCheck name not set correctly")
	}
	
	// Test BaseGiven
	given := NewBaseGiven("test", []string{"feature"}, []*BaseWhen{}, []*BaseThen{}, nil, nil)
	if given.Key != "test" {
		t.Error("BaseGiven key not set correctly")
	}
	
	// Test BaseWhen
	when := NewBaseWhen("test", nil)
	if when.Key != "test" {
		t.Error("BaseWhen key not set correctly")
	}
	
	// Test BaseThen
	then := NewBaseThen("test", nil)
	if then.Key != "test" {
		t.Error("BaseThen key not set correctly")
	}
}

// TestRunTests tests the RunTests method
func TestRunTests(t *testing.T) {
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
	
	if results == nil {
		t.Error("RunTests returned nil results")
	}
	
	// Check for expected keys
	if _, ok := results["givens"]; !ok {
		t.Error("Results missing 'givens' key")
	}
	
	if _, ok := results["fails"]; !ok {
		t.Error("Results missing 'fails' key")
	}
}
