from typing import Dict, List, Any, Callable, Optional
from .pitono_types import ITestResourceConfiguration

class BaseSuite:
    def __init__(self, name: str, givens: Dict[str, Any]):
        self.name = name
        self.givens = givens
        self.store: Any = None
        self.test_resource_configuration: Optional[ITestResourceConfiguration] = None
        self.index: int = 0
        self.failed = False
        self.fails = 0
        self.artifacts: List[str] = []
    
    def add_artifact(self, path: str) -> None:
        normalized_path = path.replace('\\', '/')
        self.artifacts.append(normalized_path)
    
    def features(self) -> List[str]:
        features = []
        seen = set()
        for given in self.givens.values():
            if hasattr(given, 'features'):
                for feature in given.features:
                    if feature not in seen:
                        features.append(feature)
                        seen.add(feature)
        return features
    
    def to_obj(self) -> Dict[str, Any]:
        givens = []
        for given in self.givens.values():
            if hasattr(given, 'to_obj'):
                givens.append(given.to_obj())
        return {
            'name': self.name,
            'givens': givens,
            'fails': self.fails,
            'failed': self.failed,
            'features': self.features(),
            'artifacts': self.artifacts
        }
    
    async def setup(
        self,
        s: Any,
        tr: ITestResourceConfiguration,
    ) -> Any:
        return s
    
    def assert_that(self, t: Any) -> bool:
        # This should call the adapter's assert method
        return bool(t)
    
    def after_all(self, store: Any) -> Any:
        return store
    
    async def run(
        self,
        input_val: Any,
        test_resource_configuration: ITestResourceConfiguration,
    ) -> 'BaseSuite':
        self.test_resource_configuration = test_resource_configuration
        
        # Create artifactory for suite setup
        suite_artifactory = None
        if hasattr(self, '_parent') and self._parent:
            # Try to get artifactory from parent
            suite_artifactory = self._parent.create_artifactory({'suite_index': self.index})
        
        subject = await self.setup(
            input_val,
            test_resource_configuration,
        )
        
        # Reset fails counter
        self.fails = 0
        self.failed = False
        
        for g_key, g in self.givens.items():
            try:
                # Create artifactory for the given
                given_artifactory = None
                if hasattr(self, '_parent') and self._parent:
                    given_artifactory = self._parent.create_artifactory({
                        'suite_index': self.index,
                        'given_key': g_key
                    })
                
                # Set parent reference if not already set
                if hasattr(g, '_parent') and not g._parent:
                    g._parent = self._parent
                
                self.store = await g.give(
                    subject,
                    g_key,
                    test_resource_configuration,
                    self.assert_that,
                    given_artifactory,  # Pass the created artifactory
                    self.index  # suite_ndx
                )
                # Add the given's fails count to the suite total
                if hasattr(g, 'fails'):
                    self.fails += g.fails
            except Exception as e:
                self.failed = True
                self.fails += 1
                # Also add any failures from the given itself
                if hasattr(g, 'fails'):
                    self.fails += g.fails
                # Log the error but continue with other givens
                print(f"Error in given {g_key}:", str(e))
        
        # Mark the suite as failed if there are any failures
        if self.fails > 0:
            self.failed = True
        
        try:
            self.after_all(self.store)
        except Exception as e:
            print(f"Error in after_all: {e}")
        
        return self
