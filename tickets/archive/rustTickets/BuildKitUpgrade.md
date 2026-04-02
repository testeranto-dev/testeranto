---
owner: adam
status: working
due date: idk
ETA: idk
title: BuildKitUpgrade
description: ''
priority: medium
---

### Rust Runtime (rusttests)

**Status**: Fully Implemented and Tested ✅

**Current User Provides**:

- `rust.Dockerfile`: Rust 1.75 with build tools
- `rust.rs`: Constants/structs
- Tests: `src/rust/Calculator.rusto.test.rs`

**Implementation Details**:

- **Cache Mounts**: Cargo registry and git caches (`/usr/local/cargo/registry`, `/usr/local/cargo/git`)
- **BuildKit Integration**: On-demand builds with `rustBuildKitBuild` function
- **Cargo Support**: Full Cargo workspace and dependency management
- **Incremental Compilation**: Leverages Cargo's incremental build system
- **Binary Production**: Creates standalone Rust executables

**Example Configuration**:

```typescript
rusttests: {
  runtime: "rust",
  tests: ["src/rust/Calculator.rusto.test.rs"],
  checks: [
    (x) => `cargo clippy ${x.join(' ')}`,
  ],
  dockerfile: `testeranto/runtimes/rust/rust.Dockerfile`,
  buildOptions: `testeranto/runtimes/rust/rust.rs`,
  buildKitOptions: {
    cacheMounts: ["/usr/local/cargo/registry", "/usr/local/cargo/git"],
    targetStage: "runtime"
  }
}
```

**Migration Complete**: Rust runtime uses BuildKit exclusively with optimized Cargo caching.
