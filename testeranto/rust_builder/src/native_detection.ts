use std::fs;
use std::path::Path;

pub fn detect_native_test(file_path: &Path) -> bool {
    // Simple detection: check for #[test] attributes
    if let Ok(content) = fs::read_to_string(file_path) {
        content.contains("#[test]") || 
        content.contains("#[cfg(test)]") ||
        content.contains("#[tokio::test]") ||
        content.contains("#[async_std::test]")
    } else {
        false
    }
}
