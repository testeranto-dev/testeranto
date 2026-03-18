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

## License

Part of the Testeranto project. See the main project repository for license information.
