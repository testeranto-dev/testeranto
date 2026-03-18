### Ruby Integration

**Detection Implementation:**

- Extend `source_analyzer.rb` to detect RSpec/Minitest patterns
- Add AST visitor for `describe`, `it`, `context` nodes
- Check for `require 'rspec'` or `require 'minitest/autorun'`

**Wrapper Generation:**

- Create adapter that loads RSpec configuration
- Capture results via `RSpec::Core::Formatters::BaseFormatter`
- Map example metadata to testeranto test attributes
# Ruby Runtime

Tests run via Ruby interpreter with native test framework detection.

## Native Toolchain Integration

### Supported Frameworks
- **RSpec** (`.spec.rb`, `_spec.rb`)
- **Minitest** (`.test.rb`, `_test.rb`)
- **Test::Unit** (legacy)

### Detection Approach
- AST parsing via Prism to identify test frameworks
- File naming patterns
- Presence of framework-specific DSL (e.g., `describe`, `it`, `context`)

### Translation Strategy
- Wrap RSpec examples in testeranto-compatible runners
- Capture test results via RSpec formatters
- Map RSpec metadata to testeranto attributes

### Implementation Details
- Uses `source_analyzer.rb` for dependency analysis
- Generates dummy bundle files that load original tests
- Computes file hashes for change detection

### BuildKit Configuration
```typescript
useBuildKit: true,
buildKitOptions: {
  cacheMounts: ["/usr/local/bundle"],
  // Optional: target stage for multi-stage builds
  // targetStage: "runtime",
  buildArgs: {
    RUBY_VERSION: "3.2"
  }
}
```

### Dockerfile Requirements
- Must include Ruby runtime and required gems
- Should install Prism for AST parsing
- Can be single-stage or multi-stage

### Entry Point Processing
1. Parse entry point file with Prism
2. Detect test framework (RSpec, Minitest, etc.)
3. Collect all dependencies recursively
4. Generate wrapper that loads original test
5. Compute hash of all input files
6. Write to `inputFiles.json`

### Native Test Execution
For native Ruby tests (non-testeranto), the builder will:
1. Detect framework via AST analysis
2. Generate adapter that runs tests through native runner
3. Capture results via framework's reporting system
4. Convert results to testeranto format
