---
status: planning
---

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
