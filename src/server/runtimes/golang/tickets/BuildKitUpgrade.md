---
owner: adam
status: Implemented, untested
due date: idk
ETA: soon
---

### Golang Runtime

**Implementation Details**:
- **Cache Mounts**: `/go/pkg/mod`, `/root/.cache/go-build`
- **BuildKit Integration**: On-demand builds with `golangBuildKitBuild` function
- **Go Module Support**: Full Go module dependency management
- **Binary Compilation**: Produces standalone executables for tests
- **Dependency Tracking**: Comprehensive input file collection

**Example Configuration**:
```typescript
golangtests: {
  runtime: "golang",
  tests: ["example/Calculator.golingvu.test.go"],
  checks: [
    (x) => `go vet ${x.join(' ')}`,
    golangciLintCommand,
  ],
  dockerfile: `testeranto/runtimes/golang/golang.Dockerfile`,
  buildOptions: `testeranto/runtimes/golang/golang.go`,
  buildKitOptions: {
    cacheMounts: ["/go/pkg/mod", "/root/.cache/go-build"],
    targetStage: "runtime"
  }
}
```

**Migration Complete**: Golang runtime uses BuildKit exclusively with optimized Go dependency caching.
