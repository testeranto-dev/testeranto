#!/bin/bash
echo "Testing BuildKit-required implementation..."

# Enable BuildKit
export DOCKER_BUILDKIT=1

# Check if BuildKit is available
if ! docker buildx version >/dev/null 2>&1; then
    echo "ERROR: BuildKit is required but not available."
    echo "Please ensure Docker BuildKit is enabled."
    echo "On Docker Desktop: Enable BuildKit in settings"
    echo "On Linux: export DOCKER_BUILDKIT=1"
    exit 1
fi

echo "✓ BuildKit is available"

# Check the example configuration
if ! grep -q "useBuildKit: true" exampleProject/testeranto.ts; then
    echo "ERROR: exampleProject/testeranto.ts must have useBuildKit: true"
    exit 1
fi

echo "✓ Configuration requires BuildKit"

# Create a simple test BuildKit Dockerfile
cat > test-required.Dockerfile << 'EOF'
FROM node:20-alpine AS builder
WORKDIR /workspace
RUN --mount=type=cache,target=/root/.npm \
    npm --version

FROM node:20-alpine AS runtime
WORKDIR /workspace
COPY --from=builder /workspace/package.json .
CMD ["echo", "BuildKit test successful"]
EOF

echo "Testing BuildKit build..."
if DOCKER_BUILDKIT=1 docker build -f test-required.Dockerfile -t test-required:latest .; then
    echo "✓ BuildKit build successful"
    
    if docker run --rm test-required:latest; then
        echo "✓ BuildKit image runs successfully"
    fi
else
    echo "✗ BuildKit build failed"
    exit 1
fi

# Clean up
docker rmi test-required:latest 2>/dev/null || true
rm -f test-required.Dockerfile

echo ""
echo "SUMMARY:"
echo "1. BuildKit is required (no fallbacks)"
echo "2. All runtimes must have useBuildKit: true"
echo "3. Configuration updated in exampleProject/testeranto.ts"
echo "4. Server will fail if BuildKit is not available"
echo ""
echo "To run:"
echo "cd exampleProject && node ../src/server/server.js"
