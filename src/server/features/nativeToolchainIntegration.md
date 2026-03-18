# Native Toolchain Integration

## Overview
Each runtime builder must detect whether entry points are native test files (e.g., RSpec, JUnit, pytest) and translate them into proper testeranto tests during the build process. This allows users to run existing test suites without modification while still benefiting from testeranto's execution and reporting infrastructure.

## Language-Specific Integration Plans

### Ruby
**Tools to integrate:**
- RSpec (`.spec.rb`, `_spec.rb`)
- Minitest (`.test.rb`, `_test.rb`)
- Test::Unit (legacy)

**Detection approach:**
- AST parsing via Prism to identify test frameworks
- File naming patterns
- Presence of framework-specific DSL (e.g., `describe`, `it`, `context`)

**Translation strategy:**
- Wrap RSpec examples in testeranto-compatible runners
- Capture test results via RSpec formatters
- Map RSpec metadata to testeranto attributes

### Java
**Tools to integrate:**
- JUnit 4 & 5 (`.java` with `@Test` annotations)
- TestNG (`.java` with `@Test` annotations)
- Spock (`.groovy` with Specification style)

**Detection approach:**
- Bytecode analysis via ASM or reflection
- Annotation scanning (`@Test`, `@org.junit.Test`)
- Class naming patterns (`*Test.java`, `*Spec.java`)

**Translation strategy:**
- Generate wrapper classes that extend testeranto base
- Use JUnit's `TestRunner` API to execute tests
- Capture results via `RunListener`

### Python
**Tools to integrate:**
- pytest (`.py` files with `test_` prefix)
- unittest (`.py` with `TestCase` classes)
- nose/nose2 (legacy)

**Detection approach:**
- AST analysis for test class/method patterns
- Import detection (`import pytest`, `from unittest import`)
- File naming conventions (`test_*.py`, `*_test.py`)

**Translation strategy:**
- Create adapter modules that import and run native tests
- Use pytest's plugin system for result capture
- Map Python test outcomes to testeranto results

### JavaScript/TypeScript (Node)
**Tools to integrate:**
- Jest (`.test.js`, `.spec.js`)
- Mocha (`.test.js`, `.spec.js`)
- Jasmine (`.spec.js`)
- Vitest (`.test.js`)

**Detection approach:**
- AST analysis for test framework imports
- Configuration file detection (`jest.config.js`, `.mocharc.js`)
- Test function patterns (`describe`, `it`, `test`)

**Translation strategy:**
- Bundle tests with framework-specific runners
- Intercept test results via reporter APIs
- Convert to testeranto result format

### Go
**Tools to integrate:**
- Go testing package (`*_test.go`)
- Testify (assertion library)
- Ginkgo (BDD framework)

**Detection approach:**
- Source analysis for `TestXxx` function signatures
- Import detection (`github.com/stretchr/testify`)
- File naming (`*_test.go`)

**Translation strategy:**
- Compile tests with `go test -c`
- Execute binaries with custom test runner
- Parse Go test output (JSON format available)

### Rust
**Tools to integrate:**
- Rust's built-in test framework (`#[test]` attributes)
- Criterion (benchmarking)
- Specs (BDD style)

**Detection approach:**
- AST analysis for `#[test]` attributes
- Cargo.toml dependency detection
- Module structure analysis

**Translation strategy:**
- Compile with `--test` flag
- Use Rust's test harness with custom formatter
- Capture results via JSON output

### Web (Browser)
**Tools to integrate:**
- Jest with jsdom
- Mocha in browser
- Cypress (e2e)
- Playwright/TestCafe

**Detection approach:**
- Configuration file analysis
- Import statements in test files
- Test runner detection

**Translation strategy:**
- Bundle tests with appropriate test runner
- Execute in browser with result interception
- Map to testeranto's web runtime

## Common Infrastructure

### AST Analysis Libraries
- Ruby: Prism (already integrated)
- Python: `ast` module (standard library)
- JavaScript: Babel parser, TypeScript compiler API
- Java: ASM, JavaParser
- Go: `go/ast` package
- Rust: `syn` crate

