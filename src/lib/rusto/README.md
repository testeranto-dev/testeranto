# Rusto - Testeranto Implementation for Rust

Rusto is a Rust implementation of the Testeranto testing framework.

## Overview

This crate provides a Rust implementation of the Testeranto testing framework, following the same patterns as
other language implementations (TypeScript, Python, Go, Ruby).

## Status

- **BDD Pattern (Given-When-Then)**: Fully implemented and production-ready (3 verbs)
- **TDT Pattern (Value-Should-Expected)**: Core classes implemented (BaseValue, BaseShould, BaseExpected), integration in progress (3 verbs)
- **Describe-It Pattern (AAA/Arrange-Act-Assert)**: Core classes implemented (BaseDescribe, BaseIt), integration in progress (2 verbs)
- BDD is recommended for production use; TDT and Describe-It patterns are available for experimentation

## Structure

- `src/types.rs`: Core type definitions and traits
- `src/base_suite.rs`: BaseSuite struct for test suites
- `src/base_given.rs`: BaseGiven struct for Given conditions (BDD)
- `src/base_when.rs`: BaseWhen struct for When actions (BDD)
- `src/base_then.rs`: BaseThen struct for Then assertions (BDD)
- `src/base_value.rs`: BaseValue struct for Value setup (TDT)
- `src/base_should.rs`: BaseShould struct for Should actions (TDT)
- `src/base_expected.rs`: BaseExpected struct for Expected checks (TDT)
- `src/base_describe.rs`: BaseDescribe struct for Describe setup (Describe-It/AAA)
- `src/base_it.rs`: BaseIt struct for It actions (Describe-It/AAA)
- `src/simple_adapter.rs`: SimpleTestAdapter default implementation
- `src/rusto.rs`: Main Rusto struct and entry point
- `src/reverse_integration.rs`: Integration with native Rust test runner
- `src/ast_transformer.rs`: AST transformation for native Rust tests

## Key Features

### 1. Artifactory System (Replaces PM)
- Context-aware file operations with structured paths
- `create_artifactory()` method in `Rusto` struct
- Path format: `{basePath}/suite-{N}/given-{key}/when-{index} filename.txt`
- Supports `write_file_sync`, `screenshot`, `open_screencast`, `close_screencast`

### 2. Multiple Testing Patterns

#### BDD Pattern (Given-When-Then) - Fully Implemented
```rust
use rusto::prelude::*;
use rusto::{BaseGiven, BaseWhen, BaseThen};

// Traditional BDD pattern
```

#### TDT Pattern (Value-Should-Expected) - Core Classes Available
```rust
use rusto::prelude::*;
use rusto::{BaseValue, BaseShould, BaseExpected};

// Table-driven testing for data-driven tests
```

#### Describe-It Pattern (AAA/Arrange-Act-Assert) - Core Classes Available
```rust
use rusto::prelude::*;
use rusto::{BaseDescribe, BaseIt};

// Describe-It pattern (AAA with 2 verbs)
```

**Note**: The AAA (Arrange-Act-Assert) pattern is implemented as the Describe-It pattern with 2 verbs: "Describe" for Arrange and "It" for combined Act and Assert phases.

### 3. AST Transformation
Rusto can transform native Rust tests (`#[test]` functions) to Testeranto-compatible tests.

### 4. Native Test Integration
Run Testeranto tests through `cargo test`.

## Usage

### Baseline Pattern (Standard API)

Add to your `Cargo.toml`:

```toml
[dependencies]
rusto = { path = "./src/lib/rusto" }
```

### Example Usage

```rust
use rusto::prelude::*;

// Create test implementation
let impl = ITestImplementation {
    suites: /* ... */,
    givens: /* ... */,
    whens: /* ... */,
    thens: /* ... */,
    values: /* ... */,
    shoulds: /* ... */,
    expecteds: /* ... */,
    describes: /* ... */,
    its: /* ... */,
};

// Create Rusto instance
let rusto = rusto(
    input,
    test_specification,
    impl,
    Box::new(SimpleTestAdapter::new()),
    ITTestResourceRequest::default(),
);
```

## Integration

Rusto follows the unified Testeranto architecture:

1. **Artifactory**: Context-aware file operations replacing PM
2. **Test Resource Configuration**: Passed as JSON string
3. **Results Output**: Consistent format across all languages
4. **Async Support**: Built on async/await with Tokio
5. **Cross-language compatibility**: Matches TypeScript (tiposkripto) implementation

## See Also

- [Tiposkripto](../tiposkripto/) - TypeScript/JavaScript implementation
- [Pitono](../pitono/) - Python implementation
- [Golingvu](../golingvu/) - Go implementation
- [Rubeno](../rubeno/) - Ruby implementation
- [Kafe](../kafe/) - Java implementation
```
=======
```
