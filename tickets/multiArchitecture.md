# Testeranto Multi-Strategy Testing Architecture

### BDD (Behavior Driven Design)

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

### AAA (Arrange-Act-Assert) - Implemented as Describe-It Pattern (2 Verbs)

**Note**: The AAA (Arrange-Act-Assert) pattern is implemented as the Describe-It pattern with 2 verbs: "Describe" (for Arrange) and "It" (for combined Act and Assert). This differs from BDD which uses 3 separate verbs (Given, When, Then). The Describe-It pattern follows the same underlying architecture but uses terminology common in JavaScript testing frameworks like Jest and Mocha.

### TDT (Table Driven Testing)

**High-level verbs**: Value, Should, Expected

**Implementation**:

- `BaseValue` extends `BaseSetup` (formerly `BaseThatFor`)
- `BaseShould` extends `BaseAction` (formerly `BaseItIs`)
- `BaseExpected` extends `BaseCheck` (formerly `BaseThat`)

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

## Overview

Testeranto now supports three testing methodologies through a unified core architecture. All methodologies share the same underlying infrastructure while providing distinct high-level APIs.

## Core Architecture

### Unified Foundation

All testing methodologies are built upon three fundamental classes:

1. **BaseSetup** - Handles test initialization and state preparation
2. **BaseAction** - Manages test execution and operations
3. **BaseCheck** - Performs verification and assertions

These classes provide a consistent foundation while allowing methodology-specific extensions.

### Adapter Interface

The test adapter uses methodology-agnostic terminology:

```typescript
interface IUniversalTestAdapter<I extends TestTypeParams_any> {
  // Lifecycle hooks
  prepareAll: (
    input: I["iinput"],
    testResource: ITestResourceConfiguration,
  ) => Promise<I["isubject"]>;
  prepareEach: (
    subject: I["isubject"],
    initializer: (c?) => I["given"],
    testResource: ITestResourceConfiguration,
    initialValues,
  ) => Promise<I["istore"]>;

  // Execution
  execute: (
    store: I["istore"],
    actionCB: I["when"],
    testResource: ITestResourceConfiguration,
  ) => Promise<I["istore"]>;

  // Verification
  verify: (
    store: I["istore"],
    checkCB: I["then"],
    testResource: ITestResourceConfiguration,
  ) => Promise<I["iselection"]>;

  // Cleanup
  cleanupEach: (store: I["istore"], key: string) => Promise<unknown>;
  cleanupAll: (store: I["istore"]) => any;

  // Assertion
  assert: (x: I["then"]) => any;
}
```

### Type System

The type system has been renamed for clarity:

1. **TestTypeParams** (formerly `Ibdd_in`) - Defines the type parameters for test execution
2. **TestSpecShape** (formerly `Ibdd_out`) - Defines the structure of test specifications

## Supported Methodologies

### 1. BDD (Behavior Driven Development) - User-Facing

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

### 2. AAA (Arrange-Act-Assert) - Implemented as Describe-It Pattern

**Note**: The AAA (Arrange-Act-Assert) pattern is implemented as the Describe-It pattern with 2 verbs: "Describe" (for Arrange) and "It" (for combined Act and Assert). This follows the same underlying architecture but uses terminology common in JavaScript testing frameworks.

### 3. TDT (Table Driven Testing) - User-Facing

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


## Additional Testing Patterns

### 3. Describe-It Pattern (AAA/Arrange-Act-Assert)

**High-level verbs**: Describe, It

**Implementation**:

- `BaseDescribe` extends `BaseSetup` (for Arrange/Describe)
- `BaseIt` extends `BaseAction` (for Act/Assert combined in It)

**Usage**:

```typescript
Describe("feature", ...)
It("should behave correctly", ...)
```

**Note**: This pattern combines the Act and Assert phases into a single "It" step, which is common in JavaScript testing frameworks like Jest and Mocha.

