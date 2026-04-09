use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::process::Command;
use serde_json;

use crate::file_collector;
use crate::native_detection;
use crate::permissions;
use crate::wrapper_generator;

pub fn process_entry_points(
    entry_points: &[String],
    workspace: &Path,
    bundles_dir: &Path,
) -> Result<HashMap<String, serde_json::Value>, Box<dyn std::error::Error>> {
    let mut all_tests_info: HashMap<String, serde_json::Value> = HashMap::new();
    
    for entry_point in entry_points {
        println!("\n📦 Processing Rust test: {}", entry_point);
        
        // Get entry point path - entry_point is relative to workspace root
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
        
        // Detect if this is a native test
        let is_native_test = native_detection::detect_native_test(&entry_point_path);
        let framework_type = if is_native_test {
            native_detection::get_test_framework(&entry_point_path)
        } else {
            "unknown".to_string()
        };
        
        if is_native_test {
            println!("  Detected native Rust test (framework: {})", framework_type);
            // Generate Testeranto-compatible wrapper for native Rust tests
            wrapper_generator::generate_testeranto_wrapper(&entry_point_path, bundles_dir, &valid_binary_name, &framework_type);
        }
        
        // Collect input files
        let input_files = file_collector::collect_input_files(&entry_point_path, workspace);
        
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
            "files": input_files,
            "isNativeTest": is_native_test,
            "frameworkType": framework_type
        });
        all_tests_info.insert(entry_point.to_string(), test_info);
        
        // Instead of building a separate binary, we'll use the existing Rust project
        // and build the specific test binary that's already defined in Cargo.toml
        
        // The entry point is a Rust source file that should already be part of the project
        // We need to determine which binary target it corresponds to
        
        // First, check if the entry point exists
        if !entry_point_path.exists() {
            eprintln!("  ❌ Entry point does not exist: {}", entry_point_path.display());
            std::process::exit(1);
        }
        
        // Read the Cargo.toml to find binary and example targets
        let cargo_toml_path = workspace.join("Cargo.toml");
        let cargo_toml_content = fs::read_to_string(&cargo_toml_path)?;
        
        // Simple parsing to find [[bin]] and [[example]] sections
        let mut targets = Vec::new(); // (name, path, target_type: "bin" or "example")
        let lines: Vec<&str> = cargo_toml_content.lines().collect();
        let mut in_section = false;
        let mut current_name = None;
        let mut current_path = None;
        let mut current_type = None;
        
        for line in lines {
            let trimmed = line.trim();
            if trimmed.starts_with("[[bin]]") {
                in_section = true;
                current_name = None;
                current_path = None;
                current_type = Some("bin");
            } else if trimmed.starts_with("[[example]]") {
                in_section = true;
                current_name = None;
                current_path = None;
                current_type = Some("example");
            } else if in_section && trimmed.starts_with("name =") {
                current_name = Some(trimmed.trim_start_matches("name =").trim().trim_matches('"'));
            } else if in_section && trimmed.starts_with("path =") {
                current_path = Some(trimmed.trim_start_matches("path =").trim().trim_matches('"'));
            } else if trimmed.starts_with('[') && !trimmed.starts_with("[[") {
                // New section starting
                if in_section {
                    if let (Some(name), Some(path), Some(target_type)) = (current_name, current_path, current_type) {
                        targets.push((name.to_string(), path.to_string(), target_type.to_string()));
                    }
                    in_section = false;
                    current_type = None;
                }
            }
        }
        
        // Check last section
        if in_section {
            if let (Some(name), Some(path), Some(target_type)) = (current_name, current_path, current_type) {
                targets.push((name.to_string(), path.to_string(), target_type.to_string()));
            }
        }
        
        println!("  📋 Found {} targets in Cargo.toml", targets.len());
        
        // Try to find which target matches our entry point
        let mut matching_target = None;
        for (target_name, target_path, target_type) in &targets {
            let absolute_target_path = Path::new(target_path);
            if absolute_target_path == entry_point_path || 
               absolute_target_path.canonicalize().ok() == entry_point_path.canonicalize().ok() {
                matching_target = Some((target_name.clone(), target_type.clone()));
                break;
            }
        }
        
        // If no exact match, try to find by filename
        if matching_target.is_none() {
            let entry_filename = entry_point_path.file_name().unwrap_or_default().to_str().unwrap_or("");
            for (target_name, target_path, target_type) in &targets {
                let path = Path::new(target_path);
                if path.file_name().unwrap_or_default() == entry_filename {
                    matching_target = Some((target_name.clone(), target_type.clone()));
                    break;
                }
            }
        }
        
        let (target_name, target_type) = if let Some((name, ttype)) = matching_target {
            println!("  🔍 Found matching {} target: {}", ttype, name);
            (name, ttype)
        } else {
            // Create a binary name from the entry point path
            let name = entry_point
                .replace("/", "_")
                .replace(".", "_")
                .replace("-", "_");
            // Ensure valid Rust identifier
            let valid_name: String = name.chars()
                .filter(|c| c.is_alphanumeric() || *c == '_')
                .collect();
            println!("  ⚠️  No matching target found, using generated binary name: {}", valid_name);
            (valid_name, "bin".to_string())
        };
        
        // Check for and handle lock file version issues before building
        let lock_file_path = workspace.join("Cargo.lock");
        if lock_file_path.exists() {
            // Try to read the lock file to check its version
            if let Ok(content) = std::fs::read_to_string(&lock_file_path) {
                if content.contains("version = 4") {
                    println!("  ⚠️  Cargo lock file version 4 detected - removing incompatible lock file");
                    // Remove the incompatible lock file
                    if let Err(e) = std::fs::remove_file(&lock_file_path) {
                        eprintln!("  ⚠️  Failed to remove Cargo.lock: {}", e);
                    } else {
                        println!("  ✅ Removed incompatible Cargo.lock file");
                    }
                }
            }
        }
        
        // Build the specific target
        println!("  🔨 Building {}: {}...", target_type, target_name);
        let build_args = match target_type.as_str() {
            "example" => vec!["build", "--release", "--example", &target_name],
            _ => vec!["build", "--release", "--bin", &target_name],
        };
        let build_status = Command::new("cargo")
            .current_dir(workspace)
            .args(&build_args)
            .status()?;
        
        if !build_status.success() {
            eprintln!("  ❌ Failed to build {}: {}", target_type, target_name);
            // Try to get more info
            let _ = Command::new("cargo")
                .current_dir(workspace)
                .args(&build_args)
                .arg("--verbose")
                .status();
            std::process::exit(1);
        }
        
        // Copy the compiled target to bundles directory
        let source_bin = workspace.join("target/release").join(
            match target_type.as_str() {
                "example" => "examples",
                _ => "",
            }
        ).join(&target_name);
        
        // Check if binary exists (with or without .exe extension)
        let binary_exists = source_bin.exists();
        let source_bin_exe = source_bin.with_extension("exe");
        let exe_exists = source_bin_exe.exists();
        
        if !binary_exists && !exe_exists {
            eprintln!("  ❌ Compiled {} not found at {:?} or {:?}", target_type, source_bin, source_bin_exe);
            // List target/release directory
            let target_release_path = workspace.join("target/release");
            let _ = Command::new("ls")
                .current_dir(&workspace)
                .args(&["-la", target_release_path.to_str().unwrap_or("target/release")])
                .status();
            std::process::exit(1);
        }
        
        let dest_bin = if exe_exists {
            bundles_dir.join(&target_name).with_extension("exe")
        } else {
            bundles_dir.join(&target_name)
        };
        
        if exe_exists {
            fs::copy(&source_bin_exe, &dest_bin)?;
        } else {
            fs::copy(&source_bin, &dest_bin)?;
        }
        permissions::make_executable(&dest_bin)?;
        println!("  ✅ Compiled {} at: {:?}", target_type, dest_bin);
    }
    
    Ok(all_tests_info)
}
