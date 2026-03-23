from .base_action import BaseAction
from typing import Any, Callable

class BaseIt(BaseAction):
    def __init__(self, name: str, it_cb: Callable[[Any], Any]):
        super().__init__(name, it_cb)
    
    async def perform_action(
        self,
        store: Any,
        action_cb: Callable[[Any], Any],
        test_resource,
        artifactory: Any = None
    ) -> Any:
        # Default implementation
        if callable(action_cb):
            return action_cb(store)
        return store
    
    # Alias test to it for Describe-It pattern
    async def it(
        self,
        store: Any,
        test_resource_configuration,
        artifactory: Any = None
    ):
        return await super().test(store, test_resource_configuration, artifactory)
