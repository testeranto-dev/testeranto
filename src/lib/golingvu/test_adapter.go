package golingvu

import (
	"fmt"
)

// SimpleTestAdapter implements both ITestAdapter and IUniversalTestAdapter
type SimpleTestAdapter struct{}

// For Describe-It pattern support
func (a *SimpleTestAdapter) PerformIt(store, itCB interface{}, testResource ITTestResourceConfiguration, artifactory func(string, interface{})) (interface{}, error) {
	// It can mix mutations and assertions
	// For now, just return the store
	return store, nil
}

// For TDT pattern support
func (a *SimpleTestAdapter) ProcessRow(store, shouldCB interface{}, testResource ITTestResourceConfiguration, artifactory func(string, interface{})) (interface{}, error) {
	return store, nil
}

func (a *SimpleTestAdapter) ValidateRow(store, expectedCB interface{}, testResource ITTestResourceConfiguration, artifactory func(string, interface{})) (interface{}, error) {
	return store, nil
}

// IUniversalTestAdapter methods
func (a *SimpleTestAdapter) PrepareAll(input interface{}, testResource ITTestResourceConfiguration, artifactory func(string, interface{})) (interface{}, error) {
	return input, nil
}

func (a *SimpleTestAdapter) PrepareEach(subject, initializer interface{}, testResource ITTestResourceConfiguration, initialValues interface{}, artifactory func(string, interface{})) (interface{}, error) {
	return subject, nil
}

func (a *SimpleTestAdapter) Execute(store, actionCB interface{}, testResource ITTestResourceConfiguration, artifactory func(string, interface{})) (interface{}, error) {
	// If actionCB is a function that can be called, execute it
	if fn, ok := actionCB.(func(store, testResource, artifactory interface{}) (interface{}, error)); ok {
		return fn(store, testResource, artifactory)
	}
	// Also try the signature used in BaseWhen.WhenCB
	if fn, ok := actionCB.(func(interface{}, interface{}, interface{}) (interface{}, error)); ok {
		return fn(store, testResource, artifactory)
	}
	return store, nil
}

func (a *SimpleTestAdapter) Verify(store, checkCB interface{}, testResource ITTestResourceConfiguration, artifactory func(string, interface{})) (interface{}, error) {
	// If checkCB is a function that can be called, execute it
	if fn, ok := checkCB.(func(store, testResource, artifactory interface{}) (interface{}, error)); ok {
		return fn(store, testResource, artifactory)
	}
	// Also try the signature used in BaseThen.ThenCB
	if fn, ok := checkCB.(func(interface{}, interface{}, interface{}) (interface{}, error)); ok {
		return fn(store, testResource, artifactory)
	}
	return store, nil
}

func (a *SimpleTestAdapter) CleanupEach(store interface{}, key string, artifactory func(string, interface{})) (interface{}, error) {
	return store, nil
}

func (a *SimpleTestAdapter) CleanupAll(store interface{}, artifactory func(string, interface{})) (interface{}, error) {
	return store, nil
}

func (a *SimpleTestAdapter) Assert(x interface{}) bool {
	return a.AssertThis(x)
}

// convertArtifactory converts an artifactory interface to a function
func (a *SimpleTestAdapter) convertArtifactory(artifactory interface{}) func(string, interface{}) {
	if artifactory == nil {
		return nil
	}
	
	// If it's already a function, return it
	if fn, ok := artifactory.(func(string, interface{})); ok {
		return fn
	}
	
	// If it has WriteFileSync method, wrap it
	if obj, ok := artifactory.(interface {
		WriteFileSync(filename string, payload string)
	}); ok {
		return func(filename string, payload interface{}) {
			var payloadStr string
			switch v := payload.(type) {
			case string:
				payloadStr = v
			default:
				payloadStr = fmt.Sprintf("%v", v)
			}
			obj.WriteFileSync(filename, payloadStr)
		}
	}
	
	return nil
}

// Legacy ITestAdapter methods for backward compatibility
func (a *SimpleTestAdapter) BeforeAll(input interface{}, tr ITTestResourceConfiguration, artifactory interface{}) interface{} {
	result, _ := a.PrepareAll(input, tr, a.convertArtifactory(artifactory))
	return result
}

func (a *SimpleTestAdapter) AfterAll(store interface{}, artifactory interface{}) interface{} {
	result, _ := a.CleanupAll(store, a.convertArtifactory(artifactory))
	return result
}

func (a *SimpleTestAdapter) BeforeEach(subject, initializer interface{}, testResource ITTestResourceConfiguration, initialValues interface{}, artifactory interface{}) interface{} {
	result, _ := a.PrepareEach(subject, initializer, testResource, initialValues, a.convertArtifactory(artifactory))
	return result
}

func (a *SimpleTestAdapter) AfterEach(store interface{}, key string, artifactory interface{}) interface{} {
	result, _ := a.CleanupEach(store, key, a.convertArtifactory(artifactory))
	return result
}

func (a *SimpleTestAdapter) AndWhen(store, whenCB interface{}, testResource interface{}, artifactory interface{}) interface{} {
	// Convert testResource to ITTestResourceConfiguration if possible
	var tr ITTestResourceConfiguration
	if t, ok := testResource.(ITTestResourceConfiguration); ok {
		tr = t
	}
	// Try to execute whenCB if it's a function
	if fn, ok := whenCB.(func(store, testResource, artifactory interface{}) (interface{}, error)); ok {
		result, _ := fn(store, testResource, artifactory)
		return result
	}
	// Also try the signature used in BaseWhen.WhenCB
	if fn, ok := whenCB.(func(interface{}, interface{}, interface{}) (interface{}, error)); ok {
		result, _ := fn(store, testResource, artifactory)
		return result
	}
	// Fall back to Execute
	result, _ := a.Execute(store, whenCB, tr, a.convertArtifactory(artifactory))
	return result
}

func (a *SimpleTestAdapter) ButThen(store, thenCB interface{}, testResource interface{}, artifactory interface{}) interface{} {
	// Convert testResource to ITTestResourceConfiguration if possible
	var tr ITTestResourceConfiguration
	if t, ok := testResource.(ITTestResourceConfiguration); ok {
		tr = t
	}
	result, _ := a.Verify(store, thenCB, tr, a.convertArtifactory(artifactory))
	return result
}

func (a *SimpleTestAdapter) AssertThis(t interface{}) bool {
	// Handle different types of assertions
	if t == nil {
		return false
	}
	
	// Check if it's a bool
	if b, ok := t.(bool); ok {
		return b
	}
	
	// Check if it's an error
	if err, ok := t.(error); ok {
		return err == nil
	}
	
	// For other types, check if they're truthy
	// In Go, we can't easily check "truthiness" like in JavaScript
	// So we'll return true for non-nil values
	return true
}
