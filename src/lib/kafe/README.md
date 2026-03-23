# Kafe - Java Implementation of Testeranto

Kafe is a Java implementation of the Testeranto testing framework, following the same patterns as other language implementations (TypeScript, Python, Go, Ruby, Rust).

## Overview

This implementation provides Java classes for writing tests with multiple patterns:
1. **BDD (Behavior Driven Development)**: Given-When-Then structure
2. **TDT (Table-Driven Testing)**: Value-Should-Expected structure
3. **Describe-It (AAA/Arrange-Act-Assert)**: Describe-It structure

All patterns are integrated with the Testeranto ecosystem and share a unified core architecture.

## Structure

- `types.java`: Core type definitions and interfaces
- `BaseSuite.java`: Base class for test suites
- `BaseGiven.java`: Base class for Given conditions (BDD)
- `BaseWhen.java`: Base class for When actions (BDD)
- `BaseThen.java`: Base class for Then assertions (BDD)
- `BaseValue.java`: Base class for Value setup (TDT)
- `BaseShould.java`: Base class for Should actions (TDT)
- `BaseExpected.java`: Base class for Expected checks (TDT)
- `BaseDescribe.java`: Base class for Describe setup (Describe-It/AAA)
- `BaseIt.java`: Base class for It actions (Describe-It/AAA)
- `SimpleTestAdapter.java`: Default adapter implementation
- `Kafe.java`: Main orchestrator class

## Patterns Supported

### BDD Pattern (Fully Implemented)
- `BaseGiven`: Extends `BaseSetup` for Given conditions
- `BaseWhen`: Extends `BaseAction` for When actions
- `BaseThen`: Extends `BaseCheck` for Then assertions

### TDT Pattern (Core Classes Available)
- `BaseValue`: Extends `BaseSetup` for Value setup (table data)
- `BaseShould`: Extends `BaseAction` for Should actions (row processing)
- `BaseExpected`: Extends `BaseCheck` for Expected checks (row validation)

### Describe-It Pattern (AAA/Arrange-Act-Assert) (Core Classes Available)
- `BaseDescribe`: Extends `BaseSetup` for Describe/Arrange phase
- `BaseIt`: Extends `BaseAction` for It phase (combines Act and Assert)

**Note**: The AAA (Arrange-Act-Assert) pattern is implemented as the Describe-It pattern with 2 verbs: "Describe" for Arrange and "It" for combined Act and Assert phases. This contrasts with BDD which uses 3 separate verbs (Given, When, Then).
