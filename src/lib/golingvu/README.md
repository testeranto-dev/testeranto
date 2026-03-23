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

## License

Part of the Testeranto project. See the main project repository for license information.
