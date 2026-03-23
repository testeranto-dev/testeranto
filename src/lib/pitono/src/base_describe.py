from .base_setup import BaseSetup
from typing import List, Any, Callable, Optional
from .pitono_types import ITestResourceConfiguration, ITestArtifactory

class BaseDescribe(BaseSetup):
    def __init__(
        self,
        features: List[str],
        its: List[Any],
        describe_cb: Callable,
        initial_values: Any
    ):
        # Map its to actions (they can mix mutations and assertions)
        super().__init__(
            features,
            its,  # Its are treated as actions
            [],   # No separate checks for Describe-It pattern
            describe_cb,
            initial_values
        )
        self.its = its
    
    async def setup_that(
        self,
        subject: Any,
        test_resource_configuration: ITestResourceConfiguration,
        artifactory: ITestArtifactory,
        setup_cb: Callable,
        initial_values: Any
    ) -> Any:
        # Default implementation for Describe setup
        if callable(setup_cb):
            return setup_cb(subject, initial_values)
        return subject
    
    # Alias setup to describe for Describe-It pattern
    async def describe(
        self,
        subject: Any,
        key: str,
        test_resource_configuration: ITestResourceConfiguration,
        tester: Callable[[Any], bool],
        artifactory: Optional[ITestArtifactory] = None,
        suite_ndx: Optional[int] = None
    ) -> Any:
        return await super().setup(
            subject,
            key,
            test_resource_configuration,
            tester,
            artifactory,
            suite_ndx
        )
