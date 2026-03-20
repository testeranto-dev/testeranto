use crate::types::IbddInAny;
use std::collections::HashMap;

/// BaseCheck is the unified base class for all verification phases.
/// It covers BDD's Then, AAA's Assert, and TDT's Validate.
pub struct BaseCheck<I: IbddInAny> {
    pub name: String,
    pub check_cb: Box<dyn Fn(I::Iselection) -> I::Then>,
    pub error: bool,
    pub artifacts: Vec<String>,
    pub status: Option<bool>,
}

impl<I: IbddInAny> BaseCheck<I> {
    pub fn new(name: String, check_cb: Box<dyn Fn(I::Iselection) -> I::Then>) -> Self {
        Self {
            name,
            check_cb,
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
    
    pub async fn verify_check(
        &self,
        _store: I::Istore,
        _check_cb: &dyn Fn(I::Iselection) -> I::Then,
        _test_resource: &dyn std::any::Any,
    ) -> Result<I::Iselection, String> {
        // In a real implementation, this would verify the check
        Err("Not implemented".to_string())
    }
    
    pub async fn test(
        &self,
        store: I::Istore,
        _test_resource: &dyn std::any::Any,
        _filepath: &str,
    ) -> Result<I::Then, String> {
        // Call verify_check with the stored check callback
        let check_cb = &*self.check_cb;
        match self.verify_check(store, check_cb, _test_resource).await {
            Ok(_selection) => {
                // In a real implementation, we would convert Iselection to Then
                // For now, return an error indicating the conversion is needed
                Err("BaseCheck.test: need to convert Iselection to Then".to_string())
            }
            Err(e) => Err(e),
        }
    }
}
