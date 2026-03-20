# Testeranto Multi-Strategy Testing Architecture

### BDD (Behavior Driven Desien)

Given, when, then

### AAA (Arange Act Assert)

Arrange, Act, Assert

### TDT (Table driven testing)

Map (inputs and outputs), feed (the enumeration), validate (assert upon output)

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

### 1. BDD (Behavior Driven Development)

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

### 2. AAA (Arrange-Act-Assert)

**High-level verbs**: Arrange, Act, Assert

**Implementation**:

- `BaseArrange` extends `BaseSetup`
- `BaseAct` extends `BaseAction`
- `BaseAssert` extends `BaseCheck`

**Usage**:

```typescript
Arrange("setup", ...)
Act("perform operation", ...)
Assert("verify result", ...)
```

### 3. TDT (Table Driven Testing)

**High-level verbs**: Map, Feed, Validate

**Implementation**:

- `BaseMap` extends `BaseSetup`
- `BaseFeed` extends `BaseAction`
- `BaseValidate` extends `BaseCheck`

**Usage**:

```typescript
Map("test data table", ...)
Feed("process row", ...)
Validate("check output", ...)
```

## Additional Testing Patterns

### 4. Describe-It (Common in JavaScript testing frameworks)

**High-level verbs**: Describe, It

**Implementation**:

- `Describe` blocks map to test suites
- `It` blocks map to individual test cases using the underlying setup-action-check pattern

**Usage**:

```typescript
Describe("feature", () => {
  It("should behave correctly", ...)
})
```

## Architecture Benefits

### 1. Consistency

All methodologies share the same:

- Test execution engine
- Resource management
- Artifact handling
- Reporting infrastructure

### 2. Flexibility

Developers can:

- Choose the methodology that fits their needs
- Mix methodologies within the same codebase
- Create custom methodologies by extending base classes

### 3. Maintainability

- Core logic is centralized in three base classes
- Methodology-specific code is isolated in extensions
- Changes to core infrastructure benefit all methodologies

### 4. Interoperability

Tests written in different methodologies can:

- Share test resources
- Use the same adapters
- Produce consistent output formats
- Run in the same test execution environment

## Implementation Status

### ✅ Completed

- BDD implementation (Given, When, Then)
- AAA implementation (Arrange, Act, Assert)
- TDT implementation (Map, Feed, Validate)
- Unified adapter interface
- Renamed type system (TestTypeParams, TestSpecShape)

### 🔄 In Progress

- BaseSetup, BaseAction, BaseCheck implementation
- Describe-It pattern implementation
- Documentation updates

### 📋 Planned

- Performance optimizations
- Additional testing patterns
- Enhanced tooling integration
- Cross-language consistency

## Migration Path

### For Existing Users

1. **BDD users**: Continue using Given/When/Then - no changes required
2. **New users**: Choose any methodology based on preference
3. **Framework developers**: Extend BaseSetup/BaseAction/BaseCheck for custom patterns

### Code Examples

**Using BDD pattern:**

```typescript
import { Given, When, Then } from "tiposkripto"

Given("a user is logged in", ...)
When("they click the button", ...)
Then("the modal should open", ...)
```

**Using AAA pattern:**

```typescript
import { Arrange, Act, Assert } from "tiposkripto"

Arrange("database is seeded", ...)
Act("API endpoint is called", ...)
Assert("response is correct", ...)
```

**Using TDT pattern:**

```typescript
import { Map, Feed, Validate } from "tiposkripto"

Map("test cases", [
  { input: 1, expected: 2 },
  { input: 2, expected: 4 }
])
Feed("process input", ...)
Validate("check against expected", ...)
```

## Future Directions

### 1. Pattern Composition

Allow mixing methodologies within single test suites:

```typescript
Describe("API tests", () => {
  Given("authenticated user", ...)
  Map("test cases", [...]).Feed(...).Validate(...)
})
```

### 2. Custom Methodologies

Enable developers to define their own testing patterns:

```typescript
class CustomPattern extends BaseSetup { ... }
class CustomAction extends BaseAction { ... }
class CustomCheck extends BaseCheck { ... }
```

### 3. Enhanced Tooling

- IDE plugins for all methodologies
- Visual test composition tools
- Performance profiling across patterns
- Cross-methodology test reporting

## Conclusion

Testeranto's multi-strategy architecture provides a flexible, consistent foundation for various
testing methodologies. By unifying the core infrastructure while supporting distinct high-level
APIs, it offers developers the freedom to choose the right approach for each testing scenario while
maintaining consistency across the entire test suite.

