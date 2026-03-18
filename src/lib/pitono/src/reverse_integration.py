"""
Reverse integration with Python's native test runners (pytest, unittest)
"""
import asyncio
import sys
import json
from typing import Any, Callable, Dict, List, Optional, Union
import inspect

# Try to import pytest and unittest
try:
    import pytest
    PYTEST_AVAILABLE = True
except ImportError:
    PYTEST_AVAILABLE = False

try:
    import unittest
    UNITTEST_AVAILABLE = True
except ImportError:
    UNITTEST_AVAILABLE = False

from .Pitono import Pitono, PitonoClass
from .pitono_types import ITestResourceConfiguration, IFinalResults
from .simple_adapter import SimpleTestAdapter

class ReverseIntegration:
    """Provides reverse integration with Python's native test runners."""
    
    def __init__(self, pitono_instance: PitonoClass):
        self.pitono = pitono_instance
    
    def as_pytest_test(self, test_name: str):
        """Convert Pitono test to a pytest test function."""
        if not PYTEST_AVAILABLE:
            raise ImportError("pytest is not available")
        
        def pytest_test_func():
            # Run the test synchronously
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                # Create a test resource configuration
                test_resource = ITestResourceConfiguration(
                    name="pytest-integration",
                    fs=".",
                    ports=[],
                    browser_ws_endpoint=None,
                    timeout=30,
                    retries=3,
                    environment={"PYTEST": "true"}
                )
                
                # Convert to JSON string
                test_resource_json = json.dumps({
                    "name": test_resource.name,
                    "fs": test_resource.fs,
                    "ports": test_resource.ports,
                    "browser_ws_endpoint": test_resource.browser_ws_endpoint,
                    "timeout": test_resource.timeout,
                    "retries": test_resource.retries,
                    "environment": test_resource.environment
                })
                
                # Run the test
                result = loop.run_until_complete(
                    self.pitono.receiveTestResourceConfig(test_resource_json, "pytest")
                )
                
                # Check for failures
                if result.failed or result.fails > 0:
                    pytest.fail(f"Test failed with {result.fails} failures")  # type: ignore
                    
            finally:
                loop.close()
        
        # Add pytest marker
        pytest_test_func = pytest.mark.pitono(pytest_test_func)  # type: ignore
        return pytest_test_func
    
    def as_unittest_testcase(self, test_name: str):
        """Convert Pitono test to a unittest TestCase."""
        if not UNITTEST_AVAILABLE:
            raise ImportError("unittest is not available")
        
        class PitonoTestCase(unittest.TestCase):
            @classmethod
            def setUpClass(cls):
                cls.pitono_instance = ReverseIntegration.__new__(ReverseIntegration)
                cls.pitono_instance.pitono = self.pitono
            
            def runTest(self):
                # Run the test synchronously
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    # Create a test resource configuration
                    test_resource = ITestResourceConfiguration(
                        name="unittest-integration",
                        fs=".",
                        ports=[],
                        browser_ws_endpoint=None,
                        timeout=30,
                        retries=3,
                        environment={"UNITTEST": "true"}
                    )
                    
                    # Convert to JSON string
                    test_resource_json = json.dumps({
                        "name": test_resource.name,
                        "fs": test_resource.fs,
                        "ports": test_resource.ports,
                        "browser_ws_endpoint": test_resource.browser_ws_endpoint,
                        "timeout": test_resource.timeout,
                        "retries": test_resource.retries,
                        "environment": test_resource.environment
                    })
                    
                    # Run the test
                    result = loop.run_until_complete(
                        self.pitono.receiveTestResourceConfig(test_resource_json, "unittest")
                    )
                    
                    # Check for failures
                    self.assertFalse(result.failed, f"Test failed with {result.fails} failures")
                    self.assertEqual(result.fails, 0, f"Expected 0 failures, got {result.fails}")
                    
                finally:
                    loop.close()
        
        # Set the test case name
        PitonoTestCase.__name__ = test_name
        return PitonoTestCase
    
    def run_with_pytest(self, test_name: Optional[str] = None):
        """Run the Pitono test using pytest."""
        if not PYTEST_AVAILABLE:
            print("pytest not available, skipping pytest integration")
            return
        
        test_func = self.as_pytest_test(test_name or "pitono_test")
        
        # Create a test class for pytest
        class TestPitono:
            test_pitono = test_func
        
        # Run pytest programmatically (simplified)
        print(f"To run with pytest, use: pytest {__file__} -v")
    
    def run_with_unittest(self, test_name: Optional[str] = None):
        """Run the Pitono test using unittest."""
        if not UNITTEST_AVAILABLE:
            print("unittest not available, skipping unittest integration")
            return
        
        TestCaseClass = self.as_unittest_testcase(test_name or "PitonoTest")
        
        # Create a test suite and run it
        suite = unittest.TestLoader().loadTestsFromTestCase(TestCaseClass)
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        return result
    
    def generate_test_module(self, module_name: str = "test_pitono_integration"):
        """Generate a Python test module that can be run with native test runners."""
        module_code = f'''
"""
Generated test module for Pitono reverse integration.
Run with: python -m pytest {module_name}.py
Or: python -m unittest {module_name}
"""
import sys
import os

# Add the pitono module to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from pitono import Pitono
    from pitono.reverse_integration import ReverseIntegration
except ImportError:
    print("Pitono not available")
    sys.exit(1)

# Create your Pitono instance here
# pitono_instance = Pitono(...)
# reverse_integration = ReverseIntegration(pitono_instance)

# Example test function
def test_example():
    """Example test using Pitono."""
    # Your test code here
    pass

if __name__ == "__main__":
    # Run with unittest
    import unittest
    unittest.main()
'''
        
        filename = f"{module_name}.py"
        with open(filename, 'w') as f:
            f.write(module_code)
        
        print(f"Generated test module: {filename}")
        return filename

