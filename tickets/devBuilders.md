---
status: partially implemented
---

Each build needs to work in both dev mode and once mode. The esbuild mechanism for node and web is the most canonical. 

## Implementation Status

✅ **Node.js Builder**:
- Dev mode: Uses esbuild watch mode with rebuild notifier plugin
- Once mode: Single esbuild build
- Signal handling for graceful shutdown with output artifact production
- Keeps process alive in dev mode with setInterval

✅ **Web Builder**:
- Dev mode: Uses esbuild watch mode with rebuild notifier plugin and dev server
- Once mode: Single esbuild build
- Signal handling for graceful shutdown with output artifact production
- Chrome service runs separately via docker-compose

⚠️ **Python Builder**:
- Dev mode: Keeps process alive with signal handlers
- Once mode: Single execution
- Has `produce_output_artifacts()` function but signal handlers are not properly integrated
- The function exists but is not called during shutdown

⚠️ **Ruby Builder**:
- Dev mode: Keeps process alive with signal handlers
- Once mode: Single execution
- Basic signal handling for SIGTERM/SIGINT but no output artifact production
- No `produceOutputArtifacts()` function implemented

⚠️ **Java Builder**:
- Dev mode: Keeps process alive with shutdown hook
- Once mode: Single execution
- No output artifact production on shutdown
- Shutdown hook only logs, doesn't produce artifacts

⚠️ **Go Builder**:
- Dev mode: Keeps process alive with signal channel
- Once mode: Single execution
- Has `produceOutputArtifacts()` function but signal handling is incomplete
- The function is only called in dev mode, not integrated with main execution

⚠️ **Rust Builder**:
- Dev mode: Keeps process alive with ctrlc handler
- Once mode: Single execution
- Has `produce_output_artifacts()` function but signal handling is incomplete
- Uses `ctrlc::set_handler()` but not properly integrated with main execution

## Shutdown Procedures

Only Node.js and Web builders have complete shutdown procedures with output artifact production. Other builders have partial or no implementation.

## Next Steps

1. **Standardize shutdown procedures** across all builders
2. **Ensure output artifact production** works consistently for all runtimes
3. **Integrate signal handling** in Python, Ruby, Java, Go, and Rust builders
4. **Document the dev/once mode behavior** for each runtime
5. **Fix Server_Docker's `stop()` method** to properly wait for builders to produce artifacts before building docker images
