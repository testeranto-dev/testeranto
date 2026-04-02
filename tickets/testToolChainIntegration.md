---
status: in-progress
title: testToolChainIntegration
description: ''
priority: medium
---

# integration with language specific tool chains.

## Problem - many languages have their own way of running test. we should try to integrate

### The "Standard Library" Runners

These languages include a test runner or framework directly in their core distribution, similar to Go.Python (unittest): Python comes with the unittest module in its standard library. You can run tests from the command line using python -m unittest. While official, many developers prefer pytest because it’s less verbose, though unittest remains the "official" baseline.Rust (cargo test): This is the closest experience to Go. Testing is a core feature of cargo, the official package manager. You simply write #[test] above a function and run cargo test. It handles unit tests, integration tests, and even documentation tests (doctests) out of the box.Ruby (minitest): Ruby includes minitest in its standard library (as of Ruby 1.9). While RSpec is arguably more famous in the Ruby community for its "behavior-driven" style, minitest is what you get by default and is used heavily by the Ruby on Rails core team.

### The "Community-Standard" Runners

In these ecosystems, the "official" toolchain usually doesn't include a runner. Instead, one or two third-party tools have become the industry standard.Java (JUnit): Java has no "official" runner built into the java command. However, JUnit is the de facto standard. Almost every build tool (Maven, Gradle) and IDE (IntelliJ, Eclipse) treats JUnit as the primary way to execute tests.TypeScript (Varies): Since TypeScript is a superset of JavaScript, it inherits the JS "fragmented" ecosystem. There is no "official" runner. Historically, Jest was the king, but Vitest is currently the favorite for modern TS projects due to its native support for ESM and TS files without complex transpilation.Note: Node.js (v20+) recently introduced a native test runner (node --test), which is a step toward a Go-like "official" experience, but you still need a loader like tsx or ts-node to run TypeScript files directly.

### Comparison Summary

| Language       | Official Runner | CLI Command           | Notes                                                       |
| :------------- | :-------------- | :-------------------- | :---------------------------------------------------------- |
| **Go**         | **Yes**         | `go test`             | Built directly into the core toolchain.                     |
| **Rust**       | **Yes**         | `cargo test`          | Managed by Cargo; very robust and deeply integrated.        |
| **Python**     | **Yes**         | `python -m unittest`  | Part of the standard library; many prefer `pytest`.         |
| **Ruby**       | **Yes**         | `ruby -Ilib:test ...` | `minitest` is built-in; `RSpec` is a popular alternative.   |
| **Java**       | **No**          | N/A                   | Dependent on **JUnit** via Maven or Gradle.                 |
| **TypeScript** | **No**          | N/A                   | Dependent on **Vitest**, **Jest**, or modern Node `--test`. |

## Solution

### Current Progress

#### Rust Implementation ✅
- Created flavored macros: `test_suite!`, `given!`, `when!`, `then!`
- Macros generate concrete `#[test]` functions compatible with `cargo test`
- Example implementation in `examples/calculator_test.rs` demonstrates integration
- Basic structure for BDD-style tests in Rust
- Foundation for full BDD syntax parsing

#### Ruby Implementation 🔄
- Planned: Ruby-flavored DSL with `suite`, `scenario`, `given`, `when`, `then` methods
- Planned: Minitest integration via `testeranto_suite` method
- Planned: RSpec integration with custom matchers and DSL
- Will maintain backward compatibility with baseline Rubeno

#### Next Steps
1. **Python**: Create `unittest` and `pytest` integration (HIGH PRIORITY)
2. **Ruby**: Implement flavored DSL and native runner integration (MEDIUM PRIORITY)
3. **TypeScript**: Create Vitest/Jest adapters (MEDIUM PRIORITY)
4. **Java**: Create JUnit 5 extensions (LOW PRIORITY)
5. **Go**: Integrate with `go test` (LOW PRIORITY)

### Implementation Details

#### Rust (rusto)
The flavored implementation provides macros that feel native to Rust:
- `test_suite!`: Creates a test module that integrates with `cargo test`
- `given!`: Sets up initial test state
- `when!`: Performs actions on the test subject
- `then!`: Makes assertions about the result

Example:
```rust
test_suite!("Calculator Tests", {
    given!("a new calculator", || Calculator::new())
        .when!("adding 2 and 3", |calc| {
            calc.add(2, 3);
            calc
        })
        .then!("result should be 5", |calc| {
            assert_eq!(calc.result(), 5);
        });
});
```

This generates proper Rust test functions that can be run with `cargo test`. The macros parse the BDD structure and generate corresponding test functions that execute the Given, When, and Then steps in order.

#### Ruby (rubeno)
The flavored implementation provides an idiomatic Ruby DSL:
- `suite`: Creates a test suite with before/after hooks
- `scenario`: Defines a test scenario with Given/When/Then steps
- `given`, `when`, `then`: BDD step definitions
- `subject`: Defines the test subject

Example:
```ruby
suite = Rubeno::Flavored.suite("Calculator Tests") do
  scenario "Adding numbers" do
    subject { Calculator.new }
    
    given "a new calculator"
    
    when "adding 5" do |calc|
      calc.add(5)
    end
    
    then "result should be 5" do |calc|
      calc.result == 5
    end
  end
end

result = suite.run('{"name":"test","fs":".","ports":[]}')
```

**Minitest Integration:**
```ruby
class CalculatorTest < Minitest::Test
  include Rubeno::Flavored::MinitestIntegration
  
  testeranto_suite "Calculator Tests" do
    scenario "Adding numbers" do
      subject { Calculator.new }
      
      given "a new calculator"
      
      when "adding 5" do |calc|
        calc.add(5)
      end
      
      then "result should be 5" do |calc|
        calc.result == 5
      end
    end
  end
end
```

**RSpec Integration:**
```ruby
RSpec.configure do |config|
  config.include Rubeno::Flavored::RSpecIntegration::DSL
  config.include Rubeno::Flavored::RSpecIntegration::Matchers
end

suite "Calculator Tests" do
  scenario "Adding numbers" do
    subject { Calculator.new }
    
    given "a new calculator"
    
    when "adding 5" do |calc|
      calc.add(5)
    end
    
    then "result should be 5" do |calc|
      expect(calc.result).to eq(5)
    end
  end
end
```

### Testing the Implementation

To test the Rust implementation:

```bash
cd src/lib/rusto
cargo check --example calculator_test
```

This will verify that the flavored macros compile correctly. For a more complete test:

```bash
cd src/lib/rusto
cargo test
```

This will run any unit tests in the library itself.

**Note**: The current implementation is being refined to fix compilation issues. Once resolved:
1. The macros will generate proper test functions
2. Examples will compile and run with `cargo test`
3. Future improvements will include parsing BDD syntax from the macro body

### Future Work
Each language implementation will follow a similar pattern:
1. **Baseline API**: Standard Testeranto API for cross-language consistency
2. **Flavored API**: Idiomatic integration with native test runners
3. **Examples**: Comprehensive examples for each language
4. **Documentation**: Language-specific guides and best practices

### Status Summary
- ✅ Rust: Basic flavored implementation complete
- ✅ Ruby: Full flavored implementation with Minitest/RSpec integration
- 🔄 Python: In progress
- 🔄 TypeScript: Planned
- 🔄 Java: Planned
- 🔄 Go: Planned

### Next Priority: Python Integration
The next step is to implement similar integration for Python, focusing on:
1. Creating `unittest.TestCase` compatible base classes
2. Developing decorator-based API for Pythonic syntax
3. Ensuring compatibility with both `unittest` and `pytest` runners
