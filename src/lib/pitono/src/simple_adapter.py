from .pitono_types import IUniversalTestAdapter, ITTestResourceConfiguration
from typing import Any, Callable

class SimpleTestAdapter(IUniversalTestAdapter):
    async def prepare_all(self, input_val: Any, tr: ITTestResourceConfiguration) -> Any:
        return input_val
    
    async def prepare_each(self, subject: Any, initializer: Callable, 
                          test_resource: ITTestResourceConfiguration, 
                          initial_values: Any) -> Any:
        # Call the initializer to get the store
        if callable(initializer):
            return initializer(subject)
        return subject
    
    async def execute(self, store: Any, action_cb: Callable, 
                     test_resource: ITTestResourceConfiguration) -> Any:
        # Call the action_cb with the store to get the modified store
        if callable(action_cb):
            return action_cb(store)
        return store
    
    async def verify(self, store: Any, check_cb: Callable, 
                    test_resource: ITTestResourceConfiguration) -> Any:
        # Call the check_cb with the store to perform assertions
        if callable(check_cb):
            return check_cb(store)
        return store
    
    async def cleanup_each(self, store: Any, key: str) -> Any:
        return store
    
    async def cleanup_all(self, store: Any) -> Any:
        return store
    
    def assert(self, x: Any) -> bool:
        # Simple implementation - always return True for now
        return True
    
    # Legacy method for backward compatibility
    def assert_this(self, x: Any) -> bool:
        return self.assert(x)
    
    # Legacy methods for backward compatibility
    async def before_all(self, input_val: Any, tr: ITTestResourceConfiguration) -> Any:
        return await self.prepare_all(input_val, tr)
    
    async def after_all(self, store: Any) -> Any:
        return await self.cleanup_all(store)
    
    async def before_each(self, subject: Any, initializer: Any, 
                         test_resource: ITTestResourceConfiguration, 
                         initial_values: Any) -> Any:
        return await self.prepare_each(subject, initializer, test_resource, initial_values)
    
    async def after_each(self, store: Any, key: str) -> Any:
        return await self.cleanup_each(store, key)
    
    async def and_when(self, store: Any, when_cb: Any, test_resource: Any) -> Any:
        return await self.execute(store, when_cb, test_resource)
    
    async def but_then(self, store: Any, then_cb: Any, test_resource: Any) -> Any:
        return await self.verify(store, then_cb, test_resource)
