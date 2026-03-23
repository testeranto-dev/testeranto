# Kafe - Java Implementation of Testeranto

## Overview
Kafe is the Java implementation of the Testeranto testing framework, providing BDD (Given-When-Then), TDT (Value-Should-Expected), and Describe-It (AAA/Arrange-Act-Assert) patterns through unified terminology: Setup-Action-Check. BDD is fully implemented and production-ready, while TDT and Describe-It patterns have core classes available for experimentation.

## Status
- **BDD Pattern (Given-When-Then)**: Fully implemented and production-ready (3 verbs)
- **TDT Pattern (Value-Should-Expected)**: Core classes implemented (BaseValue, BaseShould, BaseExpected), integration in progress (3 verbs)
- **Describe-It Pattern (AAA/Arrange-Act-Assert)**: Core classes implemented (BaseDescribe, BaseIt), integration in progress (2 verbs)
- BDD is recommended for production use; TDT and Describe-It patterns are available for experimentation

## Core Architecture

### Main Entry Point: `Kafe.java`
- **Kafe class**: Main test runner class
  - Contains test resource configuration, test jobs, suites, givens, whens, thens
  - Implements `createArtifactory()`: Returns object with `writeFileSync`, `screenshot`, `openScreencast`, `closeScreencast` methods
  - `writeFileSync()`: Abstract method to be implemented by concrete runtimes
  - `receiveTestResourceConfig()`: Receives JSON config and executes tests
  - Constructor: Creates classy implementations for all patterns from test implementation
  - `calculateTotalTests()`: Computes total number of tests

### Base Classes (Unified Pattern)

