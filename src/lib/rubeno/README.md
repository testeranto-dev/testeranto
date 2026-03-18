# Rubeno

The Ruby implementation of Testeranto.

## Ruĝa - Ruby-flavored Testeranto

Rubeno now includes **Ruĝa** (pronounced "ROO-zha"), a Ruby-flavored implementation that provides an idiomatic Ruby DSL for BDD testing while maintaining full compatibility with the baseline Testeranto pattern.

### Quick Start with Ruĝa

```ruby
require 'rubeno/flavored'

# Fluent builder style
test = Rubeno::Flavored.given("a new calculator") { Calculator.new }
  .when("adding 2 and 3") { |calc| calc.add(2, 3) }
  .then("result is 5") { |calc| raise "Expected 5" unless calc.result == 5 }

result = test.run

# Suite DSL style
suite = Rubeno::Flavored.suite("Calculator Tests") do
  scenario "Adding numbers" do
    subject { Calculator.new }
    given "a new calculator"
    when("adding 2 and 3") { |calc| calc.add(2, 3) }
    then("result is 5") { |calc| calc.result == 5 }
  end
end

suite.run
```

### Features

- **Ruby-idiomatic DSL**: Clean, readable syntax using blocks and method chaining
- **Test Runner Integration**: Full support for Minitest and RSpec
- **Dual Compatibility**: Run standalone or convert to baseline format
- **Fluent Builder**: Chainable API for functional-style composition
- **Suite DSL**: Class-based organization with before/after hooks

## Baseline Pattern (Original)

For cross-language compatibility and the original Testeranto pattern:

### Basic Example

```ruby
require 'rubeno'

# Define test implementation
test_implementation = Rubeno::ITestImplementation.new(
  suites: { 'Default' => ->(name, givens) { ... } },
  givens: { 'basic' => ->(initial_values) { ... } },
  whens: { 'press' => ->(button) { ->(store) { ... } } },
  thens: { 'displayIs' => ->(expected) { ->(store) { ... } } }
)

# Define test specification
test_specification = ->(suites, givens, whens, thens) do
  [
    suites.Default('Test Suite', {
      'test1' => givens.basic([], [whens.press('1')], [thens.displayIs('1')], nil)
    })
  ]
end

# Create test instance
test_instance = Rubeno.Rubeno(
  nil,
  test_specification,
  test_implementation,
  Rubeno::SimpleTestAdapter.new,
  Rubeno::ITTestResourceRequest.new(ports: 1)
)

# Set as default and run
Rubeno.set_default_instance(test_instance)
Rubeno.main
```

### Running Tests

To run tests with baseline Rubeno:

```bash
ruby example/Calculator-test.rb '{"name":"test","fs":".","ports":[]}'
```

To run tests with Ruĝa (flavored):

```bash
ruby example/calculator_ruĝa_test.rb
```

## Deployment to rubygems
1) update the version in rubeno.gemspec
2) `gem build rubeno.gemspec`

## Structure

The implementation consists of:

1. **Baseline Classes**: `BaseSuite`, `BaseGiven`, `BaseWhen`, `BaseThen` - Core BDD components
2. **Flavored Classes**: `SuiteBuilder`, `ScenarioContext`, `FluentTest` - Ruby-idiomatic DSL
3. **Main Class**: `Rubeno` - Orchestrates test execution
4. **Test Adapter**: `SimpleTestAdapter` - Default adapter implementation
5. **Integration Modules**: `MinitestIntegration`, `RSpecIntegration` - Test runner support

## Integration with Testeranto

Rubeno follows the same patterns as other Testeranto implementations:

1. **Test Resource Configuration**: Passed as a JSON string argument (baseline)
2. **Results Output**: Writes to `testeranto/reports/example/ruby.Calculator.test.ts.json`
3. **WebSocket Communication**: Supports communication via WebSocket (when configured)
4. **Artifact Generation**: Supports test artifacts and reporting

## Docker Support

Rubeno includes a Dockerfile for running tests in containers:

```dockerfile
FROM ruby:3.2-alpine
WORKDIR /workspace
# ... (see testeranto/runtimes/ruby/ruby.Dockerfile)
```

## Extending

To create custom adapters for baseline:

```ruby
class CustomAdapter
  include Rubeno::ITestAdapter
  
  def before_all(input_val, tr, pm)
    # Custom setup
    input_val
  end
  
  # ... implement other methods
end
```

To extend the flavored API:

```ruby
module MyCustomDSL
  include Rubeno::Flavored
  
  def my_custom_helper
    # Custom DSL extensions
  end
end
```

## Dependencies

- Ruby 2.7+ (for pattern matching and other modern features)
- JSON (standard library)

## Future Enhancements

1. **Enhanced RSpec Integration**: More matchers and configuration options
2. **Parallel Test Execution**: Support for running tests in parallel
3. **Test Filtering**: Tag-based test selection and filtering
4. **Performance Optimizations**: Improved test execution performance

## See Also

- [Tiposkripto](../tiposkripto/) - TypeScript/JavaScript implementation
- [Pitono](../pitono/) - Python implementation
- [Golingvu](../golingvu/) - Go implementation

## Choosing Between Baseline and Flavored

**Use Baseline Rubeno when:**
- You need cross-language test compatibility
- You're working in a multi-language codebase
- You require the full Testeranto resource configuration system

**Use Ruĝa (Flavored) when:**
- You want Ruby-idiomatic syntax
- You're integrating with Minitest or RSpec
- You prefer functional or DSL-style test composition
- You're working primarily in Ruby

Both implementations can coexist and even interoperate within the same codebase.

