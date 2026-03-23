# Tiposkripto - TypeScript Implementation of Testeranto

## Overview

Tiposkripto is the TypeScript implementation of the Testeranto testing framework, providing BDD (Given-When-Then), Describe-It (AAA/Arrange-Act-Assert), and TDT (Table-Driven Testing) patterns through unified terminology: Setup-Action-Check.

## Core Architecture

### Main Entry Point: `BaseTiposkripto.ts`

- **BaseTiposkripto class**: Main abstract test runner class
  - Contains test resource configuration, test jobs, suites, givens, whens, thens
  - Implements `createArtifactory()`: Returns object with `writeFileSync`, `screenshot`, `openScreencast`, `closeScreencast` methods
  - `writeFileSync()`: Abstract method to be implemented by concrete runtimes (Node/Web)
  - `receiveTestResourceConfig()`: Receives JSON config and executes tests
  - Constructor: Creates classySuites, classyGivens, classyWhens, classyThens from test implementation
  - `calculateTotalTests()`: Computes total number of tests

### Runtime Implementations

#### `Node.ts` - NodeTiposkripto

- Extends `BaseTiposkripto` for Node.js environment
- Implements `writeFileSync()` using Node's `fs` module
- Reads configuration from `process.argv[2]`
- Creates directories before writing files

#### `Web.ts` - WebTiposkripto

- Extends `BaseTiposkripto` for browser environment
- Implements `writeFileSync()` using exposed browser functions (`__writeFile`)
- Reads configuration from `window.testResourceConfig` or URL params
- Implements `screenshot()`, `openScreencast()`, `closeScreencast()` for browser automation

### Base Classes (Unified Pattern)

#### `BaseSetup.ts` - BaseSetup

