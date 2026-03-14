These are the 6 BDD libs

- tiposkripto (web and node runtimes)
- golingvu (golang)
- pitono (python)
- rubeno (ruby)
- kafe (java)
- rusto (rust)

Each is an implementation of a Testeranto test. Each test should come online with a "test resource configuration" as a command line parameter (in the case of node, python and pitono). For webtests, this should be passed as a query parameter. As each test completes, it should transmit its results back to the server via websockets (this is to accommodate web tests which cannot write to fs directly).

## Publishing

Each package has a `publish.sh` script that handles building and publishing to its respective package registry. Make sure the scripts are executable:

```bash
chmod +x */publish.sh
```

The scripts follow a consistent pattern:

1. Error handling with `set -e`
2. Change to the script's directory
3. Show current version
4. Prompt for new version
5. Update version in relevant files
6. Build the package
7. Ask for confirmation before publishing
8. Publish if confirmed

### Version Management

- **tiposkripto**: Uses `npm version` to update `package.json`
- **pitono**: Updates both `pyproject.toml` and `setup.py`
- **rubeno**: Uses `publish.rb` which updates `rubeno.gemspec`
- **rusto**: Updates `Cargo.toml`
- **kafe**: Updates `pom.xml`
- **golingvu**: Uses git tags for versioning

Note: Some scripts may have publishing commands commented out for safety. Uncomment them when ready to publish.

---

### Testeranto docs and core concepts

⚠️ this doc is a work in progress. It is 99% accurate but needs some attention to be complete. ⚠️

Every Testeranto test follows the same pattern, across all runtimes.

```
  testeranto(
    subject,             // the thing you are testing
    specification,
    implementation,
    resourceRequirement, // any necessary resources
    adapter,
    xtras,               // arguments passed to the Given
  ) -> your_tests_get_run
```

#### The Specification

This defines the business requirements in plain language, completely separate from implementation details. This is where you describe what should be tested without worrying about how.

- Pure business logic
- Human-readable test descriptions
- Defines test suites, scenarios (Given/When/Then)
- Maps directly to BDD concepts

#### The Implementation

This provides the concrete operations that bring specifications to life. This is where you define how each test step actually works.

- suites: Test grouping and organization
- givens: Initial test states/setup
- whens: Actions that change state
- thens: Assertions and validations

#### The Adapter

The test adapter is code which is NOT business logic. The adapter adapts your test subject so that the BDD hooks can be applied. The adapter implements the traditional BDD steps "before all", "after all", "before each", "after each", etc

---

### tiposkripto

tiposkripto's type system provides a rigorous framework for Behavior-Driven Development (BDD) testing. The API may seem complex but everything you need to know can be summed up in 1 function, 3 runtimes and 5 essential types, and 1 optional type. Follow these patterns, and TypeScript's type checker will guide you through the rest.

Let's break down the key components using a Rectangle class example.

The Test Subject
This is the thing-to-be-tested, for this example, a very simple implementation of a Rectangle

```ts
class Rectangle {
  constructor(
    public width: number,
    public height: number,
  ) {}

  setWidth(w: number) {
    this.width = w;
  }
  setHeight(h: number) {
    this.height = h;
  }
  getArea() {
    return this.width * this.height;
  }
}
```

tiposkripto's 1 function
tiposkripto has 1 function. This function launches and runs the tests. It is here that all 5 types converge and if you can type this function call correctly, the TS type system should guide you through the rest.

```ts
async <I extends Ibdd_in_any, O extends Ibdd_out, M>(
  input: I["iinput"],
  testSpecification: ITestSpecification<I, O>,
  testImplementation: ITestImplementation<I, O, M>,
  testAdapter: Partial<ITestAdapter<I>>,
  testResourceRequirement: ITTestResourceRequest = defaultTestResourceRequirement
): Promise<Testeranto<I, O, M>>
```

#### tiposkripto's 2 runtimes

tiposkripto supports both frontend and backend tests. In each case, make sure you import the correct runtime.

Node

```ts
import tiposkripto from "tiposkripto/src/Node"; // <- import the Node main function
// below this point, all runtimes are identical!

import { implementation } from "./Rectangle.test.implementation";
import { specification } from "./Rectangle.test.specification";
import { adapter } from "./Rectangle.test.adapter";

// Note the type parameters I, O, and M: these will be important later
export default tiposkripto<
  I extends Ibdd_in,
  O extends Ibdd_out,
  M
  >(
    Rectangle.prototype, // <- the subject of the test.
    specification,
    implementation,
    adapter
);
```

