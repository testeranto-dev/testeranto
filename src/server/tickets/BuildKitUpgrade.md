---
owner: adam
status: planning
---

# BuildKit Upgrade Plan

## Current Architecture
- Hot builders continuously watch source files
- Process manager watches builder outputs
- Two-level file watching system
- Builders emit inputFiles.json for dependency tracking
- **Mode System**: `dev` (continuous) vs `once` (run-once) modes
- **Image Hierarchy**: Builder images serve as base for test containers
- **Volume Strategy**: Host-directory mounts for source code and artifacts
- **Runtime Strategies**: Different build approaches per language type
- **User Configuration**: Three-layer config system with user-provided Dockerfiles

## Issues
- Resource overhead from hot builders (especially in `dev` mode)
- Complex synchronization between watchers
- Inefficient cache utilization
- Multiple file system watchers increase I/O load
- **Mode Inconsistency**: Hot builders always run in `dev` mode, wasting resources in `once` mode
- **Image Bloat**: Test containers inherit full builder image with build tools
- **Volume Performance**: Host bind mounts create I/O overhead and permission issues
- **Strategy Fragmentation**: Different approaches for interpreted vs compiled languages
- **Configuration Complexity**: Three separate config layers increase setup complexity

## User Configuration Analysis (Based on Example Project)

### What Users Currently Provide:
1. **Project Config** (`testeranto.ts`):
   - Defines all runtimes with their configurations
   - Specifies tests, checks, dockerfiles, and build options for each runtime
   - Example shows 7 runtimes: rubytests, nodetests, webtests, pythontests, golangtests, rusttests

2. **Runtime Config Files** (language-specific):
   - **Node/Web**: `.mjs`/`.ts` files with esbuild configuration
   - **Python**: `.py` files that output JSON config
   - **Golang**: `.go` files that output JSON config  
   - **Ruby**: `.rb` files that output JSON config
   - **Rust**: `.rs` files with constants/structs
   - **Java**: `.java` files (currently empty in example)

3. **Dockerfiles** (per runtime):
   - Custom Dockerfiles for each language runtime
   - Users control base images, dependencies, and setup
   - Example shows varied approaches: alpine-based, tool installations, etc.

### Key Observations from Example Project:
1. **Consistent Pattern**: Each runtime has same structure in `testeranto.ts`
2. **Language-Specific Build Files**: Different formats for different languages
3. **Custom Dockerfiles**: Users provide optimized images for their needs
4. **Check Functions**: Custom static analysis commands per runtime
5. **Test Paths**: Language-specific test file naming conventions

## Proposed Solution
### Ephemeral Builders with BuildKit
- Replace hot builders with on-demand builds
- Single watcher process detects source changes
- Trigger language-specific builds via BuildKit
- Use cache mounts for persistent dependencies
- **Mode Optimization**: Both modes use same ephemeral approach
- **Multi-Stage Builds**: Separate build and runtime images
- **Volume Strategy**: Named volumes for caches, BuildKit for artifacts
- **Unified Strategy**: Consistent pattern across all runtimes
- **Configuration Simplification**: Reduce config layers while maintaining flexibility
- **Backward Compatibility**: Maintain support for existing user configurations

## Migration Timeline

### Phase 0: Derisking (1-2 weeks)
**Goal**: Systematically identify and validate the hardest, most difficult, least well-known, and broadest technical challenges before committing to full implementation.

**High-Risk Areas to Validate**:
1. **BuildKit Integration with Existing Docker Compose**
   - Test BuildKit alongside current docker-compose setup
   - Validate cache mount compatibility with existing volume strategy
   - Ensure multi-stage builds work with user-provided Dockerfiles

2. **Web Runtime Chrome Integration**
   - Test Chrome as standalone service with BuildKit-built bundles
   - Validate WebSocket connection stability
   - Measure performance impact of separating Chrome from builder

3. **Cross-Language Artifact Sharing**
   - Test BuildKit's content-addressable storage for multi-language artifacts
   - Validate artifact transfer between build and runtime stages
   - Test parallel build coordination across languages

4. **User Dockerfile Compatibility**
   - Test BuildKit extensions with various user Dockerfile patterns
   - Validate backward compatibility with existing projects
   - Test build argument injection and template extension

5. **Performance Baseline Comparison**
   - Measure current hot builder resource usage (CPU, memory, I/O)
   - Test ephemeral builder startup and build times
   - Compare cache effectiveness between old and new systems

