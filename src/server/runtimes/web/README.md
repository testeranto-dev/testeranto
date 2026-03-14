## Web Runtime

Tests run in Chrome via WebSocket connection.

### Architecture
- **Builder**: Creates bundles using esbuild via BuildKit
- **Chrome Service**: Separate container for browser execution (not in user Dockerfile)
- **Test Runner**: Connects to Chrome and executes tests

### BuildKit Integration
- Uses BuildKit for efficient bundle builds
- Cache mounts for npm/yarn dependencies
- Simple single-stage Dockerfiles are sufficient

See the BuildKit Upgrade Plan for configuration details.