Web

```ts
import tiposkripto from "tiposkripto/src/Web"; // <- import the Web main function
// below this point, all runtimes are identical!

import { implementation } from "./Rectangle.test.implementation";
import { specification } from "./Rectangle.test.specification";
import { adapter } from "./Rectangle.test.adapter";

// Note the type parameters I, O, and M: these will be important later
export default tiposkripto<
  I extends Ibdd_in,
  O extends Ibdd_out,
  M
  >(
    Rectangle.prototype, // <- the subject of the test.
    specification,
    implementation,
    adapter
);
Pure
```

tiposkripto's 5 essential types
Every tiposkripto test is built around these 5 types that form a complete testing pipeline.

The Specification (ITestSpecification)

```ts
import {
  Ibdd_in,
  Ibdd_out,
  ITestSpecification,
} from "tiposkripto/src/CoreTypes";

//  Note the type parameters I and O. These are important!
export const specification: ITestSpecification<
  I extends Ibdd_in,
  O extends Ibdd_out,
> = (
  Suite,
  Given,
  When,
  Then,
  Check
) => {
  return [
    Suite.Default(
      "Testing the Rectangle class",
      {
        test0: Given.Default(
          ["https://api.github.com/repos/adamwong246/tiposkripto/issues/8"],
          [],
          [Then.getWidth(2)]
        ),
        test1: Given.Default(
          [`Rectangles have width and height.`],
          [When.setWidth(4), When.setHeight(5)],
          [Then.getWidth(4), Then.getHeight(5), Then.area(20)]
        ),
      },

      // Ignore this for now
      []
    ),
  ];
};
```

The Implementation (ITestImplementation)

```ts
import {
  Ibdd_in,
  Ibdd_out,
  ITestImplementation,
} from "tiposkripto/src/CoreTypes";

//  Note the type parameters I and O. These are important!
export const implementation: ITestImplementation<
  I extends Ibdd_in,
  O extends Ibdd_out,
  M
> = {
  suites: {
    Default: "a default suite",
  },

  givens: {
    Default: () => new Rectangle(2, 2),
    WidthAndHeightOf: (width, height) => new Rectangle(width, height),
  },

  whens: {
    setWidth: (width: number) => (rectangle) => {
      rectangle.setWidth(width);
      return rectangle;
    },
    setHeight: (height: number) => (rectangle) => {
      rectangle.setHeight(height);
      return rectangle;
    },
  },

  thens: {
    getWidth: (expectedWidth) => (rectangle) => {
      assert.equal(rectangle.getWidth(), expectedWidth);
      return rectangle;
    },
    getHeight: (expectedHeight) => (rectangle) => {
      assert.equal(rectangle.getHeight(), expectedHeight);
      return rectangle;
    },
    area: (area) => (rectangle) => {
      assert.equal(rectangle.area(), area);
      return rectangle;
    },
    circumference: (circumference: number) => (rectangle: Rectangle) => {
      assert.equal(rectangle.circumference(), circumference);
      return rectangle;
    },
  }
};
```

The Adapter aka ITestAdapter

```ts
import {
  Ibdd_in,
  ITestAdapter,
} from "tiposkripto/src/CoreTypes";

//  Note the type parameter. This is important!
export const testAdapter: ITestAdapter<
  I extends Ibdd_in,
> = {
  beforeEach: async (subject, i) => {
    return i();
  },
  andWhen: async function (s, whenCB, tr, utils) {
    return whenCB(s, utils);
  },
  butThen: async (s, t, tr, pm) => {
    return t(s, pm);
  },
  afterEach: (z) => {
    return z;
  },
  afterAll: () => {},
  assertThis: (x: any, y) => {},
};
```

type I aka Ibdd_in

This type describes the "inner" shape of your BDD tests. Over the course of the execution of the test, the subject will change shapes- this test describe those changes.

