#!/usr/bin/env python3

import sys
import json
import os
import ast
from typing import Dict, List, Set, Any
import hashlib

import time

# Import native detection module - no fallback
# Add the path to native_detection.py to sys.path
# In the container, working directory is /workspace, and native_detection.py is at
# testeranto/runtimes/python/native_detection.py
import os
import sys

# Add possible paths where native_detection.py could be
possible_paths = [
    os.path.join(os.getcwd(), 'testeranto', 'runtimes', 'python'),
    os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'testeranto', 'runtimes', 'python'),
    '/workspace/testeranto/runtimes/python',
]

for path in possible_paths:
    if os.path.exists(os.path.join(path, 'native_detection.py')):
        if path not in sys.path:
            sys.path.insert(0, path)
        break

# Now import
from native_detection import PythonNativeTestDetection

def resolve_python_import(import_path: str, current_file: str) -> str:
    """Resolve a Python import to a file path. Raises ImportError if not found."""
    # Handle relative imports
    if import_path.startswith('.'):
        current_dir = os.path.dirname(current_file)
        # Count dots
        dot_count = 0
        remaining = import_path
        while remaining.startswith('.'):
            dot_count += 1
            remaining = remaining[1:]
        
        # Remove leading slash
        if remaining.startswith('/'):
            remaining = remaining[1:]
        
        # Go up appropriate number of directories
        base_dir = current_dir
        for _ in range(1, dot_count):
            base_dir = os.path.dirname(base_dir)
        
        # Handle case with no remaining path
        if not remaining:
            init_path = os.path.join(base_dir, '__init__.py')
            if os.path.exists(init_path):
                return init_path
            raise ImportError(f"Cannot resolve import '{import_path}' from '{current_file}'")
        
        # Resolve full path
        resolved = os.path.join(base_dir, remaining)
        
        # Try different extensions
        for ext in ['.py', '/__init__.py']:
            potential = resolved + ext
            if os.path.exists(potential):
                return potential
        
        # Check if it's a directory with __init__.py
        if os.path.exists(resolved) and os.path.isdir(resolved):
            init_path = os.path.join(resolved, '__init__.py')
            if os.path.exists(init_path):
                return init_path
        raise ImportError(f"Cannot resolve import '{import_path}' from '{current_file}'")
    
    # Handle absolute imports
    # Look in various directories
    dirs = [
        os.path.dirname(current_file),
        os.getcwd(),
    ] + os.environ.get('PYTHONPATH', '').split(os.pathsep)
    
    for dir_path in dirs:
        if not dir_path:
            continue
        potential_paths = [
            os.path.join(dir_path, import_path + '.py'),
            os.path.join(dir_path, import_path, '__init__.py'),
            os.path.join(dir_path, import_path.replace('.', '/') + '.py'),
            os.path.join(dir_path, import_path.replace('.', '/'), '__init__.py'),
        ]
        for potential in potential_paths:
            if os.path.exists(potential):
                return potential
    raise ImportError(f"Cannot resolve import '{import_path}' from '{current_file}'")

def parse_python_imports(file_path: str) -> List[Dict[str, Any]]:
    """Parse import statements from a Python file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Warning: Could not read {file_path}: {e}")
        return []
    
    try:
        tree = ast.parse(content)
    except SyntaxError as e:
        print(f"Warning: Syntax error in {file_path}: {e}")
        return []
    
    imports = []
    
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                import_path = alias.name
                resolved = resolve_python_import(import_path, file_path)
                imports.append({
                    'path': import_path,
                    'kind': 'import-statement',
                    'external': resolved is None,
                })
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                import_path = node.module
                resolved = resolve_python_import(import_path, file_path)
                imports.append({
                    'path': import_path,
                    'kind': 'import-statement',
                    'external': resolved is None,
                })
    return imports

def collect_dependencies(file_path: str, visited: Set[str] = None) -> List[str]:
    """Collect all dependencies of a Python file recursively."""
    if visited is None:
        visited = set()
    
    if file_path in visited:
        return []
    visited.add(file_path)
    
    dependencies = [file_path]
    imports = parse_python_imports(file_path)
    
    for imp in imports:
        if not imp.get('external') and imp['path']:
            resolved = resolve_python_import(imp['path'], file_path)
            if resolved and os.path.exists(resolved):
                dependencies.extend(collect_dependencies(resolved, visited))
    
    # Remove duplicates
    seen = set()
    unique = []
    for dep in dependencies:
        if dep not in seen:
            seen.add(dep)
            unique.append(dep)
    return unique

def compute_files_hash(files: List[str]) -> str:
    """Compute a simple hash from file paths and contents, similar to Ruby's compute_files_hash."""
    import hashlib
    
    hash_obj = hashlib.md5()
    
    for file_path in files:
        try:
            if os.path.exists(file_path):
                # Add file path
                hash_obj.update(file_path.encode('utf-8'))
                # Add file stats
                stats = os.stat(file_path)
                hash_obj.update(str(stats.st_mtime).encode('utf-8'))
                hash_obj.update(str(stats.st_size).encode('utf-8'))
            else:
                # File may not exist, include its name anyway
                hash_obj.update(file_path.encode('utf-8'))
                hash_obj.update(b'missing')
        except Exception as error:
            # If we can't stat the file, still include its name
            hash_obj.update(file_path.encode('utf-8'))
            hash_obj.update(b'error')
    
    return hash_obj.hexdigest()

