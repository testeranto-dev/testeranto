use crate::base_check::BaseCheck;
use crate::types::IbddInAny;

/// BaseAssert extends BaseCheck to support AAA pattern.
pub struct BaseAssert<I: IbddInAny> {
    inner: BaseCheck<I>,
}

impl<I: IbddInAny> BaseAssert<I> {
    pub fn new(name: String, assert_cb: Box<dyn Fn(I::Iselection) -> I::Then>) -> Self {
        Self {
            inner: BaseCheck::new(name, assert_cb),
        }
    }
    
    // Alias verify_check to verify_assert for AAA pattern
    pub async fn verify_assert(
        &mut self,
        store: I::Istore,
        assert_cb: Box<dyn Fn(I::Iselection) -> I::Then>,
        test_resource: &dyn std::any::Any,
    ) -> Result<I::Iselection, String> {
        self.inner.verify_check(store, &*assert_cb, test_resource).await
    }
    
    // Alias test to verify for AAA pattern
    pub async fn verify(
        &mut self,
        store: I::Istore,
        test_resource: &dyn std::any::Any,
        filepath: &str,
    ) -> Result<I::Then, String> {
        self.inner.test(store, test_resource, filepath).await
    }
    
    // Delegate methods to inner
    pub fn add_artifact(&mut self, path: String) {
        self.inner.add_artifact(path);
    }
    
    pub fn to_obj(&self) -> std::collections::HashMap<String, Box<dyn std::any::Any>> {
        self.inner.to_obj()
    }
}