```ts
import { Ibdd_in } from "tiposkripto/src/CoreTypes";

// TODO this is inaccurate
export type I = Ibdd_in<
  null,
  null,
  Rectangle,
  Rectangle,
  Rectangle,
  (...x) => (rectangle: Rectangle, utils: IPM) => Rectangle,
  (rectangle: Rectangle, utils: IPM) => Rectangle
>;
type O aka Ibdd_out
This type describes the "outer" shape of your BDD tests. This type describes the set of legal BDD clauses.

import { Ibdd_out } from "tiposkripto/src/CoreTypes";

export type O = Ibdd_out<
  // Suite
  {
    Default: [string];
  },
  // "Given" are initial states
  {
    Default;
    WidthOfOneAndHeightOfOne;
    WidthAndHeightOf: [number, number];
  },
  // "Whens" are steps which change the state of the test subject
  {
    HeightIsPubliclySetTo: [number];
    WidthIsPubliclySetTo: [number];
    setWidth: [number];
    setHeight: [number];
  },
  // "Thens" are steps which make assertions of the test subject
  {
    AreaPlusCircumference: [number];
    circumference: [number];
    getWidth: [number];
    getHeight: [number];
    area: [number];
    prototype: [];
  },
  // "Checks" are similar to "Givens"
  {
    Default;
    WidthOfOneAndHeightOfOne;
    WidthAndHeightOf: [number, number];
  }
>;
```

Putting it all together

```ts
import Testeranto from "tiposkripto/src/Node";

import {
  Ibdd_in,
  Ibdd_out,
  ITestImplementation,
  ITestSpecification,
  ITestAdapter,
} from "tiposkripto/src/CoreTypes";

// The test subject
class Rectangle {
  constructor(public width: number, public height: number) {}

  setWidth(w: number) {
    this.width = w;
  }
  setHeight(h: number) {
    this.height = h;
  }
  getArea() {
    return this.width * this.height;
  }
}

////////////////////////////////////////////////////////

// TODO this is inaccurate
type I = Ibdd_in<
  null,
  null,
  Rectangle,
  Rectangle,
  Rectangle,
  (...x) => (rectangle: Rectangle, utils: IPM) => Rectangle,
  (rectangle: Rectangle, utils: IPM) => Rectangle
>;

type O = Ibdd_out<
  // Suites
  {
    Default: [string];
  },
  // Givens
  {
    Default;
    WidthOfOneAndHeightOfOne;
    WidthAndHeightOf: [number, number];
  },
  // Whens
  {
    HeightIsPubliclySetTo: [number];
    WidthIsPubliclySetTo: [number];
    setWidth: [number];
    setHeight: [number];
  },
  // Thens
  {
    AreaPlusCircumference: [number];
    circumference: [number];
    getWidth: [number];
    getHeight: [number];
    area: [number];
    prototype: [];
  },
  // Checks are broken right now, ignore them
  {
    Default;
    WidthOfOneAndHeightOfOne;
    WidthAndHeightOf: [number, number];
  }
>;

type M = {
  givens: {
    [K in keyof O["givens"]]: (...Iw: O["givens"][K]) => Rectangle;
  };
  whens: {
    [K in keyof O["whens"]]: (
      ...Iw: O["whens"][K]
    ) => (rectangle: Rectangle, utils: PM) => Rectangle;
  };
  thens: {
    [K in keyof O["thens"]]: (
      ...Iw: O["thens"][K]
    ) => (rectangle: Rectangle, utils: PM) => Rectangle;
  };
};

const testAdapter: ITestAdapter<
  I extends Ibdd_in,
> = {
  beforeEach: async (subject, i) => {
    return i();
  },
  andWhen: async function (s, whenCB, tr, utils) {
    return whenCB(s, utils);
  },
  butThen: async (s, t, tr, pm) => {
    return t(s, pm);
  },
  afterEach: (z) => {
    return z;
  },
  afterAll: () => {},
  assertThis: (x: any, y) => {},
};

const testImplementation: ITestImplementation<
  I extends Ibdd_in,
  O extends Ibdd_out,
  M
> = {
  suites: {
    Default: "a default suite",
  },

  givens: {
    Default: () => new Rectangle(2, 2),
    WidthAndHeightOf: (width, height) => new Rectangle(width, height),
  },

  whens: {
    setWidth: (width: number) => (rectangle) => {
      rectangle.setWidth(width);
      return rectangle;
    },
    setHeight: (height: number) => (rectangle) => {
      rectangle.setHeight(height);
      return rectangle;
    },
  },

  thens: {
    getWidth: (expectedWidth) => (rectangle) => {
      assert.equal(rectangle.getWidth(), expectedWidth);
      return rectangle;
    },
    getHeight: (expectedHeight) => (rectangle) => {
      assert.equal(rectangle.getHeight(), expectedHeight);
      return rectangle;
    },
    area: (area) => (rectangle) => {
      assert.equal(rectangle.area(), area);
      return rectangle;
    },
    circumference: (circumference: number) => (rectangle: Rectangle) => {
      assert.equal(rectangle.circumference(), circumference);
      return rectangle;
    },
  }
};

const testSpecification: ITestSpecification<
  I extends Ibdd_in,
  O extends Ibdd_out,
> = (
  Suite,
  Given,
  When,
  Then,
  Check
) => {
  return [
    Suite.Default(
      "Testing the Rectangle class",
      {
        test0: Given.Default(
          ["https://api.github.com/repos/adamwong246/testeranto/issues/8"],
          [],
          [Then.getWidth(2)]
        ),
        test1: Given.Default(
          [`Rectangles have width and height.`],
          [When.setWidth(4), When.setHeight(5)],
          [Then.getWidth(4), Then.getHeight(5), Then.area(20)]
        ),
      },

      // Ignore this for now
      []
    ),
  ];
};

// 1 function will launch the test
export default Testeranto<
  I extends Ibdd_in,
  O extends Ibdd_out,
  M
  >(
    Rectangle.prototype,
    testSpecification,
    testSmplementation,
    testSnterface
);
```

