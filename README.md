---
status: todo
title: Readme.md
description: 'Feature: Readme.md'
---
# Testeranto

## What is it?

Testeranto lets you vibe code large, real-world polyglot codebases via tests written in javascript, python, golang, rust and java. By wrapping your code in BDD (Given-When-Then), AAA (Arrange-Act-Assert), and TDT (Table Driven Testing) semantics, you specify the behavior of your components. The tests are run and the output of those tests are passed into the context of your favorite LLM. Testeranto edits your code and tests using your documentation and then runs the tests again. You can define any number of agents, customized to your liking all collaborating through a chat thread. In short, testeranto is my attempt to automate my job. 

In more concrete terms, testeranto is

- a Bun/TS server/test runner that uses docker as a multi-language process manager
- a VS code extension to manage that server
- 6 language specific packages
  - tiposkripto
  - pitono
  - rubeno
  - rusto
  - kafe
  - golingvu

- turns github issues, BDD specs and markdown documentation into packaged artifacts and human readable test reports.
- supports multiple testing patterns: BDD (Given-When-Then), AAA (Arrange-Act-Assert), and TDT (Table Driven Testing)

## getting started

Install testeranto
Add a lib for you language of choice.

- tiposkripto (ts) npm
- rusto (rust) cargo
- pitono (python) pypi
- golingvu (go) `go get github.com/testeranto-dev/golingvu`
- kafe (java) TBD
- rubeno (ruby ) rubygems
- Run `testeranto dev`

### Important Note for Cross-Platform Development

When developing on macOS (especially Apple Silicon) and running tests in Docker containers (Linux x86_64):

- **Node.js dependencies** are installed inside the container during build time
- **Host `node_modules` is NOT mounted** into containers to avoid platform incompatibility
- Ensure your `package.json` and lock files (`yarn.lock`, `package-lock.json`) are included in your Docker build context
- Native addons will be compiled for the container's architecture, not the host's

### Dockerfile Requirements and Common Errors

#### 1. Stage Targeting Error

**Error**: `"ERROR: failed to build: failed to solve: target stage "runtime" could not be found"`

**Cause**: Your Dockerfile doesn't have a stage named "runtime", but the BuildKit configuration is trying to build with `targetStage: "runtime"`.

**Solutions**:

1. **Option A**: Remove `targetStage` from your configuration:
   ```typescript
   buildKitOptions: {
     // Don't include targetStage
     cacheMounts: [...]
   }
   ```
2. **Option B**: Add a stage named "runtime" to your Dockerfile:
   ```dockerfile
   FROM node:20-alpine AS runtime
   WORKDIR /workspace
   # ... rest of your Dockerfile
   ```
3. **Option C**: Update your configuration to match your Dockerfile's stage names:
   ```typescript
   buildKitOptions: {
     targetStage: "builder", // or whatever your stage is named
     cacheMounts: [...]
   }
   ```

#### 2. Single-Stage vs Multi-Stage Dockerfiles

- **Single-stage**: Don't use `targetStage` in configuration
- **Multi-stage**: Use `targetStage` only if you need to build a specific stage

#### 3. Example Configurations

**Single-stage Dockerfile**:

```typescript
buildKitOptions: {
  cacheMounts: ["/root/.npm"];
  // No targetStage
}
```

**Multi-stage Dockerfile with "runtime" stage**:

```typescript
buildKitOptions: {
  cacheMounts: ["/root/.npm"],
  targetStage: "runtime"
}
```

**Multi-stage Dockerfile with custom stage name**:

```typescript
buildKitOptions: {
  cacheMounts: ["/root/.npm"],
  targetStage: "production" // matches FROM ... AS production
}
```

## Philosophy

### Code Structure

Testeranto promotes a clean architecture where:

1. **Business Logic Classes** are pure and testable, delegating to utility functions.
2. **Utility Functions** are each in their own file, organized by folder to preserve context space.
3. **External Dependencies** are abstracted behind a thin wrapper with real and mock implementations.
4. **Testing** focuses on the business logic class using testeranto's BDD, AAA, and TDT patterns.

### Testing and Packaging Approach

The common pattern of testing and packaging software is

1. static tests of entire codebase
2. unit tests of entire codebase
3. packaging
4. integration tests of entire codebase

Testeranto reverses this pattern

1. Breakup the application into "slices"
2. Package each test, producing a set of input files which correlate output artifacts to to the local files which they import.
3. run all the tests
4. the developer invokes the LLM and the results of the tests are passed to an LLM context, along with the input files, features, etc
5. the LLM produces a change
6. this change triggers the test runner to rebuild and relaunch the relevevant tests
7. goto 4

By packaging a piece of software first, we can correlate the output aritifacts to it's specific input source files. We can then run static tests and unit tests upon this set of input files. The results of all these tests, plus the BDD test results, are given to an LLM. This allows focus the LLM's context entirely around 1 slice of an application.

## Running the server

```bash
# Install dependencies
bun install

# Run the server (Bun runs TypeScript directly)
bun run start

# Or run in watch mode
bun run dev

# Build for production
bun build --target node --outdir dist src/index.ts

# Install globally
bun run link   # This builds first, then links

Make sure `~/.bun/bin` is in your PATH:
export PATH="$HOME/.bun/bin:$PATH"
# Add this line to your ~/.zshrc for permanent access
```

## VS Code extension

```sh
# build the extionsion
yarn package:vsce
```
