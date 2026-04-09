// use std::collections::HashMap;
// use std::fs;
// use std::path::Path;
// use std::process::Command;
// use serde_json;

// use crate::file_collector;
// use crate::native_detection;
// use crate::permissions;
// use crate::wrapper_generator;

// pub fn process_entry_points(
//     entry_points: &[String],
//     workspace: &Path,
//     bundles_dir: &Path,
//     config_key: &str,
// ) -> Result<HashMap<String, serde_json::Value>, Box<dyn std::error::Error>> {
//     let mut all_tests_info: HashMap<String, serde_json::Value> = HashMap::new();
    
//     for entry_point in entry_points {
//         println!("\n📦 Processing Rust test: {}", entry_point);
        
//         // Get entry point path - entry_point is relative to workspace root
//         let entry_point_path = workspace.join(entry_point);
//         if !entry_point_path.exists() {
//             eprintln!("  ❌ Entry point does not exist: {}", entry_point_path.display());
//             std::process::exit(1);
//         }
        
//         // Get base name for binary
//         let file_name = entry_point_path.file_name()
//             .unwrap_or_default()
//             .to_str()
//             .unwrap_or("");
//         if !file_name.ends_with(".rs") {
//             eprintln!("  ❌ Entry point is not a Rust file: {}", entry_point);
//             std::process::exit(1);
//         }
        
//         // Create a valid crate name: replace dots and slashes with underscores
//         // Also ensure it starts with a letter and contains only alphanumeric characters or underscores
//         let binary_name = entry_point
//             .replace("/", "_")
//             .replace(".", "_")
//             .replace("-", "_");
//         // Ensure the name is valid for Rust crate
//         let valid_binary_name = binary_name
//             .chars()
//             .filter(|c| c.is_alphanumeric() || *c == '_')
//             .collect::<String>();
        
//         // Detect if this is a native test
//         let is_native_test = native_detection::detect_native_test(&entry_point_path);
//         let framework_type = if is_native_test {
//             "rust_testing".to_string()
//         } else {
//             "unknown".to_string()
//         };
        
//         if is_native_test {
//             println!("  Detected native Rust test (framework: {})", framework_type);
//             // Generate Go-compatible wrapper for native Rust tests
//             wrapper_generator::generate_go_compatible_wrapper(&entry_point_path, bundles_dir, &valid_binary_name, &framework_type);
//         }
        
//         // Collect input files
//         let input_files = file_collector::collect_input_files(&entry_point_path, workspace);
        
//         // Compute hash
//         use std::collections::hash_map::DefaultHasher;
//         use std::hash::{Hash, Hasher};
//         let mut hasher = DefaultHasher::new();
//         for file in &input_files {
//             file.hash(&mut hasher);
//         }
//         let hash = hasher.finish();
//         let hash_str = format!("{:x}", hash);
        
//         // Store test information
//         let test_info = serde_json::json!({
//             "hash": hash_str,
//             "files": input_files,
//             "isNativeTest": is_native_test,
//             "frameworkType": framework_type
//         });
//         all_tests_info.insert(entry_point.to_string(), test_info);
        
//         // Instead of building a separate binary, we'll use the existing Rust project
//         // and build the specific test binary that's already defined in Cargo.toml
        
//         // The entry point is a Rust source file that should already be part of the project
//         // We need to determine which binary target it corresponds to
        
//         // First, check if the entry point exists
//         if !entry_point_path.exists() {
//             eprintln!("  ❌ Entry point does not exist: {}", entry_point_path.display());
//             std::process::exit(1);
//         }
        
//         // Read the Cargo.toml to find binary targets
//         let cargo_toml_content = fs::read_to_string("Cargo.toml")?;
        
//         // Simple parsing to find [[bin]] sections
//         let mut binary_targets = Vec::new();
//         let lines: Vec<&str> = cargo_toml_content.lines().collect();
//         let mut in_bin_section = false;
//         let mut current_bin_name = None;
//         let mut current_bin_path = None;
        
