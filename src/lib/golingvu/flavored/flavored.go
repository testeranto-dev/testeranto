// Package flavored provides a more idiomatic Go testing interface for golingvu
package flavored

import (
	"fmt"
	"testing"

	"github.com/testeranto-dev/testeranto/src/lib/golingvu"
)

// Given starts a BDD test chain with a given condition
func Given(t *testing.T, description string, setupFunc func() interface{}) *TestChain {
	return &TestChain{
		t:           t,
		description: description,
		setupFunc:   setupFunc,
	}
}

// TestChain represents a chain of BDD test steps
type TestChain struct {
	t           *testing.T
	description string
	setupFunc   func() interface{}
	whenSteps   []whenStep
	thenSteps   []thenStep
}

type whenStep struct {
	description string
	action      func(interface{}, ...interface{}) interface{}
	args        []interface{}
}

type thenStep struct {
	description string
	assertion   func(interface{}, ...interface{})
	args        []interface{}
}

// When adds a when step to the test chain
func (tc *TestChain) When(description string, action func(interface{}, ...interface{}) interface{}, args ...interface{}) *TestChain {
	tc.whenSteps = append(tc.whenSteps, whenStep{
		description: description,
		action:      action,
		args:        args,
	})
	return tc
}

// Then adds a then step to the test chain
func (tc *TestChain) Then(description string, assertion func(interface{}, ...interface{}), args ...interface{}) *TestChain {
	tc.thenSteps = append(tc.thenSteps, thenStep{
		description: description,
		assertion:   assertion,
		args:        args,
	})
	return tc
}

// Run executes the test chain with proper test reporting
func (tc *TestChain) Run() {
	tc.t.Helper()
	
	// Run the entire test as a subtest for better organization
	tc.t.Run(fmt.Sprintf("Given %s", tc.description), func(t *testing.T) {
		t.Helper()
		
		// Setup the initial state
		subject := tc.setupFunc()
		if subject == nil {
			t.Fatal("setupFunc returned nil")
		}
		
		// Track subject in a mutable reference
		subjectRef := &subject
		
		// Execute all when steps
		for _, step := range tc.whenSteps {
			stepName := fmt.Sprintf("When %s", step.description)
			t.Run(stepName, func(t *testing.T) {
				t.Helper()
				
				// Call the action function with current subject and args
				result := step.action(*subjectRef, step.args...)
				if result != nil {
					*subjectRef = result
				}
			})
		}
		
		// Execute all then steps
		for _, step := range tc.thenSteps {
			stepName := fmt.Sprintf("Then %s", step.description)
			t.Run(stepName, func(t *testing.T) {
				t.Helper()
				
				// Call the assertion function with current subject and args
				step.assertion(*subjectRef, step.args...)
			})
		}
	})
}

// Integration with standard golingvu
// ConvertTestChain converts a flavored test chain to a golingvu test specification
func ConvertTestChain(tc *TestChain) golingvu.ITestSpecification {
	return func(suites, givens, whens, thens interface{}) interface{} {
		// Convert when steps
		whenNames := make([]interface{}, len(tc.whenSteps))
		for i, step := range tc.whenSteps {
			whenNames[i] = step.description
		}
		
		// Convert then steps
		thenNames := make([]interface{}, len(tc.thenSteps))
		for i, step := range tc.thenSteps {
			thenNames[i] = step.description
		}
		
		return []interface{}{
			map[string]interface{}{
				"key": tc.description,
				"givens": map[string]interface{}{
					tc.description: map[string]interface{}{
						"features": []string{"flavored"},
						"whens":    whenNames,
						"thens":    thenNames,
					},
				},
			},
		}
	}
}

// ToGolingvu converts a flavored test chain to a Golingvu instance
func (tc *TestChain) ToGolingvu() *golingvu.Golingvu {
	// Convert when steps to interface{} slices
	whenSteps := make([]interface{}, len(tc.whenSteps))
	for i := range tc.whenSteps {
		// Capture step by value to avoid closure issues
		step := tc.whenSteps[i]
		whenSteps[i] = func(store interface{}) interface{} {
			// The action expects subject as first argument, then step.args
			return step.action(store, step.args...)
		}
	}
	
	// Convert then steps to interface{} slices
	thenSteps := make([]interface{}, len(tc.thenSteps))
	for i := range tc.thenSteps {
		// Capture step by value to avoid closure issues
		step := tc.thenSteps[i]
		thenSteps[i] = func(store interface{}) interface{} {
			// The assertion expects subject as first argument, then step.args
			step.assertion(store, step.args...)
			// Return something to satisfy the interface
			return true
		}
	}
	
	// Create and return a Golingvu instance
	return golingvu.NewGolingvuFromFlavored(
		tc.description,
		tc.setupFunc,
		whenSteps,
		thenSteps,
	)
}