#### `BaseSetup.java` - BaseSetup
- Unified base for all setup phases (BDD's Given, TDT's Value, Describe-It's Describe)
- Contains `setup()` method that processes actions and checks
- `setupThat()`: Abstract method implemented by concrete types with artifactory parameter
- `afterEach()`: Cleanup hook with artifactory parameter

#### `BaseAction.java` - BaseAction
- Unified base for all action phases (BDD's When, TDT's Should, Describe-It's It)
- `performAction()`: Abstract method implemented by concrete types with artifactory parameter
- `test()`: Calls `performAction()` with proper parameters
- `addArtifact()`: Adds artifact paths
- `toObj()`: Serializes to object

#### `BaseCheck.java` - BaseCheck
- Unified base for all verification phases (BDD's Then, TDT's Expected)
- `verifyCheck()`: Abstract method implemented by concrete types with artifactory parameter
- `test()`: Calls `verifyCheck()` with filepath parameter
- `addArtifact()`: Adds artifact paths
- `toObj()`: Serializes to object

### Pattern-Specific Classes (Extend Base Classes)

#### BDD Pattern (Behavior Driven Development)
- `BaseGiven.java`: `BaseGiven` extends `BaseSetup`
  - `give()`: Alias for `setup()` with BDD terminology
  - `setupThat()`: Abstract method for BDD setup with artifactory
- `BaseWhen.java`: `BaseWhen` extends `BaseAction`
  - `performAction()`: Abstract method for BDD actions with artifactory
- `BaseThen.java`: `BaseThen` extends `BaseCheck`
  - `verifyCheck()`: Abstract method for BDD assertions with artifactory

#### TDT Pattern (Table-Driven Testing)
- `BaseValue.java`: `BaseValue` extends `BaseSetup`
  - `value()`: Alias for `setup()` with TDT terminology
  - Handles table rows for data-driven testing
- `BaseShould.java`: `BaseShould` extends `BaseAction`
  - `shouldTest()`: Alias for `test()` with TDT terminology
  - Processes each row in table-driven testing
- `BaseExpected.java`: `BaseExpected` extends `BaseCheck`
  - `expectTest()`: Alias for `test()` with TDT terminology
  - Validates each row in table-driven testing

#### Describe-It Pattern (AAA/Arrange-Act-Assert)
- `BaseDescribe.java`: `BaseDescribe` extends `BaseSetup`
  - `describe()`: Alias for `setup()` with Describe-It terminology (Arrange phase)
  - Can be nested, and Its can mix mutations and assertions
- `BaseIt.java`: `BaseIt` extends `BaseAction`
  - `itTest()`: Alias for `test()` with Describe-It terminology (combines Act and Assert phases)
  - Its can mix mutations and assertions, unlike BDD's When which only does mutations

### Supporting Infrastructure

#### `ITestAdapter.java` - Adapter Interface
- Unified interface with `prepareAll`, `prepareEach`, `execute`, `verify`, `cleanupEach`, `cleanupAll`, `assert`
- All methods include artifactory parameter for context-aware file operations
- Legacy method names for backward compatibility

#### `SimpleTestAdapter.java` - Default Implementation
- Default implementation of `ITestAdapter`
- Provides basic functionality that can be extended

#### `ITestResourceConfiguration.java` - Configuration
- Configuration for test resources (name, fs, ports, browserWsEndpoint, timeout, retries, environment)

#### `IFinalResults.java` - Results
- Test execution results with features, fails, artifacts, tests, runTimeTests, testJob

### File Relationships

#### Core Flow
1. `Kafe` constructor receives test specification and implementation
2. Creates `suitesOverrides`, `givenOverrides`, `whenOverrides`, `thenOverrides`, `valuesOverrides`, `shouldsOverrides`, `expectedsOverrides`, `describesOverrides`, `itsOverrides` from implementation
3. `receiveTestResourceConfig()` receives JSON config and executes tests
4. Tests run via `BaseSuite.run()` → `BaseGiven.give()`/`BaseValue.value()`/`BaseDescribe.describe()` → `BaseSetup.setup()`
5. `setup()` processes actions (`BaseAction.test()`) and checks (`BaseCheck.test()`)
6. Results written to filesystem via artifactory

#### Artifactory System
- Context-aware file writing with structured paths
- `createArtifactory()` in `Kafe` returns object with methods
- Path format: `{basePath}/suite-{N}/given-{key}/when-{index} filename.txt`
- Used by adapter methods as required parameter

### Test Execution Pipeline

```
Kafe constructor
    ↓
Creates classy implementations for all patterns
    ↓
receiveTestResourceConfig(JSON config)
    ↓
testJobs[0].receiveTestResourceConfig()
    ↓
BaseSuite.run()
    ↓
BaseGiven.give() / BaseValue.value() / BaseDescribe.describe()
    ↓
BaseSetup.setup()
    ├── setupThat() with artifactory
    ├── Process Actions: BaseAction.test() → performAction() with artifactory
    ├── Process Checks: BaseCheck.test() → verifyCheck() with artifactory
    └── afterEach() with artifactory
        ↓
Write results via artifactory.writeFileSync()
        ↓
Return IFinalResults
```

### Key Design Patterns

1. **Abstract Base Classes**: `BaseSetup`, `BaseAction`, `BaseCheck` define abstract methods
2. **Template Method**: `BaseSetup.setup()` defines algorithm skeleton, delegates to `setupThat()`
3. **Strategy Pattern**: Adapters provide different implementations of test execution logic
4. **Factory Pattern**: `Kafe` creates classy instances from test implementation

### Integration Points

#### With Testeranto Ecosystem
- Consistent JSON test resource configuration format
- Consistent artifact path structure across languages
- Follows same patterns as TypeScript (tiposkripto) and Go (golingvu) implementations

### File Dependencies

```
Kafe.java (main)
├── ITestAdapter.java (adapter interface)
├── SimpleTestAdapter.java (default adapter)
├── BaseSetup.java (core)
│   ├── BaseAction.java
│   ├── BaseCheck.java
│   ├── BaseGiven.java (BDD)
│   ├── BaseValue.java (TDT)
│   └── BaseDescribe.java (Describe-It)
├── BaseWhen.java (BDD action)
│   └── BaseAction.java
├── BaseThen.java (BDD check)
│   └── BaseCheck.java
├── BaseShould.java (TDT action)
│   └── BaseAction.java
├── BaseExpected.java (TDT check)
│   └── BaseCheck.java
├── BaseIt.java (Describe-It action)
│   └── BaseAction.java
├── BaseSuite.java (suite management)
├── ITestResourceConfiguration.java (config)
├── IFinalResults.java (results)
├── ITestJob.java (test job interface)
└── ITestImplementation.java (test impl)
```

### Important Notes

1. **Artifactory replaces PM**: All file operations go through artifactory, not direct filesystem access
2. **Context propagation**: Suite index, given key, action/check indices propagate through context
3. **Error handling**: Failures increment `fails` count but don't stop test execution (continue with other setups)
4. **Serialization**: `toObj()` methods convert test objects to plain objects for JSON output
5. **Pattern support**: All three patterns (BDD, TDT, Describe-It) are supported with core classes
6. **AAA pattern**: AAA (Arrange-Act-Assert) is implemented as the Describe-It pattern with 2 verbs: Describe (for Arrange) and It (for combined Act and Assert)

### Usage Example

```java
// BDD Pattern Example
ITestImplementation bddImpl = new ITestImplementation(
    Map.of("Default", "Test Suite"),
    Map.of("test1", args -> new Calculator()),
    Map.of("add", args -> (Function<Calculator, Calculator>) calc -> { 
        calc.add((Integer)args[0]); 
        return calc; 
    }),
    Map.of("result", args -> (Function<Calculator, Boolean>) calc -> 
        calc.result() == (Integer)args[0])
);

// TDT Pattern Example (using full constructor)
ITestImplementation tdtImpl = new ITestImplementation(
    Map.of("Default", "Test Suite"),
    Map.of(), // givens
    Map.of(), // whens
    Map.of(), // thens
    Map.of("testValues", args -> new BaseValue(...)), // values
    Map.of("shouldProcess", args -> new BaseShould(...)), // shoulds
    Map.of("expectedResult", args -> new BaseExpected(...)), // expecteds
    Map.of(), // describes
    Map.of()  // its
);

// Create and run Kafe
Kafe<Object, Object, Object, Object> kafe = new Kafe<>(
    "node",
    null,
    spec,
    bddImpl,
    new ITestResourceRequest(0),
    new SimpleTestAdapter<>(),
    new ITestResourceConfiguration("test", "./results", new ArrayList<>(), null, 30000, 0, new HashMap<>()),
    "3456",
    "localhost"
);

IFinalResults results = kafe.receiveTestResourceConfig(
    new ITestResourceConfiguration("test", "./results", new ArrayList<>(), null, 30000, 0, new HashMap<>())
);
```

This architecture enables consistent cross-platform testing while leveraging Java's type system for safety and IDE support.