### Detection Heuristics
1. **File naming patterns**: Standard test file naming conventions
2. **Import/require statements**: Framework-specific imports
3. **AST patterns**: Test function/method/class definitions
4. **Configuration files**: Framework config files in project
5. **Dependencies**: Package manager metadata (Gemfile, package.json, Cargo.toml, etc.)

### Translation Patterns
1. **Wrapper generation**: Create adapter code that runs native tests
2. **Result interception**: Hook into test framework's reporting system
3. **Metadata mapping**: Convert native test attributes to testeranto format
4. **Execution orchestration**: Control test lifecycle (setup/teardown)

### Implementation Phases
1. **Phase 1**: Ruby, Python, Java (highest demand)
2. **Phase 2**: JavaScript/TypeScript, Go
3. **Phase 3**: Rust, Web frameworks
4. **Phase 4**: Additional niche frameworks

## Canonical Three-Parameter Architecture

Testeranto's canonical TypeScript structure uses three key parameters that must be generated when translating native test frameworks:

1. **Specification**: Defines the test structure (suites, givens, whens, thens)
2. **Implementation**: Provides concrete implementations for the specification
3. **Adapter**: Adapts the test to the runtime environment

### Automatic Generation from Native Tests

For each native test framework, we need to automatically generate these three components:

#### 1. Specification Generation
The specification defines the BDD structure. For native tests, we generate:
- **Suite**: One suite per test class or describe block
- **Given**: Setup code extracted from `@Before`, `setUp`, `beforeEach`, etc.
- **When**: Test actions extracted from test methods
- **Then**: Assertions extracted from test body

Example for JUnit:
```typescript
// Generated specification
const specification = (Suite, Given, When, Then) => [
  Suite("CalculatorTest", {
    "given calculator setup": Given(
      ["Calculator test"],
      [When("perform addition", ...)],
      [Then("result is correct", ...)]
    )
  })
];
```

#### 2. Implementation Generation
The implementation provides concrete code for the specification:
- **Suites**: Map to test classes or describe blocks
- **Givens**: Map to setup methods
- **Whens**: Map to test methods
- **Thens**: Map to assertion logic

Example for JUnit:
```typescript
// Generated implementation
const implementation = {
  suites: {
    "CalculatorTest": {
      // Suite implementation
    }
  },
  givens: {
    "calculator setup": (features, whens, thens, givenCB, initialValues) => {
      // Setup code from @Before method
    }
  },
  whens: {
    "perform addition": (store) => {
      // Code from @Test method
    }
  },
  thens: {
    "result is correct": (selection) => {
      // Assertion logic
    }
  }
};
```

#### 3. Adapter Generation
The adapter connects testeranto to the native test runner:
- **beforeAll/beforeEach**: Map to framework setup hooks
- **andWhen**: Map to test execution
- **butThen**: Map to assertion execution
- **afterAll/afterEach**: Map to teardown hooks

Example for JUnit:
```typescript
// Generated adapter
const adapter = {
  beforeAll: (input, testResource) => {
    // JUnit @BeforeClass equivalent
  },
  beforeEach: (subject, initializer, testResource, initialValues) => {
    // JUnit @Before equivalent
  },
  andWhen: (store, whenCB, testResource) => {
    // Execute test method
    return whenCB(store);
  },
  butThen: (store, thenCB, testResource) => {
    // Execute assertions
    return thenCB(store);
  }
};
```

### Framework-Specific Translation Strategies

#### RSpec (Ruby)
**Specification Generation:**
- Each `describe` block → Suite
- `before(:each)` → Given
- `it` blocks → When + Then
- `expect` statements → Then assertions

**Implementation Generation:**
- Extract RSpec DSL to testeranto implementation
- Map RSpec matchers to testeranto assertions

**Adapter Generation:**
- Use RSpec's runner API to execute tests
- Capture results via RSpec formatters

#### JUnit (Java)
**Specification Generation:**
- Test class → Suite
- `@Before`/`@BeforeEach` → Given
- `@Test` methods → When + Then
- Assert statements → Then assertions

**Implementation Generation:**
- Use reflection to extract test methods
- Map JUnit assertions to testeranto assertions

**Adapter Generation:**
- Use `JUnitCore` to run tests
- Implement `RunListener` to capture results

