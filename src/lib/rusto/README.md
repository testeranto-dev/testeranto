# Rusto - Testeranto Implementation for Rust

Rusto is a Rust implementation of the Testeranto BDD testing framework.

## Overview

This crate provides a Rust implementation of the Testeranto testing framework, following the same patterns as other language implementations (TypeScript, Python, Go, Ruby).

## Structure

- `src/types.rs`: Core type definitions and traits
- `src/base_suite.rs`: BaseSuite struct for test suites
- `src/base_given.rs`: BaseGiven struct for Given conditions
- `src/base_when.rs`: BaseWhen struct for When actions
- `src/base_then.rs`: BaseThen struct for Then assertions
- `src/simple_adapter.rs`: SimpleTestAdapter default implementation
- `src/rusto.rs`: Main Rusto struct and entry point
- `src/reverse_integration.rs`: Integration with native Rust test runner
- `src/ast_transformer.rs`: AST transformation for native Rust tests
- `src/flavored.rs`: Idiomatic Rust macros for native test integration

## Features

### 1. Multiple Testing Patterns
Rusto supports multiple testing methodologies through a unified architecture:

#### BDD Pattern (Given-When-Then)
```rust
use rusto::prelude::*;
use rusto::{BaseGiven, BaseWhen, BaseThen};

// Traditional BDD pattern
```

#### AAA Pattern (Arrange-Act-Assert)
```rust
use rusto::prelude::*;
use rusto::{BaseArrange, BaseAct, BaseAssert};

// AAA pattern for unit testing
```

#### TDT Pattern (Table Driven Testing)
```rust
use rusto::prelude::*;
use rusto::{BaseMap, BaseFeed, BaseValidate};

// Table-driven testing for data-driven tests
```

### 2. AST Transformation
Rusto can transform native Rust tests (`#[test]` functions) to Testeranto-compatible tests:

```rust
use rusto::{transform_rust_tests, detect_rust_tests};

// Detect tests in a file
let test_names = detect_rust_tests("tests/my_test.rs")?;
println!("Found tests: {:?}", test_names);

// Transform tests to Testeranto format
let transformed = transform_rust_tests("tests/my_test.rs")?;
println!("Transformed code:\n{}", transformed);
```

### 3. Native Test Integration
Run Testeranto tests through `cargo test`:

```rust
use rusto::reverse_integration::RustoReverseIntegration;

// Convert Rusto instance to native test
let native_test = rusto_instance.as_native_test(&config);
```

### 4. Standard Testeranto API
Use the standard Testeranto API for new tests:

```rust
use rusto::prelude::*;

// Create test specification, implementation, and adapter
// ... (standard Testeranto pattern)
```

## Usage

### Baseline Pattern (Standard API)

Add to your `Cargo.toml`:

```toml
[dependencies]
rusto = { path = "./src/lib/rusto" }
```

### AST Transformation Example

```rust
use rusto::RustASTTransformer;

// Transform existing Rust tests to Testeranto
let transformed = RustASTTransformer::transform_file("src/tests.rs")?;
std::fs::write("src/tests_transformed.rs", transformed)?;
```

## Testing

Run tests with:

```bash
cargo test
```

To run the example:

```bash
cargo test --example calculator_test
```

## Integration

Rusto follows the unified Testeranto architecture:

1. **AST Transformation**: Convert native tests to Testeranto format
2. **Test Resource Configuration**: Passed as JSON string
3. **Results Output**: Consistent format across all languages
4. **Async Support**: Built on Tokio for async operations
5. **Error Handling**: Uses `thiserror` for comprehensive error types

## Future Enhancements

1. **Complete AST Transformation**: Full parsing and transformation of test bodies
2. **WebSocket Support**: Real-time test reporting
3. **More Adapters**: Specialized adapter implementations
4. **Performance Optimizations**: Lever Rust's performance characteristics

## See Also

- [Tiposkripto](../tiposkripto/) - TypeScript/JavaScript implementation
- [Pitono](../pitono/) - Python implementation
- [Golingvu](../golingvu/) - Go implementation
- [Rubeno](../rubeno/) - Ruby implementation
