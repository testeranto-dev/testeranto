"""
Example of the flavored (Pythonic) Pitono syntax.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from pitono.flavored import suite, given, when, then
except ImportError:
    # Try relative import
    from ..src.flavored import suite, given, when, then

class Calculator:
    def __init__(self):
        self.result = 0
    
    def add(self, x, y):
        self.result = x + y
        return self
    
    def get_result(self):
        return self.result

@suite("Calculator Tests")
class CalculatorTests:
    @given("a new calculator", features=["basic arithmetic"])
    def setup_calculator(self):
        """Given: a new calculator"""
        return Calculator()
    
    @when("adding {x} and {y}")
    def add_numbers(self, calculator, x, y):
        """When: adding {x} and {y}"""
        return calculator.add(x, y)
    
    @then("result should be {expected}")
    def verify_result(self, calculator, expected):
        """Then: result should be {expected}"""
        assert calculator.get_result() == expected
        return calculator

# This can also be used with unittest
if __name__ == "__main__":
    # Create an instance and run tests
    tests = CalculatorTests()
    
    # Note: In a real scenario, you would need to provide actual values
    # for the parameters in when and then decorators
    print("Test suite created successfully!")
    print("To run tests, you would need to:")
    print("1. Create an instance of CalculatorTests")
    print("2. Call run_tests() method")
    print("3. The decorators collect test specifications")
    
    # Show what methods are available
    print(f"\nAvailable methods in CalculatorTests:")
    for attr_name in dir(CalculatorTests):
        if not attr_name.startswith('__'):
            attr = getattr(CalculatorTests, attr_name)
            if hasattr(attr, '_pitono_step'):
                step_info = attr._pitono_step
                print(f"  - {attr_name}: {step_info['type']} step")