- BDD implementation (Given, When, Then)
- AAA implementation TBD
- TDT implementation TBD
- Unified adapter interface
- Renamed type system (TestTypeParams, TestSpecShape)

---

TODOs for Terminology Transition

1. Update TDT Pattern Terminology

• [x] Rename ThatFor → Value (in all files: types, classes, specs)
• [x] Rename ItIs → Should
• [x] Rename That → Expected
• [x] Update BaseThatFor.ts → BaseValue.ts
• [x] Update BaseItIs.ts → BaseShould.ts
• [x] Update BaseThat.ts → BaseExpected.ts

2. Update Specification Helper Functions

• [x] Update createTDTSpecification() in index.ts to use Value, Should, Expected
• [x] Update Confirm() helper function parameters
• [x] Update example specification in Calculator.test.specification.ts

3. Update Type Definitions

• [x] Update types.ts: add IValues, IShoulds, IExpecteds (kept old types for backward compatibility)
• [x] Update CoreTypes.ts if needed for TDT type mappings - No changes needed, uses generic types

4. Update Documentation

• [x] Update index.md to reflect new TDT terminology
• [x] Update multiArchitecture.md ticket
• [x] Update README if needed - README is minimal and doesn't mention TDT

5. Update Example Files

• [x] Update Calculator.test.specification.ts example to use new syntax:

// From:
[ThatFor[`someInput`], ItIs["equal to"], That["someOutput"]]

// To:
[Value["someInput"], Should["equal"], Expected["someOutput"]]

6. Verify Cross-Language Compatibility

• [x] Check that Value, Should, Expected aren't keywords in target languages (Python, Ruby, Rust, Go,
Java) - These terms are safe in all target languages
• [x] Ensure the terms work well for code generation in all languages - Terms are clear and consistent

7. Test the Changes

• [ ] Run existing tests to ensure nothing breaks
• [ ] Create a simple test to verify TDT pattern works with new terminology
• [ ] Check that BDD and Describe-It patterns remain unchanged

8. Remove Deprecated Files (Clean Break)

• [x] Remove BaseFeed.ts (deprecated TDT action)
• [x] Remove BaseMap.ts (deprecated TDT setup)  
• [x] Remove BaseValidate.ts (deprecated TDT check)
• [x] Remove AAA pattern files (base_arrange.go, base_act.go, base_assert.go) - not currently implemented
• [x] Rename Go TDT files: base_map.go → base_value.go, base_feed.go → base_should.go, base_validate.go → base_expected.go
• [x] Add Describe-It pattern to Go implementation: base_describe.go, base_it.go
• [x] Ensure no backward compatibility code remains

Notes:

• BDD (Given, When, Then), TDT (Value, Should, Expected), and Describe-It (Describe, It) patterns are all user-facing APIs
• Internal implementation uses Setup, Action, Check (not exposed to users)
• All deprecated files have been removed for a clean break from old patterns
• No backward compatibility is maintained as requested
• Go implementation (golingvu) and TypeScript implementation (tiposkripto) support all three patterns:
  - BDD: Fully implemented
  - TDT: Partially implemented (core classes exist, integration in progress)
  - Describe-It: Partially implemented (core classes exist, integration in progress)
• AAA (Arrange-Act-Assert) pattern is implemented as the Describe-It pattern with 2 verbs: Describe (Arrange) and It (combined Act and Assert)

Quick Start Commands:

# 1. Rename core TDT files

mv src/BaseThatFor.ts src/BaseValue.ts
mv src/BaseItIs.ts src/BaseShould.ts
mv src/BaseThat.ts src/BaseExpected.ts

# 2. Update imports and references

# 3. Update specification examples

# 4. Run tests

Notes:

• BDD (Given, When, Then) and AAA (Describe, It) patterns remain unchanged
• Only TDT pattern gets updated terminology
• The changes are mostly renaming for clarity and cross-language compatibility

This transition maintains backward compatibility for BDD and AAA while making TDT terminology clearer
and more consistent across all target languages.