# Pytest fixtures for Pitono
if PYTEST_AVAILABLE:
    @pytest.fixture
    def pitono_test_resource():
        """Fixture providing test resource configuration for Pitono tests."""
        return ITestResourceConfiguration(
            name="pytest-fixture",
            fs=".",
            ports=[],
            browser_ws_endpoint=None,
            timeout=30,
            retries=3,
            environment={"PYTEST": "true"}
        )
    
    @pytest.fixture
    def pitono_adapter():
        """Fixture providing a test adapter for Pitono tests."""
        return SimpleTestAdapter()
    
    @pytest.fixture
    def pitono_instance():
        """Fixture providing a Pitono instance."""
        # This is a placeholder - users should override this fixture
        # with their actual Pitono instance
        return None

# Helper function to run Pitono tests with asyncio
async def run_pitono_test_async(pitono_instance: PitonoClass, 
                               test_resource: Optional[ITestResourceConfiguration] = None):
    """Run a Pitono test asynchronously."""
    if test_resource is None:
        test_resource = ITestResourceConfiguration(
            name="async-test",
            fs=".",
            ports=[],
            browser_ws_endpoint=None,
            timeout=30,
            retries=3,
            environment={"ASYNC": "true"}
        )
    
    # Convert to JSON string
    test_resource_json = json.dumps({
        "name": test_resource.name,
        "fs": test_resource.fs,
        "ports": test_resource.ports,
        "browser_ws_endpoint": test_resource.browser_ws_endpoint,
        "timeout": test_resource.timeout,
        "retries": test_resource.retries,
        "environment": test_resource.environment
    })
    
    # Run the test
    result = await pitono_instance.receiveTestResourceConfig(test_resource_json, "async")
    return result

# Main function for command-line usage
def main():
    """Command-line interface for reverse integration."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Pitono reverse integration")
    parser.add_argument("--runner", choices=["pytest", "unittest", "generate"],
                       default="pytest", help="Test runner to use")
    parser.add_argument("--name", help="Test name")
    parser.add_argument("--module", help="Module name for generation")
    
    args = parser.parse_args()
    
    print(f"Pitono reverse integration with {args.runner}")
    
    if args.runner == "generate":
        integration = ReverseIntegration(None)  # type: ignore
        filename = integration.generate_test_module(args.module or "test_pitono")
        print(f"Generated: {filename}")
    else:
        print("Note: You need to create a Pitono instance first")
        print("See the generated module for an example")

if __name__ == "__main__":
    main()
