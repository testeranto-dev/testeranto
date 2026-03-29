FROM golang:1.22

WORKDIR /workspace

# Install build tools including gcc for CGO support
RUN apt-get update && apt-get install -y build-essential

# git is already installed in the golang:1.22 image
# No need to install it with apk or apt

# Set environment variables
ENV GO111MODULE=on \
    CGO_ENABLED=1

# Install golangci-lint version compatible with Go 1.22
# Version 1.54.2 is the latest that supports Go 1.22
RUN go install github.com/golangci/golangci-lint/cmd/golangci-lint@v1.54.2

# Default command
CMD ["go", "version"]
