## Builders Overview

Each builder creates test artifacts and dependency metadata using BuildKit.

### Common Responsibilities

1. **Import Configuration**: Process language-specific config files
2. **Create Bundles**: Generate executable test artifacts
3. **Generate Metadata**: Produce inputFiles.json listing all source dependencies

### BuildKit Only (No Fallbacks)

- All builders use BuildKit exclusively
- No traditional builds supported
- BuildKit is the only option (no configuration flag needed)

### Dockerfile Simplicity

- Users provide minimal Dockerfiles
- No Chrome/socat in web Dockerfiles (handled by testeranto)
- Single-stage Dockerfiles are sufficient
- Cache mounts improve performance

### Language-Specific Build Approaches

- **Node/Web**: esbuild bundles
- **Python/Ruby**: Script files (no compilation)
- **Go/Rust/Java**: Compiled executables

### BuildKit Configuration

When using BuildKit, ensure your configuration includes:

```typescript
useBuildKit: true,
buildKitOptions: {
  // Optional: cache mounts for dependencies
  cacheMounts: ["/go/pkg/mod", "/root/.cache/go-build"], // Example for Go
  // Optional: target stage for multi-stage builds (if your Dockerfile has stages)
  // targetStage: "runtime",  // Only use if your Dockerfile has a stage named "runtime"
  // Optional: build arguments
  // buildArgs: {
  //   GO_ENV: "production"
  // }
}
```

**Important**: The `targetStage` option should only be used if your Dockerfile has multi-stage builds with a stage named "runtime". If you have a single-stage Dockerfile, omit this option or set it to `undefined`.

### Dockerfile Stage Requirements

1. **Single-stage Dockerfiles**: Don't use `targetStage` in buildKitOptions
2. **Multi-stage Dockerfiles**: Use `targetStage` only if you have a stage with that name
3. **Default behavior**: If no targetStage is specified, BuildKit builds the final stage

BuildKit will build your Dockerfile as specified. Cache mounts are optional but recommended for better performance.

### inputFiles.json

Every builder produces a single inputFiles.json file for all tests in a runtime, which describes what files changed for a particular build. This is used by the server to detect changes to packages and launch them. This file contains an object where each key is a test entry point, and the value is an object with a hash and list of files.

```json
{
  "src/ruby/Calculator-test.rb": {
    "hash": "f2e42dab26fa96d70c56c03b26054f31",
    "files": ["/src/ruby/Calculator-test.rb", "/src/ruby/Calculator.rb"]
  }
}
```

The hash is obtained by concatenating the contents of all the relevant input files and running it through MD5.

## Success Metrics

- Native tests run without modification
- Test results accurately captured and reported
- Performance overhead < 20%
- # Support for 80% of popular test frameworks in each language

## Three-Parameter Architecture for Native Test Integration

Each runtime builder must generate three canonical components when translating native test frameworks to testeranto's BDD structure:

### 1. Specification Generation
- **Purpose**: Define the BDD test structure (suites, givens, whens, thens)
- **Source**: Extracted from native test files via AST analysis
- **Output**: Testeranto specification function

### 2. Implementation Generation  
- **Purpose**: Provide concrete implementations for the specification
- **Source**: Native test code (setup, test methods, assertions)
- **Output**: Testeranto implementation object

### 3. Adapter Generation
- **Purpose**: Connect testeranto to native test runner
- **Source**: Framework-specific execution hooks
- **Output**: Testeranto adapter object

### Implementation Requirements by Language

#### Ruby Integration
**Three-Parameter Generation:**
- **Specification**: Extract from RSpec `describe`/`context`/`it` blocks
- **Implementation**: Map RSpec examples and expectations
- **Adapter**: Bridge to RSpec runner via `RSpec::Core::Formatters`

#### Python Integration
**Three-Parameter Generation:**
- **Specification**: Extract from pytest fixtures and test functions
- **Implementation**: Map pytest test functions and assertions  
- **Adapter**: Bridge to pytest via `pytest.main()` and hooks

#### Java Integration
**Three-Parameter Generation:**
- **Specification**: Extract from JUnit test classes and annotations
- **Implementation**: Map `@Test` methods and assertions
- **Adapter**: Bridge to JUnit via `JUnitCore` and `RunListener`

#### JavaScript/TypeScript Integration
**Three-Parameter Generation:**
- **Specification**: Extract from Jest/Mocha `describe`/`it` blocks
- **Implementation**: Map test functions and `expect` assertions
- **Adapter**: Bridge to Jest/Mocha runner APIs

#### Node.js Native Detection Module
The Node.js runtime includes `native_detection.js` which:
1. **Detects** native test frameworks (Jest, Mocha, Jasmine, Vitest) using Babel AST parsing
2. **Extracts** test structure (suites, test cases, hooks)
3. **Generates** the three canonical components (specification, implementation, adapter)
4. **Integrates** with the existing esbuild-based bundling pipeline

#### Go Integration
**Three-Parameter Generation:**
- **Specification**: Extract from `TestXxx` functions and setup
- **Implementation**: Map test functions and assertions
- **Adapter**: Bridge to `go test` runner

#### Rust Integration
**Three-Parameter Generation:**
- **Specification**: Extract from `#[test]` functions and modules
- **Implementation**: Map test functions and assertions
- **Adapter**: Bridge to Rust test harness

#### Web Integration
**Three-Parameter Generation:**
- **Specification**: Extract from browser test frameworks
- **Implementation**: Map test cases and assertions
- **Adapter**: Bridge to browser test runners

### Builder Extension Requirements

Each runtime builder must be extended to:

1. **Detect Framework**: Identify native test framework in entry points
2. **Parse Tests**: Analyze test files using appropriate AST parser
3. **Generate Components**: Create specification, implementation, and adapter
4. **Create Wrapper**: Generate code that loads and executes the three components
5. **Execute Tests**: Run tests through the generated adapter

### Example Workflow

For a JUnit test file:
1. **Detection**: Identify `@Test` annotations and imports
2. **Parsing**: Extract test class, methods, setup, assertions
3. **Generation**:
   - Create specification with suite and given/when/then structure
   - Create implementation mapping Java code to testeranto
   - Create adapter connecting to JUnit runner
4. **Execution**: Run tests through generated adapter

This approach maintains testeranto's strict BDD architecture while supporting native test frameworks through automatic translation of the three canonical parameters.
