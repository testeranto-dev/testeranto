from typing import Any, Dict, List, Callable, Optional

class BaseAction:
    def __init__(self, name: str, action_cb: Callable[[Any], Any]):
        self.name = name
        self.action_cb = action_cb
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
    
    async def perform_action(
        self,
        store: Any,
        action_cb: Callable[[Any], Any],
        test_resource
    ) -> Any:
        raise NotImplementedError("perform_action must be implemented by subclasses")
    
    def to_obj(self) -> Dict[str, Any]:
        error_str = None
        if self.error:
            error_str = f"{type(self.error).__name__}: {str(self.error)}"
        return {
            'name': self.name,
            'status': self.status,
            'error': error_str,
            'artifacts': self.artifacts
        }
    
    async def test(
        self,
        store: Any,
        test_resource_configuration: Any,
    ) -> Any:
        try:
            result = await self.perform_action(
                store,
                self.action_cb,
                test_resource_configuration
            )
            self.status = True
            return result
        except Exception as e:
            self.status = False
            self.error = e
            raise e
