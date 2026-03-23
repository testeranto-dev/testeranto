use crate::base_setup::BaseSetup;
use crate::types::IbddInAny;
use std::collections::HashMap;

/// BaseDescribe extends BaseSetup for Describe-It pattern (AAA).
/// Describe can be nested, and Its can mix mutations and assertions.
pub struct BaseDescribe<I: IbddInAny> {
    inner: BaseSetup<I>,
}

impl<I: IbddInAny> BaseDescribe<I> {
    pub fn new(
        features: Vec<String>,
        its: Vec<Box<dyn std::any::Any>>,
        describe_cb: I::Given,
        initial_values: Box<dyn std::any::Any>,
    ) -> Self {
        Self {
            inner: BaseSetup::new(features, its, Vec::new(), describe_cb, initial_values),
        }
    }
    
    pub fn add_artifact(&mut self, path: String) {
        self.inner.add_artifact(path);
    }
    
    pub fn to_obj(&self) -> HashMap<String, Box<dyn std::any::Any>> {
        self.inner.to_obj()
    }
    
    // Alias setup to describe for Describe-It pattern
    pub async fn describe(
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
