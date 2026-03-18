"""
Complete example showing both decorator and fluent APIs.
"""
import sys
import os
import asyncio

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from pitono.flavored import suite, given, when, then, given_fluent, FluentTestBuilder

# ==================== TEST SUBJECT ====================

class Calculator:
    def __init__(self):
        self.value = 0
    
    def add(self, x):
        self.value += x
        return self
    
    def subtract(self, x):
        self.value -= x
        return self
    
    def multiply(self, x):
        self.value *= x
        return self
    
    def get_value(self):
        return self.value
    
    def reset(self):
        self.value = 0
        return self

# ==================== DECORATOR API EXAMPLE ====================

@suite("Calculator Decorator Tests")
class CalculatorDecoratorTests:
    @given("a new calculator", features=["basic operations"])
    def setup_calculator(self):
        """Given: a new calculator"""
        return Calculator()
    
    @when("adding {amount}")
    def add_to_calculator(self, calculator, amount):
        """When: adding {amount}"""
        return calculator.add(amount)
    
    @then("value should be {expected}")
    def check_value(self, calculator, expected):
        """Then: value should be {expected}"""
        assert calculator.get_value() == expected
        return calculator
    
    @given("calculator with initial value {initial}", features=["advanced operations"])
    def setup_with_initial(self, initial):
        """Given: calculator with initial value {initial}"""
        calc = Calculator()
        calc.add(initial)
        return calc
    
    @when("multiplying by {factor}")
    def multiply_calculator(self, calculator, factor):
        """When: multiplying by {factor}"""
        return calculator.multiply(factor)
    
    @then("result should be {expected}")
    def check_result(self, calculator, expected):
        """Then: result should be {expected}"""
        assert calculator.get_value() == expected
        return calculator

# ==================== FLUENT API EXAMPLE ====================

def run_fluent_tests():
    """Demonstrate fluent builder API."""
    print("\n" + "="*50)
    print("FLUENT BUILDER TESTS")
    print("="*50)
    
    # Test 1: Simple addition
    test1 = given_fluent("a new calculator", Calculator) \
        .when("adding 5", lambda calc, x: calc.add(x), 5) \
        .then("value should be 5", lambda calc, expected: assert calc.get_value() == expected, 5)
    
    # Test 2: Multiple operations
    test2 = given_fluent("calculator with value 10", lambda: Calculator().add(10)) \
        .when("subtracting 3", lambda calc, x: calc.subtract(x), 3) \
        .when("multiplying by 2", lambda calc, x: calc.multiply(x), 2) \
        .then("result should be 14", lambda calc, expected: assert calc.get_value() == expected, 14)
    
    return test1, test2

# ==================== ASYNC EXAMPLE ====================

@suite("Async Calculator Tests")
class AsyncCalculatorTests:
    @given("async calculator setup", features=["async operations"])
    async def setup_async(self):
        """Given: async calculator setup"""
        await asyncio.sleep(0.01)  # Simulate async operation
        return Calculator()
    
    @when("async adding {amount}")
    async def add_async(self, calculator, amount):
        """When: async adding {amount}"""
        await asyncio.sleep(0.01)
        return calculator.add(amount)
    
    @then("async value check {expected}")
    async def check_async(self, calculator, expected):
        """Then: async value check {expected}"""
        await asyncio.sleep(0.01)
        assert calculator.get_value() == expected
        return calculator

# ==================== MAIN EXECUTION ====================

async def main():
    print("COMPLETE PITONO FLAVORED API EXAMPLE")
    print("="*50)
    
    # Run decorator tests
    print("\n1. DECORATOR API TESTS")
    print("-"*30)
    
    decorator_tests = CalculatorDecoratorTests()
    results = await decorator_tests.run_tests()
    
    print(f"Suite: {results['suite_name']}")
    print(f"Passed: {results['passed']}")
    print(f"Total scenarios: {len(results['results'])}")
    
    for result in results['results']:
        status = "✓" if result['passed'] else "✗"
        print(f"  {status} {result['scenario']}")
        if not result['passed']:
            print(f"    Error: {result['error']}")
    
    # Convert to baseline
    print("\n2. CONVERSION TO BASELINE")
    print("-"*30)
    baseline = decorator_tests.to_baseline()
    print(f"Baseline specification created: {bool(baseline['specification'])}")
    print(f"Baseline implementation created: {bool(baseline['implementation'])}")
    
    # Run fluent tests
    print("\n3. FLUENT BUILDER TESTS")
    print("-"*30)
    
    test1, test2 = run_fluent_tests()
    
    # Run test 1
    result1 = await test1.run()
    print(f"Test 1: {'✓ PASSED' if result1['success'] else '✗ FAILED'}")
    if not result1['success']:
        print(f"  Error: {result1['error']}")
    
    # Run test 2
    result2 = await test2.run()
    print(f"Test 2: {'✓ PASSED' if result2['success'] else '✗ FAILED'}")
    if not result2['success']:
        print(f"  Error: {result2['error']}")
    
    # Convert fluent to baseline
    print("\n4. FLUENT TO BASELINE CONVERSION")
    print("-"*30)
    baseline1 = test1.to_baseline()
    print(f"Fluent test 1 baseline created: {bool(baseline1['specification'])}")
    
    # Run async tests
    print("\n5. ASYNC TESTS")
    print("-"*30)
    
    async_tests = AsyncCalculatorTests()
    async_results = await async_tests.run_tests()
    
    print(f"Async suite: {async_results['suite_name']}")
    print(f"Async passed: {async_results['passed']}")
    
    # Integration with unittest (if available)
    print("\n6. UNITTEST INTEGRATION")
    print("-"*30)
    try:
        import unittest
        print("unittest module available")
        print("To use with unittest, inherit from PitonoTestCase")
    except ImportError:
        print("unittest module not available")
    
    print("\n" + "="*50)
    print("EXAMPLE COMPLETE")
    print("="*50)

if __name__ == "__main__":
    asyncio.run(main())