//         for line in lines {
//             let trimmed = line.trim();
//             if trimmed.starts_with("[[bin]]") {
//                 in_bin_section = true;
//                 current_bin_name = None;
//                 current_bin_path = None;
//             } else if in_bin_section && trimmed.starts_with("name =") {
//                 current_bin_name = Some(trimmed.trim_start_matches("name =").trim().trim_matches('"'));
//             } else if in_bin_section && trimmed.starts_with("path =") {
//                 current_bin_path = Some(trimmed.trim_start_matches("path =").trim().trim_matches('"'));
//             } else if trimmed.starts_with('[') && !trimmed.starts_with("[[") {
//                 // New section starting
//                 if in_bin_section {
//                     if let (Some(name), Some(path)) = (current_bin_name, current_bin_path) {
//                         binary_targets.push((name.to_string(), path.to_string()));
//                     }
//                     in_bin_section = false;
//                 }
//             }
//         }
        
//         // Check last section
//         if in_bin_section {
//             if let (Some(name), Some(path)) = (current_bin_name, current_bin_path) {
//                 binary_targets.push((name.to_string(), path.to_string()));
//             }
//         }
        
//         println!("  📋 Found {} binary targets in Cargo.toml", binary_targets.len());
        
//         // Try to find which binary target matches our entry point
//         let mut matching_binary = None;
//         for (bin_name, bin_path) in &binary_targets {
//             let absolute_bin_path = Path::new(bin_path);
//             if absolute_bin_path == entry_point_path || 
//                absolute_bin_path.canonicalize().ok() == entry_point_path.canonicalize().ok() {
//                 matching_binary = Some(bin_name.clone());
//                 break;
//             }
//         }
        
//         // If no exact match, try to find by filename
//         if matching_binary.is_none() {
//             let entry_filename = entry_point_path.file_name().unwrap_or_default().to_str().unwrap_or("");
//             for (bin_name, bin_path) in &binary_targets {
//                 let path = Path::new(bin_path);
//                 if path.file_name().unwrap_or_default() == entry_filename {
//                     matching_binary = Some(bin_name.clone());
//                     break;
//                 }
//             }
//         }
        
//         let binary_name = if let Some(bin) = matching_binary {
//             println!("  🔍 Found matching binary target: {}", bin);
//             bin
//         } else {
//             // Create a binary name from the entry point path
//             let name = entry_point
//                 .replace("/", "_")
//                 .replace(".", "_")
//                 .replace("-", "_");
//             // Ensure valid Rust identifier
//             let valid_name: String = name.chars()
//                 .filter(|c| c.is_alphanumeric() || *c == '_')
//                 .collect();
//             println!("  ⚠️  No matching binary target found, using generated name: {}", valid_name);
//             valid_name
//         };
        
//         // Build the specific binary
//         println!("  🔨 Building binary: {}...", binary_name);
//         let build_status = Command::new("cargo")
//             .args(&["build", "--release", "--bin", &binary_name])
//             .status()?;
        
//         if !build_status.success() {
//             eprintln!("  ❌ Failed to build binary: {}", binary_name);
//             // Try to get more info
//             let _ = Command::new("cargo")
//                 .args(&["build", "--release", "--bin", &binary_name, "--verbose"])
//                 .status();
//             std::process::exit(1);
//         }
        
//         // Copy the binary to bundles directory
//         let source_bin = Path::new("target/release").join(&binary_name);
//         if !source_bin.exists() {
//             // Try with .exe extension
//             let source_bin_exe = source_bin.with_extension("exe");
//             if source_bin_exe.exists() {
//                 let dest_bin = bundles_dir.join(&binary_name).with_extension("exe");
//                 fs::copy(&source_bin_exe, &dest_bin)?;
//                 permissions::make_executable(&dest_bin)?;
//                 println!("  ✅ Compiled binary at: {:?}", dest_bin);
//             } else {
//                 eprintln!("  ❌ Compiled binary not found at {:?} or {:?}", source_bin, source_bin_exe);
//                 // List target/release directory
//                 let _ = Command::new("ls")
//                     .args(&["-la", "target/release/"])
//                     .status();
//                 std::process::exit(1);
//             }
//         } else {
//             let dest_bin = bundles_dir.join(&binary_name);
//             fs::copy(&source_bin, &dest_bin)?;
//             permissions::make_executable(&dest_bin)?;
//             println!("  ✅ Compiled binary at: {:?}", dest_bin);
//         }
//     }
    
//     Ok(all_tests_info)
// }
