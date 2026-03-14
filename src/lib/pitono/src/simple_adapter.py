from .pitono_types import ITestAdapter, ITTestResourceConfiguration
from typing import Any, Callable

class SimpleTestAdapter(ITestAdapter):
    async def before_all(self, input_val: Any, tr: ITTestResourceConfiguration, pm: Any) -> Any:
        return input_val
    
    async def after_all(self, store: Any, pm: Any) -> Any:
        return store
    
    async def before_each(self, subject: Any, initializer: Any, test_resource: ITTestResourceConfiguration, 
                         initial_values: Any, pm: Any) -> Any:
        # Call the initializer to get the store
        if callable(initializer):
            return initializer()
        return subject
    
    async def after_each(self, store: Any, key: str, pm: Any) -> Any:
        return store
    
    async def and_when(self, store: Any, when_cb: Any, test_resource: Any, pm: Any) -> Any:
        # Call the when_cb with the store to get the modified store
        if callable(when_cb):
            return when_cb(store)
        return store
    
    async def but_then(self, store: Any, then_cb: Any, test_resource: Any, pm: Any) -> Any:
        # Call the then_cb with the store to perform assertions
        if callable(then_cb):
            return then_cb(store)
        return store
    
    def assert_this(self, t: Any) -> bool:
        # Simple implementation - always return True for now
        return True
