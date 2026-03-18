# Ruĝa - Ruby-flavored Testeranto

Ruĝa (pronounced "ROO-zha") is a Ruby-flavored implementation of Testeranto that provides an idiomatic Ruby DSL for Behavior-Driven Development (BDD) testing while maintaining full compatibility with the baseline Testeranto pattern.

## Features

- **Ruby-idiomatic DSL**: Clean, readable syntax using blocks and method chaining
- **Dual Compatibility**: Can run standalone or convert to baseline format automatically
- **Test Runner Integration**: Full support for Minitest and RSpec
- **Backward Compatibility**: All existing Rubeno tests continue to work
- **Fluent Builder**: Chainable API for functional-style test composition
- **Suite DSL**: Class-based organization with before/after hooks

## Installation

Add to your Gemfile:

```ruby
gem 'rubeno'
```

Or install directly:

```bash
gem install rubeno
```

## Quick Start

### Using the Suite DSL

```ruby
require 'rubeno/flavored'

suite = Rubeno::Flavored.suite("Calculator Tests") do
  before_all do |context|
    puts "Test suite starting..."
    context[:start_time] = Time.now
    context
  end
  
  scenario "Adding numbers" do
    subject { Calculator.new }
    
    given "a new calculator"
    
    when "adding 2 and 3" do |calc|
      calc.add(2, 3)
    end
    
    then "result should be 5" do |calc|
      raise "Expected 5, got #{calc.result}" unless calc.result == 5
    end
  end
end

result = suite.run
puts "Suite passed: #{result[:passed]}"
```

### Using the Fluent Builder

```ruby
require 'rubeno/flavored'

test = Rubeno::Flavored.given("a new calculator") { Calculator.new }
  .when("adding 2 and 3") { |calc| calc.add(2, 3) }
  .then("result is 5") { |calc| raise "Expected 5" unless calc.result == 5 }

result = test.run
puts "Test passed: #{result[:success]}"
```

## Integration with Test Runners

### Minitest Integration

```ruby
require 'minitest/autorun'
require 'rubeno/flavored'

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
  
  def test_traditional_with_flavored
    test = Rubeno::Flavored.given("calculator") { Calculator.new }
      .when("adding 3 and 4") { |calc| calc.add(3, 4) }
      .then("result is 7") { |calc| assert_equal 7, calc.result }
    
    result = test.run
    assert result[:success]
  end
end
```

### RSpec Integration

```ruby
require 'rspec'
require 'rubeno/flavored'

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

## API Reference

### SuiteBuilder

Main class for organizing tests into suites with hooks.

```ruby
suite = Rubeno::Flavored.suite("Suite Name") do
  before_all { |context| ... }      # Runs once before all scenarios
  after_all { |context| ... }       # Runs once after all scenarios
  
  scenario "Scenario description" do
    subject { ... }                 # Object being tested
    given "description" { ... }     # Setup/initial state
    when "description" { ... }      # Action/state change
    then "description" { ... }      # Assertion/verification
  end
end
```

### FluentTest

Chainable API for functional-style test composition.

```ruby
test = Rubeno::Flavored.given("initial state") { setup_code }
  .when("action") { |state| ... }
  .when("another action") { |state| ... }
  .then("assertion") { |state| ... }
  .then("another assertion") { |state| ... }
  
result = test.run
```

### Conversion to Baseline

Convert flavored tests to baseline Testeranto format for compatibility:

```ruby
suite = Rubeno::Flavored.suite("My Tests") { ... }
baseline = suite.to_baseline

# Use with baseline Rubeno
Rubeno::Baseline.run(baseline[:specification], baseline[:implementation])
```

## Best Practices

1. **Keep Scenarios Focused**: Each scenario should test one specific behavior
2. **Use Descriptive Names**: Scenario names should clearly describe what's being tested
3. **Isolate Test Data**: Avoid sharing state between scenarios unless necessary
4. **Use Hooks Sparingly**: `before_all` and `after_all` are for suite-level setup/teardown
5. **Follow Ruby Conventions**: Use snake_case for method names and symbols

## Error Handling

Tests fail by raising exceptions. The framework catches these and reports them:

```ruby
then "should fail gracefully" do |state|
  raise "Expected condition not met" unless condition_met?(state)
end
```

## Running Examples

See the `example/` directory for complete working examples:

```bash
cd src/lib/rubeno
ruby example/calculator_ruĝa_test.rb
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for your changes
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see the main Rubeno repository for details.
