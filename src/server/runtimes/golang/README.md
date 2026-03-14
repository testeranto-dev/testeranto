# golang builder

This will run in a builder container for golang projects. It has 2 jobs

1) build the golang tests
2) produce a "metafile" - a json file describing the output files and for each, the input files. This should be similar to the js's esbuild metafile. 

BDD tests and static analysis tests are run as Docker commands upon the build image. These will be run from outside the builder (in the server). The builder only needs to be setup to run these tests- it does not run these tests itself. 

Ensure your configuration includes:

```typescript
useBuildKit: true,
buildKitOptions: {
  // Optional: cache mounts for Go dependencies
  cacheMounts: ["/go/pkg/mod", "/root/.cache/go-build"],
  // Optional: target stage for multi-stage builds (if your Dockerfile has stages)
  // targetStage: "runtime",
  // Optional: build arguments
  // buildArgs: {
  //   GO_ENV: "production"
  // }
}
```

BuildKit will build your existing Dockerfile as-is. No changes to your Dockerfile are required. Cache mounts are optional but recommended for better performance.
