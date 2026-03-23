package golingvu

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
	return store, nil
}

func (a *SimpleTestAdapter) Verify(store, checkCB interface{}, testResource ITTestResourceConfiguration, artifactory func(string, interface{})) (interface{}, error) {
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

// Legacy ITestAdapter methods for backward compatibility
func (a *SimpleTestAdapter) BeforeAll(input interface{}, tr ITTestResourceConfiguration, artifactory interface{}) interface{} {
	result, _ := a.PrepareAll(input, tr, nil)
	return result
}

func (a *SimpleTestAdapter) AfterAll(store interface{}, artifactory interface{}) interface{} {
	result, _ := a.CleanupAll(store, nil)
	return result
}

func (a *SimpleTestAdapter) BeforeEach(subject, initializer interface{}, testResource ITTestResourceConfiguration, initialValues interface{}, artifactory interface{}) interface{} {
	result, _ := a.PrepareEach(subject, initializer, testResource, initialValues, nil)
	return result
}

func (a *SimpleTestAdapter) AfterEach(store interface{}, key string, artifactory interface{}) interface{} {
	result, _ := a.CleanupEach(store, key, nil)
	return result
}

func (a *SimpleTestAdapter) AndWhen(store, whenCB interface{}, testResource interface{}, artifactory interface{}) interface{} {
	// Convert testResource to ITTestResourceConfiguration if possible
	var tr ITTestResourceConfiguration
	if t, ok := testResource.(ITTestResourceConfiguration); ok {
		tr = t
	}
	result, _ := a.Execute(store, whenCB, tr, nil)
	return result
}

func (a *SimpleTestAdapter) ButThen(store, thenCB interface{}, testResource interface{}, artifactory interface{}) interface{} {
	// Convert testResource to ITTestResourceConfiguration if possible
	var tr ITTestResourceConfiguration
	if t, ok := testResource.(ITTestResourceConfiguration); ok {
		tr = t
	}
	result, _ := a.Verify(store, thenCB, tr, nil)
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
