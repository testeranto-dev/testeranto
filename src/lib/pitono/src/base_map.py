from .base_setup import BaseSetup
from typing import List, Any, Callable

class BaseMap(BaseSetup):
    def __init__(
        self,
        features: List[str],
        feeds: List[Any],
        validates: List[Any],
        map_cb: Callable,
        initial_values: Any,
        table_data: List[Any] = None
    ):
        # Map feeds to actions, validates to checks
        super().__init__(
            features,
            feeds,
            validates,
            map_cb,
            initial_values
        )
        self.table_data = table_data or []
    
    # Alias setup to map for TDT pattern
    async def map(
        self,
        subject: Any,
        key: str,
        test_resource_configuration,
        tester: Callable[[Any], bool],
        artifactory=None,
        suite_ndx=None
    ):
        return await super().setup(
            subject,
            key,
            test_resource_configuration,
            tester,
            artifactory,
            suite_ndx
        )
    
    # Method to get table data
    def get_table_data(self) -> List[Any]:
        return self.table_data
