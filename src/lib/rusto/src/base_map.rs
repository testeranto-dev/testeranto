use crate::base_setup::BaseSetup;
use crate::types::IbddInAny;

/// BaseMap extends BaseSetup to support TDT (Table Driven Testing) pattern.
pub struct BaseMap<I: IbddInAny> {
    inner: BaseSetup<I>,
    table_data: Vec<Box<dyn std::any::Any>>,
}

impl<I: IbddInAny> BaseMap<I> {
    pub fn new(
        features: Vec<String>,
        feeds: Vec<Box<dyn std::any::Any>>,
        validates: Vec<Box<dyn std::any::Any>>,
        map_cb: I::Given,
        initial_values: Box<dyn std::any::Any>,
        table_data: Vec<Box<dyn std::any::Any>>,
    ) -> Self {
        Self {
            inner: BaseSetup::new(features, feeds, validates, map_cb, initial_values),
            table_data,
        }
    }
    
    // Alias setup to map for TDT pattern
    pub async fn map(
        &mut self,
        subject: I::Isubject,
        key: &str,
        test_resource_configuration: &crate::types::ITTestResourceConfiguration,
        tester: fn(I::Then) -> bool,
        artifactory: Option<fn(&str, &dyn std::any::Any)>,
        suite_ndx: Option<i32>,
    ) -> Option<I::Istore> {
        self.inner.setup(subject, key, test_resource_configuration, tester, artifactory, suite_ndx).await
    }
    
    // Method to get table data
    pub fn get_table_data(&self) -> &Vec<Box<dyn std::any::Any>> {
        &self.table_data
    }
    
    // Delegate methods to inner
    pub fn add_artifact(&mut self, path: String) {
        self.inner.add_artifact(path);
    }
    
    pub fn to_obj(&self) -> std::collections::HashMap<String, Box<dyn std::any::Any>> {
        self.inner.to_obj()
    }
}
