#!/bin/bash
set -e
cd "$(dirname "$0")" || exit 1

# For Go, we need to check if there's a go.mod file
if [ -f "go.mod" ]; then
    CURRENT_MODULE=$(grep -E '^module ' go.mod | sed -E 's/module //')
    echo "Current module: $CURRENT_MODULE"
else
    echo "No go.mod file found"
fi

# Try to get version from git tags
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
echo "Latest git tag: $LATEST_TAG"

# Prompt for new version
read -p "Enter new version tag (e.g., v1.2.3, current is $LATEST_TAG): " NEW_TAG

if [[ -z "$NEW_TAG" ]]; then
    echo "Version tag cannot be empty."
    exit 1
fi

# Validate the tag format (should start with 'v' followed by numbers and dots)
if [[ ! $NEW_TAG =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Warning: Tag doesn't follow semantic versioning format (vX.Y.Z)"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborting."
        exit 1
    fi
fi

echo "Building Go package..."
go build ./...

echo "Publishing Go package..."
read -p "Create and push git tag $NEW_TAG? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create and push tag
    git tag "$NEW_TAG"
    git push origin "$NEW_TAG"
    echo "Created and pushed tag $NEW_TAG"
    echo "Go package published via git tag $NEW_TAG"
else
    echo "Skipping tag creation. You can create the tag manually later with:"
    echo "  git tag $NEW_TAG"
    echo "  git push origin $NEW_TAG"
fi
