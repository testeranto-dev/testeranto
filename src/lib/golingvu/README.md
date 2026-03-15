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

Golingvu is the Go implementation of the Testeranto testing framework. It provides BDD-style testing capabilities for Go applications, integrated with the broader Testeranto ecosystem.

## Key Components

### Types
- `ITestSpecification`: Defines test specifications
- `ITestImplementation`: Contains suites, givens, whens, and thens
- `ITestAdapter`: Adapter interface for test execution
- `ITTestResourceConfiguration`: Configuration for test resources

### Process Manager
- `PM_Golang`: Manages test processes and IPC communication
- Handles file operations, browser automation, and test execution

### Test Runner
- `Golingvu`: Main test runner class
- Executes BDD-style tests with Given/When/Then semantics
- Integrates with Testeranto's reporting system

## Usage Examples

### Basic Golingvu Usage

```go
package main

import (
    "fmt"
    "github.com/testeranto-dev/testeranto/src/lib/golingvu"
)

func main() {
    // Create test implementation
    impl := golingvu.ITestImplementation{
        Suites: map[string]interface{}{
            "Default": "Test Suite",
        },
        Givens: map[string]interface{}{
            "Default": func() interface{} {
                return map[string]interface{}{
                    "value": "initial",
                }
            },
        },
        Whens: map[string]interface{}{
            "Increment": func(store interface{}) interface{} {
                // Implementation
                return store
            },
        },
        Thens: map[string]interface{}{
            "CheckValue": func(store interface{}) interface{} {
                // Assertion
                return true
            },
        },
    }
    
    // Create test specification
    spec := func(suites, givens, whens, thens interface{}) interface{} {
        // Define test structure
        return []interface{}{
            map[string]interface{}{
                "key": "Default",
                "givens": map[string]interface{}{
                    "Default": map[string]interface{}{
                        "features": []string{"feature1"},
                        "whens": []interface{}{"Increment"},
                        "thens": []interface{}{"CheckValue"},
                    },
                },
            },
        }
    }
    
    // Create test runner
    runner := golingvu.NewGolingvu(
        nil,
        spec,
        impl,
        golingvu.DefaultTestResourceRequest,
        &golingvu.SimpleTestAdapter{},
        func(f func()) {
            // Error catcher
            defer func() {
                if r := recover(); r != nil {
                    fmt.Println("Recovered:", r)
                }
            }()
            f()
        },
    )
    
    fmt.Println("Test runner created:", runner)
}
```

### Flavored Version (Recommended for Go Testing)

The flavored version provides a more idiomatic Go testing interface that integrates with the standard `go test` toolchain:

```go
package mypackage_test

import (
    "testing"
    "github.com/testeranto-dev/testeranto/src/lib/golingvu/flavored"
)

// Calculator example
type Calculator struct {
    result int
}

func NewCalculator() *Calculator {
    return &Calculator{result: 0}
}

func (c *Calculator) Add(x, y int) {
    c.result = x + y
}

func (c *Calculator) Result() int {
    return c.result
}

func TestCalculatorAddition(t *testing.T) {
    flavored.Given(t, "a new calculator", func() interface{} {
        return NewCalculator()
    }).
    When("adding %d and %d", func(calc interface{}, x, y int) interface{} {
        calc.(*Calculator).Add(x, y)
        return calc
    }, 2, 3).
    Then("result should be %d", func(calc interface{}, expected int) {
        c := calc.(*Calculator)
        if c.Result() != expected {
            t.Errorf("Expected %d, got %d", expected, c.Result())
        }
    }, 5).
    Run()
}
```

### Advanced Usage with Subtests

The flavored version uses Go's built-in `t.Run()` for better test organization and reporting:

```go
func TestMultipleScenarios(t *testing.T) {
    t.Run("addition", func(t *testing.T) {
        flavored.Given(t, "calculator", func() interface{} {
            return &Calculator{result: 0}
        }).
        When("adding 5", func(calc interface{}) interface{} {
            calc.(*Calculator).Add(calc.(*Calculator).result, 5)
            return calc
        }).
        Then("result should be 5", func(calc interface{}) {
            c := calc.(*Calculator)
            if c.Result() != 5 {
                t.Errorf("Expected 5, got %d", c.Result())
            }
        }).
        Run()
    })
    
    t.Run("subtraction", func(t *testing.T) {
        flavored.Given(t, "calculator with 10", func() interface{} {
            return &Calculator{result: 10}
        }).
        When("subtracting 3", func(calc interface{}) interface{} {
            // Custom subtraction logic
            calc.(*Calculator).result -= 3
            return calc
        }).
        Then("result should be 7", func(calc interface{}) {
            c := calc.(*Calculator)
            if c.Result() != 7 {
                t.Errorf("Expected 7, got %d", c.Result())
            }
        }).
        Run()
    })
}
```

### Running Tests

```bash
# Run all tests with the standard Go toolchain
go test ./...

# Run specific test
go test -v -run TestCalculatorAddition

# Run tests with coverage
go test -cover ./...

# Run benchmarks
go test -bench=. ./...

# Run tests with race detector
go test -race ./...
```

### Integration with Standard Go Testing

The flavored version seamlessly integrates with:
- Standard `go test` command and all its flags
- Test coverage tools (`go test -cover`)
- Benchmarking (`go test -bench`)
- Parallel test execution (`t.Parallel()`)
- Test helpers and subtests (`t.Run()`)
- Race detector (`go test -race`)
- Profiling (`go test -cpuprofile`, `-memprofile`)
- JSON output (`go test -json`)

### Interoperability with Golingvu Core

Flavored tests can be converted to standard golingvu specifications:

```go
// Convert a flavored test chain to golingvu specification
chain := flavored.Given(t, "test", setupFunc).
    When("action", actionFunc).
    Then("assertion", assertionFunc)

spec := flavored.ConvertTestChain(chain)
// spec can now be used with golingvu.NewGolingvu()
```

This allows you to:
1. Start with simple flavored tests for rapid development
2. Convert to full golingvu specifications when you need advanced features
3. Mix and match both approaches in the same codebase

## Building and Testing

```bash
# Build the package
go build ./...

# Run tests
go test ./...

# Run with verbose output
go test -v ./...
```

## Publishing

To publish a new version:

```bash
cd src/lib/golingvu
./publish.sh
```

The script will:
1. Check the current module version
2. Build and test the package
3. Prompt for a new version tag (e.g., v1.0.0)
4. Create and push the git tag with the correct prefix (src/lib/golingvu/)

Note: Go modules in subdirectories require tags with the full path prefix. 
Existing root-level tags (like v0.1.9) are not compatible with Go modules.
Use the publish script to create properly formatted tags.

## Integration with Testeranto

Golingvu integrates with the broader Testeranto ecosystem:

1. **Test Execution**: Runs BDD-style tests with Given/When/Then semantics
2. **Resource Management**: Manages test resources through `PM_Golang`
3. **Reporting**: Generates test reports in Testeranto's standard format
4. **Artifact Generation**: Creates test artifacts for LLM analysis

## Architecture

### Metafile Generation
Like other Testeranto implementations, Golingvu generates metafiles that track:
- Input source files and their dependencies
- Output generated files and their relationships
- Unique signatures for change detection

### File Watching
Uses dual watchers for:
1. Source file changes (triggers regeneration)
2. Bundle file changes (triggers test execution)

### Process Communication
- IPC via WebSocket or direct file operations
- Browser automation for UI testing
- Resource lifecycle management

## License

Part of the Testeranto project. See the main project repository for license information.
