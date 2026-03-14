---
owner: adam
status: in progress
due_date: TBD
---

# BuildKit Upgrade Plan 🚧

**Migration In Progress**: BuildKit support is being added across all 7 runtimes. The infrastructure is in place but not all components are fully implemented or tested.

## Summary
The BuildKit migration is currently underway. The goal is to replace hot builders with on-demand BuildKit builds, which should result in significant performance improvements and resource savings once complete.

## Current Status
- **🟡 Infrastructure Ready**: BuildKit utilities and interfaces are in place
- **🟡 Partial Implementation**: Some runtimes have BuildKit builders implemented
- **🟡 Testing Needed**: Implementation requires thorough testing
- **🟡 Integration Pending**: Not all components are fully integrated

## Key Goals
- **On-Demand Builds**: BuildKit will trigger builds when source files change
- **Single Watcher**: One process will monitor all runtimes efficiently
- **Cache Mounts**: Language-specific cache mounts for faster builds
- **Ephemeral Builders**: Eliminate long-running builder containers
- **Multi-Stage Support**: Optional for advanced optimization

## Configuration Example (Target)
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

## Language-Specific Cache Mounts (Planned)
- **Node/Web**: `["npm", "yarn"]` or `["/root/.npm", "/usr/local/share/.cache/yarn"]`
- **Golang**: `["/go/pkg/mod", "/root/.cache/go-build"]`
- **Ruby**: `["/usr/local/bundle"]`
- **Rust**: `["/usr/local/cargo/registry", "/usr/local/cargo/git"]`
- **Java**: `["/root/.m2", "/root/.gradle"]`
- **Python**: `["/root/.cache/pip"]` (optional)

## Expected Performance Improvements
- **Target: 70% reduction** in idle memory usage
- **Target: 50-80% smaller** runtime containers  
- **Faster container startup** times
- **Better cache utilization** across builds
- **Consistent approach** for both `dev` and `once` modes

## Implementation Progress
Each runtime needs:
1. **BuildKit-based service configuration** in docker.ts files
2. **Cache mount optimization** for language-specific dependencies
3. **BuildKit build functions** for on-demand image building
4. **Simplified user experience** - users provide minimal Dockerfiles

## Current Challenges
1. **Integration Testing**: BuildKit builders need to be tested with actual Dockerfiles
2. **Fallback Mechanism**: Need to handle cases where BuildKit is not available
3. **Cache Management**: Proper cache mount configuration for each language
4. **Error Handling**: Robust error handling for build failures

## Next Steps
1. Complete implementation of BuildKit builders for all 7 runtimes
2. Test BuildKit integration with sample projects
3. Implement fallback to traditional builds when BuildKit is unavailable
4. Optimize cache mount configurations
5. Update documentation and examples

## Migration Status
The BuildKit upgrade is actively being worked on. Some components are implemented but require testing and integration. Users should continue using the current architecture until the migration is complete and thoroughly tested.

