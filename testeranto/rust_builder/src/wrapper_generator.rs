use std::fs;
use std::path::Path;

pub fn generate_testeranto_wrapper(
    test_file_path: &Path,
    bundles_dir: &Path,
    binary_name: &str,
    framework_type: &str,
) {
    // Create a Rust wrapper that adapts native Rust tests to Testeranto framework
    let wrapper_path = bundles_dir.join(format!("{}_testeranto.rs", binary_name));
    
    let wrapper_content = format!(r#"// Testeranto-compatible wrapper for native Rust test
// Original test: {}
// Framework: {}

use std::process::{{Command, ExitStatus}};
use std::env;
use std::io::{{self, Write}};

fn run_native_test() -> Result<(String, ExitStatus), String> {{
    // Get the path to the compiled test binary
    let current_exe = env::current_exe()
        .map_err(|e| format!("Failed to get current executable path: {{}}", e))?;
    
    // The actual test binary should be in the same directory
    let test_binary = current_exe.with_file_name("{}");
    
    // Check if binary exists
    if !test_binary.exists() {{
        // Try with .exe extension
        let test_binary_exe = test_binary.with_extension("exe");
        if test_binary_exe.exists() {{
            return execute_test(&test_binary_exe);
        }}
        return Err(format!("Test binary not found: {{}} or {{}}.exe", 
            test_binary.display(), test_binary.display()));
    }}
    
    execute_test(&test_binary)
}}

fn execute_test(test_binary: &std::path::Path) -> Result<(String, ExitStatus), String> {{
    let output = Command::new(test_binary)
        .output()
        .map_err(|e| format!("Failed to execute test binary: {{}}", e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    
    // Combine stdout and stderr
    let mut combined = String::new();
    if !stdout.is_empty() {{
        combined.push_str(&stdout);
    }}
    if !stderr.is_empty() {{
        if !combined.is_empty() {{
            combined.push_str("\n");
        }}
        combined.push_str(&stderr);
    }}
    
    Ok((combined, output.status))
}}

fn main() {{
    match run_native_test() {{
        Ok((output, status)) => {{
            // Write output to stdout
            io::stdout().write_all(output.as_bytes())
                .expect("Failed to write output");
            
            // Exit with the same status code as the test
            if let Some(code) = status.code() {{
                std::process::exit(code);
            }} else {{
                // If no exit code, exit with 1 if not successful
                std::process::exit(if status.success() {{ 0 }} else {{ 1 }});
            }}
        }},
        Err(e) => {{
            eprintln!("Error running native test: {{}}", e);
            std::process::exit(1);
        }}
    }}
}}

// Testeranto integration point
// This function can be called by the Testeranto framework to run the test
pub fn run_test() -> Result<String, String> {{
    match run_native_test() {{
        Ok((output, status)) => {{
            let success = status.success();
            let result = if success {{
                format!("PASS: {{}}", output)
            }} else {{
                format!("FAIL: {{}}", output)
            }};
            Ok(result)
        }},
        Err(e) => Err(e),
    }}
}}
"#, 
        test_file_path.display(), 
        framework_type,
        binary_name
    );
    
    if let Err(e) = fs::write(&wrapper_path, wrapper_content) {
        eprintln!("  ⚠️  Failed to generate Testeranto wrapper: {}", e);
        return;
    }
    
    println!("  ✅ Generated Testeranto-compatible wrapper for native Rust test");
    
    // Also create a build script to compile the wrapper
    let build_script_path = bundles_dir.join(format!("{}_build.rs", binary_name));
    let build_script_content = format!(r#"// Build script for Testeranto wrapper
fn main() {{
    println!("cargo:rerun-if-changed={}");
    println!("cargo:rerun-if-changed={}_testeranto.rs");
}}
"#,
        binary_name,
        binary_name
    );
    
    if let Err(e) = fs::write(&build_script_path, build_script_content) {
        eprintln!("  ⚠️  Failed to generate build script: {}", e);
    }
}
