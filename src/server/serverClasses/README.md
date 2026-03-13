## Server Overview

The server manages Docker containers and orchestrates test execution. BuildKit integration is currently being implemented.

### Key Responsibilities
1. **Build Orchestration**: Currently uses docker-compose, migrating to BuildKit for on-demand builds
2. **Container Management**: Manages test containers (BDD, static checks, aider)
3. **Dependency Tracking**: Watches for bundle changes and schedules tests
4. **Resource Optimization**: Working to implement BuildKit cache mounts for efficient builds

### BuildKit Integration 🚧 (In Progress)
- **On-demand builds**: Goal to eliminate long-running builder containers
- **Single watcher process**: Will monitor all runtimes efficiently once implemented
- **Language-specific cache mounts**: Being implemented for optimized dependency caching
- **Multi-stage support**: Optional for advanced optimization (planned)

### Current Container Types
- **Test Services**: BDD tests, static analysis checks, aider sessions
- **Special Services**: Chrome service for web runtime
- **Builder Services**: Currently still used, being migrated to BuildKit

### Target Performance Improvements
- **Target: 70% reduction** in idle memory usage
- **Target: 50-80% smaller** test containers
- **Faster startup**: Smaller images should load quicker
- **Better cache utilization**: Persistent caches across builds

The BuildKit migration is actively being worked on but not yet complete for all 7 runtimes.
