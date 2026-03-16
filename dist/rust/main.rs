// The rust builder
// runs in a docker image and produces built rust tests

use std::env;
use std::fs;
use std::path::Path;
use std::process::Command;
use serde_json;
use std::collections::HashMap;
#[cfg(unix)]
use std::os::unix::process::ExitStatusExt;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 Rust builder starting...");
    
    // Parse command line arguments
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 4 {
        eprintln!("❌ Insufficient arguments");
        eprintln!("Usage: {} <project_config> <rust_config> <config_key> <entry_points...>", args[0]);
        std::process::exit(1);
    }
    
    let _project_config_file_path = &args[1];
    let _rust_config_file_path = &args[2];
    let config_key = &args[3];
    let entry_points = &args[4..];
    
    println!("Config key: {}", config_key);
    println!("Entry points: {:?}", entry_points);
    
    if entry_points.is_empty() {
        eprintln!("❌ No entry points provided");
        std::process::exit(1);
    }
    
    // Change to workspace directory
    let workspace = Path::new("/workspace");
    env::set_current_dir(workspace)?;
    
    // Check if we're in a Cargo project
    let cargo_toml_path = workspace.join("Cargo.toml");
    if !cargo_toml_path.exists() {
        eprintln!("❌ Not a Cargo project: Cargo.toml not found");
        std::process::exit(1);
    }
    
    // Create bundles directory
    let bundles_dir = workspace.join("testeranto/bundles").join(config_key);
    fs::create_dir_all(&bundles_dir)?;
    
    // Create a map to store all tests' information
    let mut all_tests_info: HashMap<String, serde_json::Value> = HashMap::new();
    
    // Check if we can build the main project (but don't include test files)
    // First, check if there's a Cargo.toml and it's valid
    println!("🔨 Checking Cargo project...");
    let check_status = Command::new("cargo")
        .args(&["check", "--release", "--bins"])
        .status();
    
    match check_status {
        Ok(status) => {
            if !status.success() {
                println!("⚠️  Cargo check had issues, but continuing with test builds");
            }
        }
        Err(_) => {
            println!("⚠️  Cargo check failed, but continuing anyway");
        }
    }
    
    // Process each entry point
    for entry_point in entry_points {
        println!("\n📦 Processing Rust test: {}", entry_point);
        
        // Get entry point path
        let entry_point_path = workspace.join(entry_point);
        if !entry_point_path.exists() {
            eprintln!("  ❌ Entry point does not exist: {}", entry_point_path.display());
            std::process::exit(1);
        }
        
        // Get base name for binary
        let file_name = entry_point_path.file_name()
            .unwrap_or_default()
            .to_str()
            .unwrap_or("");
        if !file_name.ends_with(".rs") {
            eprintln!("  ❌ Entry point is not a Rust file: {}", entry_point);
            std::process::exit(1);
        }
        
        // Create a valid crate name: replace dots and slashes with underscores
        // Also ensure it starts with a letter and contains only alphanumeric characters or underscores
        let binary_name = entry_point
            .replace("/", "_")
            .replace(".", "_")
            .replace("-", "_");
        // Ensure the name is valid for Rust crate
        let valid_binary_name = binary_name
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '_')
            .collect::<String>();
        
        // Collect input files
        let input_files = collect_input_files(&entry_point_path, workspace);
        
        // Compute hash
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        let mut hasher = DefaultHasher::new();
        for file in &input_files {
            file.hash(&mut hasher);
        }
        let hash = hasher.finish();
        let hash_str = format!("{:x}", hash);
        
        // Store test information
        let test_info = serde_json::json!({
            "hash": hash_str,
            "files": input_files
        });
        all_tests_info.insert(entry_point.to_string(), test_info);
        
        // Create a custom build for this test
        // We'll create a simple main.rs that includes the test file
        let test_temp_dir = workspace.join("target").join("testeranto_build").join(&valid_binary_name);
        fs::create_dir_all(&test_temp_dir)?;
        
        // Create Cargo.toml for the test binary
        // The test needs serde_json to parse command line arguments
        let cargo_toml_content = format!(r#"[package]
name = "{}"
version = "0.1.0"
edition = "2021"

[[bin]]
name = "{}"
path = "src/main.rs"

[dependencies]
serde_json = "1.0"
"#, valid_binary_name, valid_binary_name);
        
        fs::write(test_temp_dir.join("Cargo.toml"), cargo_toml_content)?;
        
        // Create src directory structure matching the original
        // We need to preserve the directory structure for include! macros
        let test_dir = entry_point_path.parent().unwrap_or_else(|| Path::new(""));
        let relative_test_dir = test_dir.strip_prefix(workspace).unwrap_or(test_dir);
        
        // Create the same directory structure in temp dir
        let temp_test_dir = test_temp_dir.join("src").join(relative_test_dir);
        fs::create_dir_all(&temp_test_dir)?;
        
        // Copy all .rs files from the test directory to preserve includes
        if let Ok(entries) = fs::read_dir(test_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().map(|e| e == "rs").unwrap_or(false) {
                    let dest_path = temp_test_dir.join(path.file_name().unwrap());
                    fs::copy(&path, &dest_path)?;
                    println!("  📄 Copied: {:?} -> {:?}", path.file_name(), dest_path);
                }
            }
        }
        
        // Read the test file content
        let test_content = fs::read_to_string(&entry_point_path)?;
        
        // Create main.rs in the src root that includes the test file
        // We need to calculate the relative path from src root to the test file
        let test_file_name = entry_point_path.file_name().unwrap().to_str().unwrap();
        let relative_path_from_src = relative_test_dir.join(test_file_name);
        let relative_path_str = relative_path_from_src.to_str().unwrap();
        
        // Create a simple main.rs that includes the test file
        // Since the test file already has a main function, we can just use it
        let main_content = format!(r#"// Auto-generated main for test: {}
mod test_wrapper {{
    #![allow(unused_imports)]
    // Include the test file
    include!("{}");
}}

fn main() {{
    // Delegate to the test's main function
    test_wrapper::main();
}}"#, entry_point, relative_path_str);
        
        // Write main.rs at the src root
        fs::write(test_temp_dir.join("src").join("main.rs"), main_content)?;
        
        // Build the test binary
        println!("  🔨 Building test binary: {}...", valid_binary_name);
        let build_status = Command::new("cargo")
            .current_dir(&test_temp_dir)
            .args(&["build", "--release"])
            .status()?;
        
        if !build_status.success() {
            eprintln!("  ❌ Failed to build test binary: {}", valid_binary_name);
            // Try to get more info
            let _ = Command::new("cargo")
                .current_dir(&test_temp_dir)
                .args(&["build", "--release", "--verbose"])
                .status();
            std::process::exit(1);
        }
        
        // Copy the binary to bundles directory
        let source_bin = test_temp_dir.join("target/release").join(&valid_binary_name);
        if !source_bin.exists() {
            // Try with different binary name (on Windows it might have .exe)
            let source_bin_exe = source_bin.with_extension("exe");
            if source_bin_exe.exists() {
                let dest_bin = bundles_dir.join(&valid_binary_name).with_extension("exe");
                fs::copy(&source_bin_exe, &dest_bin)?;
                make_executable(&dest_bin)?;
                println!("  ✅ Compiled binary at: {:?}", dest_bin);
            } else {
                eprintln!("  ❌ Compiled binary not found at {:?} or {:?}", source_bin, source_bin_exe);
                std::process::exit(1);
            }
        } else {
            let dest_bin = bundles_dir.join(&valid_binary_name);
            fs::copy(&source_bin, &dest_bin)?;
            make_executable(&dest_bin)?;
            println!("  ✅ Compiled binary at: {:?}", dest_bin);
        }
        
        // Clean up temporary directory
        let _ = fs::remove_dir_all(test_temp_dir);
    }
    
    // Write single inputFiles.json for all tests
    let input_files_path = bundles_dir.join("inputFiles.json");
    fs::write(&input_files_path, serde_json::to_string_pretty(&all_tests_info)?)?;
    println!("\n✅ Created inputFiles.json at {:?} with {} tests", input_files_path, all_tests_info.len());
    
    println!("\n🎉 Rust builder completed successfully");
    Ok(())
}

