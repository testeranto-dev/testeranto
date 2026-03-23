from .pitono_types import IUniversalTestAdapter, ITTestResourceConfiguration
from typing import Any, Callable, Optional

class SimpleTestAdapter(IUniversalTestAdapter):
    async def prepare_all(self, input_val: Any, tr: ITTestResourceConfiguration, artifactory: Optional[Any] = None) -> Any:
        return input_val
    
    async def prepare_each(self, subject: Any, initializer: Callable, 
                          test_resource: ITTestResourceConfiguration, 
                          initial_values: Any,
                          artifactory: Optional[Any] = None) -> Any:
        # Call the initializer to get the store
        if callable(initializer):
            return initializer(subject)
        return subject
    
    async def execute(self, store: Any, action_cb: Callable, 
                     test_resource: ITTestResourceConfiguration,
                     artifactory: Optional[Any] = None) -> Any:
        # Call the action_cb with the store to get the modified store
        if callable(action_cb):
            return action_cb(store)
        return store
    
    async def verify(self, store: Any, check_cb: Callable, 
                    test_resource: ITTestResourceConfiguration,
                    artifactory: Optional[Any] = None) -> Any:
        # Call the check_cb with the store to perform assertions
        if callable(check_cb):
            return check_cb(store)
        return store
    
    async def cleanup_each(self, store: Any, key: str, artifactory: Optional[Any] = None) -> Any:
        return store
    
    async def cleanup_all(self, store: Any, artifactory: Optional[Any] = None) -> Any:
        return store
    
    def assert(self, x: Any) -> bool:
        # Simple implementation
        return bool(x)
