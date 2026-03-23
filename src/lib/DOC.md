# Testeranto Cross-Language BDD Framework - Documentation

## Overview

Testeranto is a testing framework implemented across six programming languages:

- **TypeScript/JavaScript**: `tiposkripto`
- **Python**: `pitono`
- **Go**: `golingvu`
- **Ruby**: `rubeno`
- **Java**: `kafe`
- **Rust**: `rusto`

Each implementation follows the same core BDD pattern while respecting language idioms and best practices.

## Core Philosophy

### 1. Multiple Patterns, Single Framework

Testeranto supports multiple testing patterns while maintaining a consistent API:

#### BDD Pattern (Given-When-Then)

Every Testeranto test follows the same fundamental pattern:

```
testeranto(
  subject,              // The thing being tested
  specification,        // Business requirements in plain language
  implementation,       // Concrete operations for test steps
  resourceRequirement,  // Necessary test resources
  adapter,             // Hooks for test lifecycle
  xtras                // Additional arguments passed to Given
) -> Test Execution
```

This pattern enforces a stricter set of steps. You define a series of Whens and a list of Thens. The Whens are executed in order and the Thens are not guaranteed to run in any order.

#### Describe/It

Testeranto also supports the Describe/It pattern through the same infrastructure:

- **Describe** maps to **Given** (setup initial state)
- **It** maps to TBD

This pattern enforces a looser set of steps. You define nested Describe functions with It functions. The It functions allow for both mutations and assertions mixed.

#### TDT Pattern (Table Driven Testing)

Testeranto now supports TDT (Table Driven Testing) pattern:

- **Map** maps to **Given** (defines test table data)
- **Feed** maps to **When** (processes each row from the table)
- **Validate** maps to **Then** (validates output against expected results)

This pattern is best used for testing stateless functions. You provide an input, an output, and an assertion.

This allows you to use the pattern that best fits your testing style while leveraging the same robust framework.

### 2. Separation of Concerns

- **Specification**: Pure business logic, human-readable descriptions
- **Implementation**: Concrete operations that bring specifications to life
- **Adapter**: Non-business logic code that adapts your test subject to BDD hooks

### 3. Consistent Cross-Language API

All implementations provide:

- `BaseSuite`, `BaseGiven`, `BaseWhen`, `BaseThen` base classes
- `ITestAdapter` interface for lifecycle hooks
- JSON-based test resource configuration
- WebSocket support for real-time reporting

## Key Concepts

### The 5 Essential Types (TypeScript Reference)

1. **TestTypeParams** (formerly `Ibdd_in`): Describes the type parameters for test execution

   ```typescript
   type TestTypeParams<IInput, ISubject, IStore, ISelection, ISetup, IAction, ICheck>
   ```

2. **TestSpecShape** (formerly `Ibdd_out`): Describes the structure of test specifications

   ```typescript
   type TestSpecShape<ISuites, ISetups, IActions, IChecks>
   ```

3. **ITestSpecification**: Function that defines business requirements
4. **ITestImplementation**: Structure containing concrete operations
5. **IUniversalTestAdapter**: Interface for test lifecycle hooks with methodology-agnostic terminology

### Test Lifecycle

#### BDD Lifecycle

```
BeforeAll → [Suite → (Given → When* → Then*)+] → AfterAll
           ↑
      BeforeEach/AfterEach per Given
```

#### AAA Lifecycle

```
BeforeAll → [Suite → (Arrange → Act* → Assert*)+] → AfterAll
           ↑
      BeforeEach/AfterEach per Arrange
```

Both patterns share the same underlying lifecycle hooks and adapter methods.

## Implementation Status & Alignment

### ✅ Well-Aligned Components

- All languages have the four core base classes
- Consistent BDD pattern: Given-When-Then
- JSON test results format
- Command-line/query parameter support

### ⚠️ Partial Alignment Issues

#### 1. Method Signatures

**TypeScript (Reference):**

```typescript
async give(
  subject: I["isubject"],
  key: string,
  testResourceConfiguration: ITestResourceConfiguration,
  tester: (t: Awaited<I["then"]> | undefined) => boolean,
  artifactory?: ITestArtifactory,
  suiteNdx?: number
)
```

**Python (Needs Fix):**

