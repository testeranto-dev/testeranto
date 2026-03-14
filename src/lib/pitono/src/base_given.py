from typing import List, Dict, Any, Callable, Optional
from .pitono_types import Isubject, Istore, Iselection, Then, Given

class BaseGiven:
    def __init__(
        self,
        key: str,
        features: List[str],
        whens: List[Any],
        thens: List[Any],
        given_cb: Given,
        initial_values: Any
    ):
        self.key = key
        # Ensure features are always strings
        self.features = []
        if features:
            for feature in features:
                if isinstance(feature, str):
                    self.features.append(feature)
                else:
                    # Try to convert to string
                    self.features.append(str(feature))
        self.whens = whens or []
        self.thens = thens or []
        self.given_cb = given_cb
        self.initial_values = initial_values
        self.artifacts: List[str] = []
        self.error: Optional[Exception] = None
        self.failed = False
        self.store: Optional[Istore] = None
    
    def add_artifact(self, path: str) -> None:
        # Normalize path separators
        normalized_path = path.replace('\\', '/')
        self.artifacts.append(normalized_path)
    
    def to_obj(self) -> Dict[str, Any]:
        # Convert whens and thens to their object representations
        when_objs = []
        for w in self.whens:
            if hasattr(w, 'to_obj'):
                when_objs.append(w.to_obj())
            else:
                # Create a minimal when object
                when_objs.append({
                    'name': getattr(w, 'key', 'unknown'),
                    'status': None,
                    'error': None,
                    'artifacts': []
                })
        
        then_objs = []
        for t in self.thens:
            if hasattr(t, 'to_obj'):
                then_objs.append(t.to_obj())
            else:
                # Create a minimal then object
                then_objs.append({
                    'name': getattr(t, 'key', 'unknown'),
                    'error': False,
                    'artifacts': [],
                    'status': None
                })
        
        return {
            'key': self.key,
            'whens': when_objs,
            'thens': then_objs,
            'error': str(self.error) if self.error else None,
            'failed': self.failed,
            'features': self.features,
            'artifacts': self.artifacts,
            'status': not self.failed
        }
    
    async def given_that(
        self,
        subject: Isubject,
        test_resource_configuration,
        artifactory: Callable[[str, Any], None],
        given_cb: Given,
        initial_values: Any,
        pm: Any
    ) -> Istore:
        # Default implementation - can be overridden by subclasses
        return {"initial": "store"}
    
    async def after_each(
        self,
        store: Istore,
        key: str,
        artifactory: Callable[[str, Any], None],
        pm: Any
    ) -> Istore:
        return store
    
    def uber_catcher(self, e: Exception) -> None:
        self.error = e

    async def give(
        self,
        subject: Isubject,
        key: str,
        test_resource_configuration,
        tester: Callable[[Any], bool],
        artifactory: Callable[[str, Any], None],
        suite_ndx: int
    ) -> Istore:
        self.failed = False
        self.key = key

        def given_artifactory(f_path: str, value: Any):
            artifactory(f"given-{key}/{f_path}", value)

        try:
            # Call given_that to set up the initial state
            self.store = await self.given_that(
                subject,
                test_resource_configuration,
                given_artifactory,
                self.given_cb,
                self.initial_values,
                None  # pm parameter removed to match TypeScript
            )
        except Exception as e:
            self.failed = True
            self.error = e
            # Don't re-raise to allow processing of other givens
            return self.store

        try:
            # Process whens
            for when_ndx, when_step in enumerate(self.whens):
                try:
                    self.store = await when_step.test(
                        self.store,
                        test_resource_configuration,
                        # Removed t_log, pm, and filepath to match TypeScript
                    )
                except Exception as e:
                    self.failed = True
                    self.error = e
                    # Continue to process thens even if whens fail
            
            # Process thens
            for then_ndx, then_step in enumerate(self.thens):
                try:
                    result = await then_step.test(
                        self.store,
                        test_resource_configuration,
                        # Removed t_log, pm, and filepath to match TypeScript
                    )
                    # Test the result
                    if not tester(result):
                        self.failed = True
                except Exception as e:
                    self.failed = True
                    self.error = e
                    # Continue processing other thens
        except Exception as e:
            self.error = e
            self.failed = True
        finally:
            try:
                await self.after_each(self.store, self.key, given_artifactory, None)
            except Exception as e:
                self.failed = True
                # Don't re-raise

        return self.store
