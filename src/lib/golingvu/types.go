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
	PrepareAll(input interface{}, testResource ITTestResourceConfiguration, artifactory func(string, interface{})) (interface{}, error)
	PrepareEach(subject, initializer interface{}, testResource ITTestResourceConfiguration, initialValues interface{}, artifactory func(string, interface{})) (interface{}, error)
	
	// Execution
	Execute(store, actionCB interface{}, testResource ITTestResourceConfiguration, artifactory func(string, interface{})) (interface{}, error)
	
	// Verification
	Verify(store, checkCB interface{}, testResource ITTestResourceConfiguration, artifactory func(string, interface{})) (interface{}, error)
	
	// Cleanup
	CleanupEach(store interface{}, key string, artifactory func(string, interface{})) (interface{}, error)
	CleanupAll(store interface{}, artifactory func(string, interface{})) (interface{}, error)
	
	// Assertion
	Assert(x interface{}) bool
}

// ITestAdapter defines the legacy interface for backward compatibility.
type ITestAdapter interface {
	BeforeAll(input interface{}, tr ITTestResourceConfiguration, artifactory interface{}) interface{}
	AfterAll(store interface{}, artifactory interface{}) interface{}
	BeforeEach(subject, initializer interface{}, testResource ITTestResourceConfiguration, initialValues interface{}, artifactory interface{}) interface{}
	AfterEach(store interface{}, key string, artifactory interface{}) interface{}
	AndWhen(store, whenCB interface{}, testResource interface{}, artifactory interface{}) interface{}
	ButThen(store, thenCB interface{}, testResource interface{}, artifactory interface{}) interface{}
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

// Unified Pattern Types (internal)
type ISetups = map[string]*BaseSetup
type IActions = map[string]*BaseAction
type IChecks = map[string]*BaseCheck

// User-Facing Pattern Types
// BDD Pattern
type IGivens = map[string]*BaseGiven
type IWhens = map[string]*BaseWhen
type IThens = map[string]*BaseThen

// TDT Pattern  
type IValues = map[string]*BaseValue
type IShoulds = map[string]*BaseShould
type IExpecteds = map[string]*BaseExpected

// Describe-It Pattern
type IDescribes = map[string]*BaseDescribe
type IIts = map[string]*BaseIt

// AAA Pattern (Arrange-Act-Assert) - Not implemented per multiArchitecture ticket
// This pattern is intentionally omitted as it's not part of the current architecture
// type IArranges = map[string]*BaseArrange
// type IActs = map[string]*BaseAct  
// type IAsserts = map[string]*BaseAssert

// TestResourceConfiguration holds configuration for test resources
type TestResourceConfiguration struct {
	Name string
	Fs   string
}

// IFinalResults represents the final results of test execution
type IFinalResults struct {
    Failed       bool
    Fails        int
    Artifacts    []interface{}
    Features     []string
    Tests        int
    RunTimeTests int
}

// ITestJob interface for test execution
type ITestJob interface {
    ToObj() map[string]interface{}
    Runner(artifactory interface{}, tLog func(...string)) (interface{}, error)
    ReceiveTestResourceConfig() (IFinalResults, error)
}

// Note: BaseGiven, BaseWhen, BaseThen, BaseSuite, BaseValue, BaseShould,
// BaseExpected, BaseDescribe, and BaseIt are defined in their respective files.
// These are not placeholder declarations to avoid duplicate type errors.

// TestResourceConfiguration is a simpler version of ITTestResourceConfiguration.
// For backward compatibility, use ITTestResourceConfiguration which has more fields.