6. **User Configuration Migration**
   - Test migration of existing `testeranto.ts` configurations
   - Validate runtime config file compatibility
   - Test Dockerfile extension patterns

**Derisking Activities**:
1. **Spike Prototypes**:
   - Minimal Node runtime with BuildKit (highest usage)
   - Web runtime with separate Chrome service
   - One compiled language (Go) with multi-stage builds

2. **Technical Validation**:
   - BuildKit feature compatibility matrix
   - Docker version requirements assessment
   - Cross-platform compatibility testing

3. **Integration Testing**:
   - Test BuildKit builds alongside existing hot builders
   - Validate artifact compatibility with existing test runners
   - Test mode switching (`dev` vs `once`) with new approach

4. **User Configuration Testing**:
   - Test with example project configuration
   - Validate all 7 runtime types work with new system
   - Test custom check functions and Dockerfiles

**Success Criteria for Derisking**:
- ✅ No showstopper technical issues identified
- ✅ BuildKit performance meets or exceeds hot builders for key scenarios
- ✅ User Dockerfile extension pattern validated
- ✅ Web Chrome integration proven feasible
- ✅ Clear migration path identified for each language
- ✅ Example project configuration works with new system

**Exit Criteria**:
- Technical feasibility report completed
- Risk assessment matrix with mitigation strategies
- Go/No-Go decision point for full migration

### Phase 1: Foundation (2-3 weeks)
1. Enable BuildKit across all environments
2. Implement single watcher system
3. Create BuildKit Dockerfile templates for each language
4. Set up named volume strategy for caches
5. **Configuration Bridge**: Create adapter for existing user configs

### Phase 2: Language Migration (4-6 weeks)
**Priority Order** (based on example project usage):
1. **Node** (nodetests - most common, establishes patterns)
2. **Web** (webtests - complex but important)
3. **Python/Ruby** (pythontests/rubytests - simple interpreted)
4. **Go** (golangtests - compiled with go modules)
5. **Rust** (rusttests - compiled with cargo)
6. **Java** (not in example but should be supported)

### Phase 3: Integration & Optimization (2-3 weeks)
1. Unified artifact store implementation
2. Parallel build optimization
3. Performance benchmarking
4. Documentation and migration guides
5. **Configuration Migration Tools**: Automate migration of user configs

### Phase 4: Deprecation & Cleanup (1-2 weeks)
1. Deprecate old hot builder system
2. Remove legacy code
3. Final performance validation
4. **User Migration Support**: Provide support for existing projects

## Language-Specific Migration Roadmap

### Node Runtime (nodetests)
**Current User Provides**:
- `node.Dockerfile`: Node 20 alpine with build tools
- `node.mjs`: esbuild configuration
- Tests: `src/ts/Calculator.test.node.ts`
- Checks: eslint, tsc

**Migration Strategy**:
1. Extend user Dockerfile with BuildKit multi-stage
2. Preserve esbuild configuration from `.mjs` file
3. Convert hot builder to ephemeral BuildKit builds
4. Maintain check function compatibility

**BuildKit Dockerfile Extension**:
```dockerfile
# User's base Dockerfile (node.Dockerfile)
FROM node:20.19.4-alpine as base
# ... user customizations ...

# BuildKit adds multi-stage extensions
FROM base AS builder
WORKDIR /workspace
COPY --from=base /workspace /workspace
RUN --mount=type=cache,target=/root/.npm \
    yarn install
COPY . .
# Use user's esbuild config from node.mjs
RUN npx esbuild --config=./testeranto/runtimes/node/node.mjs

FROM base AS runtime
WORKDIR /workspace
COPY --from=builder /workspace/dist ./dist
```

### Web Runtime (webtests)
**Current User Provides**:
- `web.Dockerfile`: Node + Chrome + socat
- `web.ts`: esbuild configuration
- Tests: `src/ts/Calculator.test.web.ts`
- Checks: eslint, tsc

**Migration Strategy**:
1. Separate Chrome into standalone service
2. Use BuildKit for bundling only
3. Maintain WebSocket connection to Chrome
4. Preserve user's Chrome configuration

### Python Runtime (pythontests)
**Current User Provides**:
- `python.Dockerfile`: Python 3.11 with build tools
- `python.py`: JSON config generator
- Tests: `src/python/Calculator.pitono.test.py`

**Migration Strategy**:
1. Simplify: No compilation, just dependency analysis
2. Use pip cache mounts
3. Generate dependency manifest via BuildKit
4. Preserve user's Python environment setup

