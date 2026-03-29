// Simple build options for Golang runtime
import type { BuildOptions } from '../../types';

const golangBuildOptions: BuildOptions = {
  // Pre-build commands
  preBuild: [
    'go version',
    'find . -name "go.mod" -type f -exec sed -i.bak "s/^go 1\\.[0-9][0-9]*$/go 1.22/" {} \\; || true',
    'test -f go.mod || (echo "module testeranto-golang" > go.mod && echo "go 1.22" >> go.mod)',
    'go mod download || go mod tidy',
  ],
  
  // Build commands
  build: [
    'go build ./...',
  ],
  
  // Test setup commands
  testSetup: [
    'go test -i ./... 2>/dev/null || true',
  ],
  
  // Post-test commands
  postTest: [
    'go test -coverprofile=coverage.out ./... 2>/dev/null || true',
    'test -f coverage.out && go tool cover -html=coverage.out -o coverage.html 2>/dev/null || true',
  ],
  
  // Cleanup commands
  cleanup: [
    'rm -f coverage.out coverage.html 2>/dev/null || true',
  ],
  
  // Environment variables
  env: {
    GO111MODULE: 'on',
    CGO_ENABLED: '1',  // CGO enabled - gcc is available in the Debian-based image
    GOPROXY: 'https://proxy.golang.org,direct',
    GOTOOLCHAIN: 'auto',
  },
  
  // Volume mounts
  volumes: [
    '/go/pkg/mod',
    '/root/.cache/go-build',
  ],
};

export default golangBuildOptions;
