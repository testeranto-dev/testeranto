"""
Simple example of the flavored Pitono syntax.
"""
import sys
import os

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pitono.flavored import suite, given, when, then

# Simple test subject
class Counter:
    def __init__(self):
        self.value = 0
    
    def increment(self, amount=1):
        self.value += amount
        return self
    
    def get_value(self):
        return self.value

@suite("Counter Tests")
class CounterTests:
    @given("a new counter", features=["counter functionality"])
    def create_counter(self):
        """Given: a new counter"""
        return Counter()
    
    @when("incrementing by {amount}")
    def increment_counter(self, counter, amount):
        """When: incrementing by {amount}"""
        return counter.increment(amount)
    
    @then("value should be {expected}")
    def check_value(self, counter, expected):
        """Then: value should be {expected}"""
        assert counter.get_value() == expected
        return True

if __name__ == "__main__":
    print("Flavored Pitono Example")
    print("=======================")
    
    # Create test instance
    test_instance = CounterTests()
    
    # Show that the suite was created
    if hasattr(CounterTests, '_pitono_suite'):
        suite = CounterTests._pitono_suite
        print(f"Suite name: {suite.name}")
        print(f"Number of scenarios: {len(suite.scenarios)}")
        
        for i, scenario in enumerate(suite.scenarios):
            print(f"\nScenario {i}: {scenario.name}")
            print(f"  Given: {scenario.given.name}")
            print(f"  When steps: {len(scenario.whens)}")
            print(f"  Then steps: {len(scenario.thens)}")
            print(f"  Features: {scenario.features}")
    
    print("\nTo run tests, you would call test_instance.run_tests()")
    print("This would create a Pitono instance with the collected test specifications.")
