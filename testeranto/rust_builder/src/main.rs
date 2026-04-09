// The rust builder
// runs in a docker image and produces built rust tests

// Modules in the same directory
mod test_processor;
mod file_collector;
mod native_detection;
mod output_artifacts;
mod permissions;
mod wrapper_generator;

extern crate ctrlc;

use std::env;
use std::process::Command;
use serde_json;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 Rust builder starting...");
    
    // Parse command line arguments
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 3 {
        eprintln!("❌ Insufficient arguments");
        eprintln!("Usage: {} <project_config> <rust_config> <config_slice>", args[0]);
        eprintln!("Where config_slice is a JSON string with fields: name, tests, outputs");
        std::process::exit(1);
    }
    
    let _rust_config_file_path = &args[1];
    // args[2] is a JSON string containing name, tests and outputs
    let config_json = if args.len() > 2 { &args[3] } else { "{\"name\":\"default\",\"tests\":[],\"outputs\":[]}" };
    let mut entry_points = Vec::new();
    let mut outputs = Vec::new();
    let mut config_key = "default".to_string();
    
    match serde_json::from_str::<serde_json::Value>(config_json) {
        Ok(config) => {
            // Parse config key from "name" field
            if let Some(name) = config.get("name").and_then(|n| n.as_str()) {
                config_key = name.to_string();
            }
            // Parse tests
            if let Some(tests_array) = config.get("tests").and_then(|t| t.as_array()) {
                for test in tests_array {
                    if let Some(test_str) = test.as_str() {
                        entry_points.push(test_str.to_string());
                    }
                }
            }
            // Parse outputs
            if let Some(outputs_array) = config.get("outputs").and_then(|o| o.as_array()) {
                for output in outputs_array {
                    if let Some(output_str) = output.as_str() {
                        outputs.push(output_str.to_string());
                    }
                }
            }
        }
        Err(e) => {
            println!("[Rust Builder] Failed to parse config JSON: {}", e);
            //  NO FALLBACKS! Observe SOUl.md
            // Fallback to old behavior for compatibility
            // if args.len() > 3 {
            //     config_key = args[3].clone();
            // }
            // if args.len() > 4 {
            //     entry_points = args[4..].iter().map(|s| s.to_string()).collect();
            // }
        }
    }
    
    // Check if we're in dev mode
    let mode = std::env::var("MODE").unwrap_or_else(|_| "once".to_string());
    let is_dev_mode = mode == "dev";
    
    println!("[Rust Builder] Config key: {}", config_key);
    println!("[Rust Builder] Entry points: {:?}", entry_points);
    println!("[Rust Builder] Mode: {}", if is_dev_mode { "dev" } else { "once" });
    
    if entry_points.is_empty() {
        eprintln!("❌ No entry points provided");
        std::process::exit(1);
    }
    
    // Check if entry points exist relative to current directory
    println!("[Rust Builder] Checking entry points:");
    for entry_point in &entry_points {
        let full_path = std::path::Path::new(entry_point);
        if full_path.exists() {
            println!("  ✅ {} exists at: {}", entry_point, full_path.display());
        } else {
            println!("  ❌ {} does not exist at: {}", entry_point, full_path.display());
            // Try with workspace
            let workspace = env::current_dir()?;
            let workspace_path = workspace.join(entry_point);
            if workspace_path.exists() {
                println!("     But exists at: {}", workspace_path.display());
            }
        }
    }
    
    // Use current directory as workspace root
    let workspace_root = env::current_dir()?;
    println!("[Rust Builder] Current directory: {}", workspace_root.display());
    
    // List contents of current directory for debugging
    println!("[Rust Builder] Listing current directory contents:");
    if let Ok(entries) = std::fs::read_dir(&workspace_root) {
        for entry in entries.flatten() {
            let path = entry.path();
            let name = path.file_name().unwrap_or_default().to_string_lossy();
            let is_dir = path.is_dir();
            println!("  {} {}", if is_dir { "📁" } else { "📄" }, name);
        }
    }
    
    // The actual Rust project is at src/lib/rusto
    let rusto_project_dir = workspace_root.join("src/lib/rusto");
    if !rusto_project_dir.exists() {
        eprintln!("❌ Rust project directory not found: {}", rusto_project_dir.display());
        std::process::exit(1);
    }
    
    // Check for Cargo.toml in the rusto project directory
    let cargo_toml_path = rusto_project_dir.join("Cargo.toml");
    if !cargo_toml_path.exists() {
        eprintln!("❌ Not a Cargo project: Cargo.toml not found in {}", rusto_project_dir.display());
        eprintln!("   Looking for: {}", cargo_toml_path.display());
        std::process::exit(1);
    }
    
    println!("📁 Found Cargo.toml at: {}", cargo_toml_path.display());
    
    // Use the rusto project directory as the workspace for building
    let workspace = rusto_project_dir;
    
    // Print workspace info for debugging
    println!("[Rust Builder] Workspace directory: {}", workspace.display());
    println!("[Rust Builder] Workspace Cargo.toml exists: {}", workspace.join("Cargo.toml").exists());
    
    // Ensure the testeranto_rusto dependency is accessible
    // The path in Cargo.toml points to src/lib/rusto (which is our workspace)
    let rusto_path = workspace.clone();
    if !rusto_path.exists() {
        eprintln!("⚠️  Warning: testeranto_rusto not found at: {}", rusto_path.display());
        eprintln!("   This may cause build errors if the path in Cargo.toml is incorrect");
    } else {
        println!("✅ Found testeranto_rusto at: {}", rusto_path.display());
    }
    
    // Create bundles directory relative to workspace root
    let bundles_dir = workspace_root.join("testeranto/bundles").join(&config_key);
    std::fs::create_dir_all(&bundles_dir)?;
    
    // First, check if the rusto dependency builds
    println!("🔨 Checking testeranto_rusto dependency...");
    if rusto_path.exists() {
        // Check for and handle lock file version issues
        let lock_file_path = rusto_path.join("Cargo.lock");
        if lock_file_path.exists() {
            // Try to read the lock file to check its version
            if let Ok(content) = std::fs::read_to_string(&lock_file_path) {
                if content.contains("version = 4") {
                    println!("⚠️  Cargo lock file version 4 detected - removing incompatible lock file");
                    // Remove the incompatible lock file
                    if let Err(e) = std::fs::remove_file(&lock_file_path) {
                        println!("⚠️  Failed to remove Cargo.lock: {}", e);
                    } else {
                        println!("✅ Removed incompatible Cargo.lock file");
                    }
                }
            }
        }
        
        // Try to check, but don't fail if there are other issues
        let rusto_check = Command::new("cargo")
            .current_dir(&rusto_path)
            .args(&["check"])
            .output();
        
        match rusto_check {
            Ok(output) => {
                if output.status.success() {
                    println!("✅ testeranto_rusto dependency checks out");
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    println!("⚠️  testeranto_rusto has issues: {}", stderr);
                    println!("⚠️  But continuing anyway");
                }
            }
            Err(e) => {
                println!("⚠️  Failed to check testeranto_rusto: {}, but continuing", e);
            }
        }
    } else {
        println!("❌ testeranto_rusto not found at: {}", rusto_path.display());
        std::process::exit(1);
    }
    
    // Check if we can build the main project (but don't include test files)
    // First, check if there's a Cargo.toml and it's valid
    println!("🔨 Checking Cargo project...");
    
    // Check for lock file issues here too
    let lock_file_path = workspace.join("Cargo.lock");
    if lock_file_path.exists() {
        if let Ok(content) = std::fs::read_to_string(&lock_file_path) {
            if content.contains("version = 4") {
                println!("⚠️  Cargo lock file version 4 detected in main check - removing");
                let _ = std::fs::remove_file(&lock_file_path);
            }
        }
    }
    
    let check_status = Command::new("cargo")
        .current_dir(&workspace)
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
    
    // Adjust entry points to be relative to the rusto project directory
    let adjusted_entry_points: Vec<String> = entry_points.iter()
        .map(|ep| {
            // Remove "src/lib/rusto/" prefix if present
            if ep.starts_with("src/lib/rusto/") {
                ep.strip_prefix("src/lib/rusto/").unwrap().to_string()
            } else {
                ep.clone()
            }
        })
        .collect();
    
    // Process each entry point
    let all_tests_info = test_processor::process_entry_points(
        &adjusted_entry_points,
        &workspace,
        &bundles_dir,
    )?;
    
    // Write single inputFiles.json for all tests
    let input_files_path = bundles_dir.join("inputFiles.json");
    std::fs::write(&input_files_path, serde_json::to_string_pretty(&all_tests_info)?)?;
    println!("\n✅ Created inputFiles.json at {:?} with {} tests", input_files_path, all_tests_info.len());
    
    println!("\n🎉 Rust builder completed successfully");
    
    // Store project config path from arguments
    let project_config_path = args[1].clone();
    
    // Set up signal handlers for graceful shutdown
    ctrlc::set_handler(move || {
        println!("[Rust Builder] Received SIGINT - producing output artifacts");
        output_artifacts::produce_output_artifacts(&project_config_path, &config_key);
        std::process::exit(0);
    }).expect("Error setting Ctrl-C handler");
    
    // In dev mode, keep the process alive
    if is_dev_mode {
        println!("[Rust Builder] Dev mode active - process will stay running");
        
        // Keep process alive until interrupted
        loop {
            std::thread::sleep(std::time::Duration::from_secs(1));
        }
    } else {
        println!("[Rust Builder] Once mode completed");
        // Give a moment for any signal
        std::thread::sleep(std::time::Duration::from_millis(100));
        // Also set up a timeout to exit after a short delay
        // This ensures we don't hang forever
        std::thread::sleep(std::time::Duration::from_secs(1));
    }
    
    Ok(())
}
