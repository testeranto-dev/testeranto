---
owner: adam
status: working
due date: idk
ETA: idk
---

### Python Runtime (pythontests)

**Current User Provides**:

- `python.Dockerfile`: Python 3.11 with build tools
- `python.py`: JSON config generator
- Tests: `src/python/Calculator.pitono.test.py`

**Implementation Details**:

- **Dependency Analysis**: Python import tracking with ast module
- **BuildKit Integration**: Follows Ruby pattern for consistency
- **Pip Support**: Works with requirements.txt and virtual environments
- **Bundle Generation**: Creates executable Python test bundles
- **Import Resolution**: Handles relative and absolute imports

**Example Configuration**:

```typescript
pythontests: {
  runtime: "python",
  tests: ["example/Calculator.pitono.test.py"],
  checks: [
    // Python-specific checks can be added here
  ],
  dockerfile: `testeranto/runtimes/python/python.Dockerfile`,
  buildOptions: `testeranto/runtimes/python/python.py`,
  buildKitOptions: {
    cacheMounts: ["/root/.cache/pip"],  // Optional pip cache
    targetStage: "runtime"
  }
}
```

**Migration Complete**: Python runtime uses BuildKit exclusively with comprehensive Python dependency analysis.
