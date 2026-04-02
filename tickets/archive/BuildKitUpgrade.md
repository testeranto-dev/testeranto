---
owner: adam
status: done
title: BuildKitUpgrade
description: ''
priority: medium
---

### Node Runtime

**Implementation Details**:

- **Cache Mounts**: npm/yarn caches (`/root/.npm`, `/usr/local/share/.cache/yarn`)
- **BuildKit Integration**: On-demand builds with `nodeBuildKitBuild` function
- **Dockerfile Simplicity**: Users provide minimal Node.js Dockerfiles

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