#### pytest (Python)
**Specification Generation:**
- Test module → Suite
- Fixtures → Given
- Test functions → When + Then
- `assert` statements → Then assertions

**Implementation Generation:**
- Parse pytest fixtures and test functions
- Map pytest assertions to testeranto assertions

**Adapter Generation:**
- Use `pytest.main()` to run tests
- Capture results via pytest hooks

#### Jest (JavaScript)
**Specification Generation:**
- `describe` blocks → Suites
- `beforeEach` → Given
- `it`/`test` blocks → When + Then
- `expect` calls → Then assertions

**Implementation Generation:**
- Parse Jest test files
- Map Jest matchers to testeranto assertions

**Adapter Generation:**
- Use Jest's test runner API
- Capture results via Jest reporters

### Implementation Steps for Each Runtime

#### Step 1: AST Analysis
Parse native test files to extract:
- Test structure (suites, tests, setup/teardown)
- Assertion locations and types
- Dependencies and imports

#### Step 2: Component Generation
Generate the three canonical components:
1. **Specification**: Create BDD structure from native tests
2. **Implementation**: Map native test code to testeranto implementation
3. **Adapter**: Create bridge to native test runner

#### Step 3: Integration
Integrate generated components into testeranto runtime:
- Load generated specification
- Use generated implementation
- Connect via generated adapter

### Example: JUnit to Testeranto Translation

**Original JUnit Test:**
```java
public class CalculatorTest {
    private Calculator calculator;
    
    @BeforeEach
    void setUp() {
        calculator = new Calculator();
    }
    
    @Test
    void testAddition() {
        int result = calculator.add(2, 3);
        assertEquals(5, result);
    }
}
```

**Generated Specification:**
```typescript
const specification = (Suite, Given, When, Then) => [
  Suite("CalculatorTest", {
    "calculator setup": Given(
      ["Calculator operations"],
      [When("perform addition", /* ... */)],
      [Then("result equals 5", /* ... */)]
    )
  })
];
```

**Generated Implementation:**
```typescript
const implementation = {
  suites: {
    "CalculatorTest": { /* ... */ }
  },
  givens: {
    "calculator setup": (features, whens, thens, givenCB, initialValues) => {
      // Setup code from @BeforeEach
      return new Calculator();
    }
  },
  whens: {
    "perform addition": (store) => {
      // Code from testAddition()
      return store.add(2, 3);
    }
  },
  thens: {
    "result equals 5": (selection) => {
      // Assertion from assertEquals
      return selection === 5;
    }
  }
};
```

**Generated Adapter:**
```typescript
const adapter = {
  beforeEach: (subject, initializer, testResource, initialValues) => {
    // Calls @BeforeEach method
    return initializer(subject);
  },
  andWhen: (store, whenCB, testResource) => {
    // Executes @Test method
    return whenCB(store);
  },
  butThen: (store, thenCB, testResource) => {
    // Executes assertions
    return thenCB(store);
  }
};
```

### Integration with Existing Runtimes

Each runtime builder needs to be extended to:

1. **Detect native test frameworks** in entry points
2. **Parse and analyze** native test files
3. **Generate the three canonical components**
4. **Create wrapper code** that loads the generated components
5. **Execute tests** through the generated adapter

This approach maintains testeranto's strict BDD architecture while supporting native test frameworks through automatic translation.

### Implementation Requirements

#### Ruby Integration
**BDD Translation:**
- **RSpec with Gherkin**: Map `Given`/`When`/`Then` steps directly
- **RSpec without Gherkin**: 
  - `before(:each)` → **Given**
  - `it` blocks → **When** + **Then**
  - Extract expectations as **Then** assertions
- **Minitest**: 
  - `setup` method → **Given**
  - Test methods → **When** + **Then**

#### Python Integration
**BDD Translation:**
- **pytest with fixtures**: 
  - Fixtures → **Given** (setup)
  - Test function → **When** + **Then**
- **unittest**:
  - `setUp` → **Given**
  - `test_*` methods → **When** + **Then**
- **Behave**: Direct Gherkin mapping

#### Java Integration
**BDD Translation:**
- **JUnit 4/5**:
  - `@Before`/`@BeforeEach` → **Given**
  - `@Test` methods → **When** + **Then**
  - Multiple assertions become multiple Thens
