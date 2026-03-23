# Golingvu - Go Implementation of Testeranto

## Overview
Golingvu is the Go implementation of the Testeranto testing framework, providing:
1. **BDD (Given-When-Then)**: 3 verbs, fully implemented and production-ready
2. **Describe-It (AAA/Arrange-Act-Assert)**: 2 verbs, core classes available for experimentation
3. **TDT (Table-Driven Testing)**: 3 verbs, core classes available for experimentation

All patterns use unified terminology: Setup-Action-Check internally.

## Core Architecture

### Main Entry Point: `golingvu.go`
- **Golingvu struct**: Main test runner class (Go equivalent of BaseTiposkripto)
  - Contains test resource configuration, test jobs, suites, givens, whens, thens
  - Implements `CreateArtifactory()`: Returns object with `WriteFileSync`, `Screenshot`, `OpenScreencast`, `CloseScreencast` methods
  - `WriteFileSync()`: Abstract method matching TypeScript's BaseTiposkripto
  - `ReceiveTestResourceConfig()`: Receives JSON config, executes tests, writes results
  - `NewGolingvu()`: Factory function creating instances with test specifications
  - `RunAsGoTest()`: Integration with Go's testing package

### Base Classes (Unified Pattern)

#### `base_setup.go` - BaseSetup
- Unified base for all setup phases (BDD's Given, AAA's Arrange, TDT's Map)
- Contains `Setup()` method that processes actions and checks
- `createArtifactoryForAction()` and `createArtifactoryForCheck()`: Create context-aware artifact factories
- `SetupThat()`: Abstract method implemented by concrete types

#### `base_action.go` - BaseAction
- Unified base for all action phases (BDD's When, AAA's Act, TDT's Feed)
- `PerformAction()`: Abstract method implemented by concrete types
- `Test()`: Calls `PerformAction()` with proper parameters

#### `base_check.go` - BaseCheck
- Unified base for all verification phases (BDD's Then, AAA's Assert, TDT's Validate)
- `VerifyCheck()`: Abstract method implemented by concrete types
- `Test()`: Calls `VerifyCheck()` with filepath parameter

### Pattern-Specific Classes (Extend Base Classes)

#### BDD Pattern (Behavior Driven Development) - User-Facing
- `base_given.go`: `BaseGiven` extends `BaseSetup`
  - `Give()`: Alias for `Setup()` with BDD terminology
  - `CreateDefaultArtifactory()`, `CreateArtifactoryForWhen()`, `CreateArtifactoryForThen()`: Context-specific factories
- `base_when.go`: `BaseWhen` extends `BaseAction`
  - `PerformAction()` calls `AndWhenFunc`
  - Used for BDD When conditions
- `base_then.go`: `BaseThen` extends `BaseCheck`
  - `VerifyCheck()` calls `ButThenFunc`
  - Used for BDD Then assertions

#### TDT Pattern (Table-Driven Testing) - User-Facing
- `base_value.go`: `BaseValue` extends `BaseSetup`
- `base_should.go`: `BaseShould` extends `BaseAction`
- `base_expected.go`: `BaseExpected` extends `BaseCheck`

#### Describe-It Pattern (AAA/Arrange-Act-Assert) - User-Facing
- `base_describe.go`: `BaseDescribe` extends `BaseSetup`
  - `Describe()`: Alias for `Setup()` with Describe-It terminology (Arrange phase)
- `base_it.go`: `BaseIt` extends `BaseAction`
  - `PerformIt()`: Alias for `PerformAction()` with Describe-It terminology (combines Act and Assert phases)
  - Can mix mutations and assertions

### Supporting Infrastructure

#### `types.go` - Type Definitions
- `IUniversalTestAdapter`: Unified interface with `PrepareAll`, `PrepareEach`, `Execute`, `Verify`, `CleanupEach`, `CleanupAll`, `Assert`
- `ITestAdapter`: Legacy interface for backward compatibility
- `ITestSpecification`, `ITestImplementation`: Test structure definitions
- Pattern type aliases: `ISetups`, `IActions`, `IChecks`, `IArranges`, `IActs`, `IAsserts`, `IMaps`, `IFeeds`, `IValidates`, `IGivens`, `IWhens`, `IThens`

#### `test_adapter.go` - SimpleTestAdapter
- Implements both `IUniversalTestAdapter` and `ITestAdapter`
- Provides default implementations for all adapter methods
- `AssertThis()`: Handles bool, error, and truthy value assertions

#### `base_suite.go` - BaseSuite
- Represents a test suite containing multiple givens
- `Run()`: Executes all givens in the suite
- `ToObj()`: Serializes suite results to map

#### `dsl.go` - Domain-Specific Language
- `DSL` struct: Provides readable way to create test specifications
- `TestBuilder`: Helps build test specifications with helper methods
- `SimpleSpecification()`: Creates simple test specifications

### Artifactory System

#### `golangvu.go` - CreateArtifactory
- Creates context-aware artifactory instances for file operations
- `WriteFileSync()`: Writes files synchronously with directory creation
- Path format: `{basePath}/suite-{N}/given-{key}/when-{index} filename.txt`

### File Relationships

#### Core Flow
1. `NewGolingvu()` creates instance with test specification and implementation
2. Creates `classySuites`, `classyGivens`, `classyWhens`, `classyThens` from implementation
3. `ReceiveTestResourceConfig()` parses JSON config and executes tests
4. Tests run via `BaseSuite.Run()` → `BaseGiven.Give()` → `BaseSetup.Setup()`
5. `Setup()` processes actions (`BaseAction.Test()`) and checks (`BaseCheck.Test()`)
6. Results written to filesystem via artifactory

#### Artifactory System
- Context-aware file writing with structured paths
- `CreateArtifactory()` in `golingvu.go` returns object with WriteFileSync method
- Path format: `{basePath}/suite-{N}/given-{key}/when-{index} filename.txt`
- Used by adapter methods as last parameter
- Screenshot and screencast methods are not included in Go context

#### Adapter Integration
- All adapter methods (`PrepareEach`, `Execute`, `Verify`, etc.) receive artifactory as last parameter
- `SimpleTestAdapter` provides default implementations
- Legacy `ITestAdapter` methods (`BeforeEach`, `AndWhen`, `ButThen`) map to universal methods

### Test Execution Pipeline

```
NewGolingvu()
    ↓
ReceiveTestResourceConfig(JSON config)
    ↓
runActualTests()
    ↓
BaseSuite.Run() for each suite
    ↓
BaseGiven.Give() for each given
    ↓
BaseSetup.Setup()
    ├── SetupThat() (via GivenThat)
    ├── Process Actions: BaseAction.Test() → PerformAction()
    ├── Process Checks: BaseCheck.Test() → VerifyCheck()
    └── AfterEach()
        ↓
Write results via artifactory.WriteFileSync()
        ↓
Return IFinalResults
```

### Key Design Patterns

1. **Embedding Composition**: Pattern classes embed base classes (`BaseGiven` embeds `*BaseSetup`)
2. **Abstract Methods**: Base classes define abstract methods implemented by concrete types
3. **Context Pattern**: Artifactory uses context (suiteIndex, givenKey, whenIndex) for path generation
4. **Adapter Pattern**: `IUniversalTestAdapter` provides unified interface across patterns
5. **Factory Pattern**: `NewBaseGiven`, `NewBaseWhen`, `NewBaseThen` create instances

### Integration Points

#### With Go Testing Package
- `RunAsGoTest()`: Runs tests via `testing.T`
- `CreateGoTest()`: Creates standard Go test functions
- `TestMainIntegration()`: Package-level test setup

#### With Testeranto Ecosystem
- WebSocket communication for cross-language test execution
- JSON test resource configuration format
- Consistent artifact path structure across languages

### File Dependencies

```
golingvu.go (main)
├── types.go (type definitions)
├── base_setup.go (core)
│   ├── base_action.go
│   ├── base_check.go
│   ├── base_given.go (BDD)
│   ├── base_arrange.go (AAA)
│   └── base_map.go (TDT)
├── base_when.go (BDD action)
│   └── base_action.go
├── base_then.go (BDD check)
│   └── base_check.go
├── base_suite.go (suite management)
├── test_adapter.go (adapter implementations)
├── dsl.go (DSL helpers)
└── pattern_classes.go (backward compatibility)
```

### Important Notes

1. **Artifactory system**: All file operations go through artifactory, not direct filesystem access
2. **Context propagation**: Suite index, given key, action/check indices propagate through context
3. **Error handling**: Failures increment `fails` count but don't stop test execution
4. **Serialization**: `ToObj()` methods convert test objects to maps for JSON output
5. **Backward compatibility**: Legacy BDD terminology supported alongside unified patterns

### Usage Example

```go
// Create test implementation
impl := ITestImplementation{
    Suites: map[string]interface{}{"Default": "Test Suite"},
    Givens: map[string]interface{}{
        "test1": func() interface{} { return NewCalculator() },
    },
    Whens: map[string]interface{}{
        "add": func(x int) interface{} {
            return func(calc interface{}) interface{} {
                calc.(*Calculator).Add(x)
                return calc
            }
        },
    },
    Thens: map[string]interface{}{
        "result": func(expected int) interface{} {
            return func(calc interface{}) interface{} {
                if calc.(*Calculator).Result() != expected {
                    return errors.New("mismatch")
                }
                return nil
            }
        },
    },
}

// Create Golingvu instance
gv := NewGolingvu(
    nil,
    specificationFunc,
    impl,
    DefaultTestResourceRequest,
    &SimpleTestAdapter{},
    nil,
)

// Run tests
results, _ := gv.ReceiveTestResourceConfig(`{"name":"test","fs":"./results"}`)
```

This architecture enables consistent cross-language testing while leveraging Go's strengths like struct embedding, interfaces, and strong typing.
