use crate::types::{IbddInAny, ITestResourceConfiguration};
use std::collections::HashMap;

/// BaseSetup is the unified base class for all setup phases.
/// It covers BDD's Given, AAA's Arrange, and TDT's Map.
pub struct BaseSetup<I: IbddInAny> {
    pub features: Vec<String>,
    pub actions: Vec<Box<dyn std::any::Any>>,
    pub checks: Vec<Box<dyn std::any::Any>>,
    pub setup_cb: I::Given,
    pub initial_values: Box<dyn std::any::Any>,
    pub key: String,
    pub failed: bool,
    pub artifacts: Vec<String>,
    pub fails: i32,
    pub status: Option<bool>,
    pub store: Option<I::Istore>,
    pub error: Option<String>,
}

impl<I: IbddInAny> BaseSetup<I> {
    pub fn new(
        features: Vec<String>,
        actions: Vec<Box<dyn std::any::Any>>,
        checks: Vec<Box<dyn std::any::Any>>,
        setup_cb: I::Given,
        initial_values: Box<dyn std::any::Any>,
    ) -> Self {
        Self {
            features,
            actions,
            checks,
            setup_cb,
            initial_values,
            key: String::new(),
            failed: false,
            artifacts: Vec::new(),
            fails: 0,
            status: None,
            store: None,
            error: None,
        }
    }
    
    pub fn add_artifact(&mut self, path: String) {
        let normalized_path = path.replace('\\', "/");
        self.artifacts.push(normalized_path);
    }
    
    pub fn to_obj(&self) -> HashMap<String, Box<dyn std::any::Any>> {
        let mut obj = HashMap::new();
        obj.insert("key".to_string(), Box::new(self.key.clone()) as Box<dyn std::any::Any>);
        obj.insert("features".to_string(), Box::new(self.features.clone()) as Box<dyn std::any::Any>);
        obj.insert("failed".to_string(), Box::new(self.failed) as Box<dyn std::any::Any>);
        obj.insert("fails".to_string(), Box::new(self.fails) as Box<dyn std::any::Any>);
        obj.insert("artifacts".to_string(), Box::new(self.artifacts.clone()) as Box<dyn std::any::Any>);
        obj.insert("status".to_string(), Box::new(self.status) as Box<dyn std::any::Any>);
        obj
    }
    
    pub async fn setup(
        &mut self,
        _subject: I::Isubject,
        _key: &str,
        _test_resource_configuration: &ITestResourceConfiguration,
        _tester: fn(I::Then) -> bool,
        _artifactory: Option<fn(&str, &dyn std::any::Any)>,
        _suite_ndx: Option<i32>,
    ) -> Option<I::Istore> {
        // In a real implementation, this would execute the setup
        // For now, just return None
        None
    }
}
