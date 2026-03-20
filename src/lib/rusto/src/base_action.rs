use crate::types::IbddInAny;
use std::collections::HashMap;

/// BaseAction is the unified base class for all action phases.
/// It covers BDD's When, AAA's Act, and TDT's Feed.
pub struct BaseAction<I: IbddInAny> {
    pub name: String,
    pub action_cb: Box<dyn Fn(I::Iselection) -> I::Then>,
    pub error: Option<String>,
    pub artifacts: Vec<String>,
    pub status: Option<bool>,
}

impl<I: IbddInAny> BaseAction<I> {
    pub fn new(name: String, action_cb: Box<dyn Fn(I::Iselection) -> I::Then>) -> Self {
        Self {
            name,
            action_cb,
            error: None,
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
        obj.insert("status".to_string(), Box::new(self.status) as Box<dyn std::any::Any>);
        obj.insert("error".to_string(), Box::new(self.error.clone()) as Box<dyn std::any::Any>);
        obj.insert("artifacts".to_string(), Box::new(self.artifacts.clone()) as Box<dyn std::any::Any>);
        obj
    }
    
    pub async fn perform_action(
        &self,
        store: I::Istore,
        _action_cb: &dyn Fn(I::Iselection) -> I::Then,
        _test_resource: &dyn std::any::Any,
    ) -> Result<I::Istore, String> {
        // In a real implementation, this would execute the action
        Ok(store)
    }
    
    pub async fn test(&self, store: I::Istore, test_resource: &dyn std::any::Any) -> Result<I::Istore, String> {
        let action_cb = &*self.action_cb;
        self.perform_action(store, action_cb, test_resource).await
    }
}