- **TestNG**: Similar to JUnit
- **JBehave**: Direct Gherkin mapping

#### JavaScript/TypeScript Integration
**BDD Translation:**
- **Jest/Mocha**:
  - `beforeEach` → **Given**
  - `it`/`test` blocks → **When** + **Then**
  - Multiple `expect` calls become multiple Thens
- **Cucumber.js**: Direct Gherkin mapping

#### Go Integration
**BDD Translation:**
- **Standard testing**:
  - Setup code at start of `TestXxx` → **Given**
  - Test body → **When** + **Then**
- **Testify**: Assertions map to Thens
- **Ginkgo**: BDD-style, can be mapped directly

#### Rust Integration
**BDD Translation:**
- **Standard `#[test]`**:
  - Initial setup code → **Given**
  - Test body → **When** + **Then**
- **Criterion**: Benchmarks - limited compatibility

#### Web Integration
**BDD Translation:**
- **Cypress**: 
  - `beforeEach` → **Given**
  - `it` blocks → **When** + **Then**
- **Playwright/TestCafe**: Similar to Cypress
- **Selenium**: Test methods map to When+Then

### Translation Implementation Strategy

For each framework, implement:

1. **AST Parser**: Analyze test files to identify structure
2. **Pattern Matcher**: Detect framework-specific patterns
3. **Code Transformer**: Generate testeranto-compatible wrapper
4. **Result Mapper**: Convert framework results to testeranto format

#### Example: JUnit to Testeranto
```java
// Original JUnit test
@BeforeEach
void setUp() { /* setup code */ }  // → Given

@Test
void testAddition() {
    Calculator calc = new Calculator();  // Part of Given
    int result = calc.add(2, 3);         // → When
    assertEquals(5, result);             // → Then
    assertTrue(result > 0);              // → Additional Then
}
```

#### Example: Jest to Testeranto
```javascript
// Original Jest test
beforeEach(() => { /* setup */ });  // → Given

it('adds numbers', () => {
    const calc = new Calculator();  // Part of Given
    const result = calc.add(2, 3);  // → When
    expect(result).toBe(5);         // → Then
    expect(result).toBePositive();  // → Additional Then
});
```

### Success Criteria for Translation

1. **Preserve test intent**: The behavioral meaning should remain unchanged
2. **Maintain test isolation**: Each When/Then pair should be independent
3. **Support all assertions**: All verification points become Thens
4. **Handle async tests**: Properly sequence asynchronous operations
5. **Maintain failure reporting**: Map framework failures to testeranto format

### Limitations and Workarounds

1. **Tests without clear Given**: Use empty Given or extract from test context
2. **Tests mixing multiple actions**: Split into multiple When/Then pairs
3. **Parameterized tests**: Generate separate Given/When/Then for each parameter set
4. **Tests with complex setup**: Bundle all setup as single Given

### Implementation Priority

1. **Phase 1**: Direct BDD frameworks (Cucumber, RSpec Gherkin)
2. **Phase 2**: Setup-test frameworks with clear separation (JUnit, pytest)
3. **Phase 3**: JavaScript frameworks (Jest, Mocha)
4. **Phase 4**: Remaining frameworks with adaptation needed
5. **Phase 5**: Limited compatibility frameworks (benchmarks, etc.)

This approach ensures meaningful translation while maintaining testeranto's strict BDD architecture.

## Success Metrics
- Native tests run without modification
- Test results accurately captured and reported
- Performance overhead < 20%
- Support for 80% of popular test frameworks in each language

## Implementation Timeline

### Phase 1 (Current): Foundation
- Basic detection for each language
- Simple wrapper generation for existing testeranto tests
- Input file collection and hashing

### Phase 2: Native Test Detection
- Implement AST/pattern detection for each framework
- Add configuration file parsing
- Create framework-specific detection modules

### Phase 3: Wrapper Generation
- Build adapters for each major test framework
- Implement result capture and conversion
- Handle framework-specific lifecycle hooks

### Phase 4: Optimization & Polish
- Performance optimization
- Error handling and debugging
- Documentation and examples
