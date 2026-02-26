// The rust builder
// runs in a docker image and produces built rust tests

use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use serde_json;
use md5;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 Rust builder starting...");
    
    // Parse command line arguments similar to Ruby and Python runtimes
    // Expected: main.rs project_config_file_path rust_config_file_path test_name entryPoints...
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 4 {
        eprintln!("❌ Insufficient arguments");
        eprintln!("Usage: {} <project_config> <rust_config> <test_name> <entry_points...>", args[0]);
        std::process::exit(1);
    }
    
    let project_config_file_path = &args[1];
    let rust_config_file_path = &args[2];
    let test_name = &args[3];
    let entry_points = &args[4..];
    
    println!("Project config: {}", project_config_file_path);
    println!("Rust config: {}", rust_config_file_path);
    println!("Test name: {}", test_name);
    println!("Entry points: {:?}", entry_points);
    
    if entry_points.is_empty() {
        eprintln!("❌ No entry points provided");
        std::process::exit(1);
    }
    
    // Change to workspace directory for compilation
    let workspace = Path::new("/workspace");
    env::set_current_dir(workspace)?;
    
    // Process each entry point
    for entry_point in entry_points {
        println!("\n📦 Processing Rust test: {}", entry_point);
        
        // Get absolute path to entry point
        let entry_point_path = Path::new(entry_point);
        if !entry_point_path.exists() {
            eprintln!("  ⚠️  Entry point does not exist: {}", entry_point);
            continue;
        }
        
        // Get test file name and base name (binary name)
        let test_file_name = entry_point_path.file_name()
            .unwrap_or_default()
            .to_str()
            .unwrap_or("");
        let test_base_name = test_file_name.replace(".rs", "");
        
        // Collect input files (dependencies)
        let input_files = collect_input_files(entry_point_path);
        
        // Compute hash of input files
        let test_hash = compute_files_hash(&input_files);
        
        // Create artifacts directory structure similar to other runtimes
        // Ruby pattern: testeranto/bundles/{test_name}/
        let artifacts_dir = Path::new("/workspace").join("testeranto/bundles").join(test_name);
        fs::create_dir_all(&artifacts_dir)?;
        
        // Create inputFiles.json (similar to Ruby/Python)
        // Ruby pattern: testeranto/bundles/#{test_name}/#{entry_point}-inputFiles.json
        let input_files_basename = entry_point.replace("/", "_").replace("\\", "_") + "-inputFiles.json";
        let input_files_path = artifacts_dir.join(input_files_basename);
        let input_files_json = serde_json::to_string_pretty(&input_files)?;
        fs::write(&input_files_path, input_files_json)?;
        
        println!("  ✅ Created inputFiles.json at {:?} (hash: {})", input_files_path, test_hash);
        
        // For Rust, we need to compile the test into an executable
        // The executable will be placed in the bundle directory
        if entry_point.ends_with(".rs") {
            println!("  🔨 Compiling Rust test: {}...", test_base_name);
            
            // Build with cargo for this specific binary
            let status = Command::new("cargo")
                .args(&["build", "--release", "--bin", &test_base_name])
                .status()?;
            
            if status.success() {
                println!("  ✅ Successfully compiled {}", test_base_name);
                
                // Source binary path (cargo output)
                let source_bin_path = workspace
                    .join("target")
                    .join("release")
                    .join(&test_base_name);
                
                if source_bin_path.exists() {
                    // Destination path in bundle directory
                    // We'll place the executable at: testeranto/bundles/{test_name}/{entry_point_without_extension}
                    let bundle_exe_path = artifacts_dir.join(&test_base_name);
                    
                    // Copy the compiled binary to bundle directory
                    fs::copy(&source_bin_path, &bundle_exe_path)?;
                    
                    // Make it executable
                    #[cfg(unix)]
                    {
                        use std::os::unix::fs::PermissionsExt;
                        let mut perms = fs::metadata(&bundle_exe_path)?.permissions();
                        perms.set_mode(0o755);
                        fs::set_permissions(&bundle_exe_path, perms)?;
                    }
                    
                    println!("  ✅ Executable placed at: {:?}", bundle_exe_path);
                    
                    // Also create a dummy file with the original entry point name for consistency
                    // This helps with the pattern used by other runtimes
                    let dummy_bundle_path = artifacts_dir.join(entry_point);
                    if let Some(parent) = dummy_bundle_path.parent() {
                        fs::create_dir_all(parent)?;
                    }
                    
                    // Create a simple stub that execs the compiled binary
                    // This is similar to what Python/Ruby do with dummy files
                    let dummy_content = format!(r#"#!/usr/bin/env bash
# Dummy bundle file generated by testeranto
# Hash: {}
# This file execs the compiled Rust binary: {}

exec "{}/{}" "$@"
"#, test_hash, test_base_name, artifacts_dir.display(), test_base_name);
                    
                    fs::write(&dummy_bundle_path, dummy_content)?;
                    
                    #[cfg(unix)]
                    {
                        use std::os::unix::fs::PermissionsExt;
                        let mut perms = fs::metadata(&dummy_bundle_path)?.permissions();
                        perms.set_mode(0o755);
                        fs::set_permissions(&dummy_bundle_path, perms)?;
                    }
                    
                    println!("  ✅ Created dummy bundle at: {:?}", dummy_bundle_path);
                } else {
                    eprintln!("  ⚠️  Compiled binary not found at {:?}", source_bin_path);
                }
            } else {
                eprintln!("  ❌ Cargo build failed for {}", test_base_name);
                // Create a placeholder executable to avoid breaking the pipeline
                let placeholder_path = artifacts_dir.join(&test_base_name);
                fs::write(&placeholder_path, b"#!/bin/bash\necho 'Build failed'\nexit 1")?;
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    let mut perms = fs::metadata(&placeholder_path)?.permissions();
                    perms.set_mode(0o755);
                    fs::set_permissions(&placeholder_path, perms)?;
                }
                eprintln!("  ⚠️  Created placeholder executable at {:?}", placeholder_path);
            }
        } else {
            eprintln!("  ⚠️  Entry point is not a Rust file: {}", entry_point);
        }
    }
    
    println!("\n🎉 Rust builder completed successfully");
    Ok(())
}

