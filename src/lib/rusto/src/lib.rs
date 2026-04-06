//! Rusto - Rust implementation of Testeranto
//! 
//! This crate provides a Rust implementation of the Testeranto testing framework,
//! providing three testing patterns through unified terminology: Setup-Action-Check.
//! 
//! ## Supported Patterns
//! 
//! 1. **BDD (Behavior Driven Development)**: Given, When, Then (3 verbs) - fully implemented
//! 2. **TDT (Table-Driven Testing)**: Value, Should, Expected (3 verbs) - core classes available
//! 3. **Describe-It Pattern (AAA/Arrange-Act-Assert)**: Describe, It (2 verbs) - core classes available
//! 
//! All patterns use artifactory for context-aware file operations, replacing the deprecated PM.
//! 
//! **Note**: The AAA (Arrange-Act-Assert) pattern is implemented as the Describe-It pattern with 2 verbs:
//! "Describe" for Arrange and "It" for combined Act and Assert phases.

pub mod types;
pub mod base_suite;
pub mod base_given;
pub mod base_when;
pub mod base_then;
pub mod base_setup;
pub mod base_action;
pub mod base_check;
pub mod base_value;
pub mod base_should;
pub mod base_expected;
pub mod base_describe;
pub mod base_it;
pub mod simple_adapter;
pub mod rusto;
pub mod rusto_impl;
pub mod rusto_artifactory;
pub mod rusto_helpers;
pub mod reverse_integration;
pub mod ast_transformer;
pub mod interoperability;

// Examples are standalone files in the examples/ directory, not library modules
// They are configured in Cargo.toml as [[example]] entries

// Note: Examples are standalone files in the examples/ directory
// They are not compiled into the library by default

// Re-export main types for convenience
pub use types::*;
pub use base_suite::BaseSuite;
pub use base_given::BaseGiven;
pub use base_when::BaseWhen;
pub use base_then::BaseThen;
pub use base_setup::BaseSetup;
pub use base_action::BaseAction;
pub use base_check::BaseCheck;
pub use base_value::BaseValue;
pub use base_should::BaseShould;
pub use base_expected::BaseExpected;
pub use base_describe::BaseDescribe;
pub use base_it::BaseIt;
pub use simple_adapter::SimpleTestAdapter;
pub use rusto::Rusto;
pub use reverse_integration::*;
pub use ast_transformer::RustASTTransformer;
pub use interoperability::*;

// Note: Example modules are standalone files in the examples/ directory
// They are not part of the library crate

/// Prelude module for convenient imports
pub mod prelude {
    pub use crate::types::*;
    pub use crate::BaseSuite;
    pub use crate::BaseGiven;
    pub use crate::BaseWhen;
    pub use crate::BaseThen;
    pub use crate::BaseSetup;
    pub use crate::BaseAction;
    pub use crate::BaseCheck;
    pub use crate::BaseValue;
    pub use crate::BaseShould;
    pub use crate::BaseExpected;
    pub use crate::BaseDescribe;
    pub use crate::BaseIt;
    pub use crate::SimpleTestAdapter;
    pub use crate::Rusto;
    pub use crate::RustASTTransformer;
    pub use crate::interoperability::*;
    
    // Note: Calculator examples are standalone files, not part of the library
}

/// Main entry point for creating a Rusto instance - matches TypeScript's tiposkripto
pub fn rusto<I, O, M>(
    web_or_node: &str,
    input: I::Iinput,
    test_specification: Box<dyn ITestSpecification<I, O>>,
    test_implementation: ITestImplementation<I, O, M>,
    test_resource_requirement: ITTestResourceRequest,
    test_adapter: Box<dyn IUniversalTestAdapter<I>>,
    test_resource_configuration: ITestResourceConfiguration,
    ws_port: &str,
    ws_host: &str,
) -> Rusto<I, O, M>
where
    I: IbddInAny + 'static,
    O: IbddOutAny + 'static,
    M: 'static,
    I::Iinput: Send + 'static,
    I::Isubject: Send + 'static,
    I::Istore: Send + 'static,
    I::Given: Send + 'static,
    I::Then: Send + 'static,
    I::When: Send + 'static,
{
    Rusto::new(
        web_or_node,
        input,
        test_specification,
        test_implementation,
        test_resource_requirement,
        test_adapter,
        test_resource_configuration,
        ws_port,
        ws_host,
    )
}

