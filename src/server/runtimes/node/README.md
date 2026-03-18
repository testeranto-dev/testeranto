### JavaScript/TypeScript Integration

**Detection Implementation:**

- Extend esbuild plugins to analyze test framework imports
- Parse configuration files (`jest.config.js`, etc.)
- Detect test function calls in AST

**Wrapper Generation:**

- Bundle tests with framework-specific runner adapters
- Intercept results via Jest/Mocha reporter APIs
- Handle async test execution and cleanup

### Native Test Detection and Translation

#### Detection Implementation
- **File patterns**: `*.test.js`, `*.spec.js`, `*.test.ts`, `*.spec.ts`
- **AST analysis**: Look for `describe`, `it`, `test`, `beforeEach`, `afterEach` calls
- **Import detection**: Check for `jest`, `mocha`, `jasmine`, `vitest` imports
- **Configuration**: Check for `jest.config.js`, `.mocharc.js`, `vite.config.js`

#### Framework Identification
- **Jest**: `jest` imports, `jest.mock` calls, Jest globals
- **Mocha**: `mocha` imports, `describe`/`it` without Jest globals
- **Jasmine**: `jasmine` imports, Jasmine-specific matchers
- **Vitest**: `vitest` imports, Vite test configuration

#### Three-Parameter Translation

**Specification Generation**:
- `describe` blocks → Suites
- `beforeEach` hooks → Given
- `it`/`test` blocks → When + Then
- `expect` calls → Then assertions

**Implementation Generation**:
- Extract test suites and test cases
- Map Jest/Vitest matchers to testeranto assertions
- Convert Mocha test functions with callbacks

**Adapter Generation**:
- Jest: Use Jest runner with custom reporter
- Mocha: Use Mocha runner with custom reporter
- Vitest: Use Vitest runner with custom reporter

#### Native Detection Module
The Node.js runtime now includes `native_detection.js` which provides:
1. **Detection**: Identifies native test files and their frameworks using Babel AST parsing
2. **Structure Extraction**: Parses test suites, test cases, and hooks
3. **Translation**: Generates three-parameter components for testeranto

#### Usage in Builder
When processing Node.js test files, the builder:
1. Uses `NodeNativeTestDetection.detectNativeTest()` to detect native tests
2. Marks tests as native in build metadata
3. Generates appropriate wrapper code for native vs testeranto tests
4. Includes framework-specific information in the build artifacts

### Example Workflow
For a Jest test file:
1. **Detection**: Identify `jest` imports and `describe`/`it` calls
2. **Parsing**: Extract test suites, test cases, and assertions
3. **Generation**: Create specification, implementation, and adapter
4. **Execution**: Run tests through generated adapter

# Node.js Runtime

Tests run via Node.js with native test framework detection.

## Native Toolchain Integration

### Supported Frameworks
- **Jest** (`.test.js`, `.spec.js`)
- **Mocha** (`.test.js`, `.spec.js`)
- **Jasmine** (`.spec.js`)
- **Vitest** (`.test.js`)

### Detection Approach
- AST analysis for test framework imports
- Configuration file detection (`jest.config.js`, `.mocharc.js`)
- Test function patterns (`describe`, `it`, `test`)

### Translation Strategy
- Bundle tests with framework-specific runners
- Intercept test results via reporter APIs
- Convert to testeranto result format

### Implementation Details
- Uses esbuild for bundling TypeScript/JavaScript
- Implements logging plugin for test execution tracking
- Handles both ESM and CommonJS modules

### BuildKit Configuration
```typescript
useBuildKit: true,
buildKitOptions: {
  cacheMounts: ["/root/.npm", "/usr/local/share/.cache/yarn"],
  // Optional: target stage for multi-stage builds
  // targetStage: "runtime",
  buildArgs: {
    NODE_ENV: "production"
  }
}
```

### Dockerfile Requirements
- Must include Node.js runtime and package manager
- Should include necessary build tools
- Can be single-stage or multi-stage

### Entry Point Processing
1. Bundle entry points with esbuild
2. Generate metafile with dependency information
3. Process metafile to extract input files
4. Compute hash of all input files
5. Write to `inputFiles.json`

### Native Test Execution
For native Node.js tests (non-testeranto), the builder will:
1. Detect framework via import analysis and config files
2. Bundle tests with appropriate test runner
3. Intercept results via framework's reporter system
4. Convert results to testeranto format
