use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::marker::PhantomData;
use async_trait::async_trait;

// Type variables for BDD input/output types - match TypeScript's TestTypeParams
pub trait IbddInAny {
    type Iinput;
    type Isubject;
    type Istore;
    type Iselection;
    type Then;
    type Given;
    type When;
}

pub trait IbddOutAny {}

// Match TypeScript's ITestResourceConfiguration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ITestResourceConfiguration {
    pub name: String,
    pub fs: String,
    pub ports: Vec<u16>,
    pub files: Vec<String>,
    pub timeout: Option<u32>,
    pub retries: Option<u32>,
    pub environment: Option<HashMap<String, String>>,
}

// Artifactory type for context-aware file operations - match TypeScript
// Need Send + Sync for thread safety in async contexts
pub type IArtifactory = HashMap<String, Box<dyn std::any::Any + Send + Sync>>;

// Universal test adapter with methodology-agnostic terminology - match TypeScript's IUniversalTestAdapter
#[async_trait]
pub trait IUniversalTestAdapter<I: IbddInAny> 
where
    I::Iinput: Send + 'static,
    I::Isubject: Send + 'static,
    I::Istore: Send + 'static,
    I::Given: Send + 'static,
    I::Then: Send + 'static,
    I::When: Send + 'static,
{
    // Lifecycle hooks
    async fn prepare_all(
        &self,
        input: I::Iinput,
        test_resource: &ITestResourceConfiguration,
        artifactory: Option<&IArtifactory>,
    ) -> I::Iinput;
    
    async fn prepare_each(
        &self,
        subject: I::Isubject,
        initializer: I::Given,
        test_resource: &ITestResourceConfiguration,
        initial_values: &(dyn std::any::Any + Send + Sync),
        artifactory: Option<&IArtifactory>,
    ) -> I::Isubject;
    
    async fn cleanup_each(
        &self,
        store: I::Istore,
        key: &str,
        artifactory: Option<&IArtifactory>,
    ) -> I::Istore;
    
    async fn cleanup_all(
        &self,
        store: I::Istore,
        artifactory: Option<&IArtifactory>,
    ) -> I::Istore;
    
    // Execution
    async fn execute(
        &self,
        store: I::Istore,
        action_cb: I::When,
        test_resource: &ITestResourceConfiguration,
        artifactory: Option<&IArtifactory>,
    ) -> I::Istore;
    
    // Verification
    async fn verify(
        &self,
        store: I::Istore,
        check_cb: I::Then,
        test_resource: &ITestResourceConfiguration,
        artifactory: Option<&IArtifactory>,
    ) -> I::Iselection;
    
    // Assertion - standardized name across all languages
    // Note: Named assert_that to avoid conflict with Java's 'assert' keyword
    fn assert_that(&self, x: I::Then) -> bool;
}

// Legacy test adapter interface for backward compatibility - match TypeScript's ITestAdapter
#[async_trait]
pub trait ITestAdapter<I: IbddInAny>: IUniversalTestAdapter<I>
where
    I::Iinput: Send + 'static,
    I::Isubject: Send + 'static,
    I::Istore: Send + 'static,
    I::Given: Send + 'static,
    I::Then: Send + 'static,
    I::When: Send + 'static,
{
    // Legacy method names
    async fn before_all(
        &self,
        input_val: I::Iinput,
        tr: &ITestResourceConfiguration,
        artifactory: Option<&IArtifactory>,
    ) -> I::Iinput {
        self.prepare_all(input_val, tr, artifactory).await
    }
    
    async fn before_each(
        &self,
        subject: I::Isubject,
        initializer: I::Given,
        test_resource: &ITestResourceConfiguration,
        initial_values: &(dyn std::any::Any + Send + Sync),
        artifactory: Option<&IArtifactory>,
    ) -> I::Isubject {
        self.prepare_each(subject, initializer, test_resource, initial_values, artifactory).await
    }
    
    async fn after_each(
        &self,
        store: I::Istore,
        key: &str,
        artifactory: Option<&IArtifactory>,
    ) -> I::Istore {
        self.cleanup_each(store, key, artifactory).await
    }
    
    async fn after_all(
        &self,
        store: I::Istore,
        artifactory: Option<&IArtifactory>,
    ) -> I::Istore {
        self.cleanup_all(store, artifactory).await
    }
    
    async fn and_when(
        &self,
        store: I::Istore,
        when_cb: I::When,
        test_resource: &ITestResourceConfiguration,
        artifactory: Option<&IArtifactory>,
    ) -> I::Istore {
        self.execute(store, when_cb, test_resource, artifactory).await
    }
    
    async fn but_then(
        &self,
        store: I::Istore,
        then_cb: I::Then,
        test_resource: &ITestResourceConfiguration,
        artifactory: Option<&IArtifactory>,
    ) -> I::Iselection {
        self.verify(store, then_cb, test_resource, artifactory).await
    }
    
    fn assert_this(&self, t: I::Then) -> bool {
        self.assert_that(t)
    }
}

// Type aliases to simplify complex types - match TypeScript's function types
pub type SuiteFn = Box<dyn Fn(String, HashMap<String, Box<dyn std::any::Any>>) -> Box<dyn std::any::Any> + Send + Sync>;
pub type GivenFn = Box<dyn Fn(Vec<String>, Vec<Box<dyn std::any::Any>>, Vec<Box<dyn std::any::Any>>, Box<dyn std::any::Any>) -> Box<dyn std::any::Any> + Send + Sync>;
pub type WhenFn = Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any> + Send + Sync>;
pub type ThenFn = Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any> + Send + Sync>;

