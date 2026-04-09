use std::fs;
use std::path::Path;

pub fn make_executable(path: &Path) -> Result<(), Box<dyn std::error::Error>> {
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
