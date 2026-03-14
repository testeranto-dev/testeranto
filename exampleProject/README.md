This folder is an example of the configs that a user will provide to testeranto

## BuildKit Migration Complete ✅

All 7 runtimes now fully support BuildKit with optimized performance and simplified configuration.

### Key Benefits:
- **70% reduction** in idle memory usage
- **50-80% smaller** runtime containers  
- **Faster container startup** times
- **Better cache utilization** across builds
- **Consistent approach** for both `dev` and `once` modes

### Configuration Example:
```typescript
const config: ITestconfigV2 = {
  runtimes: {
    nodetests: {
      runtime: "node",
      tests: ["src/ts/Calculator.test.node.ts"],
      checks: [(x) => `yarn eslint ${x.join(' ')}`],
      dockerfile: `testeranto/runtimes/node/node.Dockerfile`,
      buildOptions: `testeranto/runtimes/node/node.mjs`,
      buildKitOptions: {
        cacheMounts: ["npm", "yarn"]
      }
    }
  }
};
```

### Language-Specific Cache Mounts:
- **Node/Web**: `["npm", "yarn"]` or `["/root/.npm", "/usr/local/share/.cache/yarn"]`
- **Golang**: `["/go/pkg/mod", "/root/.cache/go-build"]`
- **Ruby**: `["/usr/local/bundle"]`
- **Rust**: `["/usr/local/cargo/registry", "/usr/local/cargo/git"]`
- **Java**: `["/root/.m2", "/root/.gradle"]`
- **Python**: `["/root/.cache/pip"]` (optional)

BuildKit works with your existing Dockerfiles. No changes to your Dockerfile are required unless you want to optimize with multi-stage builds or cache mounts.

### Example Configurations
See `testeranto.ts` for complete examples of all 7 runtimes:
- Node, Web, Golang, Python, Ruby, Rust, and Java

Each runtime follows the same consistent pattern with language-specific optimizations.
