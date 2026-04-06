use crate::types::IArtifactory;
use crate::rusto::Rusto;
use std::collections::HashMap;
use std::fs;
use std::path::Path;

impl<I: crate::types::IbddInAny + 'static, O: crate::types::IbddOutAny + 'static, M: 'static> Rusto<I, O, M> {
    /// Create a context-aware artifactory for file operations
    /// This replaces the deprecated PM (Process Manager)
    /// Matches TypeScript implementation in BaseTiposkripto.ts
    /// Note: Rust is a server-side language and CANNOT capture screenshots or screencasts
    /// Only the Web runtime (browser environment) can do visual captures
    /// Therefore, we only include writeFileSync method, matching Java (Kafe) implementation
    /// This is a necessary difference between web and other runtimes
    pub fn create_artifactory(
        &self,
        context: HashMap<String, String>,
    ) -> IArtifactory {
        let mut artifactory = IArtifactory::new();
        
        let base_path = self.test_resource_configuration
            .as_ref()
            .map(|c| c.fs.clone())
            .unwrap_or_else(|| "testeranto".to_string());
        
        // Add write_file_sync method - follows Rust snake_case convention
        // Rust is a server-side language and CANNOT capture screenshots or screencasts
        // Only the Web runtime (browser environment) can do visual captures
        // This is a necessary difference between web and other runtimes
        artifactory.insert("write_file_sync".to_string(), Box::new({
            let base_path = base_path.clone();
            let context = context.clone();
            move |filename: String, payload: String| {
                // Construct path based on context - match TypeScript implementation
                let mut path = String::new();
                
                // Start with the test resource configuration fs path
                let base_path = &base_path;
                
                // Add suite context if available - use TypeScript's key names
                if let Some(suite_index) = context.get("suiteIndex") {
                    path.push_str(&format!("suite-{}/", suite_index));
                }
                
                // Add given context if available
                if let Some(given_key) = context.get("givenKey") {
                    path.push_str(&format!("given-{}/", given_key));
                }
                
                // Add when or then context - use TypeScript's key names
                if let Some(when_index) = context.get("whenIndex") {
                    path.push_str(&format!("when-{} ", when_index));
                } else if let Some(then_index) = context.get("thenIndex") {
                    path.push_str(&format!("then-{} ", then_index));
                } else if let Some(row_index) = context.get("rowIndex") {
                    path.push_str(&format!("row-{} ", row_index));
                } else if let Some(it_index) = context.get("itIndex") {
                    path.push_str(&format!("it-{} ", it_index));
                } else if let Some(describe_key) = context.get("describeKey") {
                    path.push_str(&format!("describe-{}/", describe_key));
                } else if let Some(value_key) = context.get("valueKey") {
                    path.push_str(&format!("value-{}/", value_key));
                }
                
                // Add the filename
                path.push_str(&filename);
                
                // Ensure it has a .txt extension if not present
                if !path.contains('.') {
                    path.push_str(".txt");
                }
                
                // Prepend the base path, avoiding double slashes
                let base_path_clean = base_path.trim_end_matches('/');
                let path_clean = path.trim_start_matches('/');
                let full_path = format!("{}/{}", base_path_clean, path_clean);
                
                println!("[Artifactory] Full path: {}", full_path);
                
                // Create directory if it doesn't exist
                if let Some(parent) = Path::new(&full_path).parent() {
                    if !parent.exists() {
                        let _ = fs::create_dir_all(parent);
                    }
                }
                
                // Write file
                if let Err(e) = fs::write(&full_path, payload) {
                    println!("[Artifactory] Error writing file: {}", e);
                }
            }
        }) as Box<dyn std::any::Any + Send + Sync>);
        
        // NOTE: Rust is a server-side language and CANNOT capture screenshots or screencasts
        // Only the Web runtime (browser environment) can do visual captures
        // Therefore, we DO NOT include screenshot, openScreencast, or closeScreencast methods
        // This matches the Java (Kafe) implementation which also omits these browser-only methods
        // This is a necessary difference between web and other runtimes
        
        artifactory
    }
}
