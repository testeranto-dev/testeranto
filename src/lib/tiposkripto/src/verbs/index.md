# Testeranto Multi-Strategy Testing Architecture

### BDD (Behavior Driven Design)

**High-level verbs**: Given, When, Then

**Implementation**:

- `BaseGiven` - Independent implementation for setup phase
- `BaseWhen` - Independent implementation for action phase
- `BaseThen` - Independent implementation for verification phase

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

- `BaseValue` - Independent implementation for table data setup
- `BaseShould` - Independent implementation for row processing
- `BaseExpected` - Independent implementation for validation

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

Testeranto now supports three testing methodologies through independent verb implementations. Each verb defines its own behavior without relying on shared base classes, providing more flexibility and clarity.

## Architecture

### Independent Verb Implementation

Each testing methodology now uses self-contained verb classes:

1. **BDD Pattern**: BaseGiven, BaseWhen, BaseThen
2. **AAA Pattern**: BaseDescribe, BaseIt
3. **TDT Pattern**: BaseValue, BaseShould, BaseExpected

Each verb class is responsible for its own lifecycle and behavior, making the architecture more modular and easier to maintain.

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

- `BaseGiven` - Independent implementation for setup
- `BaseWhen` - Independent implementation for action
- `BaseThen` - Independent implementation for verification

**Usage**:

```typescript
Given("initial state", ...)
When("action is performed", ...)
Then("expected outcome", ...)
```

### 2. AAA (Arrange-Act-Assert) - Implemented as Describe-It Pattern

**Note**: The AAA (Arrange-Act-Assert) pattern is implemented as the Describe-It pattern with 2 verbs: "Describe" (for Arrange) and "It" (for combined Act and Assert). This follows independent implementation but uses terminology common in JavaScript testing frameworks.

### 3. TDT (Table Driven Testing) - User-Facing

**High-level verbs**: Confirm, [Value, Should, Expected]

**Implementation**:

- `BaseValue` - Independent implementation for table data
- `BaseShould` - Independent implementation for row processing
- `BaseExpected` - Independent implementation for validation

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

- `BaseDescribe` - Independent implementation for arrangement
- `BaseIt` - Independent implementation for combined action and assertion

**Usage**:

```typescript
Describe("feature", ...)
It("should behave correctly", ...)
```

**Note**: This pattern combines the Act and Assert phases into a single "It" step, which is common in JavaScript testing frameworks like Jest and Mocha.

- BDD implementation (Given, When, Then)
- AAA implementation (Describe, It)
- TDT implementation (Value, Should, Expected)
- Unified adapter interface
- Renamed type system (TestTypeParams, TestSpecShape)

---

Notes:

• All verb implementations are now independent and self-contained
• No reliance on shared base classes like BaseSetup, BaseAction, BaseCheck
• Each verb defines its own behavior and lifecycle
• This provides more flexibility and clarity in the architecture

This transition maintains backward compatibility while making each verb more modular and easier to understand.

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
