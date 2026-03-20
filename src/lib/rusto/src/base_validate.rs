use crate::base_check::BaseCheck;
use crate::types::IbddInAny;

/// BaseValidate extends BaseCheck to support TDT (Table Driven Testing) pattern.
pub struct BaseValidate<I: IbddInAny> {
    inner: BaseCheck<I>,
    expected_result: Option<Box<dyn std::any::Any>>,
}

impl<I: IbddInAny> BaseValidate<I> {
    pub fn new(name: String, validate_cb: Box<dyn Fn(I::Iselection) -> I::Then>) -> Self {
        Self {
            inner: BaseCheck::new(name, validate_cb),
            expected_result: None,
        }
    }
    
    // Set expected result before validation
    pub fn set_expected_result(&mut self, expected: Box<dyn std::any::Any>) {
        self.expected_result = Some(expected);
    }
    
    // Alias verify_check to validate for TDT pattern
    pub async fn validate(
        &mut self,
        store: I::Istore,
        validate_cb: Box<dyn Fn(I::Iselection) -> I::Then>,
        test_resource: &dyn std::any::Any,
    ) -> Result<I::Iselection, String> {
        self.inner.verify_check(store, &*validate_cb, test_resource).await
    }
    
    // Alias test to check for TDT pattern
    pub async fn check(
        &mut self,
        store: I::Istore,
        test_resource: &dyn std::any::Any,
        filepath: &str,
        expected_result: Box<dyn std::any::Any>,
    ) -> Result<I::Then, String> {
        self.set_expected_result(expected_result);
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
