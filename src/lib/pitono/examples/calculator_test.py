"""
Updated example using the complete flavored API.
"""
import sys
import os
import asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pitono.flavored import suite, given, when, then, given_fluent

class Calculator:
    def __init__(self):
        self.result = 0
    
    def add(self, x, y):
        self.result = x + y
        return self
    
    def get_result(self):
        return self.result

# Decorator-based tests
@suite("Enhanced Calculator Tests")
class EnhancedCalculatorTests:
    @given("fresh calculator", features=["arithmetic", "basic"])
    def setup_calculator(self):
        return Calculator()
    
    @when("adding {x} and {y}")
    def perform_addition(self, calculator, x, y):
        return calculator.add(x, y)
    
    @then("sum is {expected}")
    def verify_sum(self, calculator, expected):
        assert calculator.get_result() == expected
        return calculator
    
    @given("calculator with memory", features=["memory operations"])
    def setup_with_memory(self):
        calc = Calculator()
        calc.add(10, 0)  # Set to 10
        return calc
    
    @when("adding {extra}")
    def add_more(self, calculator, extra):
        current = calculator.get_result()
        return calculator.add(current, extra)
    
    @then("total is {expected}")
    def verify_total(self, calculator, expected):
        assert calculator.get_result() == expected
        return calculator

# Fluent builder example
def create_fluent_test():
    return given_fluent("calculator for fluent test", Calculator) \
        .when("adding numbers", lambda calc, x, y: calc.add(x, y), 3, 4) \
        .then("result is correct", lambda calc, expected: assert calc.get_result() == expected, 7) \
        .when("adding more", lambda calc, x: calc.add(calc.get_result(), x), 5) \
        .then("final result", lambda calc, expected: assert calc.get_result() == expected, 12)

async def run_example():
    print("ENHANCED CALCULATOR TEST EXAMPLE")
    print("="*40)
    
    # Run decorator tests
    print("\n1. Running decorator tests...")
    tests = EnhancedCalculatorTests()
    results = await tests.run_tests()
    
    print(f"Suite: {results['suite_name']}")
    print(f"Passed: {results['passed']}")
    
    for result in results['results']:
        status = "PASS" if result['passed'] else "FAIL"
        print(f"  {status}: {result['scenario']}")
    
    # Run fluent test
    print("\n2. Running fluent test...")
    fluent_test = create_fluent_test()
    fluent_result = await fluent_test.run()
    
    print(f"Fluent test: {'PASSED' if fluent_result['success'] else 'FAILED'}")
    if fluent_result['success']:
        print(f"  Final value: {fluent_result['subject'].get_result()}")
    else:
        print(f"  Error: {fluent_result['error']}")
    
    # Show conversion
    print("\n3. Conversion examples:")
    baseline = tests.to_baseline()
    print(f"  Decorator to baseline: ✓")
    
    fluent_baseline = fluent_test.to_baseline()
    print(f"  Fluent to baseline: ✓")
    
    print("\n4. Test structure:")
    print(f"  Number of scenarios: {len(tests._pitono_scenarios)}")
    for i, scenario in enumerate(tests._pitono_scenarios):
        print(f"  Scenario {i}:")
        print(f"    Given: {scenario['given']['description']}")
        if scenario['when']:
            print(f"    When: {scenario['when']['description']}")
        if scenario['then']:
            print(f"    Then: {scenario['then']['description']}")

if __name__ == "__main__":
    asyncio.run(run_example())
