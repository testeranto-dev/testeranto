from .base_check import BaseCheck
from typing import Any, Callable
from .pitono_types import ITestResourceConfiguration

class BaseExpected(BaseCheck):
    def __init__(
        self,
        name: str,
        expected_cb: Callable[[Any], Any]
    ):
        super().__init__(name, expected_cb)
        self.expected_result = None
    
    # Set expected result before validation
    def set_expected_result(self, expected: Any):
        self.expected_result = expected
    
    async def verify_check(
        self,
        store: Any,
        check_cb: Callable[[Any], Any],
        test_resource_configuration: ITestResourceConfiguration,
        artifactory: Any = None
    ) -> Any:
        # Default implementation
        if callable(check_cb):
            return check_cb(store)
        return store
    
    # Alias test to check for TDT pattern
    async def check(
        self,
        store: Any,
        test_resource_configuration,
        filepath: str,
        expected_result: Any,
        artifactory: Any = None
    ):
        self.set_expected_result(expected_result)
        return await super().test(store, test_resource_configuration, filepath, artifactory)
