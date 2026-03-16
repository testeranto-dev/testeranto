# Tiposkripto Flavored API

Tiposkripto provides two flavored syntax styles that offer more idiomatic TypeScript interfaces for BDD testing while maintaining full compatibility with
the baseline Testeranto pattern.

## Overview

The flavored API provides two approaches:

1. **Decorator-based API** - Class-based tests using TypeScript decorators
2. **Fluent Chainable API** - Functional tests using method chaining

Both styles can:

- Run tests directly without the full Testeranto infrastructure
- Convert to baseline Testeranto format for full integration
- Provide better type inference and developer experience
- Integrate with existing test runners

## Quick Start

### Installation

````bash
npm install tiposkripto


Decorator-based API


import { suite, given, when, then } from 'tiposkripto/flavored';

@suite("Calculator Tests")
class CalculatorTests {
  private calculator: Calculator;

  @given("a new calculator")
  setupCalculator() {
    this.calculator = new Calculator();
  }

  @when("adding {x} and {y}")
  addNumbers(x: number, y: number) {
    this.calculator.add(x, y);
  }

  @then("result should be {expected}")
  verifyResult(expected: number) {
    expect(this.calculator.result).toBe(expected);
  }
}


Fluent Chainable API


import { given } from 'tiposkripto/flavored';

const test = given("a new calculator", () => new Calculator())
  .when("adding {x} and {y}", (calc, x: number, y: number) => {
    calc.add(x, y);
    return calc;
  }, 2, 3)
  .then("result should be {expected}", (calc, expected: number) => {
    expect(calc.result).toBe(expected);
  }, 5);

// Run the test
await test.run();



Choosing Between Styles

Use Decorator-based API when:

 • You prefer class-based test organization
 • You want to share state between test methods
 • You're testing object-oriented code
 • You want IDE support for test discovery

Use Fluent Chainable API when:

 • You prefer functional programming style
 • You want immutable test data flow
 • You're testing pure functions or functional code
 • You want explicit control over test execution


Integration with Baseline Testeranto

Both flavored styles can be converted to baseline Testeranto format:


// Convert decorator tests
const decoratorSpec = DecoratorBaseTests.toSpecification();
const decoratorImpl = DecoratorBaseTests.toImplementation();

// Convert fluent tests
const fluentBuilder = fluentBuilder.createTest("Test");
const fluentSpec = fluentBuilder.toSpecification();
const fluentImpl = fluentBuilder.toImplementation();



Type Safety

Both APIs provide full TypeScript type inference:

 • Decorators: Type information is preserved through class methods
 • Fluent API: Generics ensure type safety across the chain


Async/Await Support

Both styles support async operations:


// Decorator style
@when("fetching user data")
async fetchUserData() {
  this.user = await api.getUser();
}

// Fluent style
given("user data", async () => await api.getUser())
  .when("processing", async (user) => await processUser(user))
  .then("should be valid", async (processed) => {
    expect(processed.valid).toBe(true);
  });



Error Handling

Both styles provide consistent error handling:

 • Test failures throw errors with descriptive messages
 • Errors are caught and reported with stack traces
 • Failed tests don't stop execution of other tests


Running Tests

Direct Execution


// Decorator tests
import { runSuite } from 'tiposkripto/flavored';
const results = await runSuite(CalculatorTests);

// Fluent tests
const result = await test.run();


Integration with Test Runners

Both styles can integrate with popular test runners:


// Jest/Vitest example
import { describe, test, expect } from 'vitest';
import { given } from 'tiposkripto/flavored';

describe("Calculator", () => {
  test("addition works", async () => {
    await given("calculator", () => new Calculator())
      .when("adding numbers", (calc) => calc.add(2, 3))
      .then("result is correct", (calc) => {
        expect(calc.result).toBe(5);
      })
      .run();
  });
});



API Reference

Decorator API

 • @suite(name: string) - Marks a class as a test suite
 • @given(description: string) - Marks a method as a Given step
 • @when(description: string) - Marks a method as a When step
 • @then(description: string) - Marks a method as a Then step
 • runSuite(testClass: any) - Runs a decorated test suite

Fluent API

 • given<T>(description: string, setup: () => T) - Starts a test chain
 • .when<A>(description: string, action: (store: T, ...args: A) => T, ...args: A) - Adds a When step
 • .then<A>(description: string, assertion: (store: T, ...args: A) => void, ...args: A) - Adds a Then step
 • .run() - Executes the test chain


Migration Guide

From Baseline to Flavored

 1 Identify test patterns in your baseline tests
 2 Choose a style based on your codebase preferences
 3 Convert gradually - start with simple tests
 4 Maintain both during transition period
 5 Update test runners to use flavored API

Example Migration

Baseline:


const specification = (Suite, Given, When, Then) => [
  Suite.Default("Calculator Tests", {
    addition: Given.Default(
      ["Should add numbers"],
      [When.add(2, 3)],
      [Then.result(5)]
    ),
  }),
];


Decorator Style:


@suite("Calculator Tests")
class CalculatorTests {
  @given("Should add numbers")
  setup() { /* ... */ }

  @when("add {x} and {y}")
  add(x: number, y: number) { /* ... */ }

  @then("result should be {expected}")
  verify(expected: number) { /* ... */ }
}


Fluent Style:


given("Should add numbers", setup)
  .when("add {x} and {y}", add, 2, 3)
  .then("result should be {expected}", verify, 5)
  .run();



Best Practices

For Decorator-based Tests

 1 Keep test classes focused on a single component
 2 Use descriptive method names that match BDD steps
 3 Initialize state in @given methods
 4 Keep @when methods focused on single actions
 5 Make @then methods pure assertions

For Fluent Chainable Tests

 1 Use descriptive descriptions for each step
 2 Keep setup functions pure and simple
 3 Chain steps logically (Given → When → Then)
 4 Use TypeScript generics for type safety
 5 Handle async operations with async/await


Limitations

Decorator-based API

 • Requires TypeScript decorator support
 • Class-based approach may not fit all codebases
 • Test discovery requires custom runner

Fluent Chainable API

 • Method chaining can become complex for many steps
 • State management is explicit (no shared class state)
 • Requires understanding of functional patterns


Contributing

See the main Tiposkripto repository for contribution guidelines.


License

MIT License - see main Tiposkripto repository for details.



---

### **File 2: `src/lib/tiposkripto/src/flavored/Decorators.md`**

```markdown
# Decorator-based API

The decorator-based API provides a class-based approach to BDD testing using TypeScript decorators. This style is ideal for object-oriented codebases and
provides excellent IDE support.

## Overview

Decorator-based tests use TypeScript decorators to mark classes and methods as test components. This approach provides:

- **Class organization**: Tests are organized in logical classes
- **State sharing**: Instance variables can be shared between test steps
- **IDE integration**: Decorators provide metadata for test discovery
- **Type safety**: Full TypeScript type checking for all test steps

## Basic Usage

### Creating a Test Suite

```typescript
import { suite, given, when, then } from 'tiposkripto/flavored';

@suite("Calculator Tests")
class CalculatorTests {
  private calculator: Calculator;

  @given("a new calculator")
  setupCalculator() {
    this.calculator = new Calculator();
    return this.calculator;
  }

  @when("adding {x} and {y}")
  addNumbers(x: number, y: number) {
    this.calculator.add(x, y);
    return this.calculator;
  }

  @then("result should be {expected}")
  verifyResult(expected: number) {
    if (this.calculator.result !== expected) {
      throw new Error(`Expected ${expected}, got ${this.calculator.result}`);
    }
    return this.calculator;
  }
}


Running Tests


import { runSuite } from 'tiposkripto/flavored';

// Run the entire suite
const results = await runSuite(CalculatorTests);
console.log(results);
// {
//   suiteName: "Calculator Tests",
//   tests: [...],
//   passed: true
// }

// Or run individual tests
const testInstance = new CalculatorTests();
testInstance.setupCalculator();
testInstance.addNumbers(2, 3);
testInstance.verifyResult(5);



Decorator Reference

@suite(name: string)

Marks a class as a test suite.

Parameters:

 • name: The name of the test suite

Usage:


@suite("User Authentication Tests")
class AuthTests {
  // Test methods...
}


Properties added to class:

 • suiteName: The suite name
 • isTestSuite: Always true
 • tests: Array of test metadata

@given(description: string)

Marks a method as a Given step (setup).

Parameters:

 • description: Description of the Given step

Usage:


@given("a logged in user")
setupUser() {
  this.user = new User();
  this.user.login("username", "password");
}


Behavior:

 • Methods are executed in declaration order
 • Can return a value that becomes the test subject
 • Multiple @given methods create separate test scenarios

@when(description: string)

Marks a method as a When step (action).

Parameters:

 • description: Description of the When step

Usage:


@when("changing password to {newPassword}")
changePassword(newPassword: string) {
  this.user.changePassword(newPassword);
}


Behavior:

 • Associated with the most recent @given method
 • Can have parameters that are injected from test data
 • Should modify the test state

@then(description: string)

Marks a method as a Then step (assertion).

Parameters:

 • description: Description of the Then step

Usage:


@then("password should be changed")
verifyPasswordChanged() {
  expect(this.user.passwordChanged).toBe(true);
}


Behavior:

 • Associated with the most recent @given (and @when) methods
 • Should make assertions about the test state
 • Throws errors for failed assertions


Advanced Features

Multiple Test Scenarios


@suite("User Tests")
class UserTests {
  private user: User;

  // Scenario 1: New user
  @given("a new user")
  setupNewUser() {
    this.user = new User();
  }

  @when("setting name to {name}")
  setName(name: string) {
    this.user.name = name;
  }

  @then("name should be {expected}")
  verifyName(expected: string) {
    expect(this.user.name).toBe(expected);
  }

  // Scenario 2: Existing user
  @given("an existing user with email {email}")
  setupExistingUser(email: string) {
    this.user = User.findByEmail(email);
  }

