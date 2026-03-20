use crate::base_action::BaseAction;
use crate::types::IbddInAny;

/// BaseAct extends BaseAction to support AAA pattern.
pub struct BaseAct<I: IbddInAny> {
    inner: BaseAction<I>,
}

impl<I: IbddInAny> BaseAct<I> {
    pub fn new(name: String, act_cb: Box<dyn Fn(I::Iselection) -> I::Then>) -> Self {
        Self {
            inner: BaseAction::new(name, act_cb),
        }
    }
    
    // Alias perform_action to perform_act for AAA pattern
    pub async fn perform_act(
        &mut self,
        store: I::Istore,
        act_cb: Box<dyn Fn(I::Iselection) -> I::Then>,
        test_resource: &dyn std::any::Any,
    ) -> Result<I::Istore, String> {
        self.inner.perform_action(store, &*act_cb, test_resource).await
    }
    
    // Alias test to act for AAA pattern
    pub async fn act(
        &mut self,
        store: I::Istore,
        test_resource: &dyn std::any::Any,
    ) -> Result<I::Istore, String> {
        self.inner.test(store, test_resource).await
    }
    
    // Delegate methods to inner
    pub fn add_artifact(&mut self, path: String) {
        self.inner.add_artifact(path);
    }
    
    pub fn to_obj(&self) -> std::collections::HashMap<String, Box<dyn std::any::Any>> {
        self.inner.to_obj()
    }
}