def generate_native_test_wrapper(entry_point_path: str, detection_result: Dict[str, Any], 
                                translation_result: Dict[str, str], files_hash: str) -> str:
    """Generate wrapper for native Python tests with three-parameter translation."""
    original_test_abs = os.path.abspath(entry_point_path)
    framework = detection_result.get("framework_type", "unknown")
    
    wrapper = f'''#!/usr/bin/env python3
# Native test wrapper generated by testeranto
# Hash: {files_hash}
# Framework: {framework}
# This file loads the native test translation

import sys
import os
import json

# Add the original file's directory to sys.path
original_dir = os.path.dirname(r'{original_test_abs}')
if original_dir not in sys.path:
    sys.path.insert(0, original_dir)

# Load the translation components
# Note: In a real implementation, these would be generated files
# For now, we'll directly execute the original test

# Execute through appropriate test runner based on framework
if '{framework}' == 'pytest':
    import pytest
    # Run pytest on the original test file
    sys.exit(pytest.main([r'{original_test_abs}']))
elif '{framework}' == 'unittest':
    import unittest
    # Discover and run unittest tests
    loader = unittest.TestLoader()
    suite = loader.discover(os.path.dirname(r'{original_test_abs}'), 
                           pattern=os.path.basename(r'{original_test_abs}'))
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
else:
    # Generic execution for unknown frameworks
    with open(r'{original_test_abs}', 'r', encoding='utf-8') as f:
        code = f.read()
    
    # Execute the code in the global namespace
    exec(code, {{'__name__': '__main__', '__file__': r'{original_test_abs}'}})
    
    # If there's a test framework runner, execute it
    if 'TestFramework' in locals():
        TestFramework.run()
'''
    return wrapper

