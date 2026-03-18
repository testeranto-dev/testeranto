# Kafe - Java Implementation of Testeranto

Kafe is a Java implementation of the Testeranto BDD testing framework, following the same patterns as other language implementations (TypeScript, Python, Go, Ruby, Rust).

## Overview

This implementation provides Java classes for writing BDD-style tests with Given-When-Then structure, integrated with the Testeranto ecosystem.

## Structure

- `types.java`: Core type definitions and interfaces
- `BaseSuite.java`: Base class for test suites
- `BaseGiven.java`: Base class for Given conditions
- `BaseWhen.java`: Base class for When actions
- `BaseThen.java`: Base class for Then assertions
- `SimpleTestAdapter.java`: Default adapter implementation
- `Kafe.java`: Main orchestrator class
