# Golingvu - Testeranto Implementation for Go

## Installation

```bash
go get github.com/testeranto-dev/testeranto/src/lib/golingvu@v0.1.10
```

Or for the latest commit:
```bash
go get github.com/testeranto-dev/testeranto/src/lib/golingvu@main
```

## Import

```go
import "github.com/testeranto-dev/testeranto/src/lib/golingvu"
```

## Overview

Golingvu is the Go implementation of the Testeranto testing framework. It provides multiple testing methodologies:

1. **BDD (Behavior Driven Development)**: Given, When, Then (fully implemented and production-ready)
2. **TDT (Table-Driven Testing)**: Value, Should, Expected (core classes implemented, integration in progress)
3. **Describe-It Pattern (AAA/Arrange-Act-Assert)**: Describe, It (core classes implemented, integration in progress)

All patterns are built upon a unified internal architecture using Setup, Action, Check (not exposed to users) and use the Artifactory system for file operations (replacing the deprecated PM system).

**Note**: 
- The AAA (Arrange-Act-Assert) pattern is implemented as the Describe-It pattern with 2 verbs: "Describe" and "It". This differs from BDD which uses 3 separate verbs.
- BDD pattern is fully functional and recommended for production use
- TDT and Describe-It patterns have core classes available for experimentation
- Uses Artifactory for file operations (not PM)

## Key Components

### Types
- `ITestSpecification`: Defines test specifications
- `ITestImplementation`: Contains suites, givens, whens, and thens
- `ITestAdapter`: Adapter interface for test execution
- `ITTestResourceConfiguration`: Configuration for test resources

## Interoperability Features

Golingvu supports multiple ways to run tests for better interoperability:

1. **Official Test Runner**: Use `ReceiveTestResourceConfig()` with JSON configuration
2. **Go Testing Package**: Use `RunAsGoTest()` with `testing.T`
3. **Direct Execution**: Use `RunTests()` for programmatic access
4. **Simple Tests**: Use `RunSimpleTest()` for quick integration

This allows Golingvu tests to be run both within the Testeranto ecosystem and as standard Go tests.

## Running Golingvu Tests on Official Go Test Runner

Golingvu integrates seamlessly with Go's built-in `go test` command, allowing you to run your tests using the official Go test runner. Here's how:

### Method 1: Using `RunAsGoTest()` with `testing.T`

Create a standard Go test function that uses Golingvu's `RunAsGoTest()` method:

```go
package mypackage_test

import (
    "testing"
    "github.com/testeranto-dev/testeranto/src/lib/golingvu"
)

func TestCalculator(t *testing.T) {
    // Create your Golingvu instance
    gv := golingvu.NewGolingvu(
        nil,
        specificationFunc,
        impl,
        golingvu.DefaultTestResourceRequest,
        &golingvu.SimpleTestAdapter{},
        nil,
    )
    
    // Run with testing.T context
    gv.WithTestingT(t).RunAsGoTest()
}
```

### Method 2: Using `CreateGoTest()` Helper

Golingvu provides a helper method to create test functions:

```go
package mypackage_test

import (
    "testing"
    "github.com/testeranto-dev/testeranto/src/lib/golingvu"
)

var gv *golingvu.Golingvu

func init() {
    // Initialize Golingvu once
    gv = golingvu.NewGolingvu(
        nil,
        specificationFunc,
        impl,
        golingvu.DefaultTestResourceRequest,
        &golingvu.SimpleTestAdapter{},
        nil,
    )
}

// Create individual test functions
var TestAddition = gv.CreateGoTest("TestAddition")
var TestSubtraction = gv.CreateGoTest("TestSubtraction")
var TestMultiplication = gv.CreateGoTest("TestMultiplication")
```

### Method 3: Using `RunSimpleTest()` for Simple Cases

For simple test cases without complex setup:

