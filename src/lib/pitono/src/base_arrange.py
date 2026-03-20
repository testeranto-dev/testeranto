from .base_setup import BaseSetup
from typing import List, Any, Callable

class BaseArrange(BaseSetup):
    def __init__(
        self,
        features: List[str],
        acts: List[Any],
        asserts: List[Any],
        arrange_cb: Callable,
        initial_values: Any
    ):
        # Map acts to actions, asserts to checks
        super().__init__(
            features,
            acts,
            asserts,
            arrange_cb,
            initial_values
        )
    
    # Alias setup to arrange for AAA pattern
    async def arrange(
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
