use crate::base_action::BaseAction;
use crate::types::IbddInAny;
use std::collections::HashMap;

/// BaseIt extends BaseAction for Describe-It pattern.
/// Its can mix mutations and assertions, unlike BDD's When which only does mutations.
pub struct BaseIt<I: IbddInAny> {
    inner: BaseAction<I>,
}

impl<I: IbddInAny> BaseIt<I> {
    pub fn new(name: String, it_cb: Box<dyn Fn(I::Iselection) -> I::Then>) -> Self {
        Self {
            inner: BaseAction::new(name, it_cb),
        }
    }
    
    pub fn add_artifact(&mut self, path: String) {
        self.inner.add_artifact(path);
    }
    
    pub fn to_obj(&self) -> HashMap<String, Box<dyn std::any::Any>> {
        self.inner.to_obj()
    }
    
    // Alias test to it for Describe-It pattern
    pub async fn it(
        &mut self,
        store: I::Istore,
        test_resource: &dyn std::any::Any,
    ) -> Result<I::Istore, String> {
        self.inner.test(store, test_resource).await
    }
    
    // Perform it with artifactory
    pub async fn perform_it(
        &mut self,
        store: I::Istore,
        test_resource: &dyn std::any::Any,
        _artifactory: Option<&dyn std::any::Any>,
    ) -> Result<I::Istore, String> {
        // In a real implementation, artifactory would be used
        self.inner.test(store, test_resource).await
    }
}
