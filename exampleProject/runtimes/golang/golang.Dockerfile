# syntax=docker/dockerfile:1
# Simple Dockerfile for Go runtime - user provides minimal setup

FROM golang:1.22
WORKDIR /workspace

# Copy go.mod and go.sum for dependency installation
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# The rest of the source code will be mounted at runtime
