# syntax=docker/dockerfile:1
# Simple Dockerfile for Ruby runtime - user provides minimal setup

FROM ruby:3.2-alpine
WORKDIR /workspace

# User can add their own dependencies here if needed
# For example:
# RUN apk add --no-cache build-base

COPY Gemfile Gemfile.lock ./

# Install gems
RUN bundle install

# The rest of the source code will be mounted at runtime

