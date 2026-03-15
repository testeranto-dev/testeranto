"""
Working example of the flavored (Pythonic) Pitono syntax.
"""
# Note: In a real installation, this would be:
# from pitono.flavored import suite, given, when, then
# But for development, we need to adjust the import path
import sys
import os

# Add the src directory to the path to find the modules
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(current_dir, '..', 'src/lib/pitono/src')
sys.path.insert(0, src_dir)

try:
    from flavored import suite, given, when, then
except ImportError:
    # Fallback for when installed as a package
    from pitono.flavored import suite, given, when, then

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
        return Calculator()
    
    @when("adding {x} and {y}")
    def add_numbers(self, calculator, x, y):
        return calculator.add(x, y)
    
    @then("result should be {expected}")
    def verify_result(self, calculator, expected):
        assert calculator.get_result() == expected
        return calculator

if __name__ == "__main__":
    # Create an instance and run tests
    tests = CalculatorTests()
    try:
        instance = tests.run_tests()
        print("✅ Tests completed successfully!")
    except Exception as e:
        print(f"⚠️  Tests encountered an error: {e}")
        print("This might be expected if the test infrastructure isn't fully set up")
        import traceback
        traceback.print_exc()
