use crate::base_action::BaseAction;
use crate::types::IbddInAny;

/// BaseFeed extends BaseAction to support TDT (Table Driven Testing) pattern.
pub struct BaseFeed<I: IbddInAny> {
    inner: BaseAction<I>,
    row_index: i32,
    row_data: Option<Box<dyn std::any::Any>>,
}

impl<I: IbddInAny> BaseFeed<I> {
    pub fn new(name: String, feed_cb: Box<dyn Fn(I::Iselection) -> I::Then>) -> Self {
        Self {
            inner: BaseAction::new(name, feed_cb),
            row_index: -1,
            row_data: None,
        }
    }
    
    // Set the current row data before processing
    pub fn set_row_data(&mut self, index: i32, data: Box<dyn std::any::Any>) {
        self.row_index = index;
        self.row_data = Some(data);
    }
    
    // Alias perform_action to feed for TDT pattern
    pub async fn feed(
        &mut self,
        store: I::Istore,
        feed_cb: Box<dyn Fn(I::Iselection) -> I::Then>,
        test_resource: &dyn std::any::Any,
    ) -> Result<I::Istore, String> {
        self.inner.perform_action(store, &*feed_cb, test_resource).await
    }
    
    // Alias test to process_row for TDT pattern
    pub async fn process_row(
        &mut self,
        store: I::Istore,
        test_resource: &dyn std::any::Any,
        row_index: i32,
        row_data: Box<dyn std::any::Any>,
    ) -> Result<I::Istore, String> {
        self.set_row_data(row_index, row_data);
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
