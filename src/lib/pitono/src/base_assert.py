from .base_check import BaseCheck
from typing import Any, Callable
from .pitono_types import ITestResourceConfiguration

class BaseAssert(BaseCheck):
    def __init__(
        self,
        name: str,
        assert_cb: Callable[[Any], Any]
    ):
        super().__init__(name, assert_cb)
    
    # Alias verify_check to verify_assert for AAA pattern
    async def verify_assert(
        self,
        store: Any,
        assert_cb: Callable[[Any], Any],
        test_resource_configuration: ITestResourceConfiguration
    ):
        return await super().verify_check(store, assert_cb, test_resource_configuration)
    
    # Alias test to verify for AAA pattern
    async def verify(
        self,
        store: Any,
        test_resource_configuration,
        filepath: str
    ):
        return await super().test(store, test_resource_configuration, filepath)
