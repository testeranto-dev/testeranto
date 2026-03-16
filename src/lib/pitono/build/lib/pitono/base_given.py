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
        self.status: Optional[bool] = None
        self.fails: int = 0
    
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
        initial_values: Any
    ) -> Istore:
        # Default implementation - can be overridden by subclasses
        return {"initial": "store"}
    
    async def after_each(
        self,
        store: Istore,
        key: str,
        artifactory: Callable[[str, Any], None]
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
        artifactory: Optional[Callable[[str, Any], None]] = None,
        suite_ndx: int = 0
    ) -> Istore:
        self.key = key
        self.fails = 0  # Initialize fail count for this given

        # Handle missing artifactory like TypeScript seems to do
        if artifactory is None:
            def default_artifactory(f_path: str, value: Any):
                pass
            actual_artifactory = default_artifactory
        else:
            actual_artifactory = artifactory
        
        def given_artifactory(f_path: str, value: Any):
            actual_artifactory(f"given-{key}/{f_path}", value)

        try:
            # Call given_that to set up the initial state
            self.store = await self.given_that(
                subject,
                test_resource_configuration,
                given_artifactory,
                self.given_cb,
                self.initial_values
            )
            self.status = True
        except Exception as e:
            self.status = False
            self.failed = True
            self.fails += 1
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
                    )
                except Exception as e:
                    self.failed = True
                    self.fails += 1
                    self.error = e
                    # Continue to process thens even if whens fail
            
            # Process thens
            for then_ndx, then_step in enumerate(self.thens):
                try:
                    filepath = f"given-{key}/then-{then_ndx}"
                    if suite_ndx is not None:
                        filepath = f"suite-{suite_ndx}/{filepath}"
                    result = await then_step.test(
                        self.store,
                        test_resource_configuration,
                        filepath
                    )
                    # Test the result
                    if not tester(result):
                        self.failed = True
                        self.fails += 1
                except Exception as e:
                    self.failed = True
                    self.fails += 1
                    self.error = e
                    # Continue processing other thens
        except Exception as e:
            self.error = e
            self.failed = True
            self.fails += 1
        finally:
            try:
                await self.after_each(self.store, self.key, given_artifactory)
            except Exception as e:
                self.failed = True
                self.fails += 1
                # Don't re-raise

        return self.store
