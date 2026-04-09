### Rust Integration

**Detection Implementation:**

- Extend `main.rs` to parse `#[test]` attributes
- Check Cargo.toml for test framework dependencies
- Detect criterion benchmark attributes
- Use native detection module for AST-based analysis

**Native Test Adaptation:**

- Detect native Rust tests (files with `#[test]` attributes)
- Generate Rust adapter code that wraps native tests to run within testeranto framework
- Preserve original test logic while adding testeranto result reporting
- Handle both unit tests and integration tests

## Native Rust Test Detection and Adaptation

The Rust builder detects native Rust tests (distinct from testeranto tests) and adapts them to run within the testeranto framework:

### 1. Native Test Detection
- **AST-based detection** of `#[test]`, `#[tokio::test]`, `#[async_std::test]` attributes
- **Module detection** of `#[cfg(test)]` modules
- **Framework identification** (standard Rust testing, criterion, specs)
- **Test structure extraction** (test functions, imports, dependencies)

### 2. Rust Adapter Generation  
- **Rust adapter files** that wrap native test execution
- **Testeranto result reporting** integration
- **Error handling** that preserves original test behavior
- **Resource cleanup** between test runs

### 3. Three-Parameter Architecture
For native Rust tests, we generate:
- **Specification**: Extracted from `#[test]` functions and modules
- **Implementation**: Original Rust test code preserved
- **Adapter**: Bridges native Rust test execution to testeranto framework

## Native Detection Module

The Rust runtime includes `native_detection.rs` which provides:
1. **Simple detection** of test attributes in Rust source files
2. **File content analysis** without full AST parsing
3. **Framework hinting** based on attribute patterns

## Rust Test Adaptation Workflow

1. **Detection**: Builder identifies native Rust test files using attribute detection
2. **Analysis**: Determine test structure and dependencies
3. **Adapter Generation**: Create Rust code that wraps native tests for testeranto
4. **Binary Compilation**: Build adapted test binaries with `cargo build`
5. **Execution**: Run adapted tests through testeranto framework
6. **Result Processing**: Convert test results to testeranto format

## Example Usage

For a native Rust test file with `#[test]` attributes:
1. Builder detects native test and generates Rust adapter
2. Adapter wraps test execution while preserving original logic
3. Results are captured and reported through testeranto
4. Exit codes and test outcomes are maintained

## BuildKit Configuration
```typescript
useBuildKit: true,
buildKitOptions: {
  cacheMounts: ["/usr/local/cargo/registry", "/usr/local/cargo/git"],
  buildArgs: {
    RUST_VERSION: "1.79"
  }
}
```

## Dockerfile Requirements
- Must include Rust toolchain (cargo, rustc) version 1.79 or newer to support edition2024
- Should NOT include Go toolchain (no Go wrapper generation)
- Can be single-stage or multi-stage

## Entry Point Processing
1. Locate Cargo.toml and determine project structure
2. Detect native tests using attribute analysis
3. Generate Rust adapters for native tests when needed
4. Build binary with `cargo build --release --bin` or `--example`
5. Copy compiled binary to bundles directory
6. Compute hash of all input files
7. Write to `inputFiles.json`

## Native Test Execution
For native Rust tests (non-testeranto), the builder will:
1. Detect test attributes via simple content analysis
2. Generate Rust adapter code for testeranto integration when applicable
3. Compile test binary with appropriate features
4. Run tests through testeranto execution framework
5. Capture results and convert to testeranto format
