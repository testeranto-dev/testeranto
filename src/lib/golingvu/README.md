# Golingvu - Testeranto Implementation for Go

## Installation

```bash
go get github.com/testeranto-dev/testeranto/src/lib/golingvu@v0.1.9
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

## Usage Example

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
4. Create and push the git tag

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
