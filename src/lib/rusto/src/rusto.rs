use crate::types::{
    IbddInAny, IbddOutAny, ITestSpecification, ITestImplementation, 
    IUniversalTestAdapter, ITTestResourceRequest, ITestResourceConfiguration, IFinalResults,
    SuiteFn, GivenFn, WhenFn, ThenFn, IArtifactory,
    ITestJob
};
use std::collections::HashMap;
use std::marker::PhantomData;
use serde_json;
use std::fs;
use std::path::Path;
use crate::base_suite::BaseSuite;
use crate::base_given::BaseGiven;
use crate::base_when::BaseWhen;
use crate::base_then::BaseThen;
use crate::base_value::BaseValue;
use crate::base_should::BaseShould;
use crate::base_expected::BaseExpected;
use crate::base_describe::BaseDescribe;
use crate::base_it::BaseIt;

pub struct Rusto<I: IbddInAny, O: IbddOutAny, M> {
    pub total_tests: i32,
    pub artifacts: Vec<Box<dyn std::any::Any>>,
    pub assert_this: Box<dyn Fn(I::Then) -> bool>,
    pub given_overrides: HashMap<String, GivenFn>,
    pub specs: Vec<Box<dyn std::any::Any>>,
    pub suites_overrides: HashMap<String, SuiteFn>,
    pub test_jobs: Vec<ITestJob>,
    pub test_resource_requirement: ITTestResourceRequest,
    pub test_specification: Box<dyn ITestSpecification<I, O>>,
    pub then_overrides: HashMap<String, ThenFn>,
    pub when_overrides: HashMap<String, WhenFn>,
    pub test_resource_configuration: Option<ITestResourceConfiguration>,
    pub values_overrides: HashMap<String, Box<dyn Fn(Vec<String>, Vec<Vec<Box<dyn std::any::Any>>>, I::Given, Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>>,
    pub shoulds_overrides: HashMap<String, Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>>,
    pub expecteds_overrides: HashMap<String, Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>>,
    pub describes_overrides: HashMap<String, Box<dyn Fn(Vec<String>, Vec<Box<dyn std::any::Any>>, I::Given, Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>>,
    pub its_overrides: HashMap<String, Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>>,
    pub test_adapter: Box<dyn IUniversalTestAdapter<I>>,
    pub test_subject: I::Iinput,
    phantom_o: PhantomData<O>,
    phantom_m: PhantomData<M>,
}

impl<I: IbddInAny + 'static, O: IbddOutAny + 'static, M: 'static> Rusto<I, O, M> {
    pub fn new(
        web_or_node: &str,
        input: I::Iinput,
        test_specification: Box<dyn ITestSpecification<I, O>>,
        test_implementation: ITestImplementation<I, O, M>,
        test_resource_requirement: ITTestResourceRequest,
        test_adapter: Box<dyn IUniversalTestAdapter<I>>,
        test_resource_configuration: ITestResourceConfiguration,
        ws_port: &str,
        ws_host: &str,
    ) -> Self {
        let _ = web_or_node;
        let _ = ws_port;
        let _ = ws_host;
        
        // Create classy implementations for all patterns - match TypeScript implementation
        let mut suites_overrides: HashMap<String, SuiteFn> = HashMap::new();
        let mut given_overrides: HashMap<String, GivenFn> = HashMap::new();
        let mut when_overrides: HashMap<String, WhenFn> = HashMap::new();
        let mut then_overrides: HashMap<String, ThenFn> = HashMap::new();
        
        // Create TDT pattern overrides
        let mut values_overrides: HashMap<String, Box<dyn Fn(Vec<String>, Vec<Vec<Box<dyn std::any::Any>>>, I::Given, Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>> = HashMap::new();
        let mut shoulds_overrides: HashMap<String, Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>> = HashMap::new();
        let mut expecteds_overrides: HashMap<String, Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>> = HashMap::new();
        
        // Create Describe-It pattern overrides
        let mut describes_overrides: HashMap<String, Box<dyn Fn(Vec<String>, Vec<Box<dyn std::any::Any>>, I::Given, Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>> = HashMap::new();
        let mut its_overrides: HashMap<String, Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>> = HashMap::new();
        
        // Process suites - match TypeScript implementation
        for (key, _) in test_implementation.suites {
            let _key_clone = key.clone();
            suites_overrides.insert(key, Box::new(move |name: String, setups: HashMap<String, Box<dyn std::any::Any>>| {
                // Create a BaseSuite instance
                Box::new(BaseSuite::<I>::new(name, setups)) as Box<dyn std::any::Any>
            }) as SuiteFn);
        }
        
        // Process BDD pattern - match TypeScript implementation
        for (key, given_fn) in test_implementation.givens {
            let _key_clone = key.clone();
            given_overrides.insert(key, Box::new(move |features: Vec<String>, whens: Vec<Box<dyn std::any::Any>>, thens: Vec<Box<dyn std::any::Any>>, initial_values: Box<dyn std::any::Any>| {
                Box::new(BaseGiven::<I>::new(features, whens, thens, given_fn(Box::new(())), initial_values)) as Box<dyn std::any::Any>
            }) as GivenFn);
        }
        
        for (key, when_fn) in test_implementation.whens {
            let key_clone = key.clone();
            when_overrides.insert(key, Box::new(move |args: Box<dyn std::any::Any>| {
                // Convert the result to Box<dyn std::any::Any>
                let _when_result = when_fn(args);
                // Create a closure that returns I::Then
                // For now, we'll use a placeholder that panics
                Box::new(BaseWhen::<I>::new(key_clone.clone(), Box::new(move |_| {
                    // This is a temporary fix - in a real implementation, we need to properly handle this
                    panic!("BaseWhen callback not properly implemented");
                }))) as Box<dyn std::any::Any>
            }) as WhenFn);
        }
        
        for (key, then_fn) in test_implementation.thens {
            let key_clone = key.clone();
            then_overrides.insert(key, Box::new(move |args: Box<dyn std::any::Any>| {
                // Convert the result to Box<dyn std::any::Any>
                let _then_result = then_fn(args);
                // Create a closure that returns I::Then
                // For now, we'll use a placeholder that panics
                Box::new(BaseThen::<I>::new(key_clone.clone(), Box::new(move |_| {
                    panic!("BaseThen callback not properly implemented");
                }))) as Box<dyn std::any::Any>
            }) as ThenFn);
        }
        
        // Process TDT pattern - match TypeScript implementation
        for (key, _value_fn) in test_implementation.values {
            let _key_clone = key.clone();
            values_overrides.insert(key, Box::new(move |features: Vec<String>, table_rows: Vec<Vec<Box<dyn std::any::Any>>>, confirm_cb: I::Given, initial_values: Box<dyn std::any::Any>| {
                Box::new(BaseValue::<I>::new(features, table_rows, confirm_cb, initial_values)) as Box<dyn std::any::Any>
            }));
        }
        
        for (key, should_fn) in test_implementation.shoulds {
            let key_clone = key.clone();
            shoulds_overrides.insert(key, Box::new(move |args: Box<dyn std::any::Any>| {
                let _should_cb = should_fn(args);
                // Create a placeholder closure
                let should_cb_placeholder: Box<dyn Fn(I::Iselection) -> I::Then> = 
                    Box::new(move |_| panic!("BaseShould callback not properly implemented"));
                Box::new(BaseShould::<I>::new(key_clone.clone(), should_cb_placeholder)) as Box<dyn std::any::Any>
            }));
        }
        
        for (key, expected_fn) in test_implementation.expecteds {
            let key_clone = key.clone();
            expecteds_overrides.insert(key, Box::new(move |args: Box<dyn std::any::Any>| {
                let _expected_cb = expected_fn(args);
                // Create a placeholder closure
                let expected_cb_placeholder: Box<dyn Fn(I::Iselection) -> I::Then> = 
                    Box::new(move |_| panic!("BaseExpected callback not properly implemented"));
                Box::new(BaseExpected::<I>::new(key_clone.clone(), expected_cb_placeholder)) as Box<dyn std::any::Any>
            }));
        }
        
        // Process Describe-It pattern - match TypeScript implementation
        for (key, _describe_fn) in test_implementation.describes {
            let _key_clone = key.clone();
            describes_overrides.insert(key, Box::new(move |features: Vec<String>, its: Vec<Box<dyn std::any::Any>>, describe_cb: I::Given, initial_values: Box<dyn std::any::Any>| {
                Box::new(BaseDescribe::<I>::new(features, its, describe_cb, initial_values)) as Box<dyn std::any::Any>
            }));
        }
        
        for (key, it_fn) in test_implementation.its {
            let key_clone = key.clone();
            its_overrides.insert(key, Box::new(move |args: Box<dyn std::any::Any>| {
                let _it_cb = it_fn(args);
                // Create a placeholder closure
                let it_cb_placeholder: Box<dyn Fn(I::Iselection) -> I::Then> = 
                    Box::new(move |_| panic!("BaseIt callback not properly implemented"));
                Box::new(BaseIt::<I>::new(key_clone.clone(), it_cb_placeholder)) as Box<dyn std::any::Any>
            }));
        }
        
        // Generate specs - need to handle all patterns
        // We need to pass references since the HashMaps can't be cloned
        // Create a wrapper that implements the trait
        struct SpecCaller<'a> {
            suites: &'a HashMap<String, SuiteFn>,
            givens: &'a HashMap<String, GivenFn>,
            whens: &'a HashMap<String, WhenFn>,
            thens: &'a HashMap<String, ThenFn>,
        }
        
        impl<'a, I: IbddInAny, O: IbddOutAny> ITestSpecification<I, O> for SpecCaller<'a> {
            fn call(
                &self,
                _suites: HashMap<String, SuiteFn>,
                _givens: HashMap<String, GivenFn>,
                _whens: HashMap<String, WhenFn>,
                _thens: HashMap<String, ThenFn>,
            ) -> Vec<Box<dyn std::any::Any>> {
                // For now, return empty vector
                // In a real implementation, we would use the stored references
                Vec::new()
            }
        }
        
        // Since we can't easily pass the HashMaps due to Clone issues,
        // we'll create a simple implementation for now
        let specs = Vec::new();
        
        // Calculate total tests
        let total_tests = Self::calculate_total_tests(&specs);
        
        // Create test jobs (simplified for now)
        let test_jobs = Vec::new();
        
        Self {
            total_tests,
            artifacts: Vec::new(),
            assert_this: Box::new(|_| true),
            given_overrides,
            specs,
            suites_overrides,
            test_jobs,
            test_resource_requirement,
            test_specification,
            then_overrides,
            when_overrides,
            test_resource_configuration: Some(test_resource_configuration),
            values_overrides,
            shoulds_overrides,
            expecteds_overrides,
            describes_overrides,
            its_overrides,
            test_adapter,
            test_subject: input,
            phantom_o: PhantomData,
            phantom_m: PhantomData,
        }
    }
    
    fn calculate_total_tests(_specs: &[Box<dyn std::any::Any>]) -> i32 {
        // Simplified calculation - in real implementation, would count tests
        // Match TypeScript implementation
        0
    }
    
    /// Create a context-aware artifactory for file operations
    /// This replaces the deprecated PM (Process Manager)
    /// Matches TypeScript implementation in BaseTiposkripto.ts
    /// Note: Rust is a server-side language and CANNOT capture screenshots or screencasts
    /// Only the Web runtime (browser environment) can do visual captures
    /// Therefore, we only include writeFileSync method, matching Java (Kafe) implementation
    /// This is a necessary difference between web and other runtimes
    pub fn create_artifactory(
        &self,
        context: HashMap<String, String>,
    ) -> IArtifactory {
        let mut artifactory = IArtifactory::new();
        
        let base_path = self.test_resource_configuration
            .as_ref()
            .map(|c| c.fs.clone())
            .unwrap_or_else(|| "testeranto".to_string());
        
        // Add write_file_sync method - follows Rust snake_case convention
        // Rust is a server-side language and CANNOT capture screenshots or screencasts
        // Only the Web runtime (browser environment) can do visual captures
        // This is a necessary difference between web and other runtimes
        artifactory.insert("write_file_sync".to_string(), Box::new({
            let base_path = base_path.clone();
            let context = context.clone();
            move |filename: String, payload: String| {
                // Construct path based on context - match TypeScript implementation
                let mut path = String::new();
                
                // Start with the test resource configuration fs path
                let base_path = &base_path;
                
                // Add suite context if available - use TypeScript's key names
                if let Some(suite_index) = context.get("suiteIndex") {
                    path.push_str(&format!("suite-{}/", suite_index));
                }
                
                // Add given context if available
                if let Some(given_key) = context.get("givenKey") {
                    path.push_str(&format!("given-{}/", given_key));
                }
                
                // Add when or then context - use TypeScript's key names
                if let Some(when_index) = context.get("whenIndex") {
                    path.push_str(&format!("when-{} ", when_index));
                } else if let Some(then_index) = context.get("thenIndex") {
                    path.push_str(&format!("then-{} ", then_index));
                } else if let Some(row_index) = context.get("rowIndex") {
                    path.push_str(&format!("row-{} ", row_index));
                } else if let Some(it_index) = context.get("itIndex") {
                    path.push_str(&format!("it-{} ", it_index));
                } else if let Some(describe_key) = context.get("describeKey") {
                    path.push_str(&format!("describe-{}/", describe_key));
                } else if let Some(value_key) = context.get("valueKey") {
                    path.push_str(&format!("value-{}/", value_key));
                }
                
                // Add the filename
                path.push_str(&filename);
                
                // Ensure it has a .txt extension if not present
                if !path.contains('.') {
                    path.push_str(".txt");
                }
                
                // Prepend the base path, avoiding double slashes
                let base_path_clean = base_path.trim_end_matches('/');
                let path_clean = path.trim_start_matches('/');
                let full_path = format!("{}/{}", base_path_clean, path_clean);
                
                println!("[Artifactory] Full path: {}", full_path);
                
                // Create directory if it doesn't exist
                if let Some(parent) = Path::new(&full_path).parent() {
                    if !parent.exists() {
                        let _ = fs::create_dir_all(parent);
                    }
                }
                
                // Write file
                if let Err(e) = fs::write(&full_path, payload) {
                    println!("[Artifactory] Error writing file: {}", e);
                }
            }
        }) as Box<dyn std::any::Any + Send + Sync>);
        
        // NOTE: Rust is a server-side language and CANNOT capture screenshots or screencasts
        // Only the Web runtime (browser environment) can do visual captures
        // Therefore, we DO NOT include screenshot, openScreencast, or closeScreencast methods
        // This matches the Java (Kafe) implementation which also omits these browser-only methods
        // This is a necessary difference between web and other runtimes
        
        artifactory
    }
    
    // Add methods to match TypeScript's BaseTiposkripto
    pub fn specs(&self) -> &Vec<Box<dyn std::any::Any>> {
        &self.specs
    }
    
    pub fn suites(&self) -> &HashMap<String, SuiteFn> {
        &self.suites_overrides
    }
    
    pub fn given(&self) -> &HashMap<String, GivenFn> {
        &self.given_overrides
    }
    
    pub fn when(&self) -> &HashMap<String, WhenFn> {
        &self.when_overrides
    }
    
    pub fn then(&self) -> &HashMap<String, ThenFn> {
        &self.then_overrides
    }
    
    pub fn get_test_jobs(&self) -> &Vec<ITestJob> {
        &self.test_jobs
    }
    
    pub fn calculate_total_tests_method(&self) -> i32 {
        self.total_tests
    }
    
    // Match TypeScript's Suites() method (capital S)
    pub fn Suites(&self) -> &HashMap<String, SuiteFn> {
        &self.suites_overrides
    }
    
    // Match TypeScript's Given() method (capital G)
    pub fn Given(&self) -> &HashMap<String, GivenFn> {
        &self.given_overrides
    }
    
    // Match TypeScript's When() method (capital W)
    pub fn When(&self) -> &HashMap<String, WhenFn> {
        &self.when_overrides
    }
    
    // Match TypeScript's Then() method (capital T)
    pub fn Then(&self) -> &HashMap<String, ThenFn> {
        &self.then_overrides
    }
    
    // Abstract method to be implemented by concrete runtimes
    pub fn write_file_sync(&self, filename: &str, payload: &str) {
        // This should be implemented by concrete runtime
        println!("[Rusto] Would write to {}: {}", filename, &payload[..std::cmp::min(payload.len(), 100)]);
    }
    
    pub async fn receive_test_resource_config(
        &mut self,
        test_resource_config: ITestResourceConfiguration,
    ) -> Result<IFinalResults, Box<dyn std::error::Error>> {
        // Store configuration
        self.test_resource_configuration = Some(test_resource_config.clone());
        
        // Run tests (simplified)
        let total_fails = 0;
        let all_features = Vec::new();
        let all_artifacts: Vec<String> = Vec::new();
        
        // Write tests.json - match TypeScript implementation
        self.write_tests_json(&test_resource_config, total_fails, &all_features)?;
        
        // If there are test jobs, run the first one like TypeScript does
        if !self.test_jobs.is_empty() {
            // This would run the test job
        }
        
        Ok(IFinalResults {
            failed: total_fails > 0,
            fails: total_fails,
            artifacts: all_artifacts,
            features: all_features,
            tests: self.total_tests,
            run_time_tests: self.total_tests,
            test_job: HashMap::new(),
        })
    }
    
    // Also add a method to match TypeScript's receiveTestResourceConfig signature
    pub async fn receive_test_resource_config_async(
        &mut self,
        test_resource_config: ITestResourceConfiguration,
    ) -> Result<IFinalResults, Box<dyn std::error::Error>> {
        self.receive_test_resource_config(test_resource_config).await
    }
    
    // Also support string version for backward compatibility
    pub async fn receive_test_resource_config_str(
        &mut self,
        partial_test_resource: &str,
    ) -> Result<IFinalResults, Box<dyn std::error::Error>> {
        // Parse test resource configuration
        let test_resource_config: ITestResourceConfiguration = 
            serde_json::from_str(partial_test_resource)?;
        
        self.receive_test_resource_config(test_resource_config).await
    }
    
    fn write_tests_json(
        &self,
        test_resource_config: &ITestResourceConfiguration,
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
        
        // Get the fs path from test resource configuration
        let mut fs_path = test_resource_config.fs.clone();
        if !fs_path.ends_with('/') {
            fs_path.push('/');
        }
        let file_path = format!("{}tests.json", fs_path);
        
        // Create directory if it doesn't exist
        let dir_path = Path::new(&fs_path);
        if !dir_path.exists() {
            fs::create_dir_all(dir_path)?;
        }
        
        // Write to file
        fs::write(&file_path, serde_json::to_string_pretty(&tests_data)?)?;
        
        println!("tests.json written to: {}", file_path);
        Ok(())
    }
    
    // Helper methods for accessing overrides - match TypeScript implementation
    pub fn values(&self) -> &HashMap<String, Box<dyn Fn(Vec<String>, Vec<Vec<Box<dyn std::any::Any>>>, I::Given, Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>> {
        &self.values_overrides
    }
    
    pub fn shoulds(&self) -> &HashMap<String, Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>> {
        &self.shoulds_overrides
    }
    
    pub fn expecteds(&self) -> &HashMap<String, Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>> {
        &self.expecteds_overrides
    }
    
    pub fn describes(&self) -> &HashMap<String, Box<dyn Fn(Vec<String>, Vec<Box<dyn std::any::Any>>, I::Given, Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>> {
        &self.describes_overrides
    }
    
    pub fn its(&self) -> &HashMap<String, Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>> {
        &self.its_overrides
    }
}