```python
async def give(
    self,
    subject: Isubject,
    key: str,
    test_resource_configuration,
    tester: Callable[[Any], bool],
    artifactory: Optional[Callable[[str, Any], None]] = None,
    suite_ndx: int = 0
) -> Istore:
    # Missing: filepath parameter in then_step.test() calls
```

**Action Required**: Update Python to pass `filepath` parameter to `then_step.test()`

#### 2. Adapter Interface

**TypeScript (Reference):**

```typescript
interface ITestAdapter<I extends Ibdd_in_any> {
  beforeAll: (
    input: I["iinput"],
    testResource: ITestResourceConfiguration,
  ) => Promise<I["isubject"]>;
  // No 'pm' parameter
}
```

**Python/Java/Ruby (Current):**

```python
async def before_all(self, input_val: Any, tr: ITTestResourceConfiguration, pm: Any) -> Any:
    # Has 'pm' parameter
```

**Action Required**: Remove `pm` parameter from adapter methods where TypeScript doesn't have it

#### 3. BaseSuite.run() Parameters

**TypeScript (Reference):**

```typescript
async run(
  input: I["iinput"],
  testResourceConfiguration: ITestResourceConfiguration
): Promise<BaseSuite<I, O>>
// No 'artifactory' parameter passed to give()
```

**Python (Fixed):**

```python
async def run(
    self,
    input_val: Any,
    test_resource_configuration,
) -> 'BaseSuite':
    # Now passes None for artifactory to match TypeScript
    self.store = await g.give(
        subject,
        g_key,
        test_resource_configuration,
        self.assert_that,
        None,  # artifactory is None to match TypeScript
        self.index
    )
```

### ❌ Major Incongruencies Needing Attention

1. **Type Systems**: Only TypeScript has full generics
2. **Async Patterns**: Inconsistent async/await implementations
3. **Error Handling**: Different patterns across languages
4. **WebSocket Support**: Varying levels of implementation

## Language-Specific Implementation Details

### TypeScript (tiposkripto) - Reference Implementation

- **Status**: Most complete and canonical
- **Key Files**: `BaseTiposkripto.ts`, `BaseSetup.ts`, `BaseAction.ts`, `BaseCheck.ts`
- **Legacy BDD Files**: `BaseGiven.ts`, `BaseWhen.ts`, `BaseThen.ts` (deprecated)
- **Legacy AAA Files**: `BaseArrange.ts`, `BaseAct.ts`, `BaseAssert.ts` (deprecated)
- **Legacy TDT Files**: `BaseMap.ts`, `BaseFeed.ts`, `BaseValidate.ts` (deprecated)
- **Runtime Support**: Node.js and Web browsers
- **Type Safety**: Full TypeScript generics support
- **Pattern Support**: Unified (Setup-Action-Check) with backward compatibility for BDD, AAA, and TDT

#### AAA Example in TypeScript

```typescript
import { AAA } from "tiposkripto/src/index";
import tiposkripto from "tiposkripto/src/Node";

// Define your test subject
class Calculator {
  private value: number = 0;

  add(x: number) {
    this.value += x;
  }
  subtract(x: number) {
    this.value -= x;
  }
  getValue() {
    return this.value;
  }
}

// Use AAA pattern
const { Suite, Arrange, Act, Assert } = AAA();

const specification = (Suite, Arrange, Act, Assert) => [
  Suite.Default("Calculator Tests", {
    test1: Arrange.Default(
      ["Basic addition"],
      [
        Act.Default("add 5", (calc) => {
          calc.add(5);
          return calc;
        }),
      ],
      [
        Assert.Default("value should be 5", async (calc) => {
          if (calc.getValue() !== 5) throw new Error("Expected 5");
          return calc;
        }),
      ],
    ),
  }),
];

// Implementation would follow similar structure to BDD
// The adapter remains unchanged
```

### Python (pitono) - High Priority Fixes Needed

- **Status**: Good structure, needs signature alignment
- **Key Issues**:
  1. `BaseGiven.give()` should pass `filepath` to `then_step.test()`
  2. Remove `pm` parameters from adapter methods
  3. Ensure `BaseSuite.run()` doesn't pass `artifactory`
