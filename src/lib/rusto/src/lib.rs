//! Rusto - Rust implementation of Testeranto
//! 
//! This crate provides a Rust implementation of the Testeranto BDD testing framework.

pub mod types;
pub mod base_suite;
pub mod base_given;
pub mod base_when;
pub mod base_then;
pub mod base_setup;
pub mod base_action;
pub mod base_check;
pub mod base_arrange;
pub mod base_act;
pub mod base_assert;
pub mod base_map;
pub mod base_feed;
pub mod base_validate;
pub mod simple_adapter;
pub mod rusto;
pub mod reverse_integration;
pub mod ast_transformer;
pub mod interoperability;

// Re-export main types for convenience
pub use types::*;
pub use base_suite::BaseSuite;
pub use base_given::BaseGiven;
pub use base_when::BaseWhen;
pub use base_then::BaseThen;
pub use base_setup::BaseSetup;
pub use base_action::BaseAction;
pub use base_check::BaseCheck;
pub use base_arrange::BaseArrange;
pub use base_act::BaseAct;
pub use base_assert::BaseAssert;
pub use base_map::BaseMap;
pub use base_feed::BaseFeed;
pub use base_validate::BaseValidate;
pub use simple_adapter::SimpleTestAdapter;
pub use rusto::Rusto;
pub use reverse_integration::*;
pub use ast_transformer::RustASTTransformer;
pub use interoperability::*;

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
    pub use crate::BaseArrange;
    pub use crate::BaseAct;
    pub use crate::BaseAssert;
    pub use crate::BaseMap;
    pub use crate::BaseFeed;
    pub use crate::BaseValidate;
    pub use crate::SimpleTestAdapter;
    pub use crate::Rusto;
    pub use crate::RustASTTransformer;
    pub use crate::interoperability::*;
}

/// Main entry point for creating a Rusto instance
pub fn rusto<I, O, M>(
    input: I::Iinput,
    test_specification: Box<dyn ITestSpecification<I, O>>,
    test_implementation: ITestImplementation<I, O, M>,
    test_adapter: Box<dyn ITestAdapter<I>>,
    test_resource_requirement: ITTestResourceRequest,
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
{
    Rusto::new(
        input,
        test_specification,
        test_implementation,
        test_resource_requirement,
        test_adapter,
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
