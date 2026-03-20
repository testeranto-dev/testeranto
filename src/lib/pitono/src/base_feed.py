from .base_action import BaseAction
from typing import Any, Callable

class BaseFeed(BaseAction):
    def __init__(self, name: str, feed_cb: Callable[[Any], Any]):
        super().__init__(name, feed_cb)
        self.row_index = -1
        self.row_data = None
    
    # Set the current row data before processing
    def set_row_data(self, index: int, data: Any):
        self.row_index = index
        self.row_data = data
    
    # Alias perform_action to feed for TDT pattern
    async def feed(
        self,
        store: Any,
        feed_cb: Callable[[Any], Any],
        test_resource
    ):
        return await super().perform_action(store, feed_cb, test_resource)
    
    # Alias test to process_row for TDT pattern
    async def process_row(
        self,
        store: Any,
        test_resource_configuration,
        row_index: int,
        row_data: Any
    ):
        self.set_row_data(row_index, row_data)
        return await super().test(store, test_resource_configuration)
