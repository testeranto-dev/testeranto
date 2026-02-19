package golingvu

// Ibdd_in_any represents the input types for Behavior-Driven Development tests.
// Implement this interface to define custom input types for your tests.
type Ibdd_in_any interface {
	Iinput() interface{}
	Isubject() interface{}
	Istore() interface{}
	Iselection() interface{}
	Then() interface{}
	Given() interface{}
}

// Ibdd_out_any represents the output types for Behavior-Driven Development tests.
type Ibdd_out_any interface{}

// ITestSpecification defines a function that creates test specifications.
// It takes suites, givens, whens, and thens as parameters and returns
// a test structure that can be executed by the test runner.
type ITestSpecification func(suites, givens, whens, thens interface{}) interface{}

// ITestImplementation contains the concrete implementations of test components.
// Suites: Map of suite names to their implementations
// Givens: Map of given condition names to their implementations
// Whens:  Map of when action names to their implementations
// Thens:  Map of then assertion names to their implementations
type ITestImplementation struct {
	Suites map[string]interface{}
	Givens map[string]interface{}
	Whens  map[string]interface{}
	Thens  map[string]interface{}
}

// ITestAdapter defines the interface for adapting test execution to different environments.
// Implement this interface to customize test setup, teardown, and execution.
type ITestAdapter interface {
	BeforeAll(input interface{}, tr ITTestResourceConfiguration, pm interface{}) interface{}
	AfterAll(store interface{}, pm interface{}) interface{}
	BeforeEach(subject, initializer interface{}, testResource ITTestResourceConfiguration, initialValues interface{}, pm interface{}) interface{}
	AfterEach(store interface{}, key string, pm interface{}) interface{}
	AndWhen(store, whenCB interface{}, testResource interface{}, pm interface{}) interface{}
	ButThen(store, thenCB interface{}, testResource interface{}, pm interface{}) interface{}
	AssertThis(t interface{}) bool
}

// ITTestResourceConfiguration holds configuration for test resources.
// Name:              Resource name
// Fs:                Filesystem path
// BrowserWSEndpoint: WebSocket endpoint for browser automation (optional)
// Timeout:           Timeout in seconds (optional)
// Retries:           Number of retry attempts (optional)
// Environment:       Environment variables (optional)
type ITTestResourceConfiguration struct {
	Name              string
	Fs                string
	BrowserWSEndpoint string
	Timeout           int
	Retries           int
	Environment       map[string]string
}

// ITTestResourceRequirement specifies requirements for test resources.
type ITTestResourceRequirement struct {
	Name string
	Fs   string
}

// ITTestResourceRequest represents a request for test resources.
type ITTestResourceRequest struct {
}

// DefaultTestResourceRequest provides a default test resource request.
var DefaultTestResourceRequest = ITTestResourceRequest{}

// DefaultTestResourceRequirement provides default test resource requirements.
var DefaultTestResourceRequirement = ITTestResourceRequirement{
	Name: "default",
	Fs:   "./",
}