- **Files to Update**:
  - `src/lib/pitono/src/base_given.py`
  - `src/lib/pitono/src/pitono_types.py`
  - `src/lib/pitono/src/simple_adapter.py`

### Go (golingvu) - Medium Priority

- **Status**: Basic implementation needs completion
- **Key Issues**:
  1. Placeholder implementations need real logic
  2. Error handling needs Go idioms
  3. WebSocket support incomplete
- **Files to Update**:
  - `src/lib/golingvu/golingvu.go`
  - `src/lib/golingvu/base_given.go`
  - `src/lib/golingvu/base_when.go`

### Ruby (rubeno) - Medium Priority

- **Status**: Functional but Ruby-specific patterns
- **Key Issues**:
  1. Method naming (snake_case consistency)
  2. Error handling improvements
  3. WebSocket support
- **Files to Update**:
  - `src/lib/rubeno/lib/rubeno.rb`
  - `src/lib/rubeno/lib/base_given.rb`

### Rust (rusto) - High Priority

- **Status**: Skeletal structure with incomplete async
- **Key Issues**:
  1. Complete async implementations using `async_trait`
  2. Implement proper error types
  3. Add comprehensive examples
- **Files to Update**:
  - `src/lib/rusto/src/rusto.rs`
  - `src/lib/rusto/src/base_given.rs`
  - `src/lib/rusto/src/types.rs`

### Java (kafe) - High Priority

- **Status**: Placeholder implementation needs significant work
- **Key Issues**:
  1. Replace placeholder implementations with actual code
  2. Implement proper Java generics and interfaces
  3. Add Maven/Gradle build support
- **Files to Update**:
  - `src/lib/kafe/src/main/java/kafe/Kafe.java`
  - `src/lib/kafe/src/main/java/kafe/BaseGiven.java`
  - `src/lib/kafe/src/main/java/kafe/ITestAdapter.java`

## Alignment Plan

### Phase 1: Core Interface Standardization (Immediate)

1. **Standardize method signatures** across all base classes
2. **Align adapter interfaces** to match TypeScript's `ITestAdapter`
3. **Consistent error handling** patterns
4. **Uniform artifact management** with path normalization

### Phase 2: Type System Harmonization (Short-term)

1. **TypeScript**: Keep as reference model
2. **Python/Ruby**: Enhance type hints to match TypeScript patterns
3. **Go/Java/Rust**: Implement equivalent generics/interface patterns
4. **Document type mappings** between languages

### Phase 3: Async/Concurrency Patterns (Medium-term)

1. **Standardize async signatures** across all languages
2. **Implement consistent promise/future patterns**
3. **Ensure thread/goroutine safety** where applicable
4. **Document concurrency models** for each language

## Testing Strategy

### Cross-Language Test Suite

Create a reference test that runs in all languages:

```typescript
// TypeScript reference
Suite.Default("Calculator Tests", {
  test1: Given.Default(
    ["Basic arithmetic"],
    [When.add(2, 3)],
    [Then.resultShouldBe(5)],
  ),
});
```

### Implementation Checklist for Each Language

- [ ] `BaseGiven.give()` method signature matches TypeScript
- [ ] `BaseThen.test()` accepts `filepath` parameter
- [ ] Adapter methods have correct parameters (no extra `pm`)
- [ ] `BaseSuite.run()` doesn't pass `artifactory` to `give()`
- [ ] Error handling follows language idioms
- [ ] Artifact path normalization implemented
- [ ] WebSocket support (if applicable)
- [ ] JSON test output matches reference format

## Development Workflow

### 1. Start with TypeScript Reference

Always check TypeScript implementation first:

```bash
cd src/lib/tiposkripto
npm test  # Run reference tests
```

### 2. Update Target Language

```bash
# Example: Fix Python implementation
cd src/lib/pitono
# 1. Compare method signatures with TypeScript
# 2. Update base classes
# 3. Run tests
python -m pytest tests/ -v
```

### 3. Verify Cross-Language Consistency

```bash
# Run the same test scenario in multiple languages
./scripts/run-cross-language-test.sh CalculatorTest
```

### 4. Update Documentation

```bash
# Update this DOC.md with changes
# Update language-specific README files
```

## Common Patterns & Solutions

### Problem: Extra Parameters in Method Signatures