// Test specification function type - match TypeScript's ITestSpecification
pub trait ITestSpecification<I: IbddInAny, O: IbddOutAny> {
    fn call(
        &self,
        suites: HashMap<String, SuiteFn>,
        givens: HashMap<String, GivenFn>,
        whens: HashMap<String, WhenFn>,
        thens: HashMap<String, ThenFn>,
    ) -> Vec<Box<dyn std::any::Any>>;
}

// Type aliases for implementation functions - match TypeScript
pub type GivenImplFn<I> = Box<dyn Fn(Box<dyn std::any::Any>) -> <I as IbddInAny>::Given + Send + Sync>;
pub type WhenImplFn<I> = Box<dyn Fn(Box<dyn std::any::Any>) -> <I as IbddInAny>::When + Send + Sync>;
pub type ThenImplFn<I> = Box<dyn Fn(Box<dyn std::any::Any>) -> <I as IbddInAny>::Then + Send + Sync>;

// TDT pattern implementation functions - match TypeScript
pub type ValueImplFn<I> = Box<dyn Fn(Vec<String>, Vec<Vec<Box<dyn std::any::Any>>>, <I as IbddInAny>::Given, Box<dyn std::any::Any>) -> Box<dyn std::any::Any> + Send + Sync>;
pub type ShouldImplFn<I> = Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn Fn(<I as IbddInAny>::Iselection) -> <I as IbddInAny>::Then + Send + Sync> + Send + Sync>;
pub type ExpectedImplFn<I> = Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn Fn(<I as IbddInAny>::Iselection) -> <I as IbddInAny>::Then + Send + Sync> + Send + Sync>;

// Describe-It pattern implementation functions - match TypeScript
pub type DescribeImplFn<I> = Box<dyn Fn(Vec<String>, Vec<Box<dyn std::any::Any>>, <I as IbddInAny>::Given, Box<dyn std::any::Any>) -> Box<dyn std::any::Any> + Send + Sync>;
pub type ItImplFn<I> = Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn Fn(<I as IbddInAny>::Iselection) -> <I as IbddInAny>::Then + Send + Sync> + Send + Sync>;

// Test implementation structure - match TypeScript's ITestImplementation
pub struct ITestImplementation<I: IbddInAny, O: IbddOutAny, M> {
    pub suites: HashMap<String, M>,
    // BDD pattern
    pub givens: HashMap<String, GivenImplFn<I>>,
    pub whens: HashMap<String, WhenImplFn<I>>,
    pub thens: HashMap<String, ThenImplFn<I>>,
    // TDT pattern
    pub values: HashMap<String, ValueImplFn<I>>,
    pub shoulds: HashMap<String, ShouldImplFn<I>>,
    pub expecteds: HashMap<String, ExpectedImplFn<I>>,
    // Describe-It pattern
    pub describes: HashMap<String, DescribeImplFn<I>>,
    pub its: HashMap<String, ItImplFn<I>>,
    pub _phantom_o: PhantomData<O>,
    pub _phantom_m: PhantomData<M>,
}

impl<I: IbddInAny, O: IbddOutAny, M> Default for ITestImplementation<I, O, M> {
    fn default() -> Self {
        Self {
            suites: HashMap::new(),
            givens: HashMap::new(),
            whens: HashMap::new(),
            thens: HashMap::new(),
            values: HashMap::new(),
            shoulds: HashMap::new(),
            expecteds: HashMap::new(),
            describes: HashMap::new(),
            its: HashMap::new(),
            _phantom_o: PhantomData,
            _phantom_m: PhantomData,
        }
    }
}

// Test resource request - matches TypeScript's ITTestResourceRequest
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ITTestResourceRequest {
    pub ports: u16,
}

// Final results - matches TypeScript's IFinalResults
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IFinalResults {
    pub failed: bool,
    pub fails: i32,
    pub artifacts: Vec<String>,
    pub features: Vec<String>,
    pub tests: i32,
    pub run_time_tests: i32,
    pub test_job: HashMap<String, String>, // Changed from Box<dyn std::any::Any> to String for serialization
}

// Test job - matches TypeScript's ITestJob
pub struct ITestJob {
    pub test: Box<dyn std::any::Any>,
    pub runner: Box<dyn Fn(ITestResourceConfiguration) -> Box<dyn std::any::Any> + Send + Sync>,
    pub receive_test_resource_config: Box<dyn Fn(ITestResourceConfiguration) -> IFinalResults + Send + Sync>,
}

impl ITestJob {
    pub fn to_obj(&self) -> HashMap<String, Box<dyn std::any::Any>> {
        let mut obj = HashMap::new();
        obj.insert("test".to_string(), Box::new("test") as Box<dyn std::any::Any>);
        obj
    }
}

// Default implementations
impl Default for ITTestResourceRequest {
    fn default() -> Self {
        Self { ports: 0 }
    }
}

impl Default for ITestResourceConfiguration {
    fn default() -> Self {
        Self {
            name: "default".to_string(),
            fs: "testeranto".to_string(),
            ports: Vec::new(),
            files: Vec::new(),
            timeout: None,
            retries: None,
            environment: None,
        }
    }
}

// Match TypeScript's type aliases
pub type ISuites = HashMap<String, Box<dyn std::any::Any>>;
pub type IGivens = HashMap<String, Box<dyn std::any::Any>>;
pub type IWhens = HashMap<String, Box<dyn std::any::Any>>;
pub type IThens = HashMap<String, Box<dyn std::any::Any>>;
pub type IValues = HashMap<String, Box<dyn std::any::Any>>;
pub type IShoulds = HashMap<String, Box<dyn std::any::Any>>;
pub type IExpecteds = HashMap<String, Box<dyn std::any::Any>>;
pub type IDescribes = HashMap<String, Box<dyn std::any::Any>>;
pub type IIts = HashMap<String, Box<dyn std::any::Any>>;