- Unified base for all setup phases (BDD's Given, AAA's Arrange, TDT's Map)
- Contains `setup()` method that processes actions and checks
- `createArtifactoryForAction()` and `createArtifactoryForCheck()`: Create context-aware artifact factories
- `setupThat()`: Abstract method implemented by concrete types
- `afterEach()`: Cleanup hook

#### `BaseAction.ts` - BaseAction

- Unified base for all action phases (BDD's When, AAA's Act, TDT's Feed)
- `performAction()`: Abstract method implemented by concrete types
- `test()`: Calls `performAction()` with proper parameters
- `addArtifact()`: Adds artifact paths
- `toObj()`: Serializes to object

#### `BaseCheck.ts` - BaseCheck

- Unified base for all verification phases (BDD's Then, AAA's Assert, TDT's Validate)
- `verifyCheck()`: Abstract method implemented by concrete types
- `test()`: Calls `verifyCheck()` with filepath parameter
- `addArtifact()`: Adds artifact paths
- `toObj()`: Serializes to object

### User-Facing Testing Patterns

#### BDD Pattern (Behavior Driven Development)

**High-level verbs**: Given, When, Then

**Implementation**:

- `BaseGiven` extends `BaseSetup`
- `BaseWhen` extends `BaseAction`
- `BaseThen` extends `BaseCheck`

**Usage**:

```typescript
Given("initial state", ...)
When("action is performed", ...)
Then("expected outcome", ...)
```

#### Describe-It Pattern (AAA/Arrange-Act-Assert)

**High-level verbs**: Describe, It (2 verbs)

**Implementation**:

- `BaseDescribe` extends `BaseSetup` (for Arrange/Describe phase)
- `BaseIt` extends `BaseAction` (for combined Act and Assert phases)

**Usage**:

```typescript
Describe("feature", ...)
It("should behave correctly", ...)
```

**Note**: This pattern implements the AAA (Arrange-Act-Assert) pattern using 2 verbs instead of 3:
- "Describe" corresponds to the Arrange phase
- "It" combines both Act and Assert phases
This is common in JavaScript testing frameworks like Jest and Mocha, and differs from BDD which uses 3 separate verbs (Given, When, Then).

#### TDT Pattern (Table-Driven Testing)

**High-level verbs**: Value, Should, Expected

**Implementation**:

- `BaseValue` extends `BaseSetup`
- `BaseShould` extends `BaseAction`
- `BaseExpected` extends `BaseCheck`

**Usage**:

```typescript
Value("test data table", ...)
Should("process row", ...)
Expected("check output", ...)
```

**Example**:

```typescript
// Table-driven test specification
[Value["someInput"], Should["equal"], Expected["someOutput"]],
[Value["4"], Should["greater than"], Expected[3]]
```

This pattern is ideal for testing multiple input-output combinations with the same test logic.

### Internal Base Classes (Not Exposed to Users)

- `BaseSetup`: Internal base for all setup phases
- `BaseAction`: Internal base for all action phases  
- `BaseCheck`: Internal base for all verification phases

### Supporting Infrastructure

#### `CoreTypes.ts` - Type Definitions

- `IUniversalTestAdapter`: Unified interface with `prepareAll`, `prepareEach`, `execute`, `verify`, `cleanupEach`, `cleanupAll`, `assert`
- `ITestAdapter`: Legacy interface for backward compatibility (extends `IUniversalTestAdapter`)
- `TestTypeParams`: Generic type parameters for test definitions
- `Ibdd_in`, `Ibdd_out`: Legacy type aliases
- `ITestSpecification`, `ITestImplementation`: Test structure definitions
- `IArtifactory`: Type for artifactory objects

#### `types.ts` - Additional Types

- `ITestResourceConfiguration`: Configuration for test resources (name, fs, ports, files)
- `ITTestResourceRequest`: Resource requirements
- `IFinalResults`: Test execution results
- Pattern type aliases: `ISetups`, `IActions`, `IChecks`, `IArranges`, `IActs`, `IAsserts`, `IMaps`, `IFeeds`, `IValidates`, `IGivens`, `IWhens`, `IThens`

#### `index.ts` - Main Exports and Adapters

- `DefaultAdapter()`: Creates universal test adapter from partial legacy adapter
- `BaseAdapter()`: Default implementation of `IUniversalTestAdapter`
- `createAAASpecification()`: Helper for AAA pattern specifications
- `createTDTSpecification()`: Helper for TDT pattern specifications
- `AAA()`, `TDT()`: Convenience functions for pattern-specific DSL
- Exports all base classes

#### `BaseSuite.ts` - Test Suite Management

- `BaseSuite` class: Represents a test suite containing multiple givens
- `run()`: Executes all givens in the suite
- `features()`: Extracts features from givens
- `toObj()`: Serializes suite results
- `ISuites`: Type for suite collections

### File Relationships

#### Core Flow

1. `BaseTiposkripto` constructor receives test specification and implementation
2. Creates `classySuites`, `classyGivens`, `classyWhens`, `classyThens` from implementation
3. `receiveTestResourceConfig()` receives JSON config and executes tests
4. Tests run via `BaseSuite.run()` → `BaseGiven.give()` → `BaseSetup.setup()`
5. `setup()` processes actions (`BaseAction.test()`) and checks (`BaseCheck.test()`)
6. Results written to filesystem via artifactory

#### Artifactory System

- Context-aware file writing with structured paths
- `createArtifactory()` in `BaseTiposkripto` returns object with methods
- Path format: `{basePath}/suite-{N}/given-{key}/when-{index} filename.txt`
- Used by adapter methods as optional parameter

#### Adapter Integration

- All adapter methods (`prepareEach`, `execute`, `verify`, etc.) receive artifactory as optional parameter
- `DefaultAdapter()` maps legacy adapter methods to universal methods
- Supports different parameter counts for backward compatibility

### Test Execution Pipeline

```
BaseTiposkripto constructor
    ↓
Creates classySuites, classyGivens, classyWhens, classyThens
    ↓
receiveTestResourceConfig(JSON config)
    ↓
testJobs[0].receiveTestResourceConfig()
    ↓
BaseSuite.run()
    ↓
BaseGiven.give() for each given
    ↓
BaseSetup.setup()
    ├── setupThat() (via givenThat)
    ├── Process Actions: BaseAction.test() → performAction()
    ├── Process Checks: BaseCheck.test() → verifyCheck()
    └── afterEach()
        ↓
Write results via artifactory.writeFileSync()
        ↓
Return IFinalResults
```

### Key Design Patterns

1. **Abstract Base Classes**: `BaseTiposkripto`, `BaseSetup`, `BaseAction`, `BaseCheck` define abstract methods
2. **Template Method**: `BaseSetup.setup()` defines algorithm skeleton, delegates to `setupThat()`
3. **Strategy Pattern**: Adapters provide different implementations of test execution logic
4. **Factory Pattern**: `BaseTiposkripto` creates classy instances from test implementation
5. **Bridge Pattern**: Runtime implementations (Node/Web) separate abstraction from implementation

### Integration Points

#### With Node.js

- `NodeTiposkripto` uses `fs` module for file operations
- Configuration from command line arguments
- Directory creation before file writing

#### With Browser/Web

- `WebTiposkripto` uses exposed browser functions (`__writeFile`, `__screenshot`)
- Configuration from `window.testResourceConfig` or URL parameters
- Screencast support for browser automation

#### With Testeranto Ecosystem

- Consistent JSON test resource configuration format
- WebSocket communication for cross-language test execution
- Consistent artifact path structure across languages

### File Dependencies

```
BaseTiposkripto.ts (main)
├── CoreTypes.ts (type definitions)
├── types.ts (additional types)
├── BaseSetup.ts (core)
│   ├── BaseAction.ts
│   ├── BaseCheck.ts
│   ├── BaseGiven.ts (BDD)
│   ├── BaseArrange.ts (AAA)
│   └── BaseMap.ts (TDT)
├── BaseWhen.ts (BDD action)
│   └── BaseAction.ts
├── BaseThen.ts (BDD check)
│   └── BaseCheck.ts
├── BaseAct.ts (AAA action)
│   └── BaseAction.ts
├── BaseAssert.ts (AAA check)
│   └── BaseCheck.ts
├── BaseFeed.ts (TDT action)
│   └── BaseAction.ts
├── BaseValidate.ts (TDT check)
│   └── BaseCheck.ts
├── BaseSuite.ts (suite management)
├── index.ts (adapters and exports)
├── Node.ts (Node runtime)
└── Web.ts (Web runtime)
```

### Important Notes

1. **Artifactory system**: All file operations go through artifactory, not direct filesystem access
2. **Context propagation**: Suite index, given key, action/check indices propagate through context
3. **Error handling**: Failures increment `fails` count but don't stop test execution (continue with other givens)
4. **Serialization**: `toObj()` methods convert test objects to plain objects for JSON output
5. **Backward compatibility**: Legacy BDD terminology supported alongside unified patterns
6. **Abstract methods**: Concrete runtime must implement `writeFileSync()` and optionally `screenshot()`, `openScreencast()`, `closeScreencast()`

### Usage Example

```typescript
import tiposkripto from "./Node";
import { AAA } from "./index";

// Define test types
type MyTestTypes = {
  iinput: string;
  isubject: Calculator;
  istore: Calculator;
  iselection: number;
  given: (initial: number) => (calc: Calculator) => Calculator;
  when: (x: number) => (calc: Calculator) => Calculator;
  then: (expected: number) => (calc: Calculator) => boolean;
};

// Create test specification using AAA pattern
const spec = AAA<MyTestTypes, any>().Suite.Default("Calculator Suite", {
  "addition test": {
    features: ["addition", "basic"],
    acts: [
      AAA<MyTestTypes, any>().Act.Default("add 5", (calc) => calc.add(5)),
      AAA<MyTestTypes, any>().Act.Default("add 3", (calc) => calc.add(3)),
    ],
    asserts: [
      AAA<MyTestTypes, any>().Assert.Default(
        "result is 8",
        async (calc) => calc.result() === 8,
      ),
    ],
    arrangeCB: (initial: number) => (calc: Calculator) => {
      calc.reset();
      calc.add(initial);
      return calc;
    },
    initialValues: 0,
  },
});

// Create test implementation
const impl = {
  suites: { Default: "Calculator Tests" },
  givens: {
    "addition test": (
      features: string[],
      acts: any[],
      asserts: any[],
      arrangeCB: any,
      initialValues: any,
    ) => {
      // Returns BaseArrange instance
    },
  },
  whens: {
    "add 5": (x: number) => (calc: Calculator) => {
      calc.add(x);
      return calc;
    },
  },
  thens: {
    "result is 8": (expected: number) => async (calc: Calculator) => {
      return calc.result() === expected;
    },
  },
};

// Run tests
const runner = await tiposkripto(
  "test input",
  spec,
  impl,
  {}, // adapter
  { ports: 0 }, // resource requirement
);

const results = await runner.receiveTestResourceConfig({
  name: "test",
  fs: "./results",
  ports: [],
  files: [],
});
```

This architecture enables consistent cross-platform testing while leveraging TypeScript's type system for safety and IDE support.

## Implementation Notes

### Visual Artifacts (Screenshots and Screencasts)

**Ruby (Rubeno) and Python (Pitono) implementations**:
- Screenshot and screencast functionality is not applicable
- These methods exist as placeholders for cross-language API consistency
- They create file artifacts with placeholder content but do not capture actual screen content
- In browser automation contexts, these would be meaningful, but in Ruby/Python they serve only to maintain API consistency

**TypeScript (Tiposkripto) implementation**:
- Screenshot and screencast functionality is only applicable in browser environments (WebTiposkripto)
- Node.js runtime provides placeholder implementations for cross-language compatibility
- Browser runtime can capture actual screen content when running in browser automation contexts

**Other implementations (Go, Java, Rust)**:
- Should follow the same pattern: provide placeholder implementations for cross-language consistency
- Actual screen capture only makes sense in browser automation contexts

## Implementation Notes

### Visual Artifacts (Screenshots and Screencasts)

**Ruby (Rubeno) and Python (Pitono) implementations**:
- Screenshot and screencast functionality is not applicable
- These methods exist as placeholders for cross-language API consistency
- They create file artifacts with placeholder content but do not capture actual screen content
- In browser automation contexts, these would be meaningful, but in Ruby/Python they serve only to maintain API consistency

**TypeScript (Tiposkripto) implementation**:
- Screenshot and screencast functionality is only applicable in browser environments (WebTiposkripto)
- Node.js runtime provides placeholder implementations for cross-language compatibility
- Browser runtime can capture actual screen content when running in browser automation contexts

**Other implementations (Go, Java, Rust)**:
- Should follow the same pattern: provide placeholder implementations for cross-language consistency
- Actual screen capture only makes sense in browser automation contexts