```go
func TestSimpleCalculation(t *testing.T) {
    gv := golingvu.NewGolingvu(
        nil,
        specificationFunc,
        impl,
        golingvu.DefaultTestResourceRequest,
        &golingvu.SimpleTestAdapter{},
        nil,
    )
    
    gv.RunSimpleTest(t, func() error {
        // Your test logic here
        // Return nil for success, error for failure
        return nil
    })
}
```

### Method 4: Package-Level Setup with `TestMainIntegration`

For complex test suites requiring setup/teardown:

```go
package mypackage_test

import (
    "os"
    "testing"
    "github.com/testeranto-dev/testeranto/src/lib/golingvu"
)

var gv *golingvu.Golingvu

func TestMain(m *testing.M) {
    // Global setup
    gv = golingvu.NewGolingvu(
        nil,
        specificationFunc,
        impl,
        golingvu.DefaultTestResourceRequest,
        &golingvu.SimpleTestAdapter{},
        nil,
    )
    
    // Run tests with Golingvu's TestMainIntegration
    code := gv.TestMainIntegration(m)
    
    // Exit with appropriate code
    os.Exit(code)
}

func TestAll(t *testing.T) {
    gv.WithTestingT(t).RunAsGoTest()
}
```

### Running Tests with `go test`

Once you've written your tests using any of the above methods, run them using standard Go commands:

```bash
# Run all tests in the package
go test ./...

# Run specific test
go test -run TestCalculator

# Run with verbose output
go test -v

# Run with coverage
go test -cover

# Run tests in parallel
go test -parallel 4
```

### Configuration Options

Golingvu's `TestConfig` provides additional options when running with `go test`:

```go
func TestWithConfig(t *testing.T) {
    gv := golingvu.NewGolingvu(
        nil,
        specificationFunc,
        impl,
        golingvu.DefaultTestResourceRequest,
        &golingvu.SimpleTestAdapter{},
        nil,
    )
    
    // Configure test options
    config := &golingvu.TestConfig{
        Parallel: true,     // Run test in parallel
        Skip:     false,    // Skip this test
        Timeout:  30 * time.Second,
    }
    
    gv.WithTestingT(t).WithTestConfig(config).RunAsGoTest()
}
```

### Best Practices

1. **Test Organization**: Place Golingvu tests in `*_test.go` files following Go conventions
2. **Package Naming**: Use `_test` suffix for test packages (e.g., `mypackage_test`)
3. **Test Naming**: Start test functions with `Test` prefix (e.g., `TestFeatureName`)
4. **Cleanup**: Use `RegisterCleanup()` for resource cleanup:

```go
func TestWithCleanup(t *testing.T) {
    gv := golingvu.NewGolingvu(
        nil,
        specificationFunc,
        impl,
        golingvu.DefaultTestResourceRequest,
        &golingvu.SimpleTestAdapter{},
        nil,
    )
    
    // Register cleanup functions
    gv.RegisterCleanup(func() {
        // Clean up resources
    })
    
    gv.WithTestingT(t).RunAsGoTest()
}
```

### Example: Complete Test File

Here's a complete example of a Golingvu test file that works with `go test`:

```go
package calculator_test

import (
    "testing"
    "github.com/testeranto-dev/testeranto/src/lib/golingvu"
)

// Test implementation
var impl = golingvu.ITestImplementation{
    Suites: map[string]interface{}{"CalculatorSuite": "Calculator Tests"},
    Givens: map[string]interface{}{
        "emptyCalculator": func() interface{} { 
            return NewCalculator() 
        },
    },
    Whens: map[string]interface{}{
        "add": func(x int) interface{} {
            return func(calc interface{}) interface{} {
                calc.(*Calculator).Add(x)
                return calc
            }
        },
    },
    Thens: map[string]interface{}{
        "result": func(expected int) interface{} {
            return func(calc interface{}) interface{} {
                if calc.(*Calculator).Result() != expected {
                    return "result mismatch"
                }
                return nil
            }
        },
    },
}

// Test specification
func specificationFunc(suites, givens, whens, thens interface{}) interface{} {
    return []interface{}{
        map[string]interface{}{
            "key": "CalculatorSuite",
            "givens": map[string]interface{}{
                "testAddition": map[string]interface{}{
                    "features": []string{"addition"},
                    "whens": []interface{}{"add:5", "add:3"},
                    "thens": []interface{}{"result:8"},
                },
            },
        },
    }
}

func TestCalculatorSuite(t *testing.T) {
    gv := golingvu.NewGolingvu(
        nil,
        specificationFunc,
        impl,
        golingvu.DefaultTestResourceRequest,
        &golingvu.SimpleTestAdapter{},
        nil,
    )
    
    gv.WithTestingT(t).RunAsGoTest()
}
```

