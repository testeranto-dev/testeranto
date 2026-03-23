from typing import Any, Dict, List, Callable, Optional
from .pitono_types import ITestResourceConfiguration

class BaseCheck:
    def __init__(
        self,
        name: str,
        check_cb: Callable[[Any], Any]
    ):
        self.name = name
        self.check_cb = check_cb
        self.error: Optional[Exception] = None
        self.artifacts: List[str] = []
        self.status: Optional[bool] = None
    
    def add_artifact(self, path: str) -> None:
        if not isinstance(path, str):
            raise TypeError(
                f"[ARTIFACT ERROR] Expected string, got {type(path)}: {path}"
            )
        normalized_path = path.replace('\\', '/')
        self.artifacts.append(normalized_path)
    
    def to_obj(self) -> Dict[str, Any]:
        error_str = None
        if self.error:
            error_str = f"{type(self.error).__name__}: {str(self.error)}"
        return {
            'name': self.name,
            'error': error_str,
            'artifacts': self.artifacts,
            'status': self.status
        }
    
    async def verify_check(
        self,
        store: Any,
        check_cb: Callable[[Any], Any],
        test_resource_configuration: ITestResourceConfiguration,
        artifactory: Any = None
    ) -> Any:
        raise NotImplementedError("verify_check must be implemented by subclasses")
    
    async def test(
        self,
        store: Any,
        test_resource_configuration: Any,
        filepath: str,
        artifactory: Any = None
    ) -> Any:
        try:
            result = await self.verify_check(
                store,
                self.check_cb,
                test_resource_configuration,
                artifactory
            )
            self.status = True
            return result
        except Exception as e:
            self.status = False
            self.error = e
            raise e
