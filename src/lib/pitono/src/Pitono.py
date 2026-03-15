from typing import Any, Callable, Dict, List, Optional
import json
import asyncio
from .pitono_types import ITestSpecification, ITestImplementation, ITestAdapter, ITTestResourceRequest, IFinalResults
from .simple_adapter import SimpleTestAdapter
from .base_suite import BaseSuite
from .base_given import BaseGiven
from .base_when import BaseWhen
from .base_then import BaseThen
from .PM.python import PM_Python

# Export these for easier imports
__all__ = [
    'Pitono', 'set_default_instance', 'main'
]

import sys

def Pitono(
    input_val: Any = None,
    test_specification: ITestSpecification = None,
    test_implementation: ITestImplementation = None,
    test_adapter: ITestAdapter = None,
    test_resource_requirement: ITTestResourceRequest = None,
    uber_catcher: Callable[[Callable], None] = None,
    **kwargs
):
    # Create a Pitono instance and return it
    instance = PitonoClass(
        input_val,
        test_specification,
        test_implementation,
        test_resource_requirement or {},
        test_adapter,
        uber_catcher or (lambda x: None)
    )
    return instance

# Store the default instance
_default_instance = None

def set_default_instance(instance):
    global _default_instance
    _default_instance = instance

async def main():
    print("[Pitono] main called with argv:", sys.argv)
    
    # Check if we have enough arguments
    # We need at least 2 arguments: script name and partialTestResource
    if len(sys.argv) < 2:
        print("[Pitono] No test arguments provided - exiting")
        sys.exit(0)
        
    partialTestResource = sys.argv[1]
    # The websocket port is typically the third argument, but we can use a default
    websocket_port = sys.argv[2] if len(sys.argv) > 2 else 'ipcfile'
    
    print(f"[Pitono] partialTestResource: {partialTestResource}")
    print(f"[Pitono] websocket_port: {websocket_port}")
    
    if _default_instance is None:
        print("[Pitono] ERROR: No default Pitono instance has been configured")
        sys.exit(-1)
        
    result = await _default_instance.receiveTestResourceConfig(partialTestResource, websocket_port)
    print(f"[Pitono] Test completed with {result.fails} failures")
    print(f"[Pitono] Result features: {result.features}")
    print(f"[Pitono] Result artifacts: {result.artifacts}")
    print(f"[Pitono] Result failed?: {result.failed}")
    sys.exit(result.fails)