  @when("updating profile")
  updateProfile() {
    this.user.updateProfile({ lastLogin: new Date() });
  }

  @then("last login should be recent")
  verifyLastLogin() {
    expect(this.user.lastLogin).toBeWithin(new Date(), 1000);
  }
}


Async Operations


@suite("API Tests")
class ApiTests {
  private response: any;

  @given("API client")
  setupClient() {
    this.client = new ApiClient();
  }

  @when("fetching user {id}")
  async fetchUser(id: string) {
    this.response = await this.client.get(`/users/${id}`);
  }

  @then("response should contain user data")
  verifyResponse() {
    expect(this.response).toHaveProperty('user');
    expect(this.response.user.id).toBeDefined();
  }
}


Parameter Injection

Parameters can be injected into test methods using string interpolation:


@suite("Math Tests")
class MathTests {
  @given("numbers {a} and {b}")
  setupNumbers(a: number, b: number) {
    return { a, b };
  }

  @when("adding them")
  addNumbers({ a, b }: { a: number, b: number }) {
    return a + b;
  }

  @then("result should be {expected}")
  verifyResult(result: number, expected: number) {
    expect(result).toBe(expected);
  }
}



Test Metadata

The runSuite function collects metadata about tests:


const results = await runSuite(CalculatorTests);

// Results structure:
{
  suiteName: "Calculator Tests",
  tests: [
    {
      given: "a new calculator",
      when: "adding {x} and {y}",
      then: "result should be {expected}",
      passed: true,
      error: null
    }
  ],
  passed: true
}



Conversion to Baseline Format

Decorator tests can be converted to baseline Testeranto format:


class CalculatorTests {
  // ... decorator methods ...

  static toSpecification() {
    return (Suite: any, Given: any, When: any, Then: any) => [
      Suite.Default("Calculator Tests", {
        addition: Given.Default(
          ["Should add numbers"],
          [When.add(2, 3)],
          [Then.result(5)]
        ),
      }),
    ];
  }

  static toImplementation() {
    return {
      suites: { Default: "Calculator Test Suite" },
      givens: {
        Default: () => () => new Calculator(),
      },
      whens: {
        add: (x: number, y: number) => (calc: Calculator) => {
          calc.add(x, y);
          return calc;
        },
      },
      thens: {
        result: (expected: number) => (calc: Calculator) => {
          if (calc.result !== expected) {
            throw new Error(`Expected ${expected}, got ${calc.result}`);
          }
          return calc;
        },
      },
    };
  }
}



Best Practices

1. Keep Tests Focused

 • One class per component being tested
 • One logical scenario per @given method
 • Clear separation between setup, action, and assertion

2. Use Descriptive Names

 • Suite names should describe what's being tested
 • Method names should match their BDD role
 • Parameter names should be clear and meaningful

3. Handle State Properly

 • Initialize state in @given methods
 • Modify state in @when methods
 • Verify state in @then methods
 • Clean up state if necessary

4. Error Handling

 • Throw descriptive errors for test failures
 • Use try/catch for expected error scenarios
 • Provide helpful error messages

5. Async Patterns

 • Use async/await for asynchronous operations
 • Handle promises properly
 • Consider timeouts for long-running operations


Common Patterns

Setup/Teardown


@suite("Database Tests")
class DatabaseTests {
  private db: Database;
  private testData: any;

  @given("database connection")
  async setupDatabase() {
    this.db = await Database.connect();
    this.testData = await this.db.loadTestData();
  }

  @when("querying test data")
  async queryData() {
    return await this.db.query(this.testData.query);
  }

  @then("should return expected results")
  verifyResults(results: any) {
    expect(results).toEqual(this.testData.expected);
  }

  // Optional cleanup
  async cleanup() {
    if (this.db) {
      await this.db.close();
    }
  }
}


Parameterized Tests


@suite("Parameterized Math Tests")
class ParameterizedMathTests {
  @given("numbers {a} and {b}")
  setup(a: number, b: number) {
    return { a, b };
  }

  @when("calculating sum")
  calculateSum({ a, b }: { a: number, b: number }) {
    return a + b;
  }

  @then("sum should be {expected}")
  verifySum(result: number, expected: number) {
    expect(result).toBe(expected);
  }
}

// Run with different parameters
const tests = [
  { a: 1, b: 2, expected: 3 },
  { a: 0, b: 0, expected: 0 },
  { a: -1, b: 1, expected: 0 },
];

for (const test of tests) {
  const instance = new ParameterizedMathTests();
  const setup = instance.setup(test.a, test.b);
  const result = instance.calculateSum(setup);
  instance.verifySum(result, test.expected);
}



Integration with Test Runners

Jest/Vitest Integration


import { describe, test, expect } from 'vitest';
import { runSuite } from 'tiposkripto/flavored';

describe("CalculatorTests", () => {
  test("should run decorator suite", async () => {
    const results = await runSuite(CalculatorTests);
    expect(results.passed).toBe(true);
  });

  test("individual test methods", () => {
    const calculatorTest = new CalculatorTests();

    calculatorTest.setupCalculator();
    calculatorTest.addNumbers(2, 3);

    expect(() => calculatorTest.verifyResult(5)).not.toThrow();
    expect(() => calculatorTest.verifyResult(6)).toThrow();
  });
});


Custom Test Runner


import { suite, given, when, then } from 'tiposkripto/flavored';

// Custom test runner that integrates with your CI/CD
class CustomTestRunner {
  async runTestClass(testClass: any) {
    const instance = new testClass();
    const metadata = testClass.tests || [];

    for (const test of metadata) {
      try {
        await instance[test.method]();
        console.log(`✓ ${test.given} - ${test.when} - ${test.then}`);
      } catch (error) {
        console.error(`✗ ${test.given} - ${test.when} - ${test.then}`);
        console.error(error);
      }
    }
  }
}



Limitations and Considerations

TypeScript Configuration

Decorators require proper TypeScript configuration:


{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}


Test Discovery

 • Decorator metadata is collected at class definition time
 • Tests must be instantiated to run
 • Custom runners may be needed for complex test discovery

State Management

 • Instance state is shared between test methods
 • Be careful with mutable state across test scenarios
 • Consider resetting state between test scenarios


Migration Tips

From Traditional Unit Tests

 1 Identify setup → action → assertion patterns
 2 Convert setup to @given methods
 3 Convert actions to @when methods
 4 Convert assertions to @then methods
 5 Organize related tests into suites

From Baseline Testeranto

 1 Extract test logic from specification/implementation
 2 Create class with decorator methods
 3 Move state management to instance variables
 4 Convert parameter passing to method parameters
 5 Update test runners to use decorator API


Examples

See the examples/ directory for complete working examples of decorator-based tests.



---

### **File 3: `src/lib/tiposkripto/src/flavored/FluentBuilder.md`**

```markdown
# Fluent Chainable API

The fluent chainable API provides a functional, pipeline-style approach to BDD testing. This style is ideal for functional programming patterns and provides
excellent type inference and composability.

## Overview

Fluent chainable tests use method chaining to create test pipelines. This approach provides:

- **Functional style**: Immutable data flow through the pipeline
- **Type safety**: Full TypeScript generics for type inference
- **Composability**: Tests can be built and combined dynamically
- **Explicit control**: Each step is clearly defined and executed

## Basic Usage

### Creating a Test Chain

```typescript
import { given } from 'tiposkripto/flavored';

const test = given("a new calculator", () => new Calculator())
  .when("adding {x} and {y}", (calc, x: number, y: number) => {
    calc.add(x, y);
    return calc;
  }, 2, 3)
  .then("result should be {expected}", (calc, expected: number) => {
    if (calc.result !== expected) {
      throw new Error(`Expected ${expected}, got ${calc.result}`);
    }
  }, 5);

// Run the test
const result = await test.run();
console.log(result);
// { success: true, store: Calculator { result: 5 } }


Multiple Steps


const test = given("initial state", () => ({ value: 0, history: [] }))
  .when("incrementing by {amount}", (state, amount: number) => ({
    ...state,
    value: state.value + amount,
    history: [...state.history, `+${amount}`]
  }), 5)
  .when("decrementing by {amount}", (state, amount: number) => ({
    ...state,
    value: state.value - amount,
    history: [...state.history, `-${amount}`]
  }), 2)
  .then("value should be {expected}", (state, expected: number) => {
    expect(state.value).toBe(expected);
  }, 3)
  .then("history should contain {entry}", (state, entry: string) => {
    expect(state.history).toContain(entry);
  }, "+5");



API Reference

given<T>(description: string, setup: () => T | Promise<T>)

Starts a test chain with a Given step.

Parameters:

 • description: Description of the initial state
 • setup: Function that returns the initial test subject

Returns: FluentTestBuilder<T>

Usage:


given("empty array", () => [])
given("user from API", async () => await api.getUser())
given("calculator with initial value", () => new Calculator(10))


.when<A extends any[]>(description: string, action: (store: T, ...args: A) => T | Promise<T>, ...args: A)

Adds a When step to the test chain.

Parameters:

 • description: Description of the action
 • action: Function that transforms the test subject
 • ...args: Arguments to pass to the action function

Returns: this (for chaining)

Usage:


.when("pushing {item}", (array, item: string) => {
  array.push(item);
  return array;
}, "test")
.when("sorting array", (array) => {
  return array.sort();
})


.then<A extends any[]>(description: string, assertion: (store: T, ...args: A) => void | Promise<void>, ...args: A)

Adds a Then step to the test chain.

Parameters:

 • description: Description of the assertion
 • assertion: Function that makes assertions about the test subject
 • ...args: Arguments to pass to the assertion function

Returns: this (for chaining)

Usage:


.then("should contain {item}", (array, item: string) => {
  expect(array).toContain(item);
}, "test")
.then("should be sorted", (array) => {
  expect(isSorted(array)).toBe(true);
})


.run(): Promise<{ success: boolean; store?: T; error?: any }>

Executes the test chain.

