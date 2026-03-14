# syntax=docker/dockerfile:1
# Simple Dockerfile for Node runtime - user provides minimal setup
# Dependencies are installed during build, not mounted from host

FROM node:20.19.4-alpine
WORKDIR /workspace

# User can add their own dependencies here if needed
# For example:
# RUN apk add --no-cache python3

# Copy package files for dependency installation
COPY ./tsconfig*.json ./
COPY ./.yarnrc.yml ./
COPY ./eslint.config.mjs ./
COPY package.json ./
COPY yarn.lock* package-lock.json* ./

# Install dependencies during build (not from host)
RUN yarn install --frozen-lockfile --production=false

# The source code will be mounted at runtime, but node_modules stays in container
CMD ["node", "--version"]


