# Dockerfile Requirements for All Runtimes

## Overview
When using testeranto with BuildKit, users must provide Dockerfiles that meet specific requirements for each runtime. This document outlines the mandatory requirements, runtime-specific details, and best practices.

## Mandatory Requirements for All Runtimes

### 1. Working Directory
All Dockerfiles must set:
```dockerfile
WORKDIR /workspace
```
- All operations should be performed within `/workspace`
- Source code should be copied to this directory

### 2. Source Code Copy
Must copy the application source code:
```dockerfile
COPY . /workspace
```
- Use `.dockerignore` to exclude unnecessary files
- Copy dependency files first for better layer caching

### 3. Entry Point
- Define appropriate `CMD` or `ENTRYPOINT` for the runtime
- Should execute the test runner or application

### 4. Environment Variables
Set necessary environment variables:
- Language-specific variables (NODE_ENV, PYTHONPATH, etc.)
- Configuration variables

## BuildKit Features
- Use cache mounts for dependency caches
- Leverage BuildKit's parallel build capabilities
- Use build arguments for configuration

## Stage Targeting
**Important**: If your Dockerfile uses multi-stage builds, you must specify the correct target stage in your configuration:

```typescript
buildKitOptions: {
  targetStage: "runtime"  // Only if your Dockerfile has a stage named "runtime"
}
```

If your Dockerfile is single-stage (no `FROM ... AS ...` statements), **do not** specify `targetStage` or set it to `undefined`.

**Common Error**: `"ERROR: failed to build: failed to solve: target stage "runtime" could not be found"` occurs when:
1. Your Dockerfile doesn't have a stage named "runtime"
2. You specified `targetStage: "runtime"` in your configuration
3. Solution: Remove `targetStage` or rename a stage in your Dockerfile to "runtime"

## Runtime-Specific Requirements

### Node.js Runtime
**Base Image**: `node:20-alpine` or similar
**Requirements**:
```dockerfile
FROM node:20-alpine
WORKDIR /workspace
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "src/index.js"]
```

### Web Runtime
**Base Image**: `node:20-alpine` or similar
**Additional Requirements**:
- Must expose port 8000: `EXPOSE 8000`
- Must start a web server on port 8000
- **Do NOT include Chrome** - handled by separate Chrome service

**Example**:
```dockerfile
FROM node:20-alpine
WORKDIR /workspace
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8000
CMD ["npm", "start"]
```

### Python Runtime
**Base Image**: `python:3.11-slim` or similar
**Requirements**:
```dockerfile
FROM python:3.11-slim
WORKDIR /workspace
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "src/main.py"]
```

### Go Runtime
**Base Image**: `golang:1.21-alpine` or similar
**Requirements**:
```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /workspace
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o /app ./cmd/main.go

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app .
CMD ["./app"]
```

### Rust Runtime
**Base Image**: `rust:1.75-alpine` or similar
**Requirements**:
```dockerfile
FROM rust:1.75-alpine AS builder
WORKDIR /workspace
COPY Cargo.toml Cargo.lock ./
RUN cargo fetch
COPY . .
RUN cargo build --release

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /workspace/target/release/app .
CMD ["./app"]
```

### Ruby Runtime
**Base Image**: `ruby:3.2-alpine` or similar
**Requirements**:
```dockerfile
FROM ruby:3.2-alpine
WORKDIR /workspace
COPY Gemfile Gemfile.lock ./
RUN bundle install
COPY . .
CMD ["ruby", "src/main.rb"]
```

### Java Runtime
**Base Image**: `openjdk:17-alpine` or similar
**Requirements**:
```dockerfile
FROM openjdk:17-alpine AS builder
WORKDIR /workspace
COPY pom.xml ./
RUN mvn dependency:go-offline
COPY . .
RUN mvn package

FROM openjdk:17-alpine
WORKDIR /app
COPY --from=builder /workspace/target/app.jar .
CMD ["java", "-jar", "app.jar"]
```

## Best Practices

### 1. Layer Caching Optimization
- Copy dependency files first (package.json, requirements.txt, go.mod, etc.)
- Install dependencies before copying source code
- Use specific versions for reproducibility

### 2. Security
- Use non-root users when possible
- Remove unnecessary build tools in production images
- Scan for vulnerabilities regularly

### 3. Image Size Optimization
- Use alpine or slim base images
- Clean up package manager caches
- Use multi-stage builds
- Remove temporary files

### 4. BuildKit Features
- Use cache mounts for dependency caches
- Leverage BuildKit's parallel build capabilities
- Use build arguments for configuration

## Common Issues and Solutions

### 1. Permission Denied
**Problem**: Container can't write to files or directories
**Solution**:
```dockerfile
RUN adduser -D appuser && chown -R appuser:appuser /workspace
USER appuser
```

### 2. Dependency Not Found
**Problem**: Package manager can't find dependencies
**Solution**:
- Ensure dependency files are copied correctly
- Check network connectivity in Docker build
- Verify package manager configuration

### 3. Port Not Accessible
**Problem**: Service can't be reached from outside
**Solution**:
- Ensure `EXPOSE` directive is present
- Check that service binds to `0.0.0.0` not `localhost`
- Verify firewall and network settings

### 4. Build Too Slow
**Problem**: Docker builds take too long
**Solution**:
- Implement proper layer caching
- Use BuildKit cache mounts
- Reduce image size with multi-stage builds

## Testing Your Dockerfile

### 1. Build Test
```bash
docker build -t test-image -f your.Dockerfile .
```

### 2. Run Test
```bash
docker run -p 8000:8000 test-image
```

### 3. Debug Test
```bash
docker run -it test-image sh
```

## Support and Resources

### 1. Runtime-Specific Documentation
- Check individual runtime README files
- Review BuildKit upgrade plans in `tickets/` directories

### 2. Docker Official Documentation
- [Dockerfile reference](https://docs.docker.com/engine/reference/builder/)
- [Best practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

### 3. Testeranto Examples
- Reference example projects
- Check existing Dockerfiles in the codebase

## Quick Reference

| Runtime | Base Image | Dependency Command | Port |
|---------|------------|-------------------|------|
| Node.js | `node:20-alpine` | `npm ci --only=production` | 8000 (web only) |
| Python | `python:3.11-slim` | `pip install -r requirements.txt` | - |
| Go | `golang:1.21-alpine` | `go mod download` | - |
| Rust | `rust:1.75-alpine` | `cargo fetch` | - |
| Ruby | `ruby:3.2-alpine` | `bundle install` | - |
| Java | `openjdk:17-alpine` | `mvn dependency:go-offline` | - |

**Note**: All runtimes must use `WORKDIR /workspace` and copy source code to this directory.
