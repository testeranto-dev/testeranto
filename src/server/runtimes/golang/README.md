# golang builder

This will run in a builder container for golang projects. It has 2 jobs

1. build the golang tests
2. produce a "metafile" - a json file describing the output files and for each, the input files. This should be similar to the js's esbuild metafile.

BDD tests and static analysis tests are run as Docker commands upon the build image. These will be run from outside the builder (in the server). The builder only needs to be setup to run these tests- it does not run these tests itself.

Ensure your configuration includes:

```typescript
useBuildKit: true,
buildKitOptions: {
  // Optional: cache mounts for Go dependencies
  cacheMounts: ["/go/pkg/mod", "/root/.cache/go-build"],
  // Optional: target stage for multi-stage builds (if your Dockerfile has stages)
  // targetStage: "runtime",
  // Optional: build arguments
  // buildArgs: {
  //   GO_ENV: "production"
  // }
}
```

BuildKit will build your existing Dockerfile as-is. No changes to your Dockerfile are required. Cache mounts are optional but recommended for better performance.

### Go Integration

**Detection Implementation:**

- Extend `main.go` to detect `TestXxx` function signatures
- Check for testify assertion imports
- Identify Ginkgo BDD structures
- Uses native detection module for AST-based analysis

**Wrapper Generation:**

- Compile tests with `go test -c` and custom main
- Parse JSON test output format
- Handle test timing and resource cleanup
- Generate wrapper executables for native tests

### Native Test Detection and Translation

#### Detection Implementation
- **File patterns**: `*_test.go` files are automatically flagged as native
- **AST analysis**: Full Go AST parsing to detect `TestXxx`, `ExampleXxx`, `BenchmarkXxx` functions
- **Import detection**: Scans imports for `github.com/stretchr/testify`, `github.com/onsi/ginkgo`, `github.com/onsi/gomega`
- **Framework identification**: Returns specific framework type: `testing`, `testify`, or `ginkgo`

#### Three-Parameter Translation Architecture

**Specification Generation**:
- Test functions map to **When** + **Then** pairs
- Test setup functions (if any) map to **Given** steps
- Test suites map to testeranto **Suites**

**Implementation Generation**:
- Extracts test function signatures and bodies
- Maps Go testing assertions to testeranto assertion format
- Converts testify assertions to testeranto-compatible format
- Handles ginkgo BDD-style test structures

**Adapter Generation**:
- **Standard testing**: Wraps `testing` package execution
- **Testify**: Integrates with testify suite runner
- **Ginkgo**: Adapts ginkgo test runner for testeranto

#### Native Detection Module
The Go runtime now includes `native_detection.go` which provides:
1. **Comprehensive detection**: Full AST-based analysis of Go test files
2. **Structure extraction**: Detailed parsing of test functions, imports, and test hierarchies
3. **JSON output**: Machine-readable detection results for integration
4. **Command-line interface**: Can be run independently for testing and debugging

#### Builder Integration
The Go builder (`main.go`) now:
1. **Automatically detects** native test files using the detection module
2. **Runs framework-specific analysis** to determine the best execution strategy
3. **Generates wrapper executables** that adapt native tests to testeranto's execution model
4. **Includes detailed metadata** in `inputFiles.json` (framework type, test structure, etc.)
5. **Handles compilation differences** between native and non-native tests

### Example Workflow
For a Go test file (`calculator_test.go`):
1. **Detection**: Builder identifies `_test.go` suffix and runs native detection
2. **Analysis**: AST parsing reveals `TestAdd` and `TestSubtract` functions using testify
3. **Framework identification**: Detected as `testify` framework
4. **Wrapper generation**: Creates a wrapper executable that runs tests through testify adapter
5. **Compilation**: Builds both the original test binary and the wrapper
6. **Execution**: Tests run through the wrapper, integrating with testeranto's reporting system

### Testing the Integration
You can test the native detection independently:
```bash
# Run native detection on a test file
go run src/server/runtimes/golang/native_detection.go path/to/your_test.go

# The builder will automatically use this detection during builds
```

### Performance Considerations
- **AST parsing** adds minimal overhead during build phase
- **Wrapper generation** occurs only for native test files
- **Caching**: BuildKit cache mounts significantly improve dependency resolution speed
- **Incremental builds**: Only changed files trigger re-detection and re-compilation

### Framework Support Matrix
| Framework | Detection | Wrapper Generation | Execution Support |
|-----------|-----------|-------------------|-------------------|
| Standard `testing` | ✅ Full | ✅ Yes | ✅ Complete |
| Testify | ✅ Full | ✅ Yes | ✅ Complete |
| Ginkgo | ✅ Full | ✅ Yes | ✅ Complete |
| Custom frameworks | ⚠️ Basic | ⚠️ Limited | ⚠️ Experimental |

This enhanced integration provides robust native Go test support while maintaining compatibility with testeranto's BDD architecture.