### Dos and Don'ts

Do pass your test subject to the main testeranto function.
Don't import your test subject elsewhere in your tests.

---

## Library Alignment Status and Plan

Based on analysis of all six Testeranto implementations, here's the current alignment status and plan for achieving consistency across all libraries.

### Current State Analysis

**✅ Well-Aligned Components:**

- All libraries have the four core base classes: `BaseSuite`, `BaseGiven`, `BaseWhen`, `BaseThen`
- All implement the basic BDD pattern: Given-When-Then
- All support test resource configuration via command line/query parameters
- All produce JSON test results in a consistent format

**⚠️ Partial Alignment:**

- **TypeScript (tiposkripto)**: Most complete and canonical reference
- **Python (pitono)**: Good structure but missing some TypeScript features
- **Ruby (rubeno)**: Functional but with Ruby-specific patterns
- **Go (golingvu)**: Basic implementation needs completion
- **Rust (rusto)**: Skeletal structure with incomplete async
- **Java (kafe)**: Placeholder implementation needs significant work

**❌ Major Incongruencies:**

1. **Type Systems**: Only TypeScript has full generics; others have basic type hints or duck typing
2. **Async Patterns**: Inconsistent async/await implementations across languages
3. **Adapter Interface**: Varying method signatures and completeness
4. **Error Handling**: Different patterns and detail levels
5. **Artifact Management**: Inconsistent path normalization and error checking
6. **Test Execution Flow**: Different method signatures for `give()`, `test()`, etc.
7. **WebSocket Support**: Varying levels of implementation
8. **Main Class Structure**: Different initialization patterns

### Alignment Plan

#### Phase 1: Core Interface Standardization (All Libraries)

1. **Standardize method signatures** for all base classes
2. **Align adapter interfaces** to match TypeScript's `ITestAdapter`
3. **Consistent error handling** patterns across all implementations
4. **Uniform artifact management** with path normalization

#### Phase 2: Type System Harmonization

1. **TypeScript**: Keep as reference model
2. **Python/Ruby**: Enhance type hints to match TypeScript patterns
3. **Go/Java/Rust**: Implement equivalent generics/interface patterns
4. **Document type mappings** between languages

#### Phase 3: Async/Concurrency Patterns

1. **Standardize async signatures** across all languages
2. **Implement consistent promise/future patterns**
3. **Ensure thread/goroutine safety** where applicable
4. **Document concurrency models** for each language

#### Phase 4: WebSocket/Communication Layer

1. **Complete WebSocket support** in all runtimes
2. **Standardize message formats** for test reporting
3. **Implement fallback mechanisms** for non-WebSocket environments
4. **Ensure cross-language compatibility** for IPC

#### Phase 5: Advanced Features

1. **Plugin system** for custom adapters
2. **Performance optimizations** language-specific
3. **Extended reporting formats** (HTML, JUnit XML, etc.)
4. **Integration with CI/CD tools**

### Priority Fixes for Each Library

#### Python (pitono) - HIGH PRIORITY

1. Fix `BaseGiven.give()` method signature to match TypeScript
2. Remove extraneous parameters (`t_log`, `pm`) from test methods
3. Update `PitonoClass` constructor to match `BaseTiposkripto`
4. Complete `ITestAdapter` implementation

#### Ruby (rubeno) - MEDIUM PRIORITY

1. Standardize method names (snake_case to match Ruby conventions)
2. Improve error handling with proper stack traces
3. Complete WebSocket support implementation

