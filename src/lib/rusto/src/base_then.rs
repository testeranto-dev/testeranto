use crate::types::{IbddInAny, IArtifactory};
use std::collections::HashMap;

pub struct BaseThen<I: IbddInAny> {
    pub name: String,
    pub then_cb: Box<dyn Fn(<I as IbddInAny>::Iselection) -> <I as IbddInAny>::Then>,
    pub error: bool,
    pub artifacts: Vec<String>,
    pub status: Option<bool>,
}

impl<I: IbddInAny> BaseThen<I> {
    pub fn new(name: String, then_cb: Box<dyn Fn(<I as IbddInAny>::Iselection) -> <I as IbddInAny>::Then>) -> Self {
        Self {
            name,
            then_cb,
            error: false,
            artifacts: Vec::new(),
            status: None,
        }
    }
    
    pub fn add_artifact(&mut self, path: String) {
        let normalized_path = path.replace('\\', "/");
        self.artifacts.push(normalized_path);
    }
    
    pub fn to_obj(&self) -> HashMap<String, Box<dyn std::any::Any>> {
        let mut obj = HashMap::new();
        obj.insert("name".to_string(), Box::new(self.name.clone()) as Box<dyn std::any::Any>);
        obj.insert("error".to_string(), Box::new(self.error) as Box<dyn std::any::Any>);
        obj.insert("artifacts".to_string(), Box::new(self.artifacts.clone()) as Box<dyn std::any::Any>);
        obj.insert("status".to_string(), Box::new(self.status) as Box<dyn std::any::Any>);
        obj
    }
    
    pub async fn test(&mut self, _store: I::Istore, _test_resource: &dyn std::any::Any, _filepath: &str, _artifactory: Option<&IArtifactory>) -> Result<I::Then, String> {
        // Execute the then callback
        // This is a placeholder implementation
        // In practice, we would use the then_cb to verify the store
        Err("Not implemented".to_string())
    }
    
    pub async fn but_then(
        &mut self,
        _store: I::Istore,
        _then_cb: &dyn Fn(I::Iselection) -> I::Then,
        _test_resource: &dyn std::any::Any,
        _artifactory: Option<&IArtifactory>,
    ) -> Result<I::Iselection, String> {
        // Default implementation
        Err("Not implemented".to_string())
    }
}
