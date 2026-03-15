# Server

Testeranto orchestrates test execution using Docker containers managed through docker-compose. The BuildKit migration is currently in progress to optimize performance and resource efficiency.

## BuildKit Architecture

- **On-Demand Builds**: BuildKit will trigger builds when source files change
- **Reduced Hot Builders**: Goal to eliminate long-running builder containers
- **Cache Optimization**: Language-specific cache mounts for faster builds (planned)
- **Single Watcher**: One process will monitor all runtimes efficiently

## Current Container Types

- **Test Services**: BDD tests, static analysis checks, aider sessions
- **Special Services**: Chrome service for web runtime
- **Builder Services**: Currently still used, being migrated to BuildKit

## Configuration

Each runtime configuration includes:

- Runtime type (node, web, golang, python, ruby, rust, java)
- Test file paths
- Dockerfile location
- Build options file
- BuildKit cache mount configuration (optional, in progress)