**Solution**: Remove parameters not present in TypeScript reference:

```python
# Before (Python):
async def before_all(self, input_val, tr, pm):  # Extra 'pm'

# After (matches TypeScript):
async def before_all(self, input_val, tr):  # No 'pm'
```

### Problem: Missing Parameters

**Solution**: Add missing parameters from TypeScript reference:

```python
# Before (Python):
result = await then_step.test(store, test_resource_configuration)

# After (matches TypeScript):
filepath = f"given-{key}/then-{then_ndx}"
result = await then_step.test(store, test_resource_configuration, filepath)
```

### Problem: Inconsistent Error Handling

**Solution**: Standardize on try-catch patterns:

```python
# Standard pattern:
try:
    result = await step.test(store, config)
    self.status = True
    return result
except Exception as e:
    self.status = False
    self.error = e
    self.fails += 1
    # Don't re-raise to continue processing other steps
```

## Toolchain Integration

### Official Test Runners

- **Go**: `go test` integration via `golingvu`
- **Rust**: `cargo test` integration via `rusto` macros
- **Python**: `unittest`/`pytest` compatibility via `pitono`
- **Ruby**: `minitest`/`RSpec` integration via `rubeno`
- **Java**: JUnit 5 extensions via `kafe`
- **TypeScript**: Vitest/Jest/Node test runner adapters

### CI/CD Integration

Each implementation should:

1. Produce JUnit XML or similar standard reports
2. Support parallel test execution
3. Integrate with GitHub Actions, GitLab CI, etc.
4. Provide code coverage reporting

## For AI Assistants

### Key Points to Remember

1. **TypeScript is the reference**: All other implementations should match it
2. **Check method signatures first**: Most incongruencies are parameter mismatches
3. **Preserve language idioms**: Match TypeScript patterns but use language-appropriate syntax
4. **Test resource configuration**: Always passed as JSON string
5. **WebSocket port**: Default is 'ipcfile' or provided as argument

### Common Fix Patterns

```python
# Pattern 1: Remove extra parameters
- async def method(self, a, b, c, pm):  # Has extra 'pm'
+ async def method(self, a, b, c):      # Matches TypeScript

# Pattern 2: Add missing parameters
- result = step.test(store, config)
+ result = step.test(store, config, filepath)  # Add filepath

# Pattern 3: Update constructor calls
- BaseSuite.run(..., artifactory=some_func)
+ BaseSuite.run(..., artifactory=None)  # TypeScript doesn't pass it
```

### Verification Checklist for AI

When reviewing or modifying code:

- [ ] Method signatures match TypeScript reference
- [ ] Adapter interface has correct parameters
- [ ] Error handling follows language idioms
- [ ] Artifact paths are normalized (replace `\` with `/`)
- [ ] JSON output matches expected format
- [ ] Tests pass in target language
- [ ] Cross-language consistency maintained

## Getting Help

### Reference Implementations

- **Full Example**: `src/lib/tiposkripto/tests/abstractBase.test/`
- **TypeScript Types**: `src/lib/tiposkripto/src/CoreTypes.ts`
- **Base Classes**: `src/lib/tiposkripto/src/Base*.ts`

### Common Issues & Solutions

1. **"Parameter mismatch"**: Compare with TypeScript reference implementation
2. **"Async not working"**: Check language-specific async patterns
3. **"Test not running"**: Verify test resource configuration format
4. **"Results not writing"**: Check filesystem permissions and paths

### Contributing

1. Always start with TypeScript reference
2. Update one language at a time
3. Run existing tests before making changes
4. Update documentation (this file)
5. Consider cross-language impact

## Version History & Compatibility

### Current Versions

- `tiposkripto`: 0.1.x (reference)
- `pitono`: 0.1.24
- `golingvu`: Not versioned
- `rubeno`: 0.1.7
- `rusto`: Not versioned
- `kafe`: Not versioned

### Breaking Changes

When making changes that affect cross-language compatibility:

1. Update this DOC.md file
2. Notify maintainers of all implementations
3. Consider migration path for existing tests
4. Update version numbers appropriately

---

_Last Updated: 2026-03-14_
_Maintainer: Testeranto Team_
_Reference: TypeScript (tiposkripto) implementation_