Returns: Promise with test results

Usage:


const result = await test.run();
if (result.success) {
  console.log("Test passed!");
} else {
  console.error("Test failed:", result.error);
}



Advanced Features

Type Inference

The fluent API provides excellent type inference:


// TypeScript infers T as Calculator
given("calculator", () => new Calculator())
  // TypeScript knows calc is Calculator
  .when("adding", (calc, x: number, y: number) => {
    calc.add(x, y);
    return calc; // Must return Calculator
  }, 2, 3)
  // TypeScript knows calc is Calculator
  .then("verifying", (calc, expected: number) => {
    expect(calc.result).toBe(expected);
  }, 5);


Async/Await Support


const test = given("user data", async () => {
  const response = await fetch('/api/user');
  return await response.json();
})
.when("updating profile", async (user) => {
  const updated = await api.updateUser(user.id, { active: true });
  return updated;
})
.then("should be active", async (user) => {
  expect(user.active).toBe(true);
});

await test.run();


Error Handling


const test = given("calculator", () => new Calculator())
  .when("dividing by zero", (calc) => {
    // This will throw
    return calc.divide(10, 0);
  })
  .then("should handle error", (calc, expectedError: string) => {
    // This won't execute because the when step threw
  }, "Division by zero");

const result = await test.run();
// result = { success: false, error: Error("Division by zero") }


Dynamic Test Building


function createCalculatorTest(x: number, y: number, expected: number) {
  return given("calculator", () => new Calculator())
    .when("adding", (calc, a: number, b: number) => {
      calc.add(a, b);
      return calc;
    }, x, y)
    .then("result", (calc, exp: number) => {
      expect(calc.result).toBe(exp);
    }, expected);
}

// Create multiple tests
const tests = [
  createCalculatorTest(2, 3, 5),
  createCalculatorTest(0, 0, 0),
  createCalculatorTest(-1, 1, 0),
];

// Run all tests
for (const test of tests) {
  await test.run();
}



Conversion to Baseline Format

Fluent tests can be converted to baseline Testeranto format:


import { fluentBuilder } from './fluent';

const test = fluentBuilder
  .createTest("Calculator Test")
  .given("calculator", () => new Calculator())
  .when("add", (calc) => {
    calc.add(2, 3);
    return calc;
  })
  .then("verify", (calc) => {
    expect(calc.result).toBe(5);
  });

// Convert to baseline
const specification = test.toSpecification();
const implementation = test.toImplementation();

// Use with Tiposkripto
import Tiposkripto from 'tiposkripto';
const runner = Tiposkripto(
  Calculator.prototype,
  specification,
  implementation,
  adapter
);



Best Practices

1. Keep Steps Pure

 • Setup functions should be pure and predictable
 • Action functions should return new state (immutable updates)
 • Assertion functions should not modify state

2. Use Descriptive Descriptions

 • Given: Describe the initial state
 • When: Describe the action being performed
 • Then: Describe the expected outcome

3. Handle Async Properly

 • Use async/await for asynchronous operations
 • Handle promises in setup, action, and assertion functions
 • Consider timeouts for long-running operations

4. Type Safety

 • Use TypeScript generics for type inference
 • Define interfaces for complex state objects
 • Use type guards for runtime type checking

5. Error Handling

 • Throw descriptive errors for test failures
 • Use try/catch for expected error scenarios
 • Provide helpful error messages with context


Common Patterns

Immutable Updates


given("user state", () => ({
  user: { name: "John", age: 30 },
  preferences: { theme: "dark" }
}))
.when("updating name to {newName}", (state, newName: string) => ({
  ...state,
  user: {
    ...state.user,
    name: newName
  }
}), "Jane")
.then("name should be updated", (state, expectedName: string) => {
  expect(state.user.name).toBe(expectedName);
}, "Jane");


Pipeline Processing


given("data pipeline", () => ({
  raw: "hello,world,test",
  processed: [] as string[]
}))
.when("splitting by comma", (state) => ({
  ...state,
  processed: state.raw.split(',')
}))
.when("filtering empty strings", (state) => ({
  ...state,
  processed: state.processed.filter(item => item.length > 0)
}))
.when("converting to uppercase", (state) => ({
  ...state,
  processed: state.processed.map(item => item.toUpperCase())
}))
.then("should have {count} items", (state, count: number) => {
  expect(state.processed.length).toBe(count);
}, 3)
.then("should contain {item}", (state, item: string) => {
  expect(state.processed).toContain(item);
}, "HELLO");


Conditional Testing


function createConditionalTest(condition: boolean) {
  const test = given("initial state", () => ({ value: 0 }));

  if (condition) {
    test.when("incrementing", (state) => ({
      ...state,
      value: state.value + 1
    }));
  } else {
    test.when("decrementing", (state) => ({
      ...state,
      value: state.value - 1
    }));
  }

  return test.then("value should be {expected}", (state, expected: number) => {
    expect(state.value).toBe(expected);
  }, condition ? 1 : -1);
}



Integration with Test Runners

Jest/Vitest Integration


import { describe, test, expect } from 'vitest';
import { given } from 'tiposkripto/flavored';

describe("Calculator", () => {
  test("addition works", async () => {
    const result = await given("calculator", () => new Calculator())
      .when("adding", (calc, x: number, y: number) => {
        calc.add(x, y);
        return calc;
      }, 2, 3)
      .then("result is correct", (calc, expected: number) => {
        expect(calc.result).toBe(expected);
      }, 5)
      .run();

    expect(result.success).toBe(true);
  });

  test("multiple operations", async () => {
    await given("calculator", () => new Calculator())
      .when("adding", (calc, x: number, y: number) => {
        calc.add(x, y);
        return calc;
      }, 5, 3)
      .when("subtracting", (calc, x: number, y: number) => {
        calc.subtract(x, y);
        return calc;
      }, 2, 1)
      .then("final result", (calc, expected: number) => {
        expect(calc.result).toBe(expected);
      }, 7)
      .run();
  });
});


Custom Test Runner


import { given } from 'tiposkripto/flavored';

class CustomTestRunner {
  async runTest(testBuilder: any) {
    console.log(`Running test: ${testBuilder.description}`);

    try {
      const result = await testBuilder.run();

      if (result.success) {
        console.log(`✓ Test passed`);
        return { passed: true, data: result.store };
      } else {
        console.error(`✗ Test failed: ${result.error.message}`);
        return { passed: false, error: result.error };
      }
    } catch (error) {
      console.error(`✗ Test crashed: ${error.message}`);
      return { passed: false, error };
    }
  }
}

// Usage
const runner = new CustomTestRunner();
const test = given("test", () => ({ value: 0 }))
  .when("increment", (state) => ({ ...state, value: state.value + 1 }))
  .then("verify", (state) => expect(state.value).toBe(1));

await runner.runTest(test);



Performance Considerations

1. Avoid Deep Cloning


// Good: Shallow clone when possible
.when("updating", (state) => ({
  ...state,
  nested: { ...state.nested, value: "updated" }
}))

// Bad: Deep clone entire state
.when("updating", (state) => JSON.parse(JSON.stringify(state)))


2. Lazy Evaluation


// Setup functions are called when test runs
given("expensive operation", () => expensiveOperation())
  // Action functions are called in sequence
  .when("process", (data) => processData(data))
  // Assertion functions are called last
  .then("verify", (result) => verifyResult(result));


3. Memory Management


// Large data sets
given("large dataset", () => {
  const data = generateLargeDataset();
  // Process incrementally
  return processInChunks(data);
})
.when("filtering", (chunks) => {
  // Filter chunks to reduce memory
  return chunks.filter(chunk => isValid(chunk));
})
.then("should have valid data", (filtered) => {
  expect(filtered.length).toBeGreaterThan(0);
});



Migration Tips

From Traditional Unit Tests

 1 Identify arrange → act → assert patterns
 2 Convert arrange to given() setup
 3 Convert act to .when() action
 4 Convert assert to .then() assertion
 5 Chain steps together

From Baseline Testeranto

 1 Extract test logic from specification
 2 Create fluent chain with given()
 3 Convert parameter passing to method arguments
 4 Update state management to functional style
 5 Modify test runners to use fluent API

From Decorator-based Tests

 1 Extract test logic from class methods
 2 Convert instance state to function parameters
 3 Create setup function for initial state
 4 Chain actions and assertions
 5 Handle async operations with promises


Examples

See the examples/ directory for complete working examples of fluent chainable tests.



---

### **File 4: `src/lib/tiposkripto/src/flavored/Examples.md`**

```markdown
# Examples

This document provides complete, working examples of both decorator-based and fluent chainable APIs.

## Table of Contents

1. [Calculator Tests](#calculator-tests)
2. [User Authentication Tests](#user-authentication-tests)
3. [API Integration Tests](#api-integration-tests)
4. [State Management Tests](#state-management-tests)
5. [Error Handling Tests](#error-handling-tests)
6. [Async Operations Tests](#async-operations-tests)
7. [Integration with Test Runners](#integration-with-test-runners)
8. [Conversion Examples](#conversion-examples)

## Calculator Tests

### Decorator-based Example

```typescript
import { suite, given, when, then } from 'tiposkripto/flavored';

// Simple Calculator class
class Calculator {
  private value: number = 0;

  add(x: number, y: number): void {
    this.value = x + y;
  }

  subtract(x: number, y: number): void {
    this.value = x - y;
  }

  multiply(x: number, y: number): void {
    this.value = x * y;
  }

  divide(x: number, y: number): void {
    if (y === 0) throw new Error("Division by zero");
    this.value = x / y;
  }

  get result(): number {
    return this.value;
  }

  clear(): void {
    this.value = 0;
  }
}

@suite("Calculator Operations")
class CalculatorTests {
  private calculator: Calculator;

  @given("a new calculator")
  setupCalculator() {
    this.calculator = new Calculator();
    return this.calculator;
  }