class PitonoClass:
    def __init__(
        self,
        input_val: Any,
        test_specification: ITestSpecification,
        test_implementation: ITestImplementation,
        test_resource_requirement: ITTestResourceRequest,
        test_adapter: ITestAdapter,
        uber_catcher: Callable[[Callable], None]
    ):
        print("hello PitonoClass")
        self.test_resource_requirement = test_resource_requirement
        self.artifacts: List[Any] = []
        self.test_jobs: List[Any] = []
        self.test_specification = test_specification
        self.suites_overrides: Dict[str, Any] = {}
        self.given_overrides: Dict[str, Any] = {}
        self.when_overrides: Dict[str, Any] = {}
        self.then_overrides: Dict[str, Any] = {}
        self.puppet_master: Any = None
        self.specs: Any = None
        self.test_implementation = test_implementation
        self.test_subject = input_val
        self.test_adapter = test_adapter
        
        # Initialize classy implementations
        self._initialize_classy_implementations(test_implementation)
        
        # Generate specs - the specification function may expect 5 arguments
        # Let's try to call it with the expected number of parameters
        try:
            import inspect
            sig = inspect.signature(test_specification)
            if len(sig.parameters) == 5:
                # Add a Check parameter
                self.specs = test_specification(
                    self.Suites(),
                    self.Given(),
                    self.When(),
                    self.Then(),
                    lambda x: x  # Simple Check function
                )
            else:
                # Assume 4 parameters
                self.specs = test_specification(
                    self.Suites(),
                    self.Given(),
                    self.When(),
                    self.Then()
                )
        except:
            # Fallback to 4 parameters
            self.specs = test_specification(
                self.Suites(),
                self.Given(),
                self.When(),
                self.Then()
            )
        
        # Initialize test jobs
        self.test_jobs = []
        # Create test jobs from the specs
        for i, suite_spec in enumerate(self.specs):
            # Create a BaseSuite instance
            suite = BaseSuite(
                suite_spec['name'],
                suite_spec['givens']
            )
            suite.index = i
            
            # Create a runner function
            async def runner(pm, t_log):
                return await suite.run(
                    self.test_subject,
                    {},  # test_resource_config will be provided later
                    lambda f_path, value: None,  # Simple artifactory
                    t_log,
                    pm
                )
            
            self.test_jobs.append({
                'receiveTestResourceConfig': lambda pm: self._run_test_job(runner, suite, pm),
                'to_obj': suite.to_obj
            })
        
    def Suites(self):
        # Return a wrapper that can handle Suite.Default(...) calls
        def create_suite(suite_type, description, givens_dict):
            # Store the suite information
            return {
                'name': description,
                'givens': givens_dict
            }
        
        class SuiteWrapper:
            def __getattr__(self, name):
                def suite_func(description, givens_dict):
                    return create_suite(name, description, givens_dict)
                return suite_func
            
            def __getitem__(self, name):
                def suite_func(description, givens_dict):
                    return create_suite(name, description, givens_dict)
                return suite_func
        
        return SuiteWrapper()
    
    def Given(self):
        # Return a function that creates the appropriate Given instance
        def create_given(given_type, features, whens, thens, initial_values=None):
            if given_type in self.given_overrides:
                return self.given_overrides[given_type](features, whens, thens, initial_values)
            else:
                raise ValueError(f"Given type '{given_type}' not found")
        
        # Create a wrapper that provides access to all given types
        # Support both attribute access and indexing
        class GivenWrapper:
            def __getattr__(self, name):
                def given_func(features, whens, thens, initial_values=None):
                    return create_given(name, features, whens, thens, initial_values)
                return given_func
            
            def __getitem__(self, name):
                def given_func(features, whens, thens, initial_values=None):
                    return create_given(name, features, whens, thens, initial_values)
                return given_func
        
        return GivenWrapper()
    
    def When(self):
        # Similar approach for When
        def create_when(when_type, *args):
            if when_type in self.when_overrides:
                return self.when_overrides[when_type](*args)
            else:
                raise ValueError(f"When type '{when_type}' not found")
        
        class WhenWrapper:
            def __getattr__(self, name):
                def when_func(*args):
                    return create_when(name, *args)
                return when_func
            
            def __getitem__(self, name):
                def when_func(*args):
                    return create_when(name, *args)
                return when_func
        
        return WhenWrapper()
    
    def Then(self):
        # Similar approach for Then
        def create_then(then_type, *args):
            if then_type in self.then_overrides:
                return self.then_overrides[then_type](*args)
            else:
                raise ValueError(f"Then type '{then_type}' not found")
        
        class ThenWrapper:
            def __getattr__(self, name):
                def then_func(*args):
                    return create_then(name, *args)
                return then_func
            
            def __getitem__(self, name):
                def then_func(*args):
                    return create_then(name, *args)
                return then_func
        
        return ThenWrapper()
    
    def _initialize_classy_implementations(self, test_implementation):
        # Create classy implementations similar to TypeScript
        test_adapter = self.test_adapter
        
        classyGivens = {}
        for key in test_implementation.givens.keys():
            def create_given_closure(given_key):
                def given_func(features, whens, thens, initial_values=None):
                    # Create a subclass that uses the adapter's before_each
                    class AdapterGiven(BaseGiven):
                        async def given_that(self, subject, test_resource_configuration, 
                                           artifactory, given_cb, initial_values):
                            # Use the test adapter's before_each method
                            return await test_adapter.before_each(
                                subject,
                                given_cb,
                                test_resource_configuration,
                                initial_values
                            )
                    
                    return AdapterGiven(
                        given_key,
                        features,
                        whens,
                        thens,
                        test_implementation.givens[given_key],
                        initial_values
                    )
                return given_func
            classyGivens[key] = create_given_closure(key)
        
        classyWhens = {}
        for key in test_implementation.whens.keys():
            def create_when_closure(when_key):
                def when_func(*args):
                    # Create a BaseWhen instance
                    when_cb = test_implementation.whens[when_key](*args)
                    # Create a subclass that implements and_when using the adapter
                    class AdapterWhen(BaseWhen):
                        async def and_when(self, store, when_cb, test_resource_configuration):
                            # Use the test adapter's and_when method
                            return await test_adapter.and_when(
                                store, 
                                when_cb, 
                                test_resource_configuration,
                                None  # pm parameter
                            )
                    
                    # Use the key as name, similar to TypeScript
                    return AdapterWhen(when_key, when_cb)
                return when_func
            classyWhens[key] = create_when_closure(key)
        
        classyThens = {}
        for key in test_implementation.thens.keys():
            def create_then_closure(then_key):
                def then_func(*args):
                    # Create a BaseThen instance
                    then_cb = test_implementation.thens[then_key](*args)
                    # Create a subclass that implements but_then using the adapter
                    class AdapterThen(BaseThen):
                        async def but_then(self, store, then_cb, test_resource_configuration):
                            # Use the test adapter's but_then method
                            return await test_adapter.but_then(
                                store,
                                then_cb,
                                test_resource_configuration,
                                None  # pm parameter
                            )
                    
                    # Use the key as name, similar to TypeScript
                    return AdapterThen(then_key, then_cb)
                return then_func
            classyThens[key] = create_then_closure(key)
        
        self.given_overrides = classyGivens
        self.when_overrides = classyWhens
        self.then_overrides = classyThens

    async def _run_test_job(self, runner, suite, puppet_master):
        try:
            # Create a simple t_log function
            def t_log(*args):
                print(" ".join(map(str, args)))
            
            # Run the suite
            suite_done = await runner(puppet_master, t_log)
            fails = suite_done.fails
            
            # Get features and artifacts
            features = []
            if hasattr(suite_done, 'features') and callable(suite_done.features):
                features = suite_done.features()
            elif hasattr(suite_done, 'features'):
                features = suite_done.features
            
            artifacts = []
            if hasattr(suite_done, 'artifacts'):
                artifacts = suite_done.artifacts
            
            # Create a simple result object
            class Result:
                def __init__(self, fails, artifacts, features):
                    self.fails = fails
                    self.artifacts = artifacts
                    self.features = features
            
            return Result(
                fails,
                artifacts,
                features
            )
        except Exception as e:
            print(f"Error in test job: {e}")
            import traceback
            traceback.print_exc()
            
            class Result:
                def __init__(self, fails, artifacts, features):
                    self.fails = fails
                    self.artifacts = artifacts
                    self.features = features
            
            return Result(1, [], [])
    
    async def receiveTestResourceConfig(self, partialTestResource: str, websocket_port: str) -> Any:
        print(f"[Pitono] receiveTestResourceConfig called with partialTestResource: {partialTestResource}")
        # Parse the test resource configuration
        import os
        import json
        import re
        import re
        
        test_resource_config = None
        
        # First, try to parse as JSON string
        try:
            test_resource_config = json.loads(partialTestResource)
            print(f"[Pitono] Parsed JSON config: {test_resource_config}")
        except json.JSONDecodeError:
            print('idk')
            
        
        print(f"[Pitono] Using test_resource_config: {test_resource_config}")
        
        pm = PM_Python(test_resource_config, websocket_port)

        # Run all test jobs
        total_fails = 0
        all_features = set()
        all_artifacts = []
        
        # Collect all suite results
        suite_results = []
        
        # First, we need to create test jobs from the specs
        # The specs should contain the test suites to run
        if not hasattr(self, 'test_jobs') or not self.test_jobs:
            # Create test jobs from the specs
            self.test_jobs = []
            for i, suite_spec in enumerate(self.specs):
                # Create a BaseSuite instance
                suite = BaseSuite(
                    suite_spec['name'],
                    suite_spec['givens']
                )
                suite.index = i
                
                # Create a runner function
                async def runner(pm, t_log):
                    return await suite.run(
                        self.test_subject,
                        test_resource_config,
                        lambda f_path, value: None,  # Simple artifactory
                        t_log,
                        pm
                    )
                
                self.test_jobs.append({
                    'receiveTestResourceConfig': lambda pm: self._run_test_job(runner, suite, pm),
                    'to_obj': suite.to_obj
                })
        
        for job in self.test_jobs:
            try:
                result = await job['receiveTestResourceConfig'](pm)
                total_fails += result.fails
                # Add features to the set
                if hasattr(result, 'features'):
                    for feature in result.features:
                        all_features.add(feature)
                if hasattr(result, 'artifacts'):
                    all_artifacts.extend(result.artifacts)
                # Get the suite object
                suite_obj = job['to_obj']()
                suite_results.append(suite_obj)
            except Exception as e:
                print(f"Error running test job: {e}")
                import traceback
                traceback.print_exc()
                total_fails += 1
        
        # Write the final tests.json - matching TypeScript BaseTiposkripto.ts
        try:
            # Calculate total tests (number of givens across all specs)
            total_tests = 0
            for suite_spec in self.specs:
                if 'givens' in suite_spec:
                    total_tests += len(suite_spec['givens'])
            
            # Get the first test job's to_obj result
            test_job_obj = {}
            if self.test_jobs and len(self.test_jobs) > 0:
                job = self.test_jobs[0]
                if 'to_obj' in job and callable(job['to_obj']):
                    test_job_obj = job['to_obj']()
            
            # Create results matching IFinalResults structure
            results = {
                'features': list(all_features),
                'failed': total_fails > 0,
                'fails': total_fails,
                'artifacts': all_artifacts,
                'tests': 0,  # Could be calculated as number of givens
                'runTimeTests': total_tests,
                'testJob': test_job_obj
            }
            
            # Get the fs path from test resource configuration
            fs_path = test_resource_config.get('fs', '.')
            # Get the fs path from test resource configuration
            fs_path = test_resource_config.get('fs', '.')
            # Ensure fs_path is treated as a directory (even if it ends with .py)
            # If fs_path ends with .py, it's already been converted to a directory path
            # So we don't need to modify it further
            if not fs_path:
                fs_path = '.'
            report_json_path = os.path.join(fs_path, 'tests.json')
            
            # Create directory if it doesn't exist
            # fs_path should be a directory, so create it directly
            os.makedirs(fs_path, exist_ok=True)
            
            # Write to file
            with open(report_json_path, 'w') as f:
                json.dump(results, f, indent=2)
            print(f"tests.json written to: {report_json_path}")
                
        except Exception as e:
            print(f"Error writing tests.json: {e}")
            import traceback
            traceback.print_exc()
        
        # Return result as IFinalResults
        from .pitono_types import IFinalResults
        
        # Calculate total tests (number of givens across all specs)
        total_tests = 0
        for suite_spec in self.specs:
            if 'givens' in suite_spec:
                total_tests += len(suite_spec['givens'])
        
        # Get the first test job's to_obj result
        test_job_obj = {}
        if self.test_jobs and len(self.test_jobs) > 0:
            job = self.test_jobs[0]
            if 'to_obj' in job and callable(job['to_obj']):
                test_job_obj = job['to_obj']()
        
        return IFinalResults(
            failed=total_fails > 0,
            fails=total_fails,
            artifacts=all_artifacts,
            features=list(all_features),
            tests=0,
            run_time_tests=total_tests,
            test_job=test_job_obj
        )
