# Pitono

The python implementation of testeranto.

## Setup

1. Create a virtual environment:
```bash
python3 -m venv venv
```

2. Activate the virtual environment:
```bash
source venv/bin/activate
```

3. Install the package in development mode:
```bash
pip install -e .
```

## Running Tests

Make sure the virtual environment is activated, then run your Python tests normally.

## Flavored (Pythonic) Version

Pitono now includes a Pythonic, decorator-based syntax for writing tests:

```python
from pitono.flavored import suite, given, when, then

@suite("Calculator Tests")
class CalculatorTests:
    @given("a new calculator")
    def setup_calculator(self):
        return Calculator()
    
    @when("adding {x} and {y}")
    def add_numbers(self, calculator, x, y):
        return calculator.add(x, y)
    
    @then("result should be {expected}")
    def verify_result(self, calculator, expected):
        assert calculator.get_result() == expected
        return calculator

# Run tests
tests = CalculatorTests()
instance = tests.run_tests()
```

### Features:

1. **Decorator-based syntax**: Use `@suite`, `@given`, `@when`, `@then` decorators
2. **String interpolation**: Use `{parameter}` placeholders in descriptions
3. **Automatic conversion**: Flavored tests are automatically converted to baseline format
4. **unittest integration**: Use `PitonoTestCase` for integration with Python's unittest framework
5. **Backward compatibility**: Works alongside existing baseline tests

### Integration with unittest:

```python
import unittest
from pitono.flavored import PitonoTestCase

class TestCalculator(PitonoTestCase):
    @given("a new calculator")
    def setup_calculator(self):
        return Calculator()
    
    # ... test methods

if __name__ == "__main__":
    unittest.main()
```

## Examples

See `examples/flavored_example.py` for a complete working example.

## Documentation

For more details, see:
- `src/lib/pitono/tickets/pythonic.md` - Design document for the flavored version
- `src/lib/pitono/src/flavored.py` - Implementation of the flavored version
