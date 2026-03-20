from .base_check import BaseCheck
from typing import Any, Callable
from .pitono_types import ITestResourceConfiguration

class BaseValidate(BaseCheck):
    def __init__(
        self,
        name: str,
        validate_cb: Callable[[Any], Any]
    ):
        super().__init__(name, validate_cb)
        self.expected_result = None
    
    # Set expected result before validation
    def set_expected_result(self, expected: Any):
        self.expected_result = expected
    
    # Alias verify_check to validate for TDT pattern
    async def validate(
        self,
        store: Any,
        validate_cb: Callable[[Any], Any],
        test_resource_configuration: ITestResourceConfiguration
    ):
        return await super().verify_check(store, validate_cb, test_resource_configuration)
    
    # Alias test to check for TDT pattern
    async def check(
        self,
        store: Any,
        test_resource_configuration,
        filepath: str,
        expected_result: Any
    ):
        self.set_expected_result(expected_result)
        return await super().test(store, test_resource_configuration, filepath)
