from typing import Any, Dict, List, Callable, Optional
from .base_action import BaseAction

class BaseWhen(BaseAction):
    def __init__(self, name: str, when_cb: Callable[[Any], Any]):
        super().__init__(name, when_cb)
    
    async def and_when(
        self,
        store: Any,
        when_cb: Callable[[Any], Any],
        test_resource_configuration: Any,
        artifactory: Any = None
    ) -> Any:
        # This should be implemented by subclasses
        # But provide a default implementation that calls perform_action
        return await self.perform_action(store, when_cb, test_resource_configuration, artifactory)
    
    async def perform_action(
        self,
        store: Any,
        action_cb: Callable[[Any], Any],
        test_resource,
        artifactory: Any = None
    ) -> Any:
        # Default implementation that can be overridden
        if callable(action_cb):
            return action_cb(store)
        return store