The architecture ensures that all methodologies benefit from shared improvements while maintaining
their unique characteristics and developer experiences.

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

### 1. BDD (Behavior Driven Development)

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

### 2. AAA (Arrange-Act-Assert)

**High-level verbs**: Arrange, Act, Assert

**Implementation**:

- `BaseArrange` extends `BaseSetup`
- `BaseAct` extends `BaseAction`
- `BaseAssert` extends `BaseCheck`

**Usage**:

```typescript
Arrange("setup", ...)
Act("perform operation", ...)
Assert("verify result", ...)
```

### 3. TDT (Table Driven Testing)

**High-level verbs**: Map, Feed, Validate

**Implementation**:

- `BaseMap` extends `BaseSetup`
- `BaseFeed` extends `BaseAction`
- `BaseValidate` extends `BaseCheck`

**Usage**:

```typescript
Map("test data table", ...)
Feed("process row", ...)
Validate("check output", ...)
```

## Additional Testing Patterns

### 4. Describe-It (Common in JavaScript testing frameworks)

**High-level verbs**: Describe, It

**Implementation**:

- `Describe` blocks map to test suites
- `It` blocks map to individual test cases using the underlying setup-action-check pattern

**Usage**:

```typescript
Describe("feature", () => {
  It("should behave correctly", ...)
})
```

## Architecture Benefits

### 1. Consistency

All methodologies share the same:

- Test execution engine
- Resource management
- Artifact handling
- Reporting infrastructure

### 2. Flexibility

Developers can:

- Choose the methodology that fits their needs
- Mix methodologies within the same codebase
- Create custom methodologies by extending base classes

### 3. Maintainability

- Core logic is centralized in three base classes
- Methodology-specific code is isolated in extensions
- Changes to core infrastructure benefit all methodologies

### 4. Interoperability

Tests written in different methodologies can:

- Share test resources
- Use the same adapters
- Produce consistent output formats
- Run in the same test execution environment

## Implementation Status

### ✅ Completed

- BDD implementation (Given, When, Then)
- AAA implementation (Arrange, Act, Assert)
- TDT implementation (Map, Feed, Validate)
- Unified adapter interface
- Renamed type system (TestTypeParams, TestSpecShape)

### 🔄 In Progress

- BaseSetup, BaseAction, BaseCheck implementation
- Describe-It pattern implementation
- Documentation updates

### 📋 Planned

- Performance optimizations
- Additional testing patterns
- Enhanced tooling integration
- Cross-language consistency

## Migration Path

### For Existing Users

1. **BDD users**: Continue using Given/When/Then - no changes required
2. **New users**: Choose any methodology based on preference
3. **Framework developers**: Extend BaseSetup/BaseAction/BaseCheck for custom patterns

### Code Examples

**Using BDD pattern:**

```typescript
import { Given, When, Then } from "tiposkripto"

Given("a user is logged in", ...)
When("they click the button", ...)
Then("the modal should open", ...)
```

**Using AAA pattern:**

```typescript
import { Arrange, Act, Assert } from "tiposkripto"

Arrange("database is seeded", ...)
Act("API endpoint is called", ...)
Assert("response is correct", ...)
```

**Using TDT pattern:**

```typescript
import { Map, Feed, Validate } from "tiposkripto"

Map("test cases", [
  { input: 1, expected: 2 },
  { input: 2, expected: 4 }
])
Feed("process input", ...)
Validate("check against expected", ...)
```

## Future Directions

### 1. Pattern Composition

Allow mixing methodologies within single test suites:

```typescript
Describe("API tests", () => {
  Given("authenticated user", ...)
  Map("test cases", [...]).Feed(...).Validate(...)
})
```

### 2. Custom Methodologies

Enable developers to define their own testing patterns:

```typescript
class CustomPattern extends BaseSetup { ... }
class CustomAction extends BaseAction { ... }
class CustomCheck extends BaseCheck { ... }
```

### 3. Enhanced Tooling

- IDE plugins for all methodologies
- Visual test composition tools
- Performance profiling across patterns
- Cross-methodology test reporting

## Conclusion

Testeranto's multi-strategy architecture provides a flexible, consistent foundation for various
testing methodologies. By unifying the core infrastructure while supporting distinct high-level
APIs, it offers developers the freedom to choose the right approach for each testing scenario while
maintaining consistency across the entire test suite.

The architecture ensures that all methodologies benefit from shared improvements while maintaining
their unique characteristics and developer experiences.
