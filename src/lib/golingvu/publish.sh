#!/bin/bash
set -e
cd "$(dirname "$0")" || exit 1

echo "Preparing to publish golingvu Go module..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: Not in a git repository"
    exit 1
fi

# Check go.mod
if [ ! -f "go.mod" ]; then
    echo "Error: go.mod not found"
    exit 1
fi

CURRENT_MODULE=$(grep -E '^module ' go.mod | sed -E 's/module //')
echo "Module: $CURRENT_MODULE"

# Get the module subdirectory path relative to repository root
# Since we're in src/lib/golingvu, and the module path includes this, we need to know the prefix
MODULE_PREFIX="src/lib/golingvu"

# Get latest tag for this module
# Look for tags that start with the module prefix
LATEST_TAG=$(git tag -l "${MODULE_PREFIX}/v*" | sort -V | tail -n 1 || echo "")
if [ -z "$LATEST_TAG" ]; then
    echo "No existing tags found for this module."
    # Check if there are any root tags that might be relevant
    ROOT_TAG=$(git tag -l "v*" | sort -V | tail -n 1 || echo "")
    if [ -n "$ROOT_TAG" ]; then
        echo "Found root tag: $ROOT_TAG. This may not be compatible with Go modules in subdirectories."
        echo "Consider creating a proper tag with prefix ${MODULE_PREFIX}/"
    fi
    LATEST_VERSION="v0.0.0"
else
    LATEST_VERSION=${LATEST_TAG#${MODULE_PREFIX}/}
    echo "Latest tag: $LATEST_TAG (version: $LATEST_VERSION)"
fi

# Prompt for new version
read -p "Enter new version (e.g., v1.0.0, current is $LATEST_VERSION): " NEW_VERSION

if [[ -z "$NEW_VERSION" ]]; then
    echo "Error: Version cannot be empty"
    exit 1
fi

# Basic semantic version validation
if [[ ! $NEW_VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9\.]+)?(\+[a-zA-Z0-9\.]+)?$ ]]; then
    echo "Warning: Version doesn't follow semantic versioning (vX.Y.Z[-pre][+build])"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Full tag name
NEW_TAG="${MODULE_PREFIX}/${NEW_VERSION}"
echo "Will create tag: $NEW_TAG"

echo "Building module..."
if ! go build ./...; then
    echo "Error: Build failed"
    exit 1
fi

echo "Running tests..."
if ! go test ./...; then
    echo "Error: Tests failed"
    exit 1
fi

echo "Cleaning module..."
go mod tidy
go mod verify

echo "Checking for uncommitted changes..."
if ! git diff-index --quiet HEAD --; then
    echo "Warning: There are uncommitted changes"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Publishing version $NEW_TAG..."
read -p "Create and push tag $NEW_TAG to GitHub? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create tag
    if git tag "$NEW_TAG"; then
        echo "Created tag: $NEW_TAG"
    else
        echo "Error: Failed to create tag (maybe it already exists?)"
        exit 1
    fi
    
    # Push tag
    if git push origin "$NEW_TAG"; then
        echo "Pushed tag to origin"
    else
        echo "Error: Failed to push tag"
        exit 1
    fi
    
    echo ""
    echo "✅ Successfully published $CURRENT_MODULE@$NEW_VERSION"
    echo ""
    echo "Users can now install with:"
    echo "  go get $CURRENT_MODULE@$NEW_VERSION"
    echo ""
    echo "Or add to go.mod:"
    echo "  require $CURRENT_MODULE $NEW_VERSION"
    echo ""
    echo "Note: Go modules in subdirectories require tags with the full path."
    echo "The tag '$NEW_TAG' has been created for this purpose."
else
    echo "Skipping tag creation."
    echo "You can manually create and push the tag later:"
    echo "  git tag $NEW_TAG"
    echo "  git push origin $NEW_TAG"
fi
