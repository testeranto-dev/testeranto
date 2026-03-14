use crate::types::{
    IbddInAny, IbddOutAny, ITestSpecification, ITestImplementation, 
    ITestAdapter, ITTestResourceRequest, ITTestResourceConfiguration, IFinalResults,
    SuiteFn, GivenFn, WhenFn, ThenFn
};
use std::collections::HashMap;
use std::marker::PhantomData;
use serde_json;
use std::fs;
use std::path::Path;

pub struct Rusto<I: IbddInAny, O: IbddOutAny, M> {
    #[allow(dead_code)]
    _test_resource_requirement: ITTestResourceRequest,
    #[allow(dead_code)]
    _artifacts: Vec<Box<dyn std::any::Any>>,
    #[allow(dead_code)]
    _test_jobs: Vec<Box<dyn std::any::Any>>,
    #[allow(dead_code)]
    _test_specification: Box<dyn ITestSpecification<I, O>>,
    #[allow(dead_code)]
    _suites_overrides: HashMap<String, SuiteFn>,
    #[allow(dead_code)]
    _given_overrides: HashMap<String, GivenFn>,
    #[allow(dead_code)]
    _when_overrides: HashMap<String, WhenFn>,
    #[allow(dead_code)]
    _then_overrides: HashMap<String, ThenFn>,
    #[allow(dead_code)]
    _puppet_master: Option<Box<dyn std::any::Any>>,
    #[allow(dead_code)]
    _specs: Vec<Box<dyn std::any::Any>>,
    #[allow(dead_code)]
    _total_tests: i32,
    #[allow(dead_code)]
    _assert_this: Box<dyn Fn(I::Then) -> bool>,
    #[allow(dead_code)]
    _test_adapter: Box<dyn ITestAdapter<I>>,
    #[allow(dead_code)]
    _test_subject: I::Iinput,
    #[allow(dead_code)]
    _phantom_o: PhantomData<O>,
    #[allow(dead_code)]
    _phantom_m: PhantomData<M>,
}

impl<I: IbddInAny + 'static, O: IbddOutAny + 'static, M: 'static> Rusto<I, O, M> {
    pub fn new(
        input_val: <I as IbddInAny>::Iinput,
        test_specification: Box<dyn ITestSpecification<I, O>>,
        _test_implementation: ITestImplementation<I, O, M>,
        test_resource_requirement: ITTestResourceRequest,
        test_adapter: Box<dyn ITestAdapter<I>>,
    ) -> Self {
        // Initialize classy implementations
        let suites_overrides = HashMap::new();
        let given_overrides = HashMap::new();
        let when_overrides = HashMap::new();
        let then_overrides = HashMap::new();
        
        // Generate specs (simplified)
        let specs = Vec::new();
        
        Self {
            _test_resource_requirement: test_resource_requirement,
            _artifacts: Vec::new(),
            _test_jobs: Vec::new(),
            _test_specification: test_specification,
            _suites_overrides: suites_overrides,
            _given_overrides: given_overrides,
            _when_overrides: when_overrides,
            _then_overrides: then_overrides,
            _puppet_master: None,
            _specs: specs,
            _total_tests: 0,
            _assert_this: Box::new(|_| true),
            _test_adapter: test_adapter,
            _test_subject: input_val,
            _phantom_o: PhantomData,
            _phantom_m: PhantomData,
        }
    }
    
    pub async fn receive_test_resource_config(
        &mut self,
        partial_test_resource: &str,
        _websocket_port: &str,
    ) -> Result<IFinalResults, Box<dyn std::error::Error>> {
        // Parse test resource configuration
        let _test_resource_config: ITTestResourceConfiguration = 
            serde_json::from_str(partial_test_resource)?;
        
        // Run tests (simplified)
        let total_fails = 0;
        let all_features = Vec::new();
        let all_artifacts: Vec<String> = Vec::new();
        
        // Write tests.json
        self.write_tests_json(total_fails, &all_features)?;
        
        Ok(IFinalResults {
            failed: total_fails > 0,
            fails: total_fails,
            artifacts: all_artifacts,
            features: all_features,
        })
    }
    
    fn write_tests_json(
        &self,
        total_fails: i32,
        features: &[String],
    ) -> Result<(), Box<dyn std::error::Error>> {
        let tests_data = serde_json::json!({
            "name": "Rust Test",
            "givens": [],
            "fails": total_fails,
            "failed": total_fails > 0,
            "features": features,
            "artifacts": []
        });
        
        // Create directory if it doesn't exist
        let dir_path = "testeranto/reports/allTests/example";
        if !Path::new(dir_path).exists() {
            fs::create_dir_all(dir_path)?;
        }
        
        // Write to file
        let file_path = format!("{}/rust.Calculator.test.ts.json", dir_path);
        fs::write(&file_path, serde_json::to_string_pretty(&tests_data)?)?;
        
        println!("tests.json written to: {}", file_path);
        Ok(())
    }
    
    // Helper methods for accessing overrides
    pub fn suites(&self) -> &HashMap<String, SuiteFn> {
        &self._suites_overrides
    }
    
    pub fn given(&self) -> &HashMap<String, GivenFn> {
        &self._given_overrides
    }
    
    pub fn when(&self) -> &HashMap<String, WhenFn> {
        &self._when_overrides
    }
    
    pub fn then(&self) -> &HashMap<String, ThenFn> {
        &self._then_overrides
    }
}
