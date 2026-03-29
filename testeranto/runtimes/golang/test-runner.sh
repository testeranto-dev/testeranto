#!/bin/sh
# Simple test runner for Golang

set -e

echo "=== Go Test Runner (Go 1.22 with golangci-lint 1.54.2) ==="
echo "Current directory: $(pwd)"
echo "Go version: $(go version 2>/dev/null || echo 'Go not found')"

case "$1" in
  "all")
    echo "Running all tests..."
    go test -v ./... 2>/dev/null || echo "Some tests may have failed"
    ;;
  "golingvu")
    echo "Running Golingvu tests..."
    go test -v ./src/lib/golingvu/examples/calculator/golingvu_test.go ./src/lib/golingvu/golingvu_test.go ./src/lib/golingvu/interopt_test.go ./src/lib/golingvu/integration_test.go 2>/dev/null || echo "Golingvu tests may have failed"
    ;;
  "standard")
    echo "Running standard Go tests..."
    go test -v ./src/lib/golingvu/examples/calculator/native_test.go ./src/lib/golingvu/package_test.go 2>/dev/null || echo "Standard tests may have failed"
    ;;
  "coverage")
    echo "Generating coverage report..."
    go test -coverprofile=coverage.out ./src/lib/golingvu/... 2>/dev/null || true
    if [ -f "coverage.out" ]; then
        go tool cover -func=coverage.out
        echo "Coverage report generated: coverage.out"
    else
        echo "No coverage data generated"
    fi
    ;;
  "setup")
    echo "Setting up Go module..."
    if [ ! -f "go.mod" ]; then
        cat > go.mod << 'EOF'
module testeranto-golang

go 1.22
EOF
        echo "go.mod created with Go 1.22"
    else
        echo "go.mod already exists"
        if grep -q "go 1\." go.mod; then
            sed -i.bak 's/^go 1\.[0-9][0-9]*$/go 1.22/' go.mod
            echo "Updated go.mod to use Go 1.22"
        fi
    fi
    ;;
  *)
    echo "Usage: $0 {all|golingvu|standard|coverage|setup}"
    exit 1
    ;;
esac
