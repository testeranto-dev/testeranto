from typing import List, Dict, Any, Callable, Optional
from .pitono_types import ITestResourceConfiguration, ITestArtifactory

class BaseSetup:
    def __init__(
        self,
        features: List[str],
        actions: List[Any],
        checks: List[Any],
        setup_cb: Callable,
        initial_values: Any
    ):
        self.features = features
        self.actions = actions
        self.checks = checks
        self.setup_cb = setup_cb
        self.initial_values = initial_values
        self.fails = 0
        self.failed = False
        self.error: Optional[Exception] = None
        self.store: Any = None
        self.key = ""
        self.status: Optional[bool] = None
        self.artifacts: List[str] = []
    
    def add_artifact(self, path: str) -> None:
        if not isinstance(path, str):
            raise TypeError(
                f"[ARTIFACT ERROR] Expected string, got {type(path)}: {path}"
            )
        normalized_path = path.replace('\\', '/')
        self.artifacts.append(normalized_path)
    
    def to_obj(self) -> Dict[str, Any]:
        action_objs = []
        for action in self.actions:
            if action is not None and hasattr(action, 'to_obj'):
                action_objs.append(action.to_obj())
        
        check_objs = []
        for check in self.checks:
            if check is not None and hasattr(check, 'to_obj'):
                check_objs.append(check.to_obj())
        
        error_info = None
        if self.error:
            error_info = f"{type(self.error).__name__}: {str(self.error)}"
        
        return {
            'key': self.key,
            'actions': action_objs,
            'checks': check_objs,
            'error': error_info,
            'failed': self.failed,
            'features': self.features,
            'artifacts': self.artifacts,
            'status': self.status
        }
    
    async def setup_that(
        self,
        subject: Any,
        test_resource_configuration: ITestResourceConfiguration,
        artifactory: ITestArtifactory,
        setup_cb: Callable,
        initial_values: Any
    ) -> Any:
        raise NotImplementedError("setup_that must be implemented by subclasses")
    
    async def after_each(
        self,
        store: Any,
        key: str,
        artifactory: ITestArtifactory
    ) -> Any:
        return store
    
    async def setup(
        self,
        subject: Any,
        key: str,
        test_resource_configuration: ITestResourceConfiguration,
        tester: Callable[[Any], bool],
        artifactory: Optional[ITestArtifactory] = None,
        suite_ndx: Optional[int] = None
    ) -> Any:
        self.key = key
        self.fails = 0
        
        actual_artifactory = artifactory or (lambda f_path, value: None)
        def setup_artifactory(f_path: str, value: Any):
            return actual_artifactory(f"setup-{key}/{f_path}", value)
        
        try:
            self.store = await self.setup_that(
                subject,
                test_resource_configuration,
                setup_artifactory,
                self.setup_cb,
                self.initial_values
            )
            self.status = True
        except Exception as e:
            self.status = False
            self.failed = True
            self.fails += 1
            self.error = e
            return self.store
        
        try:
            # Process actions
            for action_ndx, action_step in enumerate(self.actions):
                try:
                    self.store = await action_step.test(
                        self.store,
                        test_resource_configuration,
                    )
                except Exception as e:
                    self.failed = True
                    self.fails += 1
                    self.error = e
            
            # Process checks
            for check_ndx, check_step in enumerate(self.checks):
                try:
                    if suite_ndx is not None:
                        filepath = f"suite-{suite_ndx}/setup-{key}/check-{check_ndx}"
                    else:
                        filepath = f"setup-{key}/check-{check_ndx}"
                    
                    result = await check_step.test(
                        self.store,
                        test_resource_configuration,
                        filepath
                    )
                    if not tester(result):
                        self.failed = True
                        self.fails += 1
                except Exception as e:
                    self.failed = True
                    self.fails += 1
                    self.error = e
        except Exception as e:
            self.error = e
            self.failed = True
            self.fails += 1
        finally:
            try:
                await self.after_each(self.store, self.key, setup_artifactory)
            except Exception as e:
                self.failed = True
                self.fails += 1
                self.error = e
        
        return self.store
