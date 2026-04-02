---
owner: adam
status: Done
due_date: IDK
title: BuildKitUpgrade
description: ''
priority: medium
---

# BuildKit Upgrade Plan 🚧

**Migration In Progress**: BuildKit support is being added across all 7 runtimes. The infrastructure is in place but not all components are fully implemented or tested.

## Summary

The BuildKit migration is currently underway. The goal is to replace hot builders with on-demand BuildKit builds, which should result in significant performance improvements and resource savings once complete.

## Key Goals

- **On-Demand Builds**: BuildKit will trigger builds when source files change
- **Single Watcher**: One process will monitor all runtimes efficiently
- **Cache Mounts**: Language-specific cache mounts for faster builds
- **Ephemeral Builders**: Eliminate long-running builder containers
- **Multi-Stage Support**: Optional for advanced optimization

## Configuration Example (Target)

```typescript
const config: ITesterantoConfig = {
  runtimes: {
    nodetests: {
      runtime: "node",
      tests: ["src/ts/Calculator.test.node.ts"],
      checks: [(x) => `yarn eslint ${x.join(" ")}`],
      dockerfile: `testeranto/runtimes/node/node.Dockerfile`,
      buildOptions: `testeranto/runtimes/node/node.mjs`,
      buildKitOptions: {
        cacheMounts: ["npm", "yarn"],
      },
    },
  },
};
```

## Language-Specific Cache Mounts (Planned)

- **Node/Web**: `["npm", "yarn"]` or `["/root/.npm", "/usr/local/share/.cache/yarn"]`
- **Golang**: `["/go/pkg/mod", "/root/.cache/go-build"]`
- **Ruby**: `["/usr/local/bundle"]`
- **Rust**: `["/usr/local/cargo/registry", "/usr/local/cargo/git"]`
- **Java**: `["/root/.m2", "/root/.gradle"]`
- **Python**: `["/root/.cache/pip"]` (optional)
