use std::fs;
use std::path::Path;

pub fn detect_native_test(file_path: &Path) -> bool {
    // Enhanced detection for native Rust tests
    if let Ok(content) = fs::read_to_string(file_path) {
        // Check for test attributes
        let has_test_attr = content.contains("#[test]") || 
                           content.contains("#[tokio::test]") ||
                           content.contains("#[async_std::test]");
        
        // Check for test modules
        let has_test_module = content.contains("#[cfg(test)]");
        
        // Check for test functions (functions starting with test_)
        let lines: Vec<&str> = content.lines().collect();
        let mut has_test_function = false;
        
        for i in 0..lines.len() {
            let line = lines[i].trim();
            // Look for function definitions that might be tests
            if line.starts_with("fn test_") || 
               (line.starts_with("fn ") && line.contains("test") && line.ends_with("() {")) {
                // Check if there's a #[test] attribute above the function
                let mut j = i;
                while j > 0 && j > i.saturating_sub(5) {
                    j -= 1;
                    if lines[j].trim().starts_with("#[test]") || 
                       lines[j].trim().starts_with("#[tokio::test]") ||
                       lines[j].trim().starts_with("#[async_std::test]") {
                        has_test_function = true;
                        break;
                    }
                }
            }
        }
        
        has_test_attr || has_test_module || has_test_function
    } else {
        false
    }
}

pub fn get_test_framework(file_path: &Path) -> String {
    // Determine the test framework used
    if let Ok(content) = fs::read_to_string(file_path) {
        if content.contains("#[tokio::test]") {
            "tokio".to_string()
        } else if content.contains("#[async_std::test]") {
            "async_std".to_string()
        } else if content.contains("#[test]") {
            "standard".to_string()
        } else {
            "unknown".to_string()
        }
    } else {
        "unknown".to_string()
    }
}
