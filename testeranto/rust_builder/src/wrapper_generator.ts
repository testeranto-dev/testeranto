use std::fs;
use std::path::Path;

pub fn generate_go_compatible_wrapper(
    test_file_path: &Path,
    bundles_dir: &Path,
    binary_name: &str,
    framework_type: &str,
) {
    // Create a Go wrapper that can execute the Rust binary
    let wrapper_path = bundles_dir.join(format!("{}_go_wrapper.go", binary_name));
    
    let wrapper_content = format!(r#"// Go-compatible wrapper for Rust test
// Original test: {}
// Framework: {}

package main

import (
    "fmt"
    "os"
    "os/exec"
    "path/filepath"
    "encoding/json"
)

type TestResult struct {{
    Name   string `json:"name"`
    Passed bool   `json:"passed"`
    Output string `json:"output,omitempty"`
}}

func main() {{
    // Get the path to the Rust binary
    exePath := filepath.Join(filepath.Dir(os.Args[0]), "{}")
    
    // Check if binary exists
    if _, err := os.Stat(exePath); os.IsNotExist(err) {{
        // Try with .exe extension
        exePath = exePath + ".exe"
        if _, err := os.Stat(exePath); os.IsNotExist(err) {{
            fmt.Fprintf(os.Stderr, "Rust binary not found: %s\n", exePath)
            os.Exit(1)
        }}
    }}
    
    // Execute the Rust binary
    cmd := exec.Command(exePath)
    output, err := cmd.CombinedOutput()
    
    result := TestResult{{
        Name:   "{}",
        Passed: err == nil,
        Output: string(output),
    }}
    
    // Output JSON result for Go test runner
    jsonResult, jsonErr := json.Marshal(result)
    if jsonErr != nil {{
        fmt.Fprintf(os.Stderr, "Failed to marshal result: %v\n", jsonErr)
        os.Exit(1)
    }}
    
    fmt.Println(string(jsonResult))
    
    if err != nil {{
        os.Exit(1)
    }}
}}
"#, 
        test_file_path.display(), 
        framework_type,
        binary_name,
        binary_name
    );
    
    if let Err(e) = fs::write(&wrapper_path, wrapper_content) {
        eprintln!("  ⚠️  Failed to generate Go wrapper: {}", e);
        return;
    }
    
    println!("  ✅ Generated Go-compatible wrapper for Rust test");
    
    // Also create a simple Rust test runner that outputs JSON
    let rust_runner_path = bundles_dir.join(format!("{}_runner.rs", binary_name));
    let rust_runner_content = format!(r#"// Rust test runner for Go compatibility
use std::process::Command;
use std::env;
use serde_json::json;

fn main() {{
    // Run the actual test binary
    let current_exe = env::current_exe().expect("Failed to get current executable path");
    let test_binary = current_exe.with_file_name("{}");
    
    let output = Command::new(test_binary)
        .output()
        .expect("Failed to execute test binary");
    
    // Create JSON result
    let result = json!({{
        "name": "{}",
        "passed": output.status.success(),
        "output": String::from_utf8_lossy(&output.stdout),
        "error": String::from_utf8_lossy(&output.stderr),
    }});
    
    println!("{{}}", result);
    
    // Exit with appropriate code
    std::process::exit(if output.status.success() {{ 0 }} else {{ 1 }});
}}
"#,
        binary_name,
        binary_name
    );
    
    if let Err(e) = fs::write(&rust_runner_path, rust_runner_content) {
        eprintln!("  ⚠️  Failed to generate Rust runner: {}", e);
    }
}