  @when("adding {x} and {y}")
  testAddition(x: number, y: number) {
    this.calculator.add(x, y);
    return this.calculator;
  }

  @when("subtracting {y} from {x}")
  testSubtraction(x: number, y: number) {
    this.calculator.subtract(x, y);
    return this.calculator;
  }

  @when("multiplying {x} by {y}")
  testMultiplication(x: number, y: number) {
    this.calculator.multiply(x, y);
    return this.calculator;
  }

  @when("dividing {x} by {y}")
  testDivision(x: number, y: number) {
    this.calculator.divide(x, y);
    return this.calculator;
  }

  @then("result should be {expected}")
  verifyResult(expected: number) {
    if (this.calculator.result !== expected) {
      throw new Error(`Expected ${expected}, got ${this.calculator.result}`);
    }
    return this.calculator;
  }

  @then("should throw division by zero error")
  verifyDivisionByZero() {
    try {
      this.calculator.divide(10, 0);
      throw new Error("Expected division by zero error");
    } catch (error: any) {
      if (!error.message.includes("Division by zero")) {
        throw new Error(`Unexpected error: ${error.message}`);
      }
    }
  }
}

// Running the tests
import { runSuite } from 'tiposkripto/flavored';

async function runCalculatorTests() {
  const results = await runSuite(CalculatorTests);
  console.log(`Suite: ${results.suiteName}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Tests: ${results.tests.length}`);

  for (const test of results.tests) {
    console.log(`  ${test.given} - ${test.when} - ${test.then}: ${test.passed ? '✓' : '✗'}`);
  }
}

runCalculatorTests();


Fluent Chainable Example


import { given } from 'tiposkripto/flavored';

// Same Calculator class as above

// Basic addition test
const additionTest = given("a new calculator", () => new Calculator())
  .when("adding {x} and {y}", (calc, x: number, y: number) => {
    calc.add(x, y);
    return calc;
  }, 2, 3)
  .then("result should be {expected}", (calc, expected: number) => {
    if (calc.result !== expected) {
      throw new Error(`Expected ${expected}, got ${calc.result}`);
    }
  }, 5);

// Multiple operations test
const multipleOpsTest = given("calculator with initial value 10", () => {
    const calc = new Calculator();
    calc.add(10, 0); // Set initial value
    return calc;
  })
  .when("adding {x}", (calc, x: number) => {
    calc.add(calc.result, x);
    return calc;
  }, 5)
  .when("subtracting {x}", (calc, x: number) => {
    calc.subtract(calc.result, x);
    return calc;
  }, 3)
  .then("final result should be {expected}", (calc, expected: number) => {
    if (calc.result !== expected) {
      throw new Error(`Expected ${expected}, got ${calc.result}`);
    }
  }, 12);

// Error handling test
const divisionByZeroTest = given("a calculator", () => new Calculator())
  .when("dividing by zero", (calc) => {
    // This should throw
    calc.divide(10, 0);
    return calc;
  })
  .then("should handle error", (calc, expectedError: string) => {
    // This won't execute because the when step threw
  }, "Division by zero");

// Run all tests
async function runAllTests() {
  console.log("Running addition test...");
  const additionResult = await additionTest.run();
  console.log(`Addition test: ${additionResult.success ? '✓' : '✗'}`);

  console.log("Running multiple operations test...");
  const multipleOpsResult = await multipleOpsTest.run();
  console.log(`Multiple ops test: ${multipleOpsResult.success ? '✓' : '✗'}`);

  console.log("Running division by zero test...");
  const divisionResult = await divisionByZeroTest.run();
  console.log(`Division test: ${divisionResult.success ? '✓' : '✗'}`);
  if (!divisionResult.success) {
    console.log(`  Expected error: ${divisionResult.error?.message}`);
  }
}

runAllTests();



User Authentication Tests

Decorator-based Example


import { suite, given, when, then } from 'tiposkripto/flavored';

// User model
interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  isActive: boolean;
  lastLogin?: Date;
}

// Auth service
class AuthService {
  private users: Map<string, User> = new Map();

  register(user: Omit<User, 'id'>): User {
    const id = Math.random().toString(36).substr(2, 9);
    const newUser: User = { ...user, id, isActive: true };
    this.users.set(id, newUser);
    return newUser;
  }

  login(username: string, password: string): User {
    const user = Array.from(this.users.values()).find(
      u => u.username === username && u.password === password
    );

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (!user.isActive) {
      throw new Error("Account is inactive");
    }

    user.lastLogin = new Date();
    return user;
  }

  deactivateUser(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.isActive = false;
    }
  }
}

@suite("User Authentication")
class AuthTests {
  private authService: AuthService;
  private currentUser: User | null = null;
  private lastError: Error | null = null;

  @given("a fresh auth service")
  setupAuthService() {
    this.authService = new AuthService();
    return this.authService;
  }

  @given("a registered user {username} with password {password}")
  setupRegisteredUser(username: string, password: string) {
    this.authService = new AuthService();
    this.currentUser = this.authService.register({
      username,
      email: `${username}@example.com`,
      password,
      isActive: true
    });
    return this.currentUser;
  }

  @given("an inactive user {username} with password {password}")
  setupInactiveUser(username: string, password: string) {
    this.authService = new AuthService();
    this.currentUser = this.authService.register({
      username,
      email: `${username}@example.com`,
      password,
      isActive: true
    });
    this.authService.deactivateUser(this.currentUser.id);
    return this.currentUser;
  }

  @when("registering user {username} with password {password}")
  testRegistration(username: string, password: string) {
    try {
      this.currentUser = this.authService.register({
        username,
        email: `${username}@example.com`,
        password,
        isActive: true
      });
      this.lastError = null;
    } catch (error: any) {
      this.lastError = error;
    }
    return this.currentUser;
  }

  @when("logging in with username {username} and password {password}")
  testLogin(username: string, password: string) {
    try {
      this.currentUser = this.authService.login(username, password);
      this.lastError = null;
    } catch (error: any) {
      this.lastError = error;
      this.currentUser = null;
    }
    return this.currentUser;
  }

  @when("deactivating user")
  testDeactivation() {
    if (this.currentUser) {
      this.authService.deactivateUser(this.currentUser.id);
    }
  }

  @then("user should be registered successfully")
  verifyRegistration() {
    if (this.lastError) {
      throw new Error(`Registration failed: ${this.lastError.message}`);
    }
    if (!this.currentUser) {
      throw new Error("No user was registered");
    }
    expect(this.currentUser.username).toBeDefined();
    expect(this.currentUser.id).toBeDefined();
  }

  @then("login should succeed")
  verifyLoginSuccess() {
    if (this.lastError) {
      throw new Error(`Login failed: ${this.lastError.message}`);
    }
    if (!this.currentUser) {
      throw new Error("No user was logged in");
    }
    expect(this.currentUser.lastLogin).toBeInstanceOf(Date);
  }

  @then("login should fail with error {expectedError}")
  verifyLoginFailure(expectedError: string) {
    if (!this.lastError) {
      throw new Error("Expected login to fail but it succeeded");
    }
    if (!this.lastError.message.includes(expectedError)) {
      throw new Error(`Expected error "${expectedError}", got "${this.lastError.message}"`);
    }
  }

  @then("user should be inactive")
  verifyInactive() {
    if (!this.currentUser) {
      throw new Error("No current user");
    }
    expect(this.currentUser.isActive).toBe(false);
  }
}


Fluent Chainable Example


import { given } from 'tiposkripto/flavored';

// Same AuthService and User interface as above

// Successful registration test
const registrationTest = given("fresh auth service", () => new AuthService())
  .when("registering user {username} with password {password}",
    (auth, username: string, password: string) => {
      return auth.register({
        username,
        email: `${username}@example.com`,
        password,
        isActive: true
      });
    },
    "testuser", "password123"
  )
  .then("user should be registered", (user) => {
    expect(user.id).toBeDefined();
    expect(user.username).toBe("testuser");
    expect(user.email).toBe("testuser@example.com");
    expect(user.isActive).toBe(true);
  });

// Successful login test
const loginTest = given("auth service with registered user", () => {
    const auth = new AuthService();
    auth.register({
      username: "johndoe",
      email: "john@example.com",
      password: "secret",
      isActive: true
    });
    return auth;
  })
  .when("logging in with valid credentials",
    (auth, username: string, password: string) => {
      return auth.login(username, password);
    },
    "johndoe", "secret"
  )
  .then("login should succeed", (user) => {
    expect(user.username).toBe("johndoe");
    expect(user.lastLogin).toBeInstanceOf(Date);
  });

// Failed login test
const failedLoginTest = given("auth service with registered user", () => {
    const auth = new AuthService();
    auth.register({
      username: "johndoe",
      email: "john@example.com",
      password: "secret",
      isActive: true
    });
    return auth;
  })
  .when("logging in with wrong password",
    (auth, username: string, password: string) => {
      try {
        return auth.login(username, password);
      } catch (error: any) {
        return { error: error.message, user: null };
      }
    },
    "johndoe", "wrongpassword"
  )
  .then("should return error", (result) => {
    expect(result.error).toBeDefined();
    expect(result.error).toContain("Invalid credentials");
  });

// Inactive user test
const inactiveUserTest = given("auth service with inactive user", () => {
    const auth = new AuthService();
    const user = auth.register({
      username: "inactive",
      email: "inactive@example.com",
      password: "password",
      isActive: true
    });
    auth.deactivateUser(user.id);
    return auth;
  })
  .when("trying to login",
    (auth, username: string, password: string) => {
      try {
        return auth.login(username, password);
      } catch (error: any) {
        return { error: error.message, user: null };
      }
    },
    "inactive", "password"
  )
  .then("should fail with inactive error", (result) => {
    expect(result.error).toBeDefined();
    expect(result.error).toContain("Account is inactive");
  });