def main():
    print(f"[Python Builder] ARGV: {sys.argv}")
    
    # The only argument is the JSON config slice
    if len(sys.argv) < 2:
        print("[Python Builder] Error: Insufficient arguments")
        print("Usage: python.py <config_json>")
        sys.exit(1)
    
    config_json = sys.argv[3]
    try:
        config = json.loads(config_json)
        entry_points = config.get('tests', [])
        outputs = config.get('outputs', [])
        test_name = config.get('name', '')
    except Exception as e:
        print(f"[Python Builder] Failed to parse config JSON: {e}")
        sys.exit(1)
    
    if not test_name:
        print("[Python Builder] Config must include a name")
        sys.exit(1)
    
    # Check if we're in dev mode
    import os
    is_dev_mode = os.environ.get('MODE') == 'dev'
    
    print(f"[Python Builder] Test name: {test_name}")
    print(f"[Python Builder] Entry points: {entry_points}")
    print(f"[Python Builder] Mode: {'dev' if is_dev_mode else 'once'}")
    
    # Create a dictionary to store all tests' information
    all_tests_info = {}
    
    # Process each entry point
    for entry_point in entry_points:
        print(f"[Python Builder] Processing Python test: {entry_point}")
        
        # Get absolute path to entry point
        entry_point_path = os.path.abspath(entry_point)
        
        # Check if entry point exists
        if not os.path.exists(entry_point_path):
            print(f"[Python Builder] Error: Entry point does not exist: {entry_point_path}")
            sys.exit(1)
        
        # Detect if this is a native test
        detection_result = PythonNativeTestDetection.detect_native_test(entry_point_path)
        is_native_test = detection_result.get("is_native_test", False)
        framework_type = detection_result.get("framework_type")
        
        if is_native_test:
            print(f"[Python Builder] Detected native {framework_type} test")
            # Generate translation components
            translation_result = PythonNativeTestDetection.translate_to_testeranto(detection_result)
        
        # Collect all dependencies
        all_deps = collect_dependencies(entry_point_path)
        # Ensure entry point is included
        if entry_point_path not in all_deps:
            all_deps.append(entry_point_path)
        
        # Add native detection module if it's a native test
        if is_native_test:
            detection_module_path = os.path.join(os.path.dirname(__file__), "native_detection.py")
            if os.path.exists(detection_module_path):
                if detection_module_path not in all_deps:
                    all_deps.append(detection_module_path)
        
        # Sort for consistency
        all_deps = sorted(set(all_deps))
        
        print(f"[Python Builder] Found {len(all_deps)} dependencies")
        
        # Compute hash of input files
        files_hash = compute_files_hash(all_deps)
        print(f"[Python Builder] Computed hash: {files_hash}")
        
        # Convert to workspace-relative paths
        workspace_root = '/workspace'
        relative_files = []
        for dep in all_deps:
            abs_path = os.path.abspath(dep)
            if abs_path.startswith(workspace_root):
                rel_path = abs_path[len(workspace_root):]
                # Ensure it starts with /
                if not rel_path.startswith('/'):
                    rel_path = '/' + rel_path
                relative_files.append(rel_path)
            else:
                # If not under workspace, use relative path from current directory
                rel_path = os.path.relpath(abs_path, os.getcwd())
                relative_files.append(rel_path)
        
        # Store test information
        test_info = {
            "hash": files_hash,
            "files": relative_files,
            "is_native_test": is_native_test
        }
        if is_native_test:
            test_info["framework"] = framework_type
        
        all_tests_info[entry_point] = test_info
        
        # Create the bundle file
        # Handle path correctly
        if os.path.isabs(entry_point):
            if entry_point.startswith(workspace_root):
                rel_entry_path = entry_point[len(workspace_root):]
                if rel_entry_path.startswith('/'):
                    rel_entry_path = rel_entry_path[1:]
            else:
                rel_entry_path = os.path.relpath(entry_point, os.getcwd())
        else:
            rel_entry_path = entry_point
        
        bundle_path = os.path.join("testeranto/bundles", test_name, rel_entry_path)
        
        # Ensure the directory for the bundle exists
        os.makedirs(os.path.dirname(bundle_path), exist_ok=True)
        
        # Generate appropriate wrapper content
        if is_native_test:
            bundle_content = generate_native_test_wrapper(
                entry_point_path, detection_result, translation_result, files_hash
            )
        else:
            # Original dummy bundle for testeranto tests
            original_test_abs = os.path.abspath(entry_point)
            bundle_content = f'''#!/usr/bin/env python3
# Dummy bundle file generated by testeranto
# Hash: {files_hash}
# This file loads and executes the original test file: {original_test_abs}

import sys
import os

# Add the original file's directory to sys.path if needed
original_dir = os.path.dirname(r'{original_test_abs}')
if original_dir not in sys.path:
    sys.path.insert(0, original_dir)

# Load and execute the original test file
# Using exec to ensure execution every time
with open(r'{original_test_abs}', 'r', encoding='utf-8') as f:
    code = f.read()

# Execute the code in the global namespace
exec(code, {{'__name__': '__main__', '__file__': r'{original_test_abs}'}})

# If the test framework requires explicit test execution, add it here
# For example:
#   if 'TestFramework' in locals():
#       TestFramework.run()
'''
        
        with open(bundle_path, 'w', encoding='utf-8') as f:
            f.write(bundle_content)
        
        # Make executable
        try:
            os.chmod(bundle_path, 0o755)
        except:
            pass
        
        print(f"[Python Builder] Created bundle file at: {bundle_path}")
    
    # Write single inputFiles.json for all tests
    input_files_path = os.path.join("testeranto/bundles", test_name, "inputFiles.json")
    os.makedirs(os.path.dirname(input_files_path), exist_ok=True)
    with open(input_files_path, 'w', encoding='utf-8') as f:
        json.dump(all_tests_info, f, indent=2)
    print(f"[Python Builder] Wrote inputFiles.json for {len(all_tests_info)} tests to {input_files_path}")
    
    print("[Python Builder] Python builder completed")
    
def produce_output_artifacts():
    """Produce output artifacts before shutting down."""
    print(f"[Python Builder] Producing output artifacts for config {test_name}")
    
    if not outputs:
        print(f"[Python Builder] No outputs defined for {test_name}")
        return
    
    print(f"[Python Builder] Processing {len(outputs)} output artifacts")
    
    # Create output directory
    output_dir = f"testeranto/outputs/{test_name}"
    os.makedirs(output_dir, exist_ok=True)
    
    for entrypoint in outputs:
        try:
            source_path = entrypoint
            import shutil
            file_name = os.path.basename(entrypoint)
            dest_path = os.path.join(output_dir, file_name)
            
            print(f"[Python Builder] Copying {source_path} to {dest_path}")
            
            # Copy file
            shutil.copy2(source_path, dest_path)
            
            print(f"[Python Builder] ✅ Copied {file_name}")
        except Exception as e:
            print(f"[Python Builder] Failed to process output artifact {entrypoint}: {e}")
    
    print(f"[Python Builder] Finished producing output artifacts")

    # Set up signal handlers for graceful shutdown
    import signal
    import time
    
    def handle_shutdown(signum, frame):
        print(f"[Python Builder] Received signal {signum} - producing output artifacts")
        produce_output_artifacts()
        sys.exit(0)
    
    signal.signal(signal.SIGTERM, handle_shutdown)
    signal.signal(signal.SIGINT, handle_shutdown)
    
    # In dev mode, keep the process alive
    if is_dev_mode:
        print("[Python Builder] Dev mode active - process will stay running")
        # Keep process alive
        while True:
            time.sleep(1)
    else:
        # In once mode, we're done
        print("[Python Builder] Once mode completed")

if __name__ == "__main__":
    main()
