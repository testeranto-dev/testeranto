### Ruby Integration

**Detection Implementation:**

- Framework-specific detection in `framework-converters/` directory
- AST-based pattern matching for RSpec, Minitest, Test::Unit
- File naming pattern recognition

**Wrapper Generation:**

- Framework-specific wrappers that properly initialize test frameworks
- RSpec: Configures formatters and runs via RSpec::Core::Runner
- Minitest: Uses minitest/autorun automatic execution
- Test::Unit: Configures Test::Unit::AutoRunner
- Generic fallback for unknown frameworks

**Translation to Testeranto:**

- Each converter can generate testeranto-compatible specifications
- Framework-specific adapters for lifecycle hooks
- Consistent test structure across different Ruby testing frameworks

# Ruby Runtime

Tests run via Ruby interpreter with native test framework detection and conversion.

## Framework Converters

The Ruby runtime now includes a comprehensive framework converter system similar to the Node.js implementation:

### Available Converters

1. **RSpecConverter** (`rspec.rb`)
   - Detects: `_spec.rb` files, `require 'rspec'`, `describe`/`it` DSL
   - Generates: RSpec-compatible wrapper with proper configuration
   - Supports: RSpec 3.x+

2. **MinitestConverter** (`minitest.rb`)
   - Detects: `_test.rb` files, `require 'minitest/autorun'`, `Minitest::Test` classes
   - Generates: Minitest wrapper with automatic test execution
   - Supports: Minitest 5.x+

3. **TestUnitConverter** (`test_unit.rb`)
   - Detects: `_test.rb` files, `require 'test/unit'`, `Test::Unit::TestCase` classes
   - Generates: Test::Unit wrapper with auto-runner
   - Supports: Ruby's built-in Test::Unit

4. **GenericConverter** (`generic.rb`)
   - Fallback for unknown Ruby test frameworks
   - Basic Ruby test detection
   - Simple load-and-execute wrapper

### Detection Approach
- File naming patterns (`.spec.rb`, `_test.rb`)
- AST analysis for framework-specific DSL patterns
- Import/require statement analysis
- Framework-specific class/method detection

### Wrapper Generation Strategy
- Each converter generates framework-specific wrapper code
- Proper initialization of test framework
- Result capture and exit code handling
- Integration with testeranto reporting system

### Translation to Testeranto
- Converters can generate testeranto-compatible specifications
- Framework-specific actions mapped to When steps
- Assertions mapped to Then steps
- Lifecycle hooks mapped to adapter methods

## Implementation Details

### Directory Structure
```
src/server/runtimes/ruby/
├── framework-converters/
│   ├── index.rb           # Main exports and detection logic
│   ├── base.rb            # FrameworkConverter interface
│   ├── rspec.rb           # RSpec converter
│   ├── minitest.rb        # Minitest converter
│   ├── test_unit.rb       # Test::Unit converter
│   └── generic.rb         # Generic fallback converter
├── source_analyzer.rb     # Dependency analysis
└── ruby.rb               # Main runtime builder
```

### Detection Flow
1. For each entry point, try all converters in order
2. First converter that returns `true` from `detect()` is selected
3. Generate framework-specific wrapper using selected converter
4. Store framework type in `inputFiles.json` for later reference

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
- Should install Prism for AST parsing (used by source_analyzer)
- Framework-specific gems may be needed (rspec, minitest)

### Entry Point Processing
1. Parse entry point file with framework detection
2. Collect all dependencies recursively using SourceAnalyzer
3. Select appropriate framework converter
4. Generate framework-specific wrapper
5. Compute hash of all input files
6. Write to `inputFiles.json` with framework metadata

### Native Test Execution
For native Ruby tests, the builder will:
1. Detect framework using converter system
2. Generate appropriate wrapper for that framework
3. Ensure proper test execution and result capture
4. Convert results to testeranto format when needed

## Adding New Converters

To add support for additional Ruby testing frameworks:

1. Create a new converter file in `framework-converters/`
2. Implement the `FrameworkConverter` interface:
   - `name`: String identifier
   - `detect(file_path)`: Return true if file uses this framework
   - `generate_wrapper(...)`: Generate wrapper code
   - `translate_to_testeranto(...)`: Optional translation
3. Add the converter to `ALL_CONVERTERS` in `index.rb`

## Example Usage

```ruby
# The runtime automatically detects and uses the appropriate converter
# For an RSpec file (_spec.rb):
# 1. RSpecConverter.detect() returns true
# 2. RSpec-specific wrapper is generated
# 3. Tests run with proper RSpec configuration

# For a Minitest file (_test.rb):
# 1. MinitestConverter.detect() returns true  
# 2. Minitest wrapper with autorun is generated
# 3. Tests execute via Minitest's automatic runner
```

## Integration with Testeranto

The framework converters enable:
- Seamless integration of existing Ruby test suites
- Consistent test execution across different frameworks
- Unified reporting and result capture
- Migration path to testeranto's BDD patterns