### Ruby Runtime (rubytests)
**Current User Provides**:
- `ruby.Dockerfile`: Ruby 3.2 with build tools
- `ruby.rb`: JSON config generator
- Tests: `src/ruby/Calculator-test.rb`
- Checks: rubocop

**Migration Strategy**:
1. Similar to Python: No compilation needed
2. Use gem cache mounts
3. Simplify require analysis
4. Preserve user's Ruby environment

### Golang Runtime (golangtests)
**Current User Provides**:
- `golang.Dockerfile`: Go 1.22 with module download
- `golang.go`: JSON config generator
- Tests: `src/golang/cmd/calculator-test/main.go`
- Checks: go vet, golangci-lint

**Migration Strategy**:
1. Use Go module and build caches
2. Multi-stage: builder (Go SDK) → runtime (minimal)
3. Preserve user's Go module setup
4. Maintain custom lint check functions

### Rust Runtime (rusttests)
**Current User Provides**:
- `rust.Dockerfile`: Rust 1.75 with build tools
- `rust.rs`: Constants/structs
- Tests: `src/rust/Calculator.rusto.test.rs`

**Migration Strategy**:
1. Use Cargo registry and target caches
2. Multi-stage builds
3. Preserve user's Cargo.toml setup
4. Leverage incremental compilation

## Key Changes

### 1. Configuration Layer Updates
**Current**: Three separate layers (project + runtime + Dockerfile)
**Proposed**: Unified with backward compatibility

**Migration Path for User Configs**:
```typescript
// Current user config (testeranto.ts)
const config: ITestconfigV2 = {
  runtimes: {
    nodetests: {
      runtime: "node",
      tests: ["src/ts/Calculator.test.node.ts"],
      checks: [(x) => `yarn eslint ${x.join(' ')}`],
      dockerfile: `testeranto/runtimes/node/node.Dockerfile`,
      buildOptions: `testeranto/runtimes/node/node.mjs`,
    }
  }
};

// New system maintains compatibility but can simplify:
const newConfig: ITestconfigV2 = {
  runtimes: {
    nodetests: {
      runtime: "node",
      tests: ["src/ts/Calculator.test.node.ts"],
      checks: [(x) => `yarn eslint ${x.join(' ')}`],
      // Optional: Use built-in BuildKit template instead of custom Dockerfile
      useBuildKitTemplate: true,
      // Optional: Override specific BuildKit settings
      buildKitOptions: {
        cacheMounts: ["npm", "esbuild"],
        multiStage: true
      }
    }
  }
};
```

### 2. Dockerfile Evolution
**Current**: User provides complete Dockerfile
**Proposed**: User provides base, system extends with BuildKit

**Example Migration**:
```dockerfile
# Current: User provides complete Dockerfile
FROM node:20.19.4-alpine
RUN apk add --no-cache python3 build-base
WORKDIR /workspace
COPY package.json .
RUN yarn install
# ... user's custom setup ...

# Proposed: User can still provide complete Dockerfile,
# or provide base and let BuildKit extend it
FROM node:20.19.4-alpine AS base
# User's minimal customizations
RUN apk add --no-cache python3

# BuildKit automatically adds:
# - Cache mounts for npm/yarn
# - Multi-stage build separation
# - Artifact extraction
```

### 3. Runtime Config File Handling
**Current**: Language-specific config files (.mjs, .py, .go, .rb, .rs, .java)
**Proposed**: Standardized interface with language adapters

**Adapter Pattern**:
```
User Config File → Language Adapter → BuildKit Frontend
    (.mjs/.py/.go)       (Node/Py/Go)      (Dockerfile)
```

## Benefits
- **Reduced Resource Consumption**: 70% reduction in idle memory (especially in `dev` mode)
- **Simplified Synchronization**: Single watcher instead of N+1
- **Better Cache Utilization**: BuildKit-managed caches across runs
- **Standard Docker Tooling**: Leverage industry-standard BuildKit
- **Mode Consistency**: Same efficient approach for both `dev` and `once` modes
- **Smaller Test Images**: 50-80% smaller runtime containers
- **Faster Container Startup**: Smaller images load faster
- **Improved I/O Performance**: Named volumes vs host bind mounts
- **Better Isolation**: Build artifacts managed by BuildKit, not host FS
- **Strategy Unification**: Consistent approach across all 7 languages
- **Configuration Flexibility**: Maintain user control while offering simplification
- **Backward Compatibility**: Existing projects continue to work

