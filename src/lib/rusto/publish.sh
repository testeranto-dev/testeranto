#!/bin/bash
set -e
cd "$(dirname "$0")" || exit 1

# Function to get current version from Cargo.toml
get_current_version() {
    grep -E '^version =' Cargo.toml | sed -E 's/version = "([^"]+)"/\1/' | head -1
}

# Function to update version in Cargo.toml
update_cargo_version() {
    local version="$1"
    sed -i '' -E "s/^version = \"[^\"]+\"/version = \"$version\"/" Cargo.toml
}

# Get current version
CURRENT_VERSION=$(get_current_version)
echo "Current version: $CURRENT_VERSION"

# Prompt for new version
read -p "Enter new version (current is $CURRENT_VERSION): " NEW_VERSION

if [[ -z "$NEW_VERSION" ]]; then
    echo "Version cannot be empty."
    exit 1
fi

# Update version
echo "Updating version to $NEW_VERSION..."
update_cargo_version "$NEW_VERSION"

echo "Building Rust package..."
cargo build --release

echo "Publishing Rust package..."
read -p "Publish $NEW_VERSION to crates.io? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cargo publish
    echo "Published $NEW_VERSION to crates.io"
else
    echo "Skipping publish. You can publish manually later with:"
    echo "  cargo publish"
fi