This integration allows you to leverage all Go testing features while using Golingvu's powerful BDD/TDT/Describe-It patterns.

## Examples

Check out the `examples/` directory for complete working examples:

### Native Go Tests
See `examples/calculator/native_test.go` for standard Go testing examples:
```bash
cd examples/calculator
go test -v
```

### Golingvu Tests  
See `examples/calculator/golingvu_test.go` for Golingvu testing examples:
```bash
cd examples/calculator
go test -v -run TestCalculatorWithGolingvu
```

### Directory Structure
The project now follows standard Go practices:
```
src/lib/golingvu/
├── examples/              # Example code
│   └── calculator/       # Calculator example
│       ├── calculator.go      # Calculator implementation
│       ├── native_test.go     # Native Go tests
│       └── golingvu_test.go   # Golingvu tests
├── *.go                  # Core library files
└── README.md            # Documentation
```

Old test files in `tests/cmd/` have been deprecated in favor of the examples directory.

## Quick Start Example

```go
package calculator_test

import (
    "testing"
    "github.com/testeranto-dev/testeranto/src/lib/golingvu"
)

func TestSimpleExample(t *testing.T) {
    // Create a simple test adapter
    adapter := &golingvu.SimpleTestAdapter{}
    
    // Create test implementation
    impl := golingvu.ITestImplementation{
        Suites: map[string]interface{}{"Default": "Test Suite"},
        Givens: map[string]interface{}{
            "test1": func() interface{} { return NewCalculator() },
        },
        Whens: map[string]interface{}{
            "press": func(payload interface{}) *golingvu.BaseWhen {
                button := payload.(string)
                return &golingvu.BaseWhen{
                    Key: "press",
                    WhenCB: func(store, testResource, pm interface{}) (interface{}, error) {
                        calc := store.(*Calculator)
                        calc.Press(button)
                        return calc, nil
                    },
                }
            },
        },
        Thens: map[string]interface{}{
            "result": func(payload interface{}) *golingvu.BaseThen {
                expected := payload.(string)
                return &golingvu.BaseThen{
                    Key: "result",
                    ThenCB: func(store, testResource, pm interface{}) (interface{}, error) {
                        calc := store.(*Calculator)
                        if calc.GetDisplay() != expected {
                            return nil, fmt.Errorf("expected %s, got %s", expected, calc.GetDisplay())
                        }
                        return true, nil
                    },
                }
            },
        },
    }
    
    // Create test specification
    spec := func(suites, givens, whens, thens interface{}) interface{} {
        return []interface{}{
            map[string]interface{}{
                "key": "CalculatorSuite",
                "givens": map[string]interface{}{
                    "testSingleDigit": map[string]interface{}{
                        "features": []string{"basic"},
                        "whens":    []interface{}{"press:2"},
                        "thens":    []interface{}{"result:2"},
                    },
                },
            },
        }
    }
    
    // Create and run Golingvu test
    gv := golingvu.NewGolingvu(
        nil,
        spec,
        impl,
        golingvu.DefaultTestResourceRequest,
        adapter,
        nil,
    )
    
    gv.WithTestingT(t).RunAsGoTest()
}
```

## Four Ways to Run Tests - Simple Guide

### 1. Golingvu Tests on Testeranto Runner
Run Golingvu BDD tests through the Testeranto ecosystem (configured in `testeranto.ts`):
```bash
# This runs in Docker with the configuration below
```

