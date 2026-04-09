use std::env;
use std::fs;
use std::path::Path;

pub fn collect_input_files(test_path: &Path, workspace: &Path) -> Vec<String> {
    let mut files = Vec::new();
    
    // Get the current directory (should be workspace root)
    let current_dir = env::current_dir().unwrap_or_else(|_| workspace.to_path_buf());
    
    // Add the test file itself
    if let Ok(relative) = test_path.strip_prefix(workspace) {
        files.push(relative.to_string_lossy().to_string());
    } else if let Ok(relative) = test_path.strip_prefix(&current_dir) {
        // If test_path is relative to current directory (workspace root)
        files.push(relative.to_string_lossy().to_string());
    } else {
        files.push(test_path.to_string_lossy().to_string());
    }
    
    // Add Cargo.toml (relative to current directory)
    let cargo_toml = current_dir.join("Cargo.toml");
    if cargo_toml.exists() {
        if let Ok(relative) = cargo_toml.strip_prefix(workspace) {
            files.push(relative.to_string_lossy().to_string());
        } else {
            files.push("Cargo.toml".to_string());
        }
    }
    
    // Add Cargo.lock if present
    let cargo_lock = current_dir.join("Cargo.lock");
    if cargo_lock.exists() {
        if let Ok(relative) = cargo_lock.strip_prefix(workspace) {
            files.push(relative.to_string_lossy().to_string());
        } else {
            files.push("Cargo.lock".to_string());
        }
    }
    
    // Add all .rs files in the same directory as the test
    if let Some(parent) = test_path.parent() {
        if let Ok(entries) = fs::read_dir(parent) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().map(|e| e == "rs").unwrap_or(false) {
                    if let Ok(relative) = path.strip_prefix(workspace) {
                        files.push(relative.to_string_lossy().to_string());
                    } else if let Ok(relative) = path.strip_prefix(&current_dir) {
                        files.push(relative.to_string_lossy().to_string());
                    }
                }
            }
        }
    }
    
    // Add src/ directory files (relative to current Rust project)
    let src_dir = current_dir.join("src");
    if src_dir.exists() {
        collect_rs_files_recursive(&src_dir, workspace, &mut files);
    }
    
    files
}

pub fn collect_rs_files_recursive(dir: &Path, workspace: &Path, files: &mut Vec<String>) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                collect_rs_files_recursive(&path, workspace, files);
            } else if path.extension().map(|e| e == "rs").unwrap_or(false) {
                // Try to get path relative to workspace
                if let Ok(relative) = path.strip_prefix(workspace) {
                    files.push(relative.to_string_lossy().to_string());
                } else {
                    // Try to get path relative to current directory
                    let current_dir = env::current_dir().unwrap_or_else(|_| workspace.to_path_buf());
                    if let Ok(relative) = path.strip_prefix(&current_dir) {
                        files.push(format!("src/rust/{}", relative.to_string_lossy()));
                    } else {
                        // Fallback to absolute path
                        files.push(path.to_string_lossy().to_string());
                    }
                }
            }
        }
    }
}
