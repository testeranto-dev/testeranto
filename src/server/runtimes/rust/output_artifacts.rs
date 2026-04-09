use serde_json;

pub fn produce_output_artifacts(project_config_path: &str, config_key: &str) {
    println!("[Rust Builder] Producing output artifacts for config {}", config_key);
    
    // Load project config
    let config_content = match std::fs::read_to_string(project_config_path) {
        Ok(content) => content,
        Err(e) => {
            println!("[Rust Builder] Error loading project config: {}", e);
            return;
        }
    };
    
    let project_config: serde_json::Value = match serde_json::from_str(&config_content) {
        Ok(config) => config,
        Err(e) => {
            println!("[Rust Builder] Error parsing project config: {}", e);
            return;
        }
    };
    
    let runtimes = match project_config.get("runtimes") {
        Some(r) => r,
        None => {
            println!("[Rust Builder] No runtimes found in config");
            return;
        }
    };
    
    let runtime_config = match runtimes.get(config_key) {
        Some(rc) => rc,
        None => {
            println!("[Rust Builder] No runtime config found for {}", config_key);
            return;
        }
    };
    
    let outputs = match runtime_config.get("outputs") {
        Some(o) => o.as_array(),
        None => {
            println!("[Rust Builder] No outputs defined for {}", config_key);
            return;
        }
    };
    
    let outputs = match outputs {
        Some(o) => o,
        None => {
            println!("[Rust Builder] Outputs is not an array");
            return;
        }
    };
    
    println!("[Rust Builder] Processing {} output artifacts", outputs.len());
    
    // Create output directory
    let output_dir = format!("testeranto/outputs/{}", config_key);
    if let Err(e) = std::fs::create_dir_all(&output_dir) {
        println!("[Rust Builder] Error creating output directory: {}", e);
        return;
    }
    
    for output in outputs {
        let entrypoint = match output.as_str() {
            Some(s) => s,
            None => continue,
        };
        
        let source_path = entrypoint;
        let file_name = match std::path::Path::new(entrypoint).file_name() {
            Some(name) => name.to_string_lossy().to_string(),
            None => continue,
        };
        
        let dest_path = format!("{}/{}", output_dir, file_name);
        
        println!("[Rust Builder] Copying {} to {}", source_path, dest_path);
        
        // Copy file
        if let Err(e) = std::fs::copy(source_path, &dest_path) {
            println!("[Rust Builder] Failed to copy {}: {}", source_path, e);
            continue;
        }
        
        println!("[Rust Builder] ✅ Copied {}", file_name);
    }
    
    println!("[Rust Builder] Finished producing output artifacts");
}