// Run all auth tests
async function runAuthTests() {
  const tests = [
    { name: "Registration", test: registrationTest },
    { name: "Login", test: loginTest },
    { name: "Failed Login", test: failedLoginTest },
    { name: "Inactive User", test: inactiveUserTest },
  ];

  for (const { name, test } of tests) {
    console.log(`Running ${name} test...`);
    const result = await test.run();
    console.log(`  ${name}: ${result.success ? '✓' : '✗'}`);
    if (!result.success) {
      console.log(`  Error: ${result.error?.message}`);
    }
  }
}

runAuthTests();



API Integration Tests

Decorator-based Example


import { suite, given, when, then } from 'tiposkripto/flavored';

// Mock API client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }
}

@suite("API Integration Tests")
class ApiTests {
  private apiClient: ApiClient;
  private lastResponse: any;
  private lastError: Error | null = null;

  @given("API client for {baseUrl}")
  setupApiClient(baseUrl: string) {
    this.apiClient = new ApiClient(baseUrl);
    return this.apiClient;
  }

  @when("GET request to {endpoint}")
  async testGetRequest(endpoint: string) {
    try {
      this.lastResponse = await this.apiClient.get(endpoint);
      this.lastError = null;
    } catch (error: any) {
      this.lastError = error;
      this.lastResponse = null;
    }
    return this.lastResponse;
  }

  @when("POST request to {endpoint} with data {data}")
  async testPostRequest(endpoint: string, data: any) {
    try {
      this.lastResponse = await this.apiClient.post(endpoint, data);
      this.lastError = null;
    } catch (error: any) {
      this.lastError = error;
      this.lastResponse = null;
    }
    return this.lastResponse;
  }

  @then("response should be successful")
  verifySuccess() {
    if (this.lastError) {
      throw new Error(`Request failed: ${this.lastError.message}`);
    }
    expect(this.lastResponse).toBeDefined();
  }

  @then("response should contain property {property}")
  verifyProperty(property: string) {
    if (!this.lastResponse || typeof this.lastResponse !== 'object') {
      throw new Error("No response or invalid response format");
    }
    if (!(property in this.lastResponse)) {
      throw new Error(`Response missing property: ${property}`);
    }
  }

  @then("response property {property} should equal {value}")
  verifyPropertyValue(property: string, value: any) {
    if (!this.lastResponse || typeof this.lastResponse !== 'object') {
      throw new Error("No response or invalid response format");
    }
    if (this.lastResponse[property] !== value) {
      throw new Error(
        `Property ${property} expected ${value}, got ${this.lastResponse[property]}`
      );
    }
  }

  @then("should fail with status {status}")
  verifyFailure(status: number) {
    if (!this.lastError) {
      throw new Error("Expected request to fail but it succeeded");
    }
    if (!this.lastError.message.includes(`HTTP ${status}`)) {
      throw new Error(
        `Expected HTTP ${status} error, got: ${this.lastError.message}`
      );
    }
  }
}


Fluent Chainable Example


import { given } from 'tiposkripto/flavored';

// Same ApiClient as above

// Successful GET request test
const getRequestTest = given("API client for https://api.example.com",
    () => new ApiClient("https://api.example.com")
  )
  .when("GET /users", async (client) => {
    // Mock fetch for testing
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ users: [{ id: 1, name: "John" }] })
    });

    return await client.get("/users");
  })
  .then("should return users array", (response) => {
    expect(response).toHaveProperty("users");
    expect(Array.isArray(response.users)).toBe(true);
    expect(response.users.length).toBeGreaterThan(0);
  });

// Successful POST request test
const postRequestTest = given("API client for https://api.example.com",
    () => new ApiClient("https://api.example.com")
  )
  .when("POST /users with user data", async (client, userData: any) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...userData, id: 123, createdAt: new Date().toISOString() })
    });

    return await client.post("/users", userData);
  }, { name: "Jane", email: "jane@example.com" })
  .then("should return created user with id", (response) => {
    expect(response).toHaveProperty("id");
    expect(response.id).toBe(123);
    expect(response.name).toBe("Jane");
    expect(response.email).toBe("jane@example.com");
    expect(response).toHaveProperty("createdAt");
  });

// Failed request test
const failedRequestTest = given("API client for https://api.example.com",
    () => new ApiClient("https://api.example.com")
  )
  .when("GET non-existent endpoint", async (client, endpoint: string) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found"
    });

    try {
      return await client.get(endpoint);
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  }, "/nonexistent")
  .then("should fail with 404 error", (result) => {
    expect(result.success).toBe(false);
    expect(result.error).toContain("HTTP 404");
    expect(result.error).toContain("Not Found");
  });

// Run API tests
async function runApiTests() {
  console.log("Running API tests...");

  const results = await Promise.allSettled([
    getRequestTest.run(),
    postRequestTest.run(),
    failedRequestTest.run()
  ]);

  results.forEach((result, index) => {
    const testNames = ["GET Request", "POST Request", "Failed Request"];
    if (result.status === "fulfilled") {
      console.log(`  ${testNames[index]}: ${result.value.success ? '✓' : '✗'}`);
    } else {
      console.log(`  ${testNames[index]}: ✗ (${result.reason})`);
    }
  });
}

runApiTests();



State Management Tests

Decorator-based Example


import { suite, given, when, then } from 'tiposkripto/flavored';

// Simple state management
interface AppState {
  user: {
    name: string;
    isLoggedIn: boolean;
    preferences: {
      theme: 'light' | 'dark';
      notifications: boolean;
    };
  };
  todos: Array<{
    id: number;
    text: string;
    completed: boolean;
  }>;
  filter: 'all' | 'active' | 'completed';
}

class StateManager {
  private state: AppState;

  constructor(initialState: AppState) {
    this.state = initialState;
  }

  getState(): AppState {
    return JSON.parse(JSON.stringify(this.state)); // Deep clone
  }

  login(username: string): void {
    this.state.user = {
      ...this.state.user,
      name: username,
      isLoggedIn: true
    };
  }

  logout(): void {
    this.state.user.isLoggedIn = false;
  }

  addTodo(text: string): void {
    const newTodo = {
      id: Date.now(),
      text,
      completed: false
    };
    this.state.todos.push(newTodo);
  }

  toggleTodo(id: number): void {
    const todo = this.state.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  }

  setFilter(filter: 'all' | 'active' | 'completed'): void {
    this.state.filter = filter;
  }

  updatePreferences(preferences: Partial<AppState['user']['preferences']>): void {
    this.state.user.preferences = {
      ...this.state.user.preferences,
      ...preferences
    };
  }
}

@suite("State Management")
class StateTests {
  private stateManager: StateManager;
  private initialState: AppState = {
    user: {
      name: '',
      isLoggedIn: false,
      preferences: {
        theme: 'light',
        notifications: true
      }
    },
    todos: [],
    filter: 'all'
  };

  @given("fresh state manager")
  setupStateManager() {
    this.stateManager = new StateManager(this.initialState);
    return this.stateManager;
  }

  @given("state manager with user {username}")
  setupWithUser(username: string) {
    this.stateManager = new StateManager({
      ...this.initialState,
      user: {
        ...this.initialState.user,
        name: username,
        isLoggedIn: true
      }
    });
    return this.stateManager;
  }

  @given("state manager with todos")
  setupWithTodos() {
    this.stateManager = new StateManager({
      ...this.initialState,
      todos: [
        { id: 1, text: 'Learn TypeScript', completed: false },
        { id: 2, text: 'Write tests', completed: true },
        { id: 3, text: 'Refactor code', completed: false }
      ]
    });
    return this.stateManager;
  }

  @when("logging in as {username}")
  testLogin(username: string) {
    this.stateManager.login(username);
    return this.stateManager.getState();
  }

  @when("adding todo {text}")
  testAddTodo(text: string) {
    this.stateManager.addTodo(text);
    return this.stateManager.getState();
  }

  @when("toggling todo {id}")
  testToggleTodo(id: number) {
    this.stateManager.toggleTodo(id);
    return this.stateManager.getState();
  }

  @when("setting filter to {filter}")
  testSetFilter(filter: 'all' | 'active' | 'completed') {
    this.stateManager.setFilter(filter);
    return this.stateManager.getState();
  }

  @when("updating theme to {theme}")
  testUpdateTheme(theme: 'light' | 'dark') {
    this.stateManager.updatePreferences({ theme });
    return this.stateManager.getState();
  }

  @then("user should be logged in as {username}")
  verifyLogin(state: AppState, username: string) {
    expect(state.user.isLoggedIn).toBe(true);
    expect(state.user.name).toBe(username);
  }

  @then("todos count should be {count}")
  verifyTodoCount(state: AppState, count: number) {
    expect(state.todos.length).toBe(count);
  }

  @then("todo {id} should be {status}")
  verifyTodoStatus(state: AppState, id: number, status: 'completed' | 'active') {
    const todo = state.todos.find(t => t.id === id);
    expect(todo).toBeDefined();
    expect(todo!.completed).toBe(status === 'completed');
  }

  @then("filter should be {filter}")
  verifyFilter(state: AppState, filter: 'all' | 'active' | 'completed') {
    expect(state.filter).toBe(filter);
  }

  @then("theme should be {theme}")
  verifyTheme(state: AppState, theme: 'light' | 'dark') {
    expect(state.user.preferences.theme).toBe(theme);
  }
}


Fluent Chainable Example


import { given } from 'tiposkripto/flavored';

// Same StateManager and AppState as above

// User login flow
const loginFlowTest = given("fresh state manager", () =>
    new StateManager({
      user: { name: '', isLoggedIn: false, preferences: { theme: 'light', notifications: true } },
      todos: [],
      filter: 'all'
    })
  )
  .when("logging in as {username}", (manager, username: string) => {
    manager.login(username);
    return manager.getState();
  }, "john_doe")
  .then("user should be logged in", (state) => {
    expect(state.user.isLoggedIn).toBe(true);
    expect(state.user.name).toBe("john_doe");
  })
  .then("preferences should be default", (state) => {
    expect(state.user.preferences.theme).toBe("light");
    expect(state.user.preferences.notifications).toBe(true);
  });

