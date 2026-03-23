
from typing import TypeVar, Generic, Callable, Any, Dict, List, Optional, Protocol, Union
from dataclasses import dataclass

# Type variables for BDD input/output types
Iinput = TypeVar('Iinput')
Isubject = TypeVar('Isubject')
Istore = TypeVar('Istore')
Iselection = TypeVar('Iselection')
Then = TypeVar('Then')
Given = TypeVar('Given')

# Test resource configuration
@dataclass
class ITTestResourceConfiguration:
    name: str
    fs: str
    ports: List[int]
    browser_ws_endpoint: Optional[str] = None
    timeout: Optional[int] = None
    retries: Optional[int] = None
    environment: Optional[Dict[str, str]] = None

# Universal test adapter with methodology-agnostic terminology
class IUniversalTestAdapter(Protocol):
    # Lifecycle hooks
    async def prepare_all(self, input_val: Any, tr: ITTestResourceConfiguration, artifactory: Any = None) -> Any:
        ...
    
    async def prepare_each(self, subject: Any, initializer: Callable, 
                          test_resource: ITTestResourceConfiguration, 
                          initial_values: Any,
                          artifactory: Any = None) -> Any:
        ...
    
    # Execution
    async def execute(self, store: Any, action_cb: Callable, 
                     test_resource: ITTestResourceConfiguration,
                     artifactory: Any = None) -> Any:
        ...
    
    # Verification
    async def verify(self, store: Any, check_cb: Callable, 
                    test_resource: ITTestResourceConfiguration,
                    artifactory: Any = None) -> Any:
        ...
    
    # Cleanup
    async def cleanup_each(self, store: Any, key: str, artifactory: Any = None) -> Any:
        ...
    
    async def cleanup_all(self, store: Any, artifactory: Any = None) -> Any:
        ...
    
    # Assertion - standardized name across all languages
    def assert(self, x: Any) -> bool:
        ...

# ITestAdapter is now just an alias for IUniversalTestAdapter (no legacy methods)
ITestAdapter = IUniversalTestAdapter

# Test specification function type - matches TypeScript ITestSpecification
# It can take either 4 or 5 arguments to be flexible
ITestSpecification = Callable[..., Any]

# Test implementation structure - matches TypeScript ITestImplementation structure
class ITestImplementation:
    suites: Dict[str, Any]
    givens: Dict[str, Callable[..., Any]]
    whens: Dict[str, Callable[..., Callable[[Any], Any]]]
    thens: Dict[str, Callable[..., Callable[[Any], Any]]]
    
    def __init__(self, 
                 suites: Dict[str, Any], 
                 givens: Dict[str, Callable[..., Any]], 
                 whens: Dict[str, Callable[..., Callable[[Any], Any]]], 
                 thens: Dict[str, Callable[..., Callable[[Any], Any]]]):
        self.suites = suites
        self.givens = givens
        self.whens = whens
        self.thens = thens

# Test resource request
@dataclass
class ITTestResourceRequest:
    ports: int

# Final results
@dataclass
class IFinalResults:
    failed: bool
    fails: int
    artifacts: List[Any]
    features: List[str]
    tests: int = 0
    run_time_tests: int = 0
    test_job: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.test_job is None:
            self.test_job = {}

# BDD input type interface - simplified version of Ibdd_in
class Ibdd_in(Protocol):
    pass

# BDD output type interface - simplified version of Ibdd_out
class Ibdd_out(Protocol):
    pass

# Type for artifactory function
ITestArtifactory = Callable[[str, Any], None]
