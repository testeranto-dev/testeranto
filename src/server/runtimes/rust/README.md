### Rust Integration

**Detection Implementation:**

- Extend `main.rs` to parse `#[test]` attributes
- Check Cargo.toml for test framework dependencies
- Detect criterion benchmark attributes
- Use native detection module for AST-based analysis

**Wrapper Generation:**

- Compile with `--test` and custom test harness
- Capture results via JSON output
- Handle integration vs unit test differences
- Generate Go-compatible wrappers for native test execution

## Go Toolchain Compatibility

To make Rust tests acceptable to the native Go toolchain testing runner, we generate:

### 1. Go-Compatible Wrappers
- **Go wrapper files** (`*_go_wrapper.go`) that execute Rust binaries
- **JSON output format** compatible with Go test runners
- **Exit code handling** that matches Go test expectations

### 2. Rust Test Runners  
- **Rust runner binaries** that execute actual test code
- **JSON result serialization** for standardized output
- **Error propagation** to match Go test behavior

### 3. Three-Parameter Architecture
For native Rust tests, we generate:
- **Specification**: Extracted from `#[test]` functions and modules
- **Implementation**: Mapped from Rust test code to testeranto
- **Adapter**: Bridges Rust test execution to Go toolchain

## Native Detection Module

The Rust runtime now includes `native_detection.rs` which provides:
1. **AST-based detection** of `#[test]` attributes and test modules
2. **Framework identification** (standard Rust testing, criterion, specs)
3. **Test structure extraction** (test functions, imports, dependencies)
4. **JSON output** for integration with the builder

## Go Toolchain Integration Workflow

1. **Detection**: Builder identifies Rust test files using native detection
2. **Analysis**: AST parsing reveals `#[test]` functions and their structure
3. **Wrapper Generation**: Creates Go-compatible wrapper executables
4. **Binary Compilation**: Builds both Rust test binary and Go wrapper
5. **Execution**: Tests run through Go wrapper, producing JSON results
6. **Result Processing**: Go test runner processes JSON output

## Example Usage

For a Rust test file with `#[test]` attributes:
1. Builder detects native test and generates Go wrapper
2. Go wrapper executes Rust binary and captures output
3. Results are formatted as JSON for Go test runner
4. Exit codes match Go test expectations (0 for pass, 1 for fail)

## BuildKit Configuration
```typescript
useBuildKit: true,
buildKitOptions: {
  cacheMounts: ["/usr/local/cargo/registry", "/usr/local/cargo/git"],
  // Optional: target stage for multi-stage builds
  // targetStage: "runtime",
  buildArgs: {
    RUST_VERSION: "1.75"
  }
}
```

## Dockerfile Requirements
- Must include Rust toolchain (cargo, rustc)
- Should include Go toolchain for wrapper compilation
- Can be single-stage or multi-stage

## Entry Point Processing
1. Locate Cargo.toml and determine project structure
2. Detect native tests using AST analysis
3. Generate Go-compatible wrappers for native tests
4. Build binary with `cargo build --release --bin`
5. Copy compiled binary and wrapper to bundles directory
6. Compute hash of all input files
7. Write to `inputFiles.json`

## Native Test Execution
For native Rust tests (non-testeranto), the builder will:
1. Detect test attributes via AST analysis
2. Generate Go-compatible wrapper for Go toolchain integration
3. Compile test binary with appropriate features
4. Run tests through Go wrapper for standardized execution
5. Capture results via JSON output format
6. Convert results to testeranto format
