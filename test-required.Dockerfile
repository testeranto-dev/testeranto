FROM node:20-alpine AS builder
WORKDIR /workspace
RUN --mount=type=cache,target=/root/.npm \
    npm --version

FROM node:20-alpine AS runtime
WORKDIR /workspace
COPY --from=builder /workspace/package.json .
CMD ["echo", "BuildKit test successful"]
