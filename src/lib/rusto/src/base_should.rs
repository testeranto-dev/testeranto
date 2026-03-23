use crate::base_action::BaseAction;
use crate::types::IbddInAny;
use std::collections::HashMap;

/// BaseShould extends BaseAction for TDT pattern.
/// Processes each row in table-driven testing.
pub struct BaseShould<I: IbddInAny> {
    inner: BaseAction<I>,
    current_row: Vec<Box<dyn std::any::Any>>,
    row_index: i32,
}

impl<I: IbddInAny> BaseShould<I> {
    pub fn new(name: String, should_cb: Box<dyn Fn(I::Iselection) -> I::Then>) -> Self {
        Self {
            inner: BaseAction::new(name, should_cb),
            current_row: Vec::new(),
            row_index: -1,
        }
    }
    
    pub fn add_artifact(&mut self, path: String) {
        self.inner.add_artifact(path);
    }
    
    pub fn to_obj(&self) -> HashMap<String, Box<dyn std::any::Any>> {
        self.inner.to_obj()
    }
    
    // Set current row data
    pub fn set_row_data(&mut self, row_index: i32, row_data: Vec<Box<dyn std::any::Any>>) {
        self.row_index = row_index;
        self.current_row = row_data;
    }
    
    // Process the current row
    pub async fn process_row(
        &mut self,
        store: I::Istore,
        test_resource: &dyn std::any::Any,
    ) -> Result<I::Istore, String> {
        self.inner.test(store, test_resource).await
    }
    
    // Alias test to should for TDT pattern
    pub async fn should(
        &mut self,
        store: I::Istore,
        test_resource: &dyn std::any::Any,
    ) -> Result<I::Istore, String> {
        self.process_row(store, test_resource).await
    }
}
