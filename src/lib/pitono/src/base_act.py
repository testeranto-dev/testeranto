from .base_action import BaseAction
from typing import Any, Callable

class BaseAct(BaseAction):
    def __init__(self, name: str, act_cb: Callable[[Any], Any]):
        super().__init__(name, act_cb)
    
    # Alias perform_action to perform_act for AAA pattern
    async def perform_act(
        self,
        store: Any,
        act_cb: Callable[[Any], Any],
        test_resource
    ):
        return await super().perform_action(store, act_cb, test_resource)
    
    # Alias test to act for AAA pattern
    async def act(
        self,
        store: Any,
        test_resource_configuration
    ):
        return await super().test(store, test_resource_configuration)
