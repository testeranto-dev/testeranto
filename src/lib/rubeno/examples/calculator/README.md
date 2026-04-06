# Calculator Test Example

This example demonstrates how to use Rubeno to test a Calculator class using all three testing patterns:

1. **TDT (Table-Driven Testing)**: Using Confirm, Value, and Should verbs
2. **AAA (Arrange-Act-Assert)**: Using Describe and It verbs  
3. **BDD (Behavior-Driven Development)**: Using Given, When, and Then verbs

## Files

- `Calculator.rb`: The Calculator class implementation
- `Calculator.test.implementation.rb`: Test implementations for all patterns
- `Calculator.test.specification.rb`: Test specification using all patterns
- `Calculator.test.adapter.rb`: Test adapter for lifecycle management
- `Calculator.test.rb`: Main test runner
- `run_test.rb`: Simple script to run the tests

## Running the Test

```bash
cd src/lib/rubeno/examples/calculator
ruby run_test.rb
```

Or from the project root:

```bash
ruby src/lib/rubeno/examples/calculator/run_test.rb
```

## Test Patterns

### TDT Pattern
```ruby
confirms_wrapper.addition.().(
  [
    [values_wrapper.of.([1, 1]), shoulds_wrapper.be_equal_to.(2)],
    [values_wrapper.of.([2, 3]), shoulds_wrapper.be_greater_than.(4)],
  ],
  ["./Readme.md"],
)
```

### AAA Pattern
```ruby
describes_wrapper.a_simple_calculator.("some input").(
  [
    its_wrapper.can_save_1_memory.(),
    its_wrapper.can_save_2_memories.(),
  ],
  ["./Readme.md"],
)
```

### BDD Pattern
```ruby
given_wrapper.default.("some input").(
  [
    when_wrapper.press.("5"),
    when_wrapper.press.("+"),
    when_wrapper.press.("3"),
    when_wrapper.enter.(),
  ],
  [then_wrapper.result.("8")],
  ["./Readme.md"],
)
```

This example matches the TypeScript implementation in `src/lib/tiposkripto/tests/calculator/` to demonstrate cross-language consistency.
