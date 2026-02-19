#!/bin/bash
set -e
cd "$(dirname "$0")" || exit 1

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Prompt for new version
read -p "Enter new version (current is $CURRENT_VERSION): " NEW_VERSION

if [[ -z "$NEW_VERSION" ]]; then
    echo "Version cannot be empty."
    exit 1
fi

# Update version using npm version
echo "Updating version to $NEW_VERSION..."
npm version "$NEW_VERSION" --no-git-tag-version

echo "Building TypeScript package..."
yarn build

echo "Publishing to npm..."
read -p "Publish $NEW_VERSION to npm? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    yarn publish --new-version "$NEW_VERSION"
    echo "Published $NEW_VERSION to npm"
else
    echo "Skipping publish. You can publish manually later with:"
    echo "  yarn publish"
fi