/// Simplified version for common use cases
pub fn rusto_simple<I, O, M>(
    web_or_node: &str,
    input: I::Iinput,
    test_specification: Box<dyn ITestSpecification<I, O>>,
    test_implementation: ITestImplementation<I, O, M>,
    test_adapter: Box<dyn IUniversalTestAdapter<I>>,
) -> Rusto<I, O, M>
where
    I: IbddInAny + 'static,
    O: IbddOutAny + 'static,
    M: 'static,
    I::Iinput: Send + 'static,
    I::Isubject: Send + 'static,
    I::Istore: Send + 'static,
    I::Given: Send + 'static,
    I::Then: Send + 'static,
    I::When: Send + 'static,
{
    Rusto::new(
        web_or_node,
        input,
        test_specification,
        test_implementation,
        ITTestResourceRequest::default(),
        test_adapter,
        ITestResourceConfiguration::default(),
        "8080",
        "localhost",
    )
}

/// Transform native Rust tests to Testeranto format
pub fn transform_rust_tests(file_path: &str) -> Result<String, String> {
    RustASTTransformer::transform_file(file_path)
}

/// Detect test functions in a Rust file
pub fn detect_rust_tests(file_path: &str) -> Result<Vec<String>, String> {
    RustASTTransformer::detect_tests(file_path)
}

/// Import tests from other Rust frameworks to Rusto
pub fn import_to_rusto(file_path: &str, framework: &str) -> Result<String, String> {
    let interop = interoperability::RustInteroperability::new();
    interop.import_to_rusto(file_path, framework)
}

/// Export Rusto tests to other Rust frameworks
pub fn export_from_rusto(file_path: &str, target_framework: &str) -> Result<String, String> {
    let interop = interoperability::RustInteroperability::new();
    interop.export_from_rusto(file_path, target_framework)
}

/// Create pairing between Rusto and other framework tests
pub fn create_test_pairing(file_path: &str) -> Result<std::collections::HashMap<String, String>, String> {
    let interop = interoperability::RustInteroperability::new();
    interop.create_pairing(file_path)
}

/// Create an artifactory that tracks context - matches TypeScript implementation
/// Note: Rust implementation only needs writeFileSync since screenshots and screencasts
/// are browser-specific features (WebTiposkripto handles those)
/// This is a necessary difference between web and other runtimes
pub fn create_artifactory(
    base_path: &str,
    context: std::collections::HashMap<String, String>,
) -> IArtifactory {
    let mut artifactory = IArtifactory::new();
    
    // Add write_file_sync method - follows Rust snake_case convention
    // Note: Rust is a server-side language and CANNOT capture screenshots or screencasts
    // Only the Web runtime (browser environment) can do visual captures
    // This is a necessary difference between web and other runtimes
    artifactory.insert("write_file_sync".to_string(), Box::new({
        let base_path = base_path.to_string();
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
            
            println!("[Artifactory] Writing to: {}", full_path);
            
            // Create directory if it doesn't exist
            if let Some(parent) = std::path::Path::new(&full_path).parent() {
                if !parent.exists() {
                    let _ = std::fs::create_dir_all(parent);
                }
            }
            
            // Write file
            if let Err(e) = std::fs::write(&full_path, payload) {
                println!("[Artifactory] Error writing file: {}", e);
            }
        }
    }) as Box<dyn std::any::Any + Send + Sync>);
    
    // Note: We do NOT include screenshot, openScreencast, or closeScreencast methods
    // because Rust is a server-side language and cannot capture visual content
    // This is a necessary difference between web and other runtimes
    
    artifactory
}
