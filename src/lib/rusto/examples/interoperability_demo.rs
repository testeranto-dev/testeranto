//! Demonstration of Rusto interoperability with other Rust test frameworks

use rusto::interoperability::{RustInteroperability, RustTestInteroperability};
use std::fs;
use tempfile::NamedTempFile;

fn main() -> Result<(), String> {
    println!("=== Rusto Interoperability Demo ===");
    
    // Create a sample Rust test file
    let rust_test_content = r#"
#[test]
fn test_addition() {
    assert_eq!(2 + 2, 4);
}

#[tokio::test]
async fn test_async_operation() {
    let result = async { 42 }.await;
    assert_eq!(result, 42);
}

fn helper_function() -> i32 {
    42
}
"#;
    
    // Write to a temporary file
    let mut temp_file = NamedTempFile::new().map_err(|e| e.to_string())?;
    let file_path = temp_file.path().to_str().unwrap().to_string();
    
    fs::write(&file_path, rust_test_content).map_err(|e| e.to_string())?;
    println!("Created sample Rust test file: {}", file_path);
    
    // Create interoperability instance
    let interop = RustInteroperability::new();
    
    // Detect framework
    let framework = interop.detect_rust_framework(&file_path)?;
    println!("Detected framework: {}", framework);
    
    // Import to Rusto
    println!("\n--- Importing to Rusto ---");
    let rusto_code = interop.import_to_rusto(&file_path, &framework)?;
    println!("Generated Rusto code:\n{}", rusto_code);
    
    // Create pairing
    println!("\n--- Creating Test Pairing ---");
    let pairing = interop.create_pairing(&file_path)?;
    for (key, value) in &pairing {
        println!("{} -> {}", key, value);
    }
    
    // List supported frameworks
    println!("\n--- Supported Frameworks ---");
    println!("Import: {:?}", interop.supported_import_frameworks());
    println!("Export: {:?}", interop.supported_export_frameworks());
    
    // Clean up
    temp_file.close().map_err(|e| e.to_string())?;
    
    println!("\n=== Demo Complete ===");
    Ok(())
}
