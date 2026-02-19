use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::marker::PhantomData;
use async_trait::async_trait;

// Type variables for BDD input/output types
pub trait IbddInAny {
    type Iinput;
    type Isubject;
    type Istore;
    type Iselection;
    type Then;
    type Given;
}

pub trait IbddOutAny {}

// Test resource configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ITTestResourceConfiguration {
    pub name: String,
    pub fs: String,
    pub ports: Vec<u16>,
    pub browser_ws_endpoint: Option<String>,
    pub timeout: Option<u32>,
    pub retries: Option<u32>,
    pub environment: Option<HashMap<String, String>>,
}

// Test adapter interface
#[async_trait]
pub trait ITestAdapter<I: IbddInAny> 
where
    I::Iinput: Send + 'static,
    I::Isubject: Send + 'static,
    I::Istore: Send + 'static,
    I::Given: Send + 'static,
    I::Then: Send + 'static,
{
    async fn before_all(
        &self,
        input_val: I::Iinput,
        tr: &ITTestResourceConfiguration,
        pm: &dyn std::any::Any,
    ) -> I::Iinput;
    
    async fn after_all(
        &self,
        store: I::Istore,
        pm: &dyn std::any::Any,
    ) -> I::Istore;
    
    async fn before_each(
        &self,
        subject: I::Isubject,
        initializer: I::Given,
        test_resource: &ITTestResourceConfiguration,
        initial_values: &dyn std::any::Any,
        pm: &dyn std::any::Any,
    ) -> I::Isubject;
    
    async fn after_each(
        &self,
        store: I::Istore,
        key: &str,
        pm: &dyn std::any::Any,
    ) -> I::Istore;
    
    async fn and_when(
        &self,
        store: I::Istore,
        when_cb: I::Given,
        test_resource: &ITTestResourceConfiguration,
        pm: &dyn std::any::Any,
    ) -> I::Istore;
    
    async fn but_then(
        &self,
        store: I::Istore,
        then_cb: I::Then,
        test_resource: &ITTestResourceConfiguration,
        pm: &dyn std::any::Any,
    ) -> I::Istore;
    
    fn assert_this(&self, t: I::Then) -> bool;
}

// Type aliases to simplify complex types
pub type SuiteFn = Box<dyn Fn(String, HashMap<String, Box<dyn std::any::Any>>) -> Box<dyn std::any::Any> + Send + Sync>;
pub type GivenFn = Box<dyn Fn(Vec<String>, Vec<Box<dyn std::any::Any>>, Vec<Box<dyn std::any::Any>>, Box<dyn std::any::Any>) -> Box<dyn std::any::Any> + Send + Sync>;
pub type WhenFn = Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any> + Send + Sync>;
pub type ThenFn = Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any> + Send + Sync>;

// Test specification function type - define as a trait
pub trait ITestSpecification<I: IbddInAny, O: IbddOutAny> {
    fn call(
        &self,
        suites: HashMap<String, SuiteFn>,
        givens: HashMap<String, GivenFn>,
        whens: HashMap<String, WhenFn>,
        thens: HashMap<String, ThenFn>,
    ) -> Vec<Box<dyn std::any::Any>>;
}

// Type aliases for implementation functions
pub type GivenImplFn<I> = Box<dyn Fn(Box<dyn std::any::Any>) -> <I as IbddInAny>::Given + Send + Sync>;
pub type WhenImplFn<I> = Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn Fn(<I as IbddInAny>::Iselection) -> <I as IbddInAny>::Then + Send + Sync> + Send + Sync>;
pub type ThenImplFn<I> = Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn Fn(<I as IbddInAny>::Iselection) -> <I as IbddInAny>::Then + Send + Sync> + Send + Sync>;

// Test implementation structure
pub struct ITestImplementation<I: IbddInAny, O: IbddOutAny, M> {
    pub suites: HashMap<String, M>,
    pub givens: HashMap<String, GivenImplFn<I>>,
    pub whens: HashMap<String, WhenImplFn<I>>,
    pub thens: HashMap<String, ThenImplFn<I>>,
    pub _phantom_o: PhantomData<O>,
    pub _phantom_m: PhantomData<M>,
}

// Test resource request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ITTestResourceRequest {
    pub ports: u16,
}

// Final results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IFinalResults {
    pub failed: bool,
    pub fails: i32,
    pub artifacts: Vec<String>,
    pub features: Vec<String>,
}

// Default implementations
impl Default for ITTestResourceRequest {
    fn default() -> Self {
        Self { ports: 0 }
    }
}