#### Go (golingvu) - MEDIUM PRIORITY

1. Complete all placeholder implementations
2. Implement proper error handling with Go idioms
3. Add comprehensive test coverage

#### Rust (rusto) - HIGH PRIORITY

1. Complete async implementations using `async_trait`
2. Implement proper error types with `thiserror`
3. Add comprehensive documentation and examples

#### Java (kafe) - HIGH PRIORITY

1. Replace placeholder implementations with actual code
2. Implement proper Java generics and interfaces
3. Add Maven/Gradle build support
4. Create comprehensive examples

### Success Metrics

1. **API Consistency**: All libraries have identical public APIs (adjusted for language idioms)
2. **Type Safety**: Equivalent type safety across statically-typed languages
3. **Error Handling**: Consistent error reporting and recovery
4. **Performance**: Comparable performance for equivalent test scenarios
5. **Interoperability**: Tests can be ported between languages with minimal changes
6. **Documentation**: Comprehensive, consistent documentation across all libraries

### Next Steps

1. **Immediate**: Fix Python implementation to match TypeScript signatures
2. **Short-term**: Complete Rust and Java implementations
3. **Medium-term**: Standardize WebSocket communication across all runtimes
4. **Long-term**: Add advanced features and performance optimizations

The TypeScript (tiposkripto) implementation serves as the canonical reference. All other implementations should be updated to match its structure and behavior as closely as
possible, while respecting each language's idioms and best practices.

---

## Language-Specific Integration and Developer Experience

### 1. Dual Implementation Strategy: Baseline + Flavored Versions

Each Testeranto library will provide two implementation approaches:

**Baseline Pattern** (Common across all languages):

- Standardized API matching the canonical TypeScript implementation
- Consistent method signatures and type patterns
- Cross-language portability and familiarity
- Used for multi-language test suites and reference implementations

**Flavored Version** (Language-optimized):

- Idiomatic patterns specific to each language
- Leverages language-specific features and conventions
- Enhanced developer experience for native users
- May include language-specific extensions and shortcuts

#### Implementation Examples:

**Python (pitono) - Flavored Version:**

```python
# Baseline (matches TypeScript)
from testeranto_pitono import Pitono, BaseGiven, BaseWhen, BaseThen

# Flavored (Pythonic)
from testeranto_pitono.flavored import given, when, then, suite

@suite("Calculator Tests")
class CalculatorTests:
    @given("a new calculator")
    def setup_calculator(self):
        return Calculator()

    @when("adding {x} and {y}")
    def add_numbers(self, calculator, x, y):
        return calculator.add(x, y)

    @then("result should be {expected}")
    def verify_result(self, result, expected):
        assert result == expected
```

Go (golingvu) - Flavored Version:

```
// Baseline
import "github.com/testeranto-dev/testeranto/src/lib/golingvu"

// Flavored
import "github.com/testeranto-dev/testeranto/src/lib/golingvu/flavored"

func TestCalculator(t *testing.T) {
    flavored.Given(t, "a new calculator", func() *Calculator {
        return NewCalculator()
    }).
    When("adding %d and %d", func(calc *Calculator, x, y int) *Calculator {
        calc.Add(x, y)
        return calc
    }, 2, 3).
    Then("result should be %d", func(calc *Calculator, expected int) {
        if calc.Result() != expected {
            t.Errorf("Expected %d, got %d", expected, calc.Result())
        }
    }, 5)
}
```

Rust (rusto) - Flavored Version:

```
// Baseline
use rusto::{Rusto, BaseGiven, BaseWhen, BaseThen};

// Flavored
use rusto::flavored::{given, when, then, test_suite};

test_suite!("Calculator Tests", {
    given!("a new calculator", || Calculator::new())
        .when!("adding {} and {}", |calc, x: i32, y: i32| {
            calc.add(x, y);
            calc
        }, 2, 3)
        .then!("result should be {}", |calc, expected: i32| {
            assert_eq!(calc.result(), expected);
        }, 5);
});
```

2. Integration with Official Test Runners

Languages with Official Runners:

Go (go test):

• Goal: Make Testeranto tests runnable via go test
• Approach: Generate Go test functions that wrap Testeranto suites
• Implementation: golingvu will provide a go test compatible wrapper
• Example: go test ./... will automatically run Testeranto tests

Rust (cargo test):

• Goal: Integrate with cargo test and #[test] attributes
• Approach: Provide procedural macros for test generation
• Implementation: rusto will offer #[testeranto_test] macro
• Example: cargo test will include Testeranto test cases