// Todo management flow
const todoFlowTest = given("state manager with empty todos", () =>
    new StateManager({
      user: { name: 'test', isLoggedIn: true, preferences: { theme: 'light', notifications: true } },
      todos: [],
      filter: 'all'
    })
  )
  .when("adding todo {text}", (manager, text: string) => {
    manager.addTodo(text);
    return manager.getState();
  }, "Buy groceries")
  .then("should have 1 todo", (state) => {
    expect(state.todos.length).toBe(1);
    expect(state.todos[0].text).toBe("Buy groceries");
    expect(state.todos[0].completed).toBe(false);
  })
  .when("adding another todo {text}", (manager, text: string) => {
    manager.addTodo(text);
    return manager.getState();
  }, "Walk the dog")
  .then("should have 2 todos", (state) => {
    expect(state.todos.length).toBe(2);
  })
  .when("completing first todo", (manager) => {
    const firstTodoId = manager.getState().todos[0].id;
    manager.toggleTodo(firstTodoId);
    return manager.getState();
  })
  .then("first todo should be completed", (state) => {
    expect(state.todos[0].completed).toBe(true);
    expect(state.todos[1].completed).toBe(false);
  });

// Filter and preferences flow
const filterFlowTest = given("state manager with mixed todos", () => {
    const manager = new StateManager({
      user: { name: 'test', isLoggedIn: true, preferences: { theme: 'light', notifications: true } },
      todos: [
        { id: 1, text: 'Task 1', completed: false },
        { id: 2, text: 'Task 2', completed: true },
        { id: 3, text: 'Task 3', completed: false }
      ],
      filter: 'all'
    });
    return manager;
  })
  .when("setting filter to active", (manager) => {
    manager.setFilter('active');
    return manager.getState();
  })
  .then("filter should be active", (state) => {
    expect(state.filter).toBe('active');
  })
  .when("changing theme to dark", (manager) => {
    manager.updatePreferences({ theme: 'dark' });
    return manager.getState();
  })
  .then("theme should be dark", (state) => {
    expect(state.user.preferences.theme).toBe('dark');
    expect(state.user.preferences.notifications).toBe(true); // unchanged
  });

// Run state management tests
async function runStateTests() {
  console.log("Running state management tests...");

  const tests = [
    { name: "Login Flow", test: loginFlowTest },
    { name: "Todo Flow", test: todoFlowTest },
    { name: "Filter Flow", test: filterFlowTest }
  ];

  for (const { name, test } of tests) {
    console.log(`  ${name}...`);
    const result = await test.run();
    console.log(`    ${result.success ? '✓ Passed' : '✗ Failed'}`);
    if (!result.success) {
      console.log(`    Error: ${result.error?.message}`);
    }
  }
}

runStateTests();



Error Handling Tests

Decorator-based Example


import { suite, given, when, then } from 'tiposkripto/flavored';

// Error-prone service
class ErrorProneService {
  private shouldFail: boolean = false;

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  riskyOperation(data: string): string {
    if (this.shouldFail) {
      throw new Error(`Operation failed for data: ${data}`);
    }
    return `Processed: ${data}`;
  }

  async asyncRiskyOperation(data: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 10));
    if (this.shouldFail) {
      throw new Error(`Async operation failed for data: ${data}`);
    }
    return `Async processed: ${data}`;
  }

  validateInput(input: string): void {
    if (!input) {
      throw new Error("Input cannot be empty");
    }
    if (input.length < 3) {
      throw new Error("Input must be at least 3 characters");
    }
    if (input.length > 100) {
      throw new Error("Input cannot exceed 100 characters");
    }
  }
}

@suite("Error Handling")
class ErrorTests {
  private service: ErrorProneService;
  private lastResult: string | null = null;
  private lastError: Error | null = null;

  @given("error-prone service")
  setupService() {
    this.service = new ErrorProneService();
    return this.service;
  }

  @given("service configured to fail")
  setupFailingService() {
    this.service = new ErrorProneService();
    this.service.setShouldFail(true);
    return this.service;
  }

  @when("performing risky operation with {data}")
  testRiskyOperation(data: string) {
    try {
      this.lastResult = this.service.riskyOperation(data);
      this.lastError = null;
    } catch (error: any) {
      this.lastError = error;
      this.lastResult = null;
    }
    return this.lastResult;
  }

  @when("performing async risky operation with {data}")
  async testAsyncRiskyOperation(data: string) {
    try {
      this.lastResult = await this.service.asyncRiskyOperation(data);
      this.lastError = null;
    } catch (error: any) {
      this.lastError = error;
      this.lastResult = null;
    }
    return this.lastResult;
  }

  @when("validating input {input}")
  testValidation(input: string) {
    try {
      this.service.validateInput(input);
      this.lastError = null;
      this.lastResult = "Validation passed";
    } catch (error: any) {
      this.lastError = error;
      this.lastResult = null;
    }
    return this.lastResult;
  }

  @then("operation should succeed with result {expected}")
  verifySuccess(expected: string) {
    if (this.lastError) {
      throw new Error(`Operation failed: ${this.lastError.message}`);
    }
    if (this.lastResult !== expected) {
      throw new Error(`Expected "${expected}", got "${this.lastResult}"`);
    }
  }

  @then("operation should fail with error containing {expectedError}")
  verifyFailure(expectedError: string) {
    if (!this.lastError) {
      throw new Error("Expected operation to fail but it succeeded");
    }
    if (!this.lastError.message.includes(expectedError)) {
      throw new Error(
        `Expected error containing "${expectedError}", got "${this.lastError.message}"`
      );
    }
  }

  @then("validation should pass")
  verifyValidationPass() {
    if (this.lastError) {
      throw new Error(`Validation failed: ${this.lastError.message}`);
    }
    expect(this.lastResult).toBe("Validation passed");
  }

  @then("validation should fail with {expectedError}")
  verifyValidationFail(expectedError: string) {
    if (!this.lastError) {
      throw new Error("Expected validation to fail but it passed");
    }
    if (!this.lastError.message.includes(expectedError)) {
      throw new Error(
        `Expected error "${expectedError}", got "${this.lastError.message}"`
      );
    }
  }
}


Fluent Chainable Example


import { given } from 'tiposkripto/flavored';

// Same ErrorProneService as above

// Successful operation test
const successTest = given("error-prone service", () => {
    const service = new ErrorProneService();
    service.setShouldFail(false);
    return service;
  })
  .when("performing risky operation", (service, data: string) => {
    return service.riskyOperation(data);
  }, "test data")
  .then("should succeed with expected result", (result, expected: string) => {
    expect(result).toBe(expected);
  }, "Processed: test data");

