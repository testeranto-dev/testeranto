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
- `src/flavored.rs`: Idiomatic Rust macros for native test integration

## Usage

### Baseline Pattern (Standard API)

Add to your `Cargo.toml`:

```toml
[dependencies]
rusto = { path = "./src/lib/rusto" }
```

Basic example:

```rust
use rusto::{Rusto, SimpleTestAdapter, ITestImplementation, ITestSpecification};
use async_trait::async_trait;

// Define your test implementation
let implementation = ITestImplementation {
    suites: /* ... */,
    givens: /* ... */,
    whens: /* ... */,
    thens: /* ... */,
};

// Create Rusto instance
let rusto = Rusto::new(
    input,
    test_specification,
    implementation,
    test_resource_requirement,
    Box::new(SimpleTestAdapter::new()),
);

// Run tests
let results = rusto.receive_test_resource_config(partial_test_resource).await;
```

### Flavored Pattern (Idiomatic Rust Macros)

The flavored pattern provides macros that integrate with `cargo test`:

```rust
use rusto::{test_suite, given, when, then};

struct Calculator {
    value: i32,
}

impl Calculator {
    fn new() -> Self {
        Calculator { value: 0 }
    }
    
    fn add(&mut self, x: i32, y: i32) {
        self.value = x + y;
    }
    
    fn result(&self) -> i32 {
        self.value
    }
}

test_suite!("Calculator Tests", {
    // The macro generates test functions automatically
});
```

This will generate proper Rust test functions that can be run with `cargo test`.

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

Rusto follows the same patterns as other Testeranto implementations:

1. **Test Resource Configuration**: Passed as JSON string
2. **Results Output**: Writes to `testeranto/reports/allTests/example/rust.Calculator.test.ts.json`
3. **Async Support**: Built on Tokio for async operations
4. **Error Handling**: Uses `thiserror` for comprehensive error types
5. **Native Integration**: Flavored macros generate `#[test]` functions compatible with `cargo test`

## Future Enhancements

1. **WebSocket Support**: Real-time test reporting
2. **More Adapters**: Specialized adapter implementations
3. **Performance Optimizations**: Lever Rust's performance characteristics
4. **Macro Support**: DSL macros for cleaner test definitions

## See Also

- [Tiposkripto](../tiposkripto/) - TypeScript/JavaScript implementation
- [Pitono](../pitono/) - Python implementation
- [Golingvu](../golingvu/) - Go implementation
- [Rubeno](../rubeno/) - Ruby implementation
