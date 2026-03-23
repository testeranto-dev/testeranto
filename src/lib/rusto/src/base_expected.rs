use crate::base_check::BaseCheck;
use crate::types::IbddInAny;
use std::collections::HashMap;

/// BaseExpected extends BaseCheck for TDT pattern.
/// Validates each row in table-driven testing.
pub struct BaseExpected<I: IbddInAny> {
    inner: BaseCheck<I>,
    expected_value: Option<Box<dyn std::any::Any>>,
}

impl<I: IbddInAny> BaseExpected<I> {
    pub fn new(name: String, expected_cb: Box<dyn Fn(I::Iselection) -> I::Then>) -> Self {
        Self {
            inner: BaseCheck::new(name, expected_cb),
            expected_value: None,
        }
    }
    
    pub fn add_artifact(&mut self, path: String) {
        self.inner.add_artifact(path);
    }
    
    pub fn to_obj(&self) -> HashMap<String, Box<dyn std::any::Any>> {
        self.inner.to_obj()
    }
    
    // Set expected value for current row
    pub fn set_expected_value(&mut self, expected: Box<dyn std::any::Any>) {
        self.expected_value = Some(expected);
    }
    
    // Validate current row
    pub async fn validate_row(
        &mut self,
        store: I::Istore,
        test_resource: &dyn std::any::Any,
        filepath: &str,
        expected_value: Box<dyn std::any::Any>,
    ) -> Result<I::Then, String> {
        self.set_expected_value(expected_value);
        self.inner.test(store, test_resource, filepath).await
    }
    
    // Alias test to expect for TDT pattern
    pub async fn expect(
        &mut self,
        store: I::Istore,
        test_resource: &dyn std::any::Any,
        filepath: &str,
        expected_value: Box<dyn std::any::Any>,
    ) -> Result<I::Then, String> {
        self.validate_row(store, test_resource, filepath, expected_value).await
    }
}
