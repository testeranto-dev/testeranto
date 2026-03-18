### Python Integration

**Detection Implementation:**

- Extend AST parsing in `python.py` to identify test classes/functions
- Detect `unittest.TestCase` subclasses
- Identify `pytest` fixtures and test functions

**Wrapper Generation:**

- Generate module that imports and runs `pytest.main()`
- Capture results via `pytest` plugin system
- Handle `unittest` test discovery and execution

### Native Test Detection and Translation

#### Detection Implementation
- **File patterns**: `test_*.py`, `*_test.py`, `*_spec.py`
- **AST analysis**: Look for `unittest.TestCase` subclasses, `@pytest.fixture`, `def test_*`
- **Import detection**: Check for `import pytest`, `import unittest`, `from behave import`
- **Configuration**: Check for `pytest.ini`, `setup.cfg`, `tox.ini`, `behave.ini`

#### Framework Identification
- **pytest**: Presence of `pytest` imports, `@pytest.mark` decorators
- **unittest**: `unittest.TestCase` inheritance, `setUp`/`tearDown` methods
- **behave**: Gherkin feature files with step definitions
- **nose**: Legacy nose framework detection

#### Three-Parameter Translation

**Specification Generation**:
- Test module → Suite
- Fixtures and `setUp` methods → Given
- Test functions/methods → When + Then
- `assert` statements → Then assertions

**Implementation Generation**:
- Extract pytest fixtures and test functions
- Map unittest test cases to testeranto structure
- Convert behave scenarios to Given/When/Then

**Adapter Generation**:
- pytest: Use `pytest.main()` with custom plugin
- unittest: Use `unittest.TestLoader` with custom runner
- behave: Use behave runner with custom formatter

#### Native Detection Module
The Python runtime now includes `native_detection.py` which provides:
1. **Detection**: Identifies native test files and their frameworks
2. **Structure Extraction**: Parses test functions, classes, fixtures
3. **Translation**: Generates three-parameter components for testeranto

#### Usage in Builder
When processing Python test files, the builder:
1. Uses `PythonNativeTestDetection.detect_native_test()` to detect native tests
2. Marks tests as native in `inputFiles.json`
3. Generates appropriate wrapper classes for native vs testeranto tests
4. Includes framework-specific information in the build artifacts

### Example Workflow
For a pytest test file:
1. **Detection**: Identify `pytest` imports and `test_*` functions
2. **Parsing**: Extract test functions, fixtures, and assertions
3. **Generation**: Create specification, implementation, and adapter
4. **Execution**: Run tests through generated adapter

# Python Runtime

Tests run via Python interpreter with native test framework detection.

## Native Toolchain Integration

### Supported Frameworks
- **pytest** (`.py` files with `test_` prefix)
- **unittest** (`.py` with `TestCase` classes)
- **nose/nose2** (legacy)

### Detection Approach
- AST analysis for test class/method patterns
- Import detection (`import pytest`, `from unittest import`)
- File naming conventions (`test_*.py`, `*_test.py`)

### Translation Strategy
- Create adapter modules that import and run native tests
- Use pytest's plugin system for result capture
- Map Python test outcomes to testeranto results

### Implementation Details
- Uses Python's built-in `ast` module for parsing
- Implements dependency resolution via `resolve_python_import`
- Generates bundle files that `exec()` original test code

### BuildKit Configuration
```typescript
useBuildKit: true,
buildKitOptions: {
  cacheMounts: ["/root/.cache/pip"],
  // Optional: target stage for multi-stage builds
  // targetStage: "runtime",
  buildArgs: {
    PYTHON_VERSION: "3.11"
  }
}
```

### Dockerfile Requirements
- Must include Python runtime and pip
- Should install common test frameworks (pytest, unittest)
- Can be single-stage or multi-stage

### Entry Point Processing
1. Parse entry point file with AST
2. Detect test framework (pytest, unittest, etc.)
3. Collect all imports and dependencies
4. Generate wrapper that executes original test
5. Compute hash of all input files
6. Write to `inputFiles.json`

### Native Test Execution
For native Python tests (non-testeranto), the builder will:
1. Detect framework via import statements and AST patterns
2. Generate adapter that runs tests through appropriate runner
3. Capture results via framework's reporting hooks
4. Convert results to testeranto format
