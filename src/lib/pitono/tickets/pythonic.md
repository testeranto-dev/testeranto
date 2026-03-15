---
status: ✅ IMPLEMENTED
---

src/server/tickets/testToolChainIntegration.md

**Python (pitono) - Flavored Version:**

```python
# Baseline (matches TypeScript)
from pitono import Pitono, BaseGiven, BaseWhen, BaseThen

# Flavored (Pythonic) ✅ IMPLEMENTED
from pitono.flavored import given, when, then, suite

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

**unittest integration ✅ IMPLEMENTED**

We need to interopt with the standad toolchain unittest.

1. Testeranto can run unittest's
2. unittest can run pitono tests

**Implementation Status:**
- ✅ Flavored version with decorator syntax implemented in `src/lib/pitono/src/flavored.py`
- ✅ `unittest` integration via `PitonoTestCase` class
- ✅ String interpolation for parameterized tests
- ✅ Automatic conversion to baseline format
- ✅ Backward compatibility maintained

**Usage Examples:**

1. **Direct usage:**
```python
from pitono.flavored import suite, given, when, then

@suite("Calculator Tests")
class CalculatorTests:
    @given("a new calculator")
    def setup_calculator(self):
        return Calculator()
    
    # ... test methods

# Run tests
tests = CalculatorTests()
instance = tests.run_tests()
```

2. **With unittest:**
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

3. **Parameterized tests:**
```python
@suite("Math Operations")
class MathTests:
    @given("numbers {a} and {b}")
    def setup_numbers(self, a, b):
        return {"a": int(a), "b": int(b)}
    
    @when("adding them together")
    def add_numbers(self, numbers):
        numbers["result"] = numbers["a"] + numbers["b"]
        return numbers
    
    @then("result should be {expected}")
    def verify_result(self, numbers, expected):
        assert numbers["result"] == int(expected)
        return numbers
```

**Next Steps:**
- Add more examples and documentation
- Consider `pytest` integration
- Add type hints and better error messages
- Create migration guide from baseline to flavored
