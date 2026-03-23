use crate::types::{IbddInAny, ITestResourceConfiguration, IArtifactory};
use std::collections::HashMap;

pub struct BaseGiven<I: IbddInAny> {
    pub key: String,
    pub features: Vec<String>,
    pub whens: Vec<Box<dyn std::any::Any>>,
    pub thens: Vec<Box<dyn std::any::Any>>,
    pub given_cb: <I as IbddInAny>::Given,
    pub initial_values: Box<dyn std::any::Any>,
    pub artifacts: Vec<String>,
    pub error: Option<String>,
    pub failed: bool,
    pub store: Option<<I as IbddInAny>::Istore>,
    pub fails: i32,
    pub status: Option<bool>,
    pub parent: Option<Box<dyn std::any::Any>>, // Reference to parent Rusto instance
}

impl<I: IbddInAny> BaseGiven<I> {
    pub fn new(
        features: Vec<String>,
        whens: Vec<Box<dyn std::any::Any>>,
        thens: Vec<Box<dyn std::any::Any>>,
        given_cb: <I as IbddInAny>::Given,
        initial_values: Box<dyn std::any::Any>,
    ) -> Self {
        Self {
            key: String::new(),
            features,
            whens,
            thens,
            given_cb,
            initial_values,
            artifacts: Vec::new(),
            error: None,
            failed: false,
            store: None,
            fails: 0,
            status: None,
            parent: None,
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
        obj.insert("artifacts".to_string(), Box::new(self.artifacts.clone()) as Box<dyn std::any::Any>);
        obj.insert("failed".to_string(), Box::new(self.failed) as Box<dyn std::any::Any>);
        obj.insert("fails".to_string(), Box::new(self.fails) as Box<dyn std::any::Any>);
        obj.insert("status".to_string(), Box::new(self.status) as Box<dyn std::any::Any>);
        obj
    }
    
    pub async fn give(
        &mut self,
        _subject: I::Isubject,
        key: &str,
        _test_resource_configuration: &ITestResourceConfiguration,
        _tester: fn(I::Then) -> bool,
        _artifactory: Option<&IArtifactory>,
        _suite_ndx: Option<i32>,
    ) -> Option<I::Istore> {
        self.key = key.to_string();
        self.failed = false;
        self.fails = 0;
        
        // In a real implementation, this would:
        // 1. Call given_cb to set up initial state
        // 2. Process whens (actions)
        // 3. Process thens (checks)
        // 4. Use artifactory for file operations
        
        // For now, just return None as a placeholder
        None
    }
    
    // Abstract method to be implemented by concrete Given classes
    pub async fn given_that(
        &self,
        _subject: I::Isubject,
        _test_resource_configuration: &ITestResourceConfiguration,
        _artifactory: Option<&IArtifactory>,
        _given_cb: I::Given,
        _initial_values: &dyn std::any::Any,
    ) -> Result<I::Istore, String> {
        // Default implementation: return an error indicating this needs to be implemented
        // In a real implementation, this would use the given_cb to set up initial state
        // and potentially use artifactory for file operations
        Err("BaseGiven::given_that() needs to be implemented for concrete types".to_string())
    }
    
    // Set parent reference
    pub fn set_parent(&mut self, parent: Box<dyn std::any::Any>) {
        self.parent = Some(parent);
    }
    
    // Create a default artifactory for the given - matches TypeScript implementation
    pub fn create_default_artifactory(&self, given_key: &str, suite_ndx: Option<i32>) -> IArtifactory {
        let given_key_owned = given_key.to_string();
        let mut context = HashMap::new();
        context.insert("given_key", given_key_owned.clone());
        if let Some(suite_index) = suite_ndx {
            context.insert("suite_index", suite_index.to_string());
        }
        
        // Try to get artifactory from parent if available
        if let Some(_parent) = &self.parent {
            // In a real implementation, we would call parent.create_artifactory()
            // For now, create a simple one
            let mut artifactory = IArtifactory::new();
            let given_key_clone = given_key_owned.clone();
            artifactory.insert("writeFileSync".to_string(), Box::new(move |filename: String, payload: String| {
                println!("[Artifactory] Would write to given-{}/{}: {}", given_key_clone, filename, &payload[..std::cmp::min(payload.len(), 100)]);
            }) as Box<dyn std::any::Any + Send + Sync>);
            artifactory
        } else {
            // Create a simple artifactory
            let mut artifactory = IArtifactory::new();
            let given_key_clone = given_key_owned;
            artifactory.insert("write_file_sync".to_string(), Box::new(move |filename: String, payload: String| {
                println!("[Artifactory] Would write to given-{}/{}: {}", given_key_clone, filename, &payload[..std::cmp::min(payload.len(), 100)]);
            }) as Box<dyn std::any::Any + Send + Sync>);
            artifactory
        }
    }
}
