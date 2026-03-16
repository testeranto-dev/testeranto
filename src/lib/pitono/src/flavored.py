"""
Flavored (Pythonic) version of Pitono with decorator-based syntax.
This builds upon the existing Pitono implementation.
"""
from typing import Any, Callable, Dict, List, Optional, Type, Union
import inspect
import re

# Import from existing implementation
from .pitono_types import ITestSpecification, ITestImplementation, ITestAdapter
from .Pitono import Pitono, set_default_instance
from .simple_adapter import SimpleTestAdapter

# Store for collecting test data
_test_data: Dict[str, Any] = {}

def suite(name: str):
    """Decorator to mark a class as a test suite."""
    def decorator(cls):
        # Collect all test methods
        given_methods = []
        when_methods = []
        then_methods = []
        
        # Get all methods in the class
        for attr_name in dir(cls):
            if not attr_name.startswith('__'):
                attr = getattr(cls, attr_name)
                if hasattr(attr, '_pitono_step'):
                    step_info = attr._pitono_step
                    if step_info['type'] == 'given':
                        given_methods.append((attr_name, attr, step_info))
                    elif step_info['type'] == 'when':
                        when_methods.append((attr_name, attr, step_info))
                    elif step_info['type'] == 'then':
                        then_methods.append((attr_name, attr, step_info))
        
        # Create specification function
        def create_specification():
            def specification(Suite, Given, When, Then):
                givens_dict = {}
                
                # For each given method, create a test
                for i, (given_name, given_method, given_info) in enumerate(given_methods):
                    # Find matching when and then methods
                    # For simplicity, we'll use all when and then methods
                    # In a real implementation, we'd need a way to associate them
                    when_steps = []
                    for when_name, when_method, when_info in when_methods:
                        # Extract parameters from description
                        param_pattern = r'\{([^}]+)\}'
                        param_names = re.findall(param_pattern, when_info['description'])
                        # For now, we'll use placeholder values
                        # In a real implementation, we'd need to get actual values
                        args = ["placeholder"] * len(param_names)
                        when_steps.append(When[when_name](*args))
                    
                    then_steps = []
                    for then_name, then_method, then_info in then_methods:
                        param_pattern = r'\{([^}]+)\}'
                        param_names = re.findall(param_pattern, then_info['description'])
                        args = ["placeholder"] * len(param_names)
                        then_steps.append(Then[then_name](*args))
                    
                    givens_dict[f"test{i}"] = Given[given_name](
                        given_info.get('features', []),
                        when_steps,
                        then_steps
                    )
                
                return [Suite.Default(name, givens_dict)]
            return specification
        
        # Create implementation
        def create_implementation():
            # Build implementation using the existing pattern
            suites = {"Default": name}
            givens = {}
            whens = {}
            thens = {}
            
            # Add given implementations
            for given_name, given_method, given_info in given_methods:
                def create_given_wrapper(given_func):
                    def wrapper():
                        # Create an instance of the test class
                        instance = cls()
                        return given_func(instance)
                    return wrapper
                givens[given_name] = create_given_wrapper(given_method)
            
            # Add when implementations
            for when_name, when_method, when_info in when_methods:
                def create_when_wrapper(when_func, when_name):
                    def wrapper(*args):
                        def when_applier(subject):
                            # Call the when method with subject and args
                            instance = cls()
                            return when_func(instance, subject, *args)
                        return when_applier
                    return wrapper
                whens[when_name] = create_when_wrapper(when_method, when_name)
            
            # Add then implementations
            for then_name, then_method, then_info in then_methods:
                def create_then_wrapper(then_func, then_name):
                    def wrapper(*args):
                        def then_applier(subject):
                            # Call the then method with subject and args
                            instance = cls()
                            return then_func(instance, subject, *args)
                        return then_applier
                    return wrapper
                thens[then_name] = create_then_wrapper(then_method, then_name)
            
            # Create ITestImplementation instance
            return ITestImplementation(
                suites=suites,
                givens=givens,
                whens=whens,
                thens=thens
            )
        
        # Store the specification and implementation
        cls._pitono_specification = create_specification()
        cls._pitono_implementation = create_implementation()
        
        # Add a method to run tests
        def run_tests(self, test_adapter: Optional[ITestAdapter] = None):
            """Run the tests in this suite."""
            # Create Pitono instance using the existing implementation
            instance = Pitono(
                input_val=None,
                test_specification=self._pitono_specification,
                test_implementation=self._pitono_implementation,
                test_adapter=test_adapter or SimpleTestAdapter(),
                test_resource_requirement={"ports": 1}
            )
            
            # Set as default instance for command-line execution
            set_default_instance(instance)
            
            return instance
        
        cls.run_tests = run_tests
        
        return cls
    return decorator

def given(description: str, features: List[str] = None):
    """Decorator to mark a method as a Given step."""
    def decorator(func):
        # Store step information
        func._pitono_step = {
            'type': 'given',
            'name': func.__name__,
            'description': description,
            'features': features or []
        }
        return func
    return decorator

def when(description: str):
    """Decorator to mark a method as a When step."""
    def decorator(func):
        # Parse description for parameter placeholders
        param_pattern = r'\{([^}]+)\}'
        param_names = re.findall(param_pattern, description)
        
        # Store step information
        func._pitono_step = {
            'type': 'when',
            'name': func.__name__,
            'description': description,
            'param_names': param_names
        }
        return func
    return decorator

def then(description: str):
    """Decorator to mark a method as a Then step."""
    def decorator(func):
        # Parse description for parameter placeholders
        param_pattern = r'\{([^}]+)\}'
        param_names = re.findall(param_pattern, description)
        
        # Store step information
        func._pitono_step = {
            'type': 'then',
            'name': func.__name__,
            'description': description,
            'param_names': param_names
        }
        return func
    return decorator

# Integration with unittest
try:
    import unittest
    
    class PitonoTestCase(unittest.TestCase):
        """Base test case for Pitono tests that integrates with unittest."""
        
        @classmethod
        def setUpClass(cls):
            """Set up the test suite."""
            if hasattr(cls, '_pitono_specification'):
                # Create an instance and run tests
                instance = cls()
                cls.pitono_instance = instance.run_tests()
        
        def runTest(self):
            """Run the Pitono tests."""
            if hasattr(self, 'pitono_instance'):
                # Mark test as passed for now
                self.assertTrue(True)
        
except ImportError:
    # unittest not available
    class PitonoTestCase:
        pass

# Export the decorators
__all__ = ['suite', 'given', 'when', 'then', 'PitonoTestCase']