fn collect_input_files(test_path: &Path) -> Vec<String> {
    let mut files = Vec::new();
    
    // Add the test file itself
    if let Ok(relative) = test_path.strip_prefix("/workspace") {
        files.push(relative.to_string_lossy().to_string());
    } else {
        files.push(test_path.to_string_lossy().to_string());
    }
    
    // Look for Rust files in the same directory
    if let Some(parent) = test_path.parent() {
        if let Ok(entries) = fs::read_dir(parent) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().map(|e| e == "rs").unwrap_or(false) {
                    if let Ok(relative) = path.strip_prefix("/workspace") {
                        let rel_str = relative.to_string_lossy().to_string();
                        if !files.contains(&rel_str) {
                            files.push(rel_str);
                        }
                    }
                }
            }
        }
    }
    
    // Add Cargo.toml if present
    let workspace = Path::new("/workspace");
    let cargo_toml = workspace.join("Cargo.toml");
    if cargo_toml.exists() {
        files.push("Cargo.toml".to_string());
    }
    
    // Add Cargo.lock if present
    let cargo_lock = workspace.join("Cargo.lock");
    if cargo_lock.exists() {
        files.push("Cargo.lock".to_string());
    }
    
    // Add any .rs files in src/ directory if it exists
    let src_dir = workspace.join("src");
    if src_dir.exists() {
        if let Ok(entries) = fs::read_dir(src_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().map(|e| e == "rs").unwrap_or(false) {
                    if let Ok(relative) = path.strip_prefix("/workspace") {
                        let rel_str = relative.to_string_lossy().to_string();
                        if !files.contains(&rel_str) {
                            files.push(rel_str);
                        }
                    }
                }
            }
        }
    }
    
    files
}

fn compute_files_hash(files: &[String]) -> String {
    use md5::Context;
    let mut context = Context::new();
    
    for file in files {
        context.consume(file.as_bytes());
        let file_path = Path::new("/workspace").join(file);
        match fs::metadata(&file_path) {
            Ok(metadata) => {
                if let Ok(modified) = metadata.modified() {
                    if let Ok(duration) = modified.elapsed() {
                        context.consume(duration.as_millis().to_string().as_bytes());
                    }
                }
                context.consume(metadata.len().to_string().as_bytes());
            }
            Err(_) => {
                context.consume(b"missing");
            }
        }
    }
    
    let digest = context.compute();
    format!("{:x}", digest)
}