Python (unittest/pytest):

• Goal: Support both unittest and pytest runners
• Approach: Generate test classes compatible with both frameworks
• Implementation: pitono will provide base classes for unittest.TestCase
• Example: python -m pytest or python -m unittest will run tests

Ruby (minitest/rspec):

• Goal: Integrate with Ruby's test ecosystem
• Approach: Provide minitest-compatible test classes
• Implementation: rubeno will generate minitest test cases
• Example: rake test or rspec will execute Testeranto tests

Languages without Official Runners:

TypeScript/JavaScript:

• Goal: Provide first-class Testeranto runner with ecosystem integration
• Approach: Support multiple runners (Vitest, Jest, Node's native test)
• Implementation: tiposkripto will offer adapters for popular runners
• Example: Run tests via npx testeranto or integrate with existing test suites

Java:

• Goal: Integrate with JUnit and build tools (Maven, Gradle)
• Approach: Provide JUnit 5 extensions and test templates
• Implementation: kafe will offer JUnit Jupiter extensions
• Example: mvn test or Gradle test tasks will run Testeranto tests

Integration Implementation Plan:

Phase 1: Runner Compatibility Layer

1 Create adapter interfaces for each official test runner
2 Implement test discovery mechanisms for each ecosystem
3 Provide test execution hooks that integrate with runner lifecycles
4 Ensure test reporting works with native runner outputs

Phase 2: Build Tool Integration

1 Maven/Gradle plugins for Java (kafe)
2 npm scripts and CLI tools for TypeScript (tiposkripto)
3 setup.py/pyproject.toml entry points for Python (pitono)
4 Cargo features and build scripts for Rust (rusto)
5 Gem executables and Rake tasks for Ruby (rubeno)
6 Go modules and test helpers for Go (golingvu)

Phase 3: IDE and Editor Support

1 Test explorer integration for VS Code, IntelliJ, etc.
2 Debugger support for stepping through BDD steps
3 Code lens and gutter markers for test status
4 Quick fix and refactoring support for test code

Phase 4: CI/CD Integration

1 Test result reporting in standard formats (JUnit XML, etc.)
2 Parallel test execution support
3 Test filtering and tagging systems
4 Performance profiling and optimization

Success Criteria for Integration:

1 Seamless Execution: Tests run via native commands without extra setup
2 Consistent Reporting: Test results appear in familiar formats
3 Toolchain Compatibility: Works with existing build and CI systems
4 Developer Familiarity: Feels natural to developers in each ecosystem
5 Performance Parity: Comparable performance to native test frameworks

Next Steps for Each Library:

Python (pitono):

1 Add unittest.TestCase base class compatibility
2 Create pytest plugin for BDD test discovery
3 Implement decorator-based API for Pythonic syntax

Go (golingvu):

1 Implement testing.T compatible test functions
2 Add go:generate directives for test generation
3 Create table-driven test helpers

Rust (rusto):

1 Develop procedural macros for #[test] integration
2 Implement cargo test compatible test organization
3 Add property-based testing support via proptest

Ruby (rubeno):

1 Create minitest plugin for BDD-style tests
2 Add RSpec matcher compatibility layer
3 Implement Rails test integration for web applications

TypeScript (tiposkripto):

1 Build Vitest/Jest test environment adapters
2 Create Node.js native test runner compatibility
3 Develop VS Code test explorer integration

Java (kafe):

1 Implement JUnit 5 extension for BDD tests
2 Create Maven plugin for test generation
3 Add Spring Boot test integration support

Migration Path for Existing Tests:

1 Incremental Adoption: Start with baseline pattern, migrate to flavored
2 Backward Compatibility: Ensure existing tests continue to work
3 Automated Migration: Provide tools to convert between patterns
4 Documentation and Examples: Clear guidance for each transition path

Community and Ecosystem Building:

1 Template Projects: Starter templates for each language
2 Plugin Ecosystem: Allow community extensions for each runner
3 Cross-language Examples: Demonstrate portability between implementations
4 Contributor Guidelines: Clear paths for community contributions

This dual approach ensures Testeranto remains both a consistent cross-language framework and an excellent citizen in each language's ecosystem, providing the best of both worlds
for developers.

---

Plan of attack:

- start with most pressing incongruencies
- reach baseline parity across all libs
- divide and conquer each runtime. Parallel development of the flavored versions and integration with native toolchains.
