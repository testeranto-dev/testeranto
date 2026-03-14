## Builders Overview

Each builder creates test artifacts and dependency metadata using BuildKit.

### Common Responsibilities
1. **Import Configuration**: Process language-specific config files
2. **Create Bundles**: Generate executable test artifacts
3. **Generate Metadata**: Produce inputFiles.json listing all source dependencies

### BuildKit Only (No Fallbacks)
- All builders use BuildKit exclusively
- No traditional builds supported
- BuildKit is the only option (no configuration flag needed)

### Dockerfile Simplicity
- Users provide minimal Dockerfiles
- No Chrome/socat in web Dockerfiles (handled by testeranto)
- Single-stage Dockerfiles are sufficient
- Cache mounts improve performance

### Language-Specific Build Approaches
- **Node/Web**: esbuild bundles
- **Python/Ruby**: Script files (no compilation)
- **Go/Rust/Java**: Compiled executables

### BuildKit Configuration
When using BuildKit, ensure your configuration includes:

```typescript
useBuildKit: true,
buildKitOptions: {
  // Optional: cache mounts for dependencies
  cacheMounts: ["/go/pkg/mod", "/root/.cache/go-build"], // Example for Go
  // Optional: target stage for multi-stage builds (if your Dockerfile has stages)
  // targetStage: "runtime",  // Only use if your Dockerfile has a stage named "runtime"
  // Optional: build arguments
  // buildArgs: {
  //   GO_ENV: "production"
  // }
}
```

**Important**: The `targetStage` option should only be used if your Dockerfile has multi-stage builds with a stage named "runtime". If you have a single-stage Dockerfile, omit this option or set it to `undefined`.

### Dockerfile Stage Requirements
1. **Single-stage Dockerfiles**: Don't use `targetStage` in buildKitOptions
2. **Multi-stage Dockerfiles**: Use `targetStage` only if you have a stage with that name
3. **Default behavior**: If no targetStage is specified, BuildKit builds the final stage

BuildKit will build your Dockerfile as specified. Cache mounts are optional but recommended for better performance.


### inputFiles.json

Every builder produces a single inputFiles.json file for all tests in a runtime, which describes what files changed for a particular build. This is used by the server to detect changes to packages and launch them. This file contains an object where each key is a test entry point, and the value is an object with a hash and list of files.

```json
{
  "src/golang/cmd/calculator-test/main.go": {
    "hash": "md5hash",
    "files": [
      "/src/golang/cmd/calculator-test/main.go",
      "/go.mod",
      "/go.sum"
    ]
  },
  "src/golang/another-test/main.go": {
    "hash": "anothermd5hash",
    "files": [
      "/src/golang/another-test/main.go",
      "/go.mod",
      "/go.sum"
    ]
  }
}
```

The hash is obtained by concatenating the contents of all the relevant input files and running it through MD5.
```
