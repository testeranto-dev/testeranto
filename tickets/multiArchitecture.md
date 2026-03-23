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
([Value["someInput"], Should["equal"], Expected["someOutput"]],
  [Value["4"], Should["greater than"], Expected[3]]);
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

**High-level verbs**: Confirm, [Value, Should, Expected]

**Implementation**:

TBD

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

Notes:

• BDD (Given, When, Then) and AAA (Describe, It) patterns remain unchanged
• Only TDT pattern gets updated terminology
• The changes are mostly renaming for clarity and cross-language compatibility

This transition maintains backward compatibility for BDD and AAA while making TDT terminology clearer
and more consistent across all target languages.

---

- Suite // Suite is the root
  - Given // Bdd tests start with Given
    - When
    - When // multiple whens
      ...
    - Then
    - Then
      ... // multiple thens
  - Given
    ... // multiple givens

  - Describe // AAA tests start with describe
    - Describe // they can multiple levels if 'describes'
      - ... - it - it... // they can multiple levels if 'its'
        Describe // multiple Describe

  - Confirm // TDT tess start with confirm
    - Value
      - Expect // unlike bdd and aaa, we only have 1 value, with exactly 1 expect and 1 it
      - It
    - Value // mulutple values
      ...

  ... // you can add more Givens, Describes and Confrims
