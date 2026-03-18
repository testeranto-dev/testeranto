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

### Web Integration

**Detection Implementation:**

- Analyze test files for framework-specific patterns
- Check for Jest with jsdom, Mocha in browser, etc.
- Detect Cypress/Playwright test structures

**Wrapper Generation:**

- Bundle tests with appropriate browser test runner
- Intercept results via WebSocket or console APIs
- Handle browser automation and cleanup
