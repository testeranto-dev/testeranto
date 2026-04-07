---
status: partially implemented
---
we have an outputs field in the config. When the app is shutting down, the builders should produce the given output artifacts, where the outputs are a list of entrypoints. The actual outputs will be a a docker image. After a shutdown has been initiated, but before the program exits, we should built the output artifact in a docker image 

## Implementation Status

✅ **Node.js Builder**: 
- SIGTERM/SIGINT handlers call `produceOutputArtifacts()` before exiting
- Copies files from outputs field to `testeranto/outputs/{configKey}/`
- Signal handlers set up in main() after projectConfigs is available
- Handles uncaught exceptions and produces artifacts before exiting

✅ **Web Builder**:
- SIGTERM/SIGINT handlers call `produceOutputArtifacts()` before exiting
- Copies files from outputs field to `testeranto/outputs/{configKey}/`
- Signal handlers set up in main() after projectConfigs is available
- Handles uncaught exceptions and produces artifacts before exiting

⚠️ **Server_Docker**:
- `stop()` method sends SIGTERM to builder containers to trigger artifact production
- Builds docker images for each output entrypoint using the config's dockerfile
- Image naming: `output-{configKey}-{cleanEntrypoint}:latest`
- However, the `signalBuildersForOutputArtifacts()` method is not called in the current implementation
- The `stop()` method builds docker images but doesn't wait for builders to produce artifacts first

## Remaining Work

❌ **Python Builder**:
- Has `produce_output_artifacts()` function but signal handlers are not properly integrated
- SIGTERM/SIGINT handlers are not set up in the main execution path
- The function exists but is not called during shutdown

❌ **Ruby Builder**:
- Has basic signal handling for SIGTERM/SIGINT but no `produceOutputArtifacts()` function
- No output artifact production implemented

❌ **Java Builder**:
- No output artifact production on shutdown
- Only has shutdown hook for logging, not for producing artifacts

❌ **Go Builder**:
- Has `produceOutputArtifacts()` function but signal handling is incomplete
- The function is only called in dev mode, not integrated with main execution

❌ **Rust Builder**:
- Has `produce_output_artifacts()` function but signal handling is incomplete
- Uses `ctrlc::set_handler()` but not properly integrated with main execution

## Usage

Output artifacts are defined in the testeranto.ts config:
```typescript
outputs: [
  "src/lib/kafe/examples/calculator/Calculator.java",
  "test_output",
  "testeranto/reports/rubytests"
]
```

During shutdown, these files should be copied to `testeranto/outputs/{configKey}/` and docker images should be built from them.