### 2. Standard Go Tests on Testeranto Runner  
Run traditional Go tests through Testeranto (configured in `testeranto.ts`):
```bash
# Same as above, but for standard Go tests
```

### 3. Standard Go Tests on Go Runner
Run traditional Go tests using `go test`:
```bash
cd src/lib/golingvu/examples/calculator
go test -v -run "TestCalculator.*"
```

### 4. Golingvu Tests on Standard Go Runner
Run Golingvu tests using `go test`:
```bash
cd src/lib/golingvu
go test -v -run "TestCalculatorWithGolingvu"
```

## Testeranto Configuration

The `testeranto.ts` file has a simple configuration for running all four ways:

```typescript
golangtests: {
  runtime: "golang",
  tests: [
    // Way 1: Golingvu tests on Testeranto
    "src/lib/golingvu/examples/calculator/golingvu_test.go",
    
    // Way 2: Standard Go tests on Testeranto  
    "src/lib/golingvu/examples/calculator/native_test.go",
    
    // Additional test files
    "src/lib/golingvu/golingvu_test.go",
    "src/lib/golingvu/interopt_test.go",
    "src/lib/golingvu/integration_test.go",
    "src/lib/golingvu/package_test.go",
  ],
  checks: [
    // Simple syntax check
    () => "go fmt ./...",
    
    // Simple vet check
    () => "go vet ./...",
    
    // Way 1 & 4: Run Golingvu tests
    () => "go test -v ./src/lib/golingvu/examples/calculator/golingvu_test.go ./src/lib/golingvu/golingvu_test.go ./src/lib/golingvu/interopt_test.go ./src/lib/golingvu/integration_test.go",
    
    // Way 2 & 3: Run standard Go tests
    () => "go test -v ./src/lib/golingvu/examples/calculator/native_test.go ./src/lib/golingvu/package_test.go",
    
    // All tests together
    () => "go test -v ./src/lib/golingvu/...",
    
    // Coverage report
    () => "go test -coverprofile=coverage.out ./src/lib/golingvu/... && go tool cover -func=coverage.out",
    
    // Lint check
    () => "golangci-lint run ./src/lib/golingvu/..."
  ],
  dockerfile: `testeranto/runtimes/golang/golang.Dockerfile`,
  buildOptions: `testeranto/runtimes/golang/golang.ts`,
  outputs: [
    "coverage.out",
    "coverage.html"
  ],
}
```

## Quick Start Commands

### Test the examples:
```bash
# Standard Go tests (Way 3)
cd src/lib/golingvu/examples/calculator
go test -v

# Golingvu tests (Way 4)
cd src/lib/golingvu
go test -v -run "TestCalculatorWithGolingvu"
```

### Run all tests:
```bash
# From project root
go test ./src/lib/golingvu/...

# Or navigate to the directory
cd src/lib/golingvu
go test -v
```

### Verify installation:
```bash
# Check if basic tests pass
cd src/lib/golingvu
go test -v -run TestNewGolingvu
```

## Simple Docker Setup

The Dockerfile is straightforward:
```dockerfile
FROM golang:1.22-alpine
WORKDIR /workspace
RUN apk add --no-cache git
RUN go install github.com/golangci/golangci-lint/cmd/golangci-lint@v1.54.2
ENV GO111MODULE=on CGO_ENABLED=1
CMD ["go", "version"]
```

This configuration is much simpler and easier to understand while still supporting all four ways to run tests.
```

## Interoperability

For detailed instructions on running Golingvu tests with different runners, see [interopt.md](./interopt.md).

Key interoperability features:
1. **Run Golingvu tests with `go test`**: Use `RunAsGoTest()`, `CreateGoTest()`, or `TestMainIntegration()`
2. **Run native Go tests through Golingvu**: Convert existing tests to BDD/TDT patterns
3. **Integrate with Testeranto test runner**: Use `ReceiveTestResourceConfig()` with JSON configuration

## License

Part of the Testeranto project. See the main project repository for license information.
