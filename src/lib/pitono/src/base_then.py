from typing import Any, Dict, List, Callable, Optional
from .base_check import BaseCheck
from .pitono_types import ITestResourceConfiguration

class BaseThen(BaseCheck):
    def __init__(self, name: str, then_cb: Callable[[Any], Any]):
        super().__init__(name, then_cb)
        self.error = False
    
    async def but_then(
        self,
        store: Any,
        then_cb: Callable[[Any], Any],
        test_resource_configuration: Any
    ) -> Any:
        # This should be implemented by subclasses
        # But provide a default implementation that calls verify_check
        return await self.verify_check(store, then_cb, test_resource_configuration)
    
    async def verify_check(
        self,
        store: Any,
        check_cb: Callable[[Any], Any],
        test_resource_configuration: ITestResourceConfiguration
    ) -> Any:
        # Default implementation that can be overridden
        if callable(check_cb):
            return check_cb(store)
        return store
