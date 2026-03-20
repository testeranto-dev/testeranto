use crate::base_setup::BaseSetup;
use crate::types::IbddInAny;

/// BaseArrange extends BaseSetup for AAA pattern.
pub struct BaseArrange<I: IbddInAny> {
    inner: BaseSetup<I>,
}

impl<I: IbddInAny> BaseArrange<I> {
    pub fn new(
        features: Vec<String>,
        acts: Vec<Box<dyn std::any::Any>>,
        asserts: Vec<Box<dyn std::any::Any>>,
        arrange_cb: I::Given,
        initial_values: Box<dyn std::any::Any>,
    ) -> Self {
        Self {
            inner: BaseSetup::new(features, acts, asserts, arrange_cb, initial_values),
        }
    }
    
    // Alias setup to arrange for AAA pattern
    pub async fn arrange(
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
    
    // Delegate methods to inner
    pub fn add_artifact(&mut self, path: String) {
        self.inner.add_artifact(path);
    }
    
    pub fn to_obj(&self) -> std::collections::HashMap<String, Box<dyn std::any::Any>> {
        self.inner.to_obj()
    }
}
