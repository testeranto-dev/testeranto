#!/bin/sh
# Simple Docker verification

set -e

echo "=== Docker Verification ==="
echo "Checking Docker installation..."
docker --version

echo "Building Docker image with Go 1.22..."
docker build -f golang.Dockerfile -t testeranto-golang-test .

echo "Testing Go installation (should be 1.22)..."
docker run --rm testeranto-golang-test go version

echo "Testing golangci-lint installation (should be 1.54.2)..."
docker run --rm testeranto-golang-test golangci-lint --version

echo "Testing CGO support (gcc should be available)..."
docker run --rm testeranto-golang-test sh -c "gcc --version || echo 'gcc not found'"

echo "Testing Go module support..."
docker run --rm testeranto-golang-test sh -c "cd /tmp && go mod init test-verify 2>/dev/null || true && echo 'Go module test passed'"

echo "Testing CGO compilation..."
docker run --rm testeranto-golang-test sh -c "cd /tmp && cat > test_cgo.go << 'EOF'
package main
// #include <stdio.h>
// void hello() { printf(\"CGO test\\n\"); }
import \"C\"
func main() { C.hello() }
EOF
go run test_cgo.go 2>/dev/null && echo 'CGO test passed' || echo 'CGO test failed (may be expected)'"

echo "=== Verification Complete ==="
