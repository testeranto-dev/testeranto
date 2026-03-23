from typing import Any, Callable, Dict, List, Optional
import json
import asyncio
import os
import sys
from .pitono_types import ITestSpecification, ITestImplementation, ITestAdapter, ITTestResourceRequest, IFinalResults, ITTestResourceConfiguration, ITestArtifactory
from .simple_adapter import SimpleTestAdapter
from .base_suite import BaseSuite
from .base_given import BaseGiven
from .base_when import BaseWhen
from .base_then import BaseThen
from .base_value import BaseValue
from .base_should import BaseShould
from .base_expected import BaseExpected
from .base_describe import BaseDescribe
from .base_it import BaseIt

# Export these for easier imports
__all__ = [
    'Pitono', 'set_default_instance', 'main'
]

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
        test_adapter or SimpleTestAdapter(),
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
    if len(sys.argv) < 2:
        print("[Pitono] No test arguments provided - exiting")
        sys.exit(0)
        
    partialTestResource = sys.argv[1]
    
    print(f"[Pitono] partialTestResource: {partialTestResource}")
    
    if _default_instance is None:
        print("[Pitono] ERROR: No default Pitono instance has been configured")
        sys.exit(-1)
        
    result = await _default_instance.receiveTestResourceConfig(partialTestResource)
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
        print("[Pitono] Initializing PitonoClass")
        self.test_resource_requirement = test_resource_requirement
        self.artifacts: List[Any] = []
        self.test_jobs: List[Any] = []
        self.test_specification = test_specification
        self.suites_overrides: Dict[str, Any] = {}
        self.given_overrides: Dict[str, Any] = {}
        self.when_overrides: Dict[str, Any] = {}
        self.then_overrides: Dict[str, Any] = {}
        self.value_overrides: Dict[str, Any] = {}
        self.should_overrides: Dict[str, Any] = {}
        self.expected_overrides: Dict[str, Any] = {}
        self.describe_overrides: Dict[str, Any] = {}
        self.it_overrides: Dict[str, Any] = {}
        self.specs: Any = None
        self.test_implementation = test_implementation
        self.test_subject = input_val
        self.test_adapter = test_adapter
        self.test_resource_configuration: Optional[ITTestResourceConfiguration] = None
        
        # Initialize classy implementations for all patterns
        self._initialize_classy_implementations(test_implementation)
        
        # Generate specs
        try:
            import inspect
            sig = inspect.signature(test_specification)
            param_count = len(sig.parameters)
            
            if param_count >= 9:
                # Full pattern support
                self.specs = test_specification(
                    self.Suites(),
                    self.Given(),
                    self.When(),
                    self.Then(),
                    self.Value(),
                    self.Should(),
                    self.Expected(),
                    self.Describe(),
                    self.It()
                )
            elif param_count >= 5:
                # BDD + some patterns
                self.specs = test_specification(
                    self.Suites(),
                    self.Given(),
                    self.When(),
                    self.Then(),
                    self.Value() if param_count >= 6 else None,
                    self.Should() if param_count >= 7 else None,
                    self.Expected() if param_count >= 8 else None,
                    self.Describe() if param_count >= 9 else None,
                    self.It() if param_count >= 10 else None
                )
            else:
                # Assume 4 parameters (BDD only)
                self.specs = test_specification(
                    self.Suites(),
                    self.Given(),
                    self.When(),
                    self.Then()
                )
        except Exception as e:
            print(f"[Pitono] Error calling test specification: {e}")
            # Fallback to 4 parameters
            self.specs = test_specification(
                self.Suites(),
                self.Given(),
                self.When(),
                self.Then()
            )
        
        # Initialize test jobs
        self.test_jobs = []
        if self.specs:
            for i, suite in enumerate(self.specs):
                if isinstance(suite, BaseSuite):
                    suite.index = i
                    self.test_jobs.append({
                        'suite': suite,
                        'to_obj': suite.to_obj
                    })
        
    def create_artifactory(self, context: Dict[str, Any] = None) -> Any:
        """Create a context-aware artifactory for file operations."""
        context = context or {}
        
        def get_base_path():
            if self.test_resource_configuration and self.test_resource_configuration.fs:
                return self.test_resource_configuration.fs
            return "testeranto"
        
        base_path = get_base_path()
        
        class Artifactory:
            def __init__(self, ctx):
                self.context = ctx
            
            def write_file_sync(self, filename: str, payload: str) -> str:
                # Construct path based on context
                path_parts = []
                
                if 'suite_index' in self.context:
                    path_parts.append(f"suite-{self.context['suite_index']}")
                
                if 'given_key' in self.context:
                    path_parts.append(f"given-{self.context['given_key']}")
                
                if 'when_index' in self.context:
                    path_parts.append(f"when-{self.context['when_index']}")
                elif 'then_index' in self.context:
                    path_parts.append(f"then-{self.context['then_index']}")
                elif 'it_index' in self.context:
                    path_parts.append(f"it-{self.context['it_index']}")
                
                path_parts.append(filename)
                
                # Ensure extension
                if not filename.lower().endswith(('.txt', '.json', '.png', '.webm')):
                    path_parts[-1] = path_parts[-1] + '.txt'
                
                relative_path = os.path.join(*path_parts)
                full_path = os.path.join(base_path, relative_path)
                
                # Ensure directory exists
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                
                # Write file
                with open(full_path, 'w') as f:
                    f.write(payload)
                
                print(f"[Artifactory] Wrote to: {full_path}")
                return full_path
        
        # Note: Python is a server-side language and CANNOT capture screenshots or screencasts
        # Only the Web runtime (browser environment) can do visual captures
        # This is a necessary difference between web and other runtimes
        # Therefore, we only include write_file_sync method
        
        return Artifactory(context)
    
    def writeFileSync(self, filename: str, payload: str):
        """Abstract method to write files - to be implemented by concrete runtime."""
        # Default implementation
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, 'w') as f:
            f.write(payload)
        print(f"[Pitono] Wrote to: {filename}")
    
    def Suites(self):
        def create_suite(suite_type, name, givens_dict):
            return BaseSuite(name, givens_dict)
        
        class SuiteWrapper:
            def __getattr__(self, name):
                def suite_func(name, givens_dict):
                    return create_suite(name, name, givens_dict)
                return suite_func
            
            def __getitem__(self, name):
                def suite_func(name, givens_dict):
                    return create_suite(name, name, givens_dict)
                return suite_func
        
        return SuiteWrapper()
    
    def Given(self):
        def create_given(given_type, features, whens, thens, initial_values=None):
            if given_type in self.given_overrides:
                return self.given_overrides[given_type](features, whens, thens, initial_values)
            raise ValueError(f"Given type '{given_type}' not found")
        
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
        def create_when(when_type, *args):
            if when_type in self.when_overrides:
                return self.when_overrides[when_type](*args)
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
        def create_then(then_type, *args):
            if then_type in self.then_overrides:
                return self.then_overrides[then_type](*args)
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
    
    def Value(self):
        def create_value(value_type, features, table_rows, confirm_cb, initial_values=None):
            if value_type in self.value_overrides:
                return self.value_overrides[value_type](features, table_rows, confirm_cb, initial_values)
            raise ValueError(f"Value type '{value_type}' not found")
        
        class ValueWrapper:
            def __getattr__(self, name):
                def value_func(features, table_rows, confirm_cb, initial_values=None):
                    return create_value(name, features, table_rows, confirm_cb, initial_values)
                return value_func
            
            def __getitem__(self, name):
                def value_func(features, table_rows, confirm_cb, initial_values=None):
                    return create_value(name, features, table_rows, confirm_cb, initial_values)
                return value_func
        
        return ValueWrapper()
    
    def Should(self):
        def create_should(should_type, *args):
            if should_type in self.should_overrides:
                return self.should_overrides[should_type](*args)
            raise ValueError(f"Should type '{should_type}' not found")
        
        class ShouldWrapper:
            def __getattr__(self, name):
                def should_func(*args):
                    return create_should(name, *args)
                return should_func
            
            def __getitem__(self, name):
                def should_func(*args):
                    return create_should(name, *args)
                return should_func
        
        return ShouldWrapper()
    
    def Expected(self):
        def create_expected(expected_type, *args):
            if expected_type in self.expected_overrides:
                return self.expected_overrides[expected_type](*args)
            raise ValueError(f"Expected type '{expected_type}' not found")
        
        class ExpectedWrapper:
            def __getattr__(self, name):
                def expected_func(*args):
                    return create_expected(name, *args)
                return expected_func
            
            def __getitem__(self, name):
                def expected_func(*args):
                    return create_expected(name, *args)
                return expected_func
        
        return ExpectedWrapper()
    
    def Describe(self):
        def create_describe(describe_type, features, its, describe_cb, initial_values=None):
            if describe_type in self.describe_overrides:
                return self.describe_overrides[describe_type](features, its, describe_cb, initial_values)
            raise ValueError(f"Describe type '{describe_type}' not found")
        
        class DescribeWrapper:
            def __getattr__(self, name):
                def describe_func(features, its, describe_cb, initial_values=None):
                    return create_describe(name, features, its, describe_cb, initial_values)
                return describe_func
            
            def __getitem__(self, name):
                def describe_func(features, its, describe_cb, initial_values=None):
                    return create_describe(name, features, its, describe_cb, initial_values)
                return describe_func
        
        return DescribeWrapper()
    
    def It(self):
        def create_it(it_type, *args):
            if it_type in self.it_overrides:
                return self.it_overrides[it_type](*args)
            raise ValueError(f"It type '{it_type}' not found")
        
        class ItWrapper:
            def __getattr__(self, name):
                def it_func(*args):
                    return create_it(name, *args)
                return it_func
            
            def __getitem__(self, name):
                def it_func(*args):
                    return create_it(name, *args)
                return it_func
        
        return ItWrapper()
    
    def _initialize_classy_implementations(self, test_implementation):
        # Initialize BDD pattern
        if hasattr(test_implementation, 'givens'):
            for key in test_implementation.givens.keys():
                def create_given_closure(given_key):
                    def given_func(features, whens, thens, initial_values=None):
                        return BaseGiven(
                            key=given_key,
                            features=features,
                            whens=whens,
                            thens=thens,
                            given_cb=test_implementation.givens[given_key],
                            initial_values=initial_values
                        )
                    return given_func
                self.given_overrides[key] = create_given_closure(key)
        
        if hasattr(test_implementation, 'whens'):
            for key in test_implementation.whens.keys():
                def create_when_closure(when_key):
                    def when_func(*args):
                        when_cb = test_implementation.whens[when_key](*args)
                        return BaseWhen(when_key, when_cb)
                    return when_func
                self.when_overrides[key] = create_when_closure(key)
        
        if hasattr(test_implementation, 'thens'):
            for key in test_implementation.thens.keys():
                def create_then_closure(then_key):
                    def then_func(*args):
                        then_cb = test_implementation.thens[then_key](*args)
                        return BaseThen(then_key, then_cb)
                    return then_func
                self.then_overrides[key] = create_then_closure(key)
        
        # Initialize TDT pattern if present
        if hasattr(test_implementation, 'values'):
            for key in test_implementation.values.keys():
                def create_value_closure(value_key):
                    def value_func(features, table_rows, confirm_cb, initial_values=None):
                        return BaseValue(
                            features=features,
                            table_rows=table_rows,
                            confirm_cb=confirm_cb,
                            initial_values=initial_values
                        )
                    return value_func
                self.value_overrides[key] = create_value_closure(key)
        
        if hasattr(test_implementation, 'shoulds'):
            for key in test_implementation.shoulds.keys():
                def create_should_closure(should_key):
                    def should_func(*args):
                        should_cb = test_implementation.shoulds[should_key](*args)
                        return BaseShould(should_key, should_cb)
                    return should_func
                self.should_overrides[key] = create_should_closure(key)
        
        if hasattr(test_implementation, 'expecteds'):
            for key in test_implementation.expecteds.keys():
                def create_expected_closure(expected_key):
                    def expected_func(*args):
                        expected_cb = test_implementation.expecteds[expected_key](*args)
                        return BaseExpected(expected_key, expected_cb)
                    return expected_func
                self.expected_overrides[key] = create_expected_closure(key)
        
        # Initialize Describe-It pattern if present
        if hasattr(test_implementation, 'describes'):
            for key in test_implementation.describes.keys():
                def create_describe_closure(describe_key):
                    def describe_func(features, its, describe_cb, initial_values=None):
                        return BaseDescribe(
                            features=features,
                            its=its,
                            describe_cb=describe_cb,
                            initial_values=initial_values
                        )
                    return describe_func
                self.describe_overrides[key] = create_describe_closure(key)
        
        if hasattr(test_implementation, 'its'):
            for key in test_implementation.its.keys():
                def create_it_closure(it_key):
                    def it_func(*args):
                        it_cb = test_implementation.its[it_key](*args)
                        return BaseIt(it_key, it_cb)
                    return it_func
                self.it_overrides[key] = create_it_closure(key)
    
    async def receiveTestResourceConfig(self, partialTestResource: str) -> IFinalResults:
        print(f"[Pitono] receiveTestResourceConfig called with: {partialTestResource}")
        
        # Parse test resource configuration
        try:
            test_resource_config = json.loads(partialTestResource)
        except json.JSONDecodeError:
            # If not JSON, try to parse as a file path
            if os.path.exists(partialTestResource):
                with open(partialTestResource, 'r') as f:
                    test_resource_config = json.load(f)
            else:
                # Default configuration
                test_resource_config = {
                    "name": "default",
                    "fs": "./testeranto_results",
                    "ports": [],
                    "files": []
                }
        
        self.test_resource_configuration = ITTestResourceConfiguration(
            name=test_resource_config.get("name", "default"),
            fs=test_resource_config.get("fs", "./testeranto_results"),
            ports=test_resource_config.get("ports", []),
            browser_ws_endpoint=test_resource_config.get("browserWsEndpoint"),
            timeout=test_resource_config.get("timeout"),
            retries=test_resource_config.get("retries"),
            environment=test_resource_config.get("environment")
        )
        
        # Create base directory
        os.makedirs(self.test_resource_configuration.fs, exist_ok=True)
        
        # Run all test jobs
        total_fails = 0
        all_features = set()
        all_artifacts = []
        
        for job in self.test_jobs:
            suite = job['suite']
            try:
                # Run the suite with artifactory
                suite_done = await suite.run(
                    self.test_subject,
                    self.test_resource_configuration
                )
                
                total_fails += suite_done.fails
                
                # Collect features
                features = suite_done.features()
                for feature in features:
                    all_features.add(feature)
                
                # Collect artifacts
                if hasattr(suite_done, 'artifacts'):
                    all_artifacts.extend(suite_done.artifacts)
                    
            except Exception as e:
                print(f"[Pitono] Error running suite: {e}")
                import traceback
                traceback.print_exc()
                total_fails += 1
        
        # Calculate total tests
        total_tests = 0
        for job in self.test_jobs:
            suite = job['suite']
            if hasattr(suite, 'givens'):
                total_tests += len(suite.givens)
        
        # Get test job object
        test_job_obj = {}
        if self.test_jobs:
            test_job_obj = self.test_jobs[0]['to_obj']()
        
        # Create final results
        results = IFinalResults(
            failed=total_fails > 0,
            fails=total_fails,
            artifacts=all_artifacts,
            features=list(all_features),
            tests=0,
            run_time_tests=total_tests,
            test_job=test_job_obj
        )
        
        # Write results to file
        report_path = os.path.join(self.test_resource_configuration.fs, "tests.json")
        with open(report_path, 'w') as f:
            json.dump({
                'failed': results.failed,
                'fails': results.fails,
                'artifacts': results.artifacts,
                'features': results.features,
                'tests': results.tests,
                'runTimeTests': results.run_time_tests,
                'testJob': results.test_job
            }, f, indent=2)
        
        print(f"[Pitono] Results written to: {report_path}")
        return results
