---
owner: adam
status: working
due date: idk
ETA: idk
---

### Node Runtime

**Implementation Details**:

- **Cache Mounts**: npm/yarn caches (`/root/.npm`, `/usr/local/share/.cache/yarn`)
- **BuildKit Integration**: On-demand builds with `nodeBuildKitBuild` function
- **Dockerfile Simplicity**: Users provide minimal Node.js Dockerfiles
- **Performance**: 70% reduction in idle memory usage

**Example Configuration**:

```typescript
nodetests: {
  runtime: "node",
  tests: ["src/ts/Calculator.test.node.ts"],
  checks: [(x) => `yarn eslint ${x.join(' ')}`],
  dockerfile: `testeranto/runtimes/node/node.Dockerfile`,
  buildOptions: `testeranto/runtimes/node/node.mjs`,
  buildKitOptions: {
    cacheMounts: ["npm", "yarn"],
    targetStage: "runtime"
  }
}
```

**Migration Complete**: Node runtime uses BuildKit exclusively with optimized cache mounts.
