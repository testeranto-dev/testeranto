from typing import List, Dict, Any, Callable, Optional
from .base_setup import BaseSetup
from .base_when import BaseWhen
from .base_then import BaseThen
from .pitono_types import ITestResourceConfiguration, ITestArtifactory

class BaseGiven(BaseSetup):
    def __init__(
        self,
        key: str,
        features: List[str],
        whens: List[BaseWhen],
        thens: List[BaseThen],
        given_cb: Callable,
        initial_values: Any
    ):
        # Map whens to actions and thens to checks
        super().__init__(
            features,
            whens,
            thens,
            given_cb,
            initial_values
        )
        self.key = key
    
    async def given_that(
        self,
        subject: Any,
        test_resource_configuration: ITestResourceConfiguration,
        artifactory: ITestArtifactory,
        given_cb: Callable,
        initial_values: Any
    ) -> Any:
        # Default implementation that can be overridden
        # This should call setup_that from BaseSetup
        return await self.setup_that(
            subject,
            test_resource_configuration,
            artifactory,
            given_cb,
            initial_values
        )
    
    async def setup_that(
        self,
        subject: Any,
        test_resource_configuration: ITestResourceConfiguration,
        artifactory: ITestArtifactory,
        setup_cb: Callable,
        initial_values: Any
    ) -> Any:
        # Default implementation
        if callable(setup_cb):
            return setup_cb(subject, initial_values)
        return subject
    
    # Alias setup to give for BDD pattern
    async def give(
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
