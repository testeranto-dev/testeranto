package golingvu

// TestTypeParams_any represents the unified type parameters for test execution.
// This replaces Ibdd_in_any for the new unified architecture.
type TestTypeParams_any interface {
	Iinput() interface{}
	Isubject() interface{}
	Istore() interface{}
	Iselection() interface{}
	Given() interface{}
	When() interface{}
	Then() interface{}
}

// TestSpecShape_any represents the unified structure of test specifications.
// This replaces Ibdd_out_any for the new unified architecture.
type TestSpecShape_any interface{}

// Legacy type aliases for backward compatibility
type Ibdd_in_any = TestTypeParams_any
type Ibdd_out_any = TestSpecShape_any

// TestFunc is a function that can be used in flavored tests
type TestFunc func(...interface{}) interface{}

// AssertionFunc is a function that performs assertions
type AssertionFunc func(...interface{})

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

// IUniversalTestAdapter defines the unified interface for adapting test execution.
// It uses methodology-agnostic terminology for the new unified architecture.
type IUniversalTestAdapter interface {
	// Lifecycle hooks
	PrepareAll(input interface{}, testResource ITTestResourceConfiguration) (interface{}, error)
	PrepareEach(subject, initializer interface{}, testResource ITTestResourceConfiguration, initialValues interface{}) (interface{}, error)
	
	// Execution
	Execute(store, actionCB interface{}, testResource ITTestResourceConfiguration) (interface{}, error)
	
	// Verification
	Verify(store, checkCB interface{}, testResource ITTestResourceConfiguration) (interface{}, error)
	
	// Cleanup
	CleanupEach(store interface{}, key string) (interface{}, error)
	CleanupAll(store interface{}) (interface{}, error)
	
	// Assertion
	Assert(x interface{}) bool
}

// ITestAdapter defines the legacy interface for backward compatibility.
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
	Ports int
}

// DefaultTestResourceRequest provides a default test resource request.
var DefaultTestResourceRequest = ITTestResourceRequest{
	Ports: 0,
}

// DefaultTestResourceRequirement provides default test resource requirements.
var DefaultTestResourceRequirement = ITTestResourceRequirement{
	Name: "default",
	Fs:   "./",
}

// Unified Pattern Types
type ISetups = map[string]interface{}
type IActions = map[string]interface{}
type IChecks = map[string]interface{}

// AAA Pattern Types
type IArranges = map[string]interface{}
type IActs = map[string]interface{}
type IAsserts = map[string]interface{}

// TDT Pattern Types
type IMaps = map[string]interface{}
type IFeeds = map[string]interface{}
type IValidates = map[string]interface{}

// BDD Pattern Types (legacy)
type IGivens = map[string]interface{}
type IWhens = map[string]interface{}
type IThens = map[string]interface{}

