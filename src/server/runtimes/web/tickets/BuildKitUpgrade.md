---
owner: adam
status: working
due date: idk
ETA: idk
---

### Web Runtime

**Implementation Details**:

- **Chrome Service**: Separated from builder (standalone `chrome-service` container)
- **Cache Mounts**: npm/yarn caches (`/root/.npm`, `/usr/local/share/.cache/yarn`)
- **Dockerfile Simplicity**: Users provide minimal Dockerfiles without Chrome/socat
- **BuildKit Integration**: On-demand builds with `webBuildKitBuild` function
- **Architecture**: Builder creates bundles, Chrome service handles browser execution

**Example Configuration**:

```typescript
webtests: {
  runtime: "web",
  tests: ["src/ts/Calculator.test.web.ts"],
  checks: [(x) => `yarn eslint ${x.join(' ')}`],
  dockerfile: `testeranto/runtimes/web/web.Dockerfile`,
  buildOptions: `testeranto/runtimes/web/web.ts`,
  buildKitOptions: {
    cacheMounts: ["npm", "yarn"],
    targetStage: "runtime"
  }
}
```

**Migration Complete**: Web runtime uses BuildKit exclusively with separated Chrome service architecture.

**Important Configuration Note**:

- If your Dockerfile is single-stage, do not specify `targetStage` in `buildKitOptions`
- If your Dockerfile has multi-stage builds, specify the correct target stage name
- Default configuration no longer assumes `targetStage: 'runtime'`