// Failing operation test
const failureTest = given("error-prone service configured to fail", () => {
    const service = new ErrorProneService();
    service.setShouldFail(true);
    return service;
  })
  .when("performing risky operation", (service, data: string) => {
    try {
      return { success: true, result: service.riskyOperation(data) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, "failing data")
  .then("should fail with expected error", (outcome, expectedError: string) => {
    expect(outcome.success).toBe(false);
    expect(outcome.error).toContain(expectedError);
  }, "Operation failed for data: failing data");

// Async operation test
const asyncTest = given("error-prone service", () => new ErrorProneService())
  .when("performing async operation", async (service, data: string) => {
    try {
      const result = await service.asyncRiskyOperation(data);
      return { success: true, result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, "async data")
  .then("should succeed", (outcome) => {
    expect(outcome.success).toBe(true);
    expect(outcome.result).toBe("Async processed: async data");
  });

// Validation tests
const validationTests = [
  given("error-prone service", () => new ErrorProneService())
    .when("validating empty input", (service, input: string) => {
      try {
        service.validateInput(input);
        return { valid: true };
      } catch (error: any) {
        return { valid: false, error: error.message };
      }
    }, "")
    .then("should fail with empty error", (result, expectedError: string) => {
      expect(result.valid).toBe(false);
      expect(result.error).toContain(expectedError);
    }, "Input cannot be empty"),

  given("error-prone service", () => new ErrorProneService())
    .when("validating short input", (service, input: string) => {
      try {
        service.validateInput(input);
        return { valid: true };
      } catch (error: any) {
        return { valid: false, error: error.message };
      }
    }, "ab")
    .then("should fail with length error", (result, expectedError: string) => {
      expect(result.valid).toBe(false);
      expect(result.error).toContain(expectedError);
    }, "Input must be at least 3 characters"),

  given("error-prone service", () => new ErrorProneService())
    .when("validating valid input", (service, input: string) => {
      try {
        service.validateInput(input);
        return { valid: true };
      } catch (error: any) {
        return { valid: false, error: error.message };
      }
    }, "valid input")
    .then("should pass validation", (result) => {
      expect(result.valid).toBe(true);
    })
];

// Run error handling tests
async function runErrorTests() {
  console.log("Running error handling tests...");

  const mainTests = [
    { name: "Success Test", test: successTest },
    { name: "Failure Test", test: failureTest },
    { name: "Async Test", test: asyncTest }
  ];

  for (const { name, test } of mainTests) {
    console.log(`  ${name}...`);
    const result = await test.run();
    console.log(`    ${result.success ? '✓' : '✗'}`);
  }

  console.log("  Validation Tests...");
  for (let i = 0; i < validationTests.length; i++) {
    const result = await validationTests[i].run();
    console.log(`    Test ${i + 1}: ${result.success ? '✓' : '✗'}`);
  }
}

runErrorTests();



Async Operations Tests

Decorator-based Example


import { suite, given, when, then } from 'tiposkripto/flavored';

// Async data service
class DataService {
  private data: Map<string, any> = new Map();

  async save(key: string, value: any): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate delay
    this.data.set(key, value);
  }

  async get(key: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 30)); // Simulate delay
    const value = this.data.get(key);
    if (value === undefined) {
      throw new Error(`Key not found: ${key}`);
    }
    return value;
  }

  async getAll(): Promise<Map<string, any>> {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
    return new Map(this.data);
  }

  async delete(key: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 20)); // Simulate delay
    return this.data.delete(key);
  }

  async batchSave(items: Array<{ key: string; value: any }>): Promise<void> {
    const promises = items.map(item => this.save(item.key, item.value));
    await Promise.all(promises);
  }
}

@suite("Async Operations")
class AsyncTests {
  private service: DataService;
  private lastResult: any = null;
  private lastError: Error | null = null;

  @given("fresh data service")
  setupService() {
    this.service = new DataService();
    return this.service;
  }

  @given("data service with test data")
  async setupWithData() {
    this.service = new DataService();
    await this.service.save("user1", { name: "Alice", age: 30 });
    await this.service.save("user2", { name: "Bob", age: 25 });
    return this.service;
  }

  @when("saving data with key {key} and value {value}")
  async testSave(key: string, value: any) {
    try {
      await this.service.save(key, value);
      this.lastResult = { success: true };
      this.lastError = null;
    } catch (error: any) {
      this.lastError = error;
      this.lastResult = null;
    }
    return this.lastResult;
  }

  @when("getting data with key {key}")
  async testGet(key: string) {
    try {
      this.lastResult = await this.service.get(key);
      this.lastError = null;
    } catch (error: any) {
      this.lastError = error;
      this.lastResult = null;
    }
    return this.lastResult;
  }

  @when("getting all data")
  async testGetAll() {
    try {
      this.lastResult = await this.service.getAll();
      this.lastError = null;
    } catch (error: any) {
      this.lastError = error;
      this.lastResult = null;
    }
    return this.lastResult;
  }

  @when("deleting data with key {key}")
  async testDelete(key: string) {
    try {
      const deleted = await this.service.delete(key);
      this.lastResult = { success: true, deleted };
      this.lastError = null;
    } catch (error: any) {
      this.lastError = error;
      this.lastResult = null;
    }
    return this.lastResult;
  }

  @when("batch saving {count} items")
  async testBatchSave(count: number) {
    const items = Array.from({ length: count }, (_, i) => ({
      key: `item${i}`,
      value: { index: i, timestamp: Date.now() }
    }));

    try {
      await this.service.batchSave(items);
      this.lastResult = { success: true, count };
      this.lastError = null;
    } catch (error: any) {
      this.lastError = error;
      this.lastResult = null;
    }
    return this.lastResult;
  }

  @then("operation should succeed")
  verifySuccess() {
    if (this.lastError) {
      throw new Error(`Operation failed: ${this.lastError.message}`);
    }
    expect(this.lastResult).toBeDefined();
  }

  @then("should return data for key {key}")
  verifyData(key: string) {
    if (!this.lastResult) {
      throw new Error("No result returned");
    }
    expect(this.lastResult).toBeDefined();
  }

  @then("should return {count} items")
  verifyItemCount(count: number) {
    if (!this.lastResult || !(this.lastResult instanceof Map)) {
      throw new Error("Invalid result format");
    }
    expect(this.lastResult.size).toBe(count);
  }

  @then("should fail with key not found error")
  verifyKeyNotFound() {
    if (!this.lastError) {
      throw new Error("Expected operation to fail but it succeeded");
    }
    expect(this.lastError.message).toContain("Key not found");
  }

  @then("batch should save {count} items")
  verifyBatchCount(count: number) {
    if (!this.lastResult) {
      throw new Error("No batch result");
    }
    expect(this.lastResult.count).toBe(count);
  }
}


Fluent Chainable Example


import { given } from 'tiposkripto/flavored';

// Same DataService as above

// Basic save and retrieve
const saveRetrieveTest = given("fresh data service", () => new DataService())
  .when("saving user data", async (service, key: string, user: any) => {
    await service.save(key, user);
    return service;
  }, "user123", { name: "John", email: "john@example.com" })
  .when("retrieving user data", async (service, key: string) => {
    return await service.get(key);
  }, "user123")
  .then("should return saved user", (user) => {
    expect(user.name).toBe("John");
    expect(user.email).toBe("john@example.com");
  });

// Batch operations
const batchOperationsTest = given("fresh data service", () => new DataService())
  .when("batch saving items", async (service, count: number) => {
    const items = Array.from({ length: count }, (_, i) => ({
      key: `item${i}`,
      value: { id: i, data: `test${i}` }
    }));
    await service.batchSave(items);
    return service;
  }, 5)
  .when("getting all data", async (service) => {
    return await service.getAll();
  })
  .then("should have all items", (allData) => {
    expect(allData.size).toBe(5);
    for (let i = 0; i < 5; i++) {
      expect(allData.has(`item${i}`)).toBe(true);
    }
  });

// Error scenario
const errorScenarioTest = given("fresh data service", () => new DataService())
  .when("trying to get non-existent key", async (service, key: string) => {
    try {
      await service.get(key);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, "nonexistent")
  .then("should fail with key not found", (result) => {
    expect(result.success).toBe(false);
    expect(result.error).toContain("Key not found");
  });

// Complex async flow
const complexAsyncFlowTest = given("data service with initial data", async () => {
    const service = new DataService();
    await service.save("config", { theme: "dark", language: "en" });
    await service.save("cache", { timestamp: Date.now(), data: "cached" });
    return service;
  })
  .when("updating configuration", async (service, updates: any) => {
    const config = await service.get("config");
    const updated = { ...config, ...updates };
    await service.save("config", updated);
    return updated;
  }, { theme: "light", notifications: true })
  .then("configuration should be updated", (config) => {
    expect(config.theme).toBe("light");
    expect(config.language).toBe("en");
    expect(config.notifications).toBe(true);
  })
  .when("clearing cache", async (service) => {
    const deleted = await service.delete("cache");
    return { deleted, service };
  })
  .then("cache should be deleted", (result) => {
    expect(result.deleted).toBe(true);
  })
  .when("verifying cache is gone", async (result) => {
    try {
      await result.service.get("cache");
      return { exists: true };
    } catch {
      return { exists: false };
    }
  })
  .then("cache should not exist", (verification) => {
    expect(verification.exists).toBe(false);
  });

// Run async tests
async function runAsyncTests() {
  console.log("Running async operations tests...");

  const tests = [
    { name: "Save/Retrieve", test: saveRetrieveTest },
    { name: "Batch Operations", test: batchOperationsTest },
    { name: "Error Scenario", test: errorScenarioTest },
    { name: "Complex Flow", test: complexAsyncFlowTest }
  ];

  for (const { name, test } of tests) {
    console.log(`  ${name}...`);
    const startTime = Date.now();
    const result = await test.run();
    const duration = Date.now() - startTime;

    console.log(`    ${result.success ? '✓' : '✗'} (${duration}ms)`);
    if (!result.success) {
      console.log(`    Error: ${result.error?.message}`);
    }
  }
}

runAsyncTests();



Integration with Test Runners

Jest Integration


// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage',
};

// calculator.jest.test.ts
import { describe, test, expect, beforeEach } from '@jest/globals';
import { given } from 'tiposkripto/flavored';

describe("Calculator with Jest", () => {
  test("basic addition", async () => {
    const result = await given("calculator", () => ({
      value: 0,
      add(x: number, y: number) {
        this.value = x + y;
      },
      getValue() {
        return this.value;
      }
    }))
      .when("adding numbers", (calc, x: number, y: number) => {
        calc.add(x, y);
        return calc;
      }, 2, 3)
      .then("result should be correct", (calc, expected: number) => {
        expect(calc.getValue()).toBe(expected);
      }, 5)
      .run();

    expect(result.success).toBe(true);
  });

  test("multiple operations", async () => {
    await given("calculator", () => ({
      value: 10,
      add(x: number) {
        this.value += x;
      },
      subtract(x: number) {
        this.value -= x;
      },
      getValue() {
        return this.value;
      }
    }))
      .when("adding", (calc, x: number) => {
        calc.add(x);
        return calc;
      }, 5)
      .when("subtracting", (calc, x: number) => {
        calc.subtract(x);
        return calc;
      }, 3)
      .then("final result", (calc, expected: number) => {
        expect(calc.getValue()).toBe(expected);
      }, 12)
      .run();
  });
});

// Using decorators with Jest
import { suite, given, when, then, runSuite } from 'tiposkripto/flavored';

@suite("Jest Decorator Tests")
class JestDecoratorTests {
  private value: number = 0;

  @given("initial value {initial}")
  setup(initial: number) {
    this.value = initial;
  }

  @when("adding {x}")
  add(x: number) {
    this.value += x;
  }

  @then("result should be {expected}")
  verify(expected: number) {
    expect(this.value).toBe(expected);
  }
}

describe("JestDecoratorTests", () => {
  test("should run decorator suite", async () => {
    const results = await runSuite(JestDecoratorTests);
    expect(results.passed).toBe(true);
  });

  test("individual test", () => {
    const testInstance = new JestDecoratorTests();
    testInstance.setup(5);
    testInstance.add(3);
    expect(() => testInstance.verify(8)).not.toThrow();
  });
});


Vitest Integration


// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});

// calculator.vitest.test.ts
import { describe, test, expect } from 'vitest';
import { given } from 'tiposkripto/flavored';

describe("Calculator with Vitest", () => {
  test("basic addition", async () => {
    const result = await given("calculator", () => new Calculator())
      .when("adding", (calc, x: number, y: number) => {
        calc.add(x, y);
        return calc;
      }, 2, 3)
      .then("verifying result", (calc, expected: number) => {
        expect(calc.result).toBe(expected);
      }, 5)
      .run();

    expect(result.success).toBe(true);
  });

  test.concurrent("parallel tests", async () => {
    await given("counter", () => ({ count: 0 }))
      .when("incrementing", (counter) => ({
        ...counter,
        count: counter.count + 1
      }))
      .then("should be incremented", (counter) => {
        expect(counter.count).toBe(1);
      })
      .run();
  });
});

// Snapshot testing
describe("Snapshot tests", () => {
  test("data structure", async () => {
    await given("complex data", () => ({
      users: [
        { id: 1, name: "Alice", roles: ["admin", "user"] },
        { id: 2, name: "Bob", roles: ["user"] }
      ],
      metadata: {
        createdAt: "2024-01-01",
        version: "1.0.0"
      }
    }))
      .when("transforming data", (data) => ({
        ...data,
        users: data.users.map(user => ({
          ...user,
          name: user.name.toUpperCase()
        }))
      }))
      .then("should match snapshot", (transformed) => {
        expect(transformed).toMatchSnapshot();
      })
      .run();
  });
});


Node.js Test Runner Integration


// calculator.node.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { given } from 'tiposkripto/flavored';

describe("Calculator with Node.js test runner", () => {
  it("should perform addition", async () => {
    const result = await given("calculator", () => new Calculator())
      .when("adding", (calc, x: number, y: number) => {
        calc.add(x, y);
        return calc;
      }, 2, 3)
      .then("verifying", (calc, expected: number) => {
        assert.strictEqual(calc.result, expected);
      }, 5)
      .run();

    assert.strictEqual(result.success, true);
  });

  it("should handle errors", async () => {
    const result = await given("calculator", () => new Calculator())
      .when("dividing by zero", (calc) => {
        // This will throw
        calc.divide(10, 0);
        return calc;
      })
      .then("should not reach here", () => {
        assert.fail("Should have thrown error");
      })
      .run();

    assert.strictEqual(result.success, false);
    assert(result.error instanceof Error);
    assert.match(result.error.message, /Division by zero/);
  });
});

// Test hooks
describe("Test with hooks", { concurrency: false }, () => {
  let sharedCalculator: Calculator;

  beforeEach(() => {
    sharedCalculator = new Calculator();
  });

  afterEach(() => {
    // Cleanup if needed
  });

  it("should use shared calculator", async () => {
    await given("shared calculator", () => sharedCalculator)
      .when("adding", (calc, x: number, y: number) => {
        calc.add(x, y);
        return calc;
      }, 5, 3)
      .then("verifying", (calc, expected: number) => {
        assert.strictEqual(calc.result, expected);
      }, 8)
      .run();
  });
});



Conversion Examples

From Baseline to Decorator

Baseline:


// specification.ts
export const specification = (Suite, Given, When, Then) => [
  Suite.Default("Calculator Tests", {
    addition: Given.Default(
      ["Should add numbers correctly"],
      [When.add(2, 3)],
      [Then.result(5)]
    ),
    subtraction: Given.Default(
      ["Should subtract numbers correctly"],
      [When.subtract(10, 4)],
      [Then.result(6)]
    ),
  }),
];

// implementation.ts
export const implementation = {
  suites: { Default: "Calculator Test Suite" },
  givens: {
    Default: () => () => new Calculator(),
  },
  whens: {
    add: (x: number, y: number) => (calc: Calculator) => {
      calc.add(x, y);
      return calc;
    },
    subtract: (x: number, y: number) => (calc: Calculator) => {
      calc.subtract(x, y);
      return calc;
    },
  },
  thens: {
    result: (expected: number) => (calc: Calculator) => {
      if (calc.result !== expected) {
        throw new Error(`Expected ${expected}, got ${calc.result}`);
      }
      return calc;
    },
  },
};


Decorator Version:


import { suite, given, when, then } from 'tiposkripto/flavored';

@suite("Calculator Tests")
class CalculatorTests {
  private calculator: Calculator;

  @given("Should add numbers correctly")
  setupForAddition() {
    this.calculator = new Calculator();
  }

  @when("add {x} and {y}")
  testAddition(x: number, y: number) {
    this.calculator.add(x, y);
    return this.calculator;
  }

  @then("result should be {expected}")
  verifyAddition(expected: number) {
    if (this.calculator.result !== expected) {
      throw new Error(`Expected ${expected}, got ${this.calculator.result}`);
    }
    return this.calculator;
  }

  @given("Should subtract numbers correctly")
  setupForSubtraction() {
    this.calculator = new Calculator();
    this.calculator.add(10, 0); // Set initial value
  }

  @when("subtract {y} from {x}")
  testSubtraction(x: number, y: number) {
    this.calculator.subtract(x, y);
    return this.calculator;
  }

  // Reuse the same verification method
  @then("result should be {expected}")
  verifySubtraction(expected: number) {
    return this.verifyAddition(expected);
  }

  // Convert back to baseline if needed
  static toSpecification() {
    return (Suite: any, Given: any, When: any, Then: any) => [
      Suite.Default("Calculator Tests", {
        addition: Given.Default(
          ["Should add numbers correctly"],
          [When.add(2, 3)],
          [Then.result(5)]
        ),
        subtraction: Given.Default(
          ["Should subtract numbers correctly"],
          [When.subtract(10, 4)],
          [Then.result(6)]
        ),
      }),
    ];
  }

  static toImplementation() {
    // Return the original implementation
    return {
      suites: { Default: "Calculator Test Suite" },
      givens: {
        Default: () => () => new Calculator(),
      },
      whens: {
        add: (x: number, y: number) => (calc: Calculator) => {
          calc.add(x, y);
          return calc;
        },
        subtract: (x: number, y: number) => (calc: Calculator) => {
          calc.subtract(x, y);
          return calc;
        },
      },
      thens: {
        result: (expected: number) => (calc: Calculator) => {
          if (calc.result !== expected) {
            throw new Error(`Expected ${expected}, got ${calc.result}`);
          }
          return calc;
        },
      },
    };
  }
}


From Baseline to Fluent

Baseline: (Same as above)

Fluent Version:


import { given } from 'tiposkripto/flavored';
import { fluentBuilder } from './fluent';

// Individual tests
const additionTest = given("Should add numbers correctly", () => new Calculator())
  .when("add {x} and {y}", (calc, x: number, y: number) => {
    calc.add(x, y);
    return calc;
  }, 2, 3)
  .then("result should be {expected}", (calc, expected: number) => {
    if (calc.result !== expected) {
      throw new Error(`Expected ${expected}, got ${calc.result}`);
    }
  }, 5);

const subtractionTest = given("Should subtract numbers correctly", () => {
    const calc = new Calculator();
    calc.add(10, 0); // Set initial value
    return calc;
  })
  .when("subtract {y} from {x}", (calc, x: number, y: number) => {
    calc.subtract(x, y);
    return calc;
  }, 10, 4)
  .then("result should be {expected}", (calc, expected: number) => {
    if (calc.result !== expected) {
      throw new Error(`Expected ${expected}, got ${calc.result}`);
    }
  }, 6);

// Convert to baseline using fluentBuilder
const testSuite = fluentBuilder
  .createTest("Calculator Tests")
  .given("Should add numbers correctly", () => new Calculator())
  .when("add", (calc) => {
    calc.add(2, 3);
    return calc;
  })
  .then("result", (calc) => {
    if (calc.result !== 5) {
      throw new Error(`Expected 5, got ${calc.result}`);
    }
  });

const specification = testSuite.toSpecification();
const implementation = testSuite.toImplementation();

// Run tests
async function runTests() {
  console.log("Running addition test...");
  const additionResult = await additionTest.run();
  console.log(`Addition: ${additionResult.success ? '✓' : '✗'}`);

  console.log("Running subtraction test...");
  const subtractionResult = await subtractionTest.run();
  console.log(`Subtraction: ${subtractionResult.success ? '✓' : '✗'}`);

  console.log("Running test suite...");
  const suiteResult = await testSuite.run();
  console.log(`Test suite: ${suiteResult.success ? '✓' : '✗'}`);
}

runTests();


Mixed Usage Example


// Using both styles together
import { suite, given, when, then, runSuite } from 'tiposkripto/flavored';
import { given as fluentGiven } from 'tiposkripto/flavored';

// Decorator for class-based tests
@suite("User Management")
class UserTests {
  private userService: UserService;

  @given("user service")
  setupService() {
    this.userService = new UserService();
  }

  @when("creating user {username}")
  createUser(username: string) {
    return this.userService.createUser(username);
  }

  @then("user should exist")
  verifyUser(user: User) {
    expect(user.id).toBeDefined();
    expect(user.username).toBeDefined();
  }
}

// Fluent for functional tests
const functionalTests = [
  fluentGiven("user service", () => new UserService())
    .when("creating admin user", (service, username: string) => {
      return service.createUser(username, ["admin"]);
    }, "admin_user")
    .then("should have admin role", (user) => {
      expect(user.roles).toContain("admin");
    }),

  fluentGiven("user service with existing user", () => {
      const service = new UserService();
      service.createUser("existing", ["user"]);
      return service;
    })
    .when("updating user role", (service, username: string, newRole: string) => {
      return service.updateUser(username, { roles: [newRole] });
    }, "existing", "editor")
    .then("should have new role", (user) => {
      expect(user.roles).toContain("editor");
      expect(user.roles).not.toContain("user");
    })
];

// Run all tests
async function runAllTests() {
  console.log("Running decorator tests...");
  const decoratorResults = await runSuite(UserTests);
  console.log(`Decorator tests: ${decoratorResults.passed ? '✓' : '✗'}`);

  console.log("Running functional tests...");
  for (let i = 0; i < functionalTests.length; i++) {
    const result = await functionalTests[i].run();
    console.log(`  Functional test ${i + 1}: ${result.success ? '✓' : '✗'}`);
  }
}

runAllTests();



Conclusion

These examples demonstrate the flexibility and power of Tiposkripto's flavored APIs. Whether you prefer the class-based organization of decorators or the
functional flow of fluent chains, both styles provide:

 1 Type safety with full TypeScript support
 2 BDD clarity with Given/When/Then structure
 3 Flexibility to choose the style that fits your codebase
 4 Integration with popular test runners
 5 Conversion between styles and baseline format

Choose the style that best fits your project's architecture and team preferences, or mix and match as needed!
````
