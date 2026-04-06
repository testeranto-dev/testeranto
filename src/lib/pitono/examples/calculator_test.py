"""
Updated example using the complete flavored API.
"""
import sys
import os
import asyncio

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src"))

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

# ============================================================================
# Pitono Calculator Test (matching TypeScript tiposkripto example)
# ============================================================================

import json
from typing import List, Any, Callable

# Re-define Calculator with full functionality matching TypeScript version
class FullCalculator:
    def __init__(self):
        self.display = ""
        self.values = {}

    def enter(self):
        try:
            result = eval(self.display)
            if result == float('inf') or result == float('-inf'):
                self.display = "Error"
            else:
                self.display = str(result)
        except Exception:
            self.display = "Error"

    def memory_store(self):
        try:
            val = float(self.display) if self.display else 0.0
        except ValueError:
            val = 0.0
        self.set_value("memory", val)
        self.clear()

    def memory_recall(self):
        memory_val = self.get_value("memory") or 0.0
        self.display = str(memory_val)

    def memory_clear(self):
        self.set_value("memory", 0.0)

    def memory_add(self):
        try:
            current = float(self.display) if self.display else 0.0
        except ValueError:
            current = 0.0
        memory_val = self.get_value("memory") or 0.0
        self.set_value("memory", memory_val + current)
        self.clear()

    def handle_special_button(self, button):
        if button == "C":
            self.clear()
            return True
        elif button == "MS":
            self.memory_store()
            return True
        elif button == "MR":
            self.memory_recall()
            return True
        elif button == "MC":
            self.memory_clear()
            return True
        elif button == "M+":
            self.memory_add()
            return True
        else:
            return False

    def press(self, button):
        if self.handle_special_button(button):
            return self
        self.display = self.display + button
        return self

    def get_display(self):
        return self.display

    def clear(self):
        self.display = ""

    def add(self, a, b):
        return a + b

    def subtract(self, a, b):
        return a - b

    def multiply(self, a, b):
        return a * b

    def divide(self, a, b):
        if b == 0:
            raise ZeroDivisionError("Cannot divide by zero")
        return a / b

    def set_value(self, identifier, value):
        self.values[identifier] = value

    def get_value(self, identifier):
        return self.values.get(identifier)

# Helper to turn dict into object with attributes
class Obj:
    def __init__(self, d):
        for k, v in d.items():
            setattr(self, k, v)

# Test implementation matching TypeScript structure
implementation = Obj({
    # TDT pattern
    "values": {
        "of": lambda numbers: numbers,
        "one_and_two": lambda: [1, 2],
        "addition": lambda: lambda a, b: a + b
    },
    "shoulds": {
        "be_equal_to": lambda expected: lambda actual: actual == expected,
        "be_greater_than": lambda expected: lambda actual: actual > expected,
        "when_multiplied_are_at_least": lambda expected: lambda actual: actual >= expected,
        "equal": lambda expected: lambda actual: actual == expected
    },
    # AAA pattern
    "describes": {
        "a_simple_calculator": lambda input_cls: input_cls()
    },
    "its": {
        "can_save_1_memory": lambda: lambda calc: calc.memory_store(),
        "can_save_2_memories": lambda: lambda calc: (calc.memory_store(), calc.memory_add())
    },
    # BDD pattern
    "givens": {
        "Default": lambda input_cls: input_cls()
    },
    "whens": {
        "press": lambda button: lambda calc: calc.press(button),
        "enter": lambda: lambda calc: calc.enter(),
        "memory_store": lambda: lambda calc: calc.memory_store(),
        "memory_recall": lambda: lambda calc: calc.memory_recall(),
        "memory_clear": lambda: lambda calc: calc.memory_clear(),
        "memory_add": lambda: lambda calc: calc.memory_add()
    },
    "thens": {
        "result": lambda expected: lambda calc: calc.get_display() == expected
    }
})

# Test specification function (matches Pitono's argument order)
def specification(Suite, Given, When, Then, Value, Should, Expected, Describe, It):
    # TDT: Use Value["addition"] as confirm_cb
    addition_cb = implementation.values["addition"]()
    return [
        # TDT pattern using Value and Should directly
        Value["addition"](
            features=["./README.md"],
            table_rows=[
                [[1, 1], Should["be_equal_to"](2)],
                [[2, 3], Should["be_greater_than"](4)]
            ],
            confirm_cb=addition_cb,
            initial_values=None
        ),
        # AAA pattern
        Describe["a_simple_calculator"](
            features=["./README.md"],
            its=[
                It["can_save_1_memory"](),
                It["can_save_2_memories"]()
            ],
            describe_cb=implementation.describes["a_simple_calculator"],
            initial_values="some input"
        ),
        # BDD pattern
        Given["Default"](
            features=["./README.md"],
            whens=[
                When["press"]("5"),
                When["press"]("+"),
                When["press"]("3"),
                When["enter"]()
            ],
            thens=[Then["result"]("8")],
            initial_values="some input"
        ),
        # Additional TDT tests
        Value["addition"](
            features=["./README.md"],
            table_rows=[
                [[3, 3], Should["be_equal_to"](6)]
            ],
            confirm_cb=addition_cb,
            initial_values=None
        ),
        Value["addition"](
            features=["./README.md"],
            table_rows=[
                [[3, 32], Should["be_equal_to"](35)]
            ],
            confirm_cb=addition_cb,
            initial_values=None
        ),
        Value["addition"](
            features=["./README.md"],
            table_rows=[
                [[3, 332], Should["be_equal_to"](335)]
            ],
            confirm_cb=addition_cb,
            initial_values=None
        ),
    ]

# Runner for the Pitono test
async def run_pitono_example():
    print("\n" + "="*60)
    print("PITONO CALCULATOR TEST (TypeScript matching example)")
    print("="*60)
    
    from pitono import Pitono, set_default_instance
    from pitono.simple_adapter import SimpleTestAdapter
    
    adapter = SimpleTestAdapter()
    
    pitono_instance = Pitono(
        input_val=FullCalculator,
        test_specification=specification,
        test_implementation=implementation,
        test_adapter=adapter,
        test_resource_requirement={"ports": 0}
    )
    
    set_default_instance(pitono_instance)
    
    test_config = {
        "name": "calculator_test",
        "fs": "testeranto/reports/pitono/calculator",
        "ports": [],
        "browserWsEndpoint": None,
        "timeout": None,
        "retries": None,
        "environment": None
    }
    config_json = json.dumps(test_config)
    
    results = await pitono_instance.receiveTestResourceConfig(config_json)
    print(f"\nTests completed: fails={results.fails}, failed={results.failed}")
    if results.fails == 0:
        print("All tests passed!")
    else:
        print("Some tests failed.")
    return results.fails

# Main entry point
async def main():
    await run_example()
    await run_pitono_example()

if __name__ == "__main__":
    asyncio.run(main())