fn collect_input_files(test_path: &Path, workspace: &Path) -> Vec<String> {
    let mut files = Vec::new();
    
    // Add the test file itself
    if let Ok(relative) = test_path.strip_prefix(workspace) {
        files.push(relative.to_string_lossy().to_string());
    } else {
        files.push(test_path.to_string_lossy().to_string());
    }
    
    // Add Cargo.toml
    let cargo_toml = workspace.join("Cargo.toml");
    if cargo_toml.exists() {
        files.push("Cargo.toml".to_string());
    }
    
    // Add Cargo.lock if present
    let cargo_lock = workspace.join("Cargo.lock");
    if cargo_lock.exists() {
        files.push("Cargo.lock".to_string());
    }
    
    // Add all .rs files in the same directory as the test
    if let Some(parent) = test_path.parent() {
        if let Ok(entries) = fs::read_dir(parent) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().map(|e| e == "rs").unwrap_or(false) {
                    if let Ok(relative) = path.strip_prefix(workspace) {
                        files.push(relative.to_string_lossy().to_string());
                    }
                }
            }
        }
    }
    
    // Add src/ directory files
    let src_dir = workspace.join("src");
    if src_dir.exists() {
        collect_rs_files_recursive(&src_dir, workspace, &mut files);
    }
    
    files
}

fn collect_rs_files_recursive(dir: &Path, workspace: &Path, files: &mut Vec<String>) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                collect_rs_files_recursive(&path, workspace, files);
            } else if path.extension().map(|e| e == "rs").unwrap_or(false) {
                if let Ok(relative) = path.strip_prefix(workspace) {
                    files.push(relative.to_string_lossy().to_string());
                }
            }
        }
    }
}

fn make_executable(path: &Path) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(path)?.permissions();
        perms.set_mode(0o755);
        fs::set_permissions(path, perms)?;
    }
    #[cfg(windows)]
    {
        // Windows doesn't have executable permissions in the same way
        // Just ensure the file exists
    }
    Ok(())
}
