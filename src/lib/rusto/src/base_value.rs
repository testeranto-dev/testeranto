use crate::base_setup::BaseSetup;
use crate::types::IbddInAny;
use std::collections::HashMap;

/// BaseValue extends BaseSetup for TDT pattern.
/// Sets up table data for table-driven testing.
pub struct BaseValue<I: IbddInAny> {
    inner: BaseSetup<I>,
    table_rows: Vec<Vec<Box<dyn std::any::Any>>>,
}

impl<I: IbddInAny> BaseValue<I> {
    pub fn new(
        features: Vec<String>,
        table_rows: Vec<Vec<Box<dyn std::any::Any>>>,
        confirm_cb: I::Given,
        initial_values: Box<dyn std::any::Any>,
    ) -> Self {
        Self {
            inner: BaseSetup::new(features, Vec::new(), Vec::new(), confirm_cb, initial_values),
            table_rows,
        }
    }
    
    pub fn add_artifact(&mut self, path: String) {
        self.inner.add_artifact(path);
    }
    
    pub fn to_obj(&self) -> HashMap<String, Box<dyn std::any::Any>> {
        let mut obj = self.inner.to_obj();
        obj.insert("table_rows".to_string(), Box::new(self.table_rows.len()) as Box<dyn std::any::Any>);
        obj
    }
    
    // Alias setup to value for TDT pattern
    pub async fn value(
        &mut self,
        subject: I::Isubject,
        key: &str,
        test_resource_configuration: &crate::types::ITestResourceConfiguration,
        tester: fn(I::Then) -> bool,
        artifactory: Option<fn(&str, &dyn std::any::Any)>,
        suite_ndx: Option<i32>,
    ) -> Option<I::Istore> {
        self.inner.setup(subject, key, test_resource_configuration, tester, artifactory, suite_ndx).await
    }
}
