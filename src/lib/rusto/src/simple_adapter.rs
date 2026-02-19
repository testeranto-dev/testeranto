use crate::types::{IbddInAny, ITTestResourceConfiguration, ITestAdapter};
use async_trait::async_trait;

pub struct SimpleTestAdapter;

impl SimpleTestAdapter {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl<I> ITestAdapter<I> for SimpleTestAdapter 
where
    I: IbddInAny + Send + Sync,
    <I as IbddInAny>::Iinput: Send + 'static,
    <I as IbddInAny>::Isubject: Send + 'static,
    <I as IbddInAny>::Istore: Send + 'static,
    <I as IbddInAny>::Given: Send + 'static,
    <I as IbddInAny>::Then: Send + 'static,
{
    async fn before_all(
        &self,
        input_val: <I as IbddInAny>::Iinput,
        _tr: &ITTestResourceConfiguration,
        _pm: &dyn std::any::Any,
    ) -> <I as IbddInAny>::Iinput {
        input_val
    }
    
    async fn after_all(
        &self,
        store: <I as IbddInAny>::Istore,
        _pm: &dyn std::any::Any,
    ) -> <I as IbddInAny>::Istore {
        store
    }
    
    async fn before_each(
        &self,
        subject: <I as IbddInAny>::Isubject,
        _initializer: <I as IbddInAny>::Given,
        _test_resource: &ITTestResourceConfiguration,
        _initial_values: &dyn std::any::Any,
        _pm: &dyn std::any::Any,
    ) -> <I as IbddInAny>::Isubject {
        subject
    }
    
    async fn after_each(
        &self,
        store: <I as IbddInAny>::Istore,
        _key: &str,
        _pm: &dyn std::any::Any,
    ) -> <I as IbddInAny>::Istore {
        store
    }
    
    async fn and_when(
        &self,
        store: <I as IbddInAny>::Istore,
        _when_cb: <I as IbddInAny>::Given,
        _test_resource: &ITTestResourceConfiguration,
        _pm: &dyn std::any::Any,
    ) -> <I as IbddInAny>::Istore {
        store
    }
    
    async fn but_then(
        &self,
        store: <I as IbddInAny>::Istore,
        _then_cb: <I as IbddInAny>::Then,
        _test_resource: &ITTestResourceConfiguration,
        _pm: &dyn std::any::Any,
    ) -> <I as IbddInAny>::Istore {
        store
    }
    
    fn assert_this(&self, _t: <I as IbddInAny>::Then) -> bool {
        true
    }
}
