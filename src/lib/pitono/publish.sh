#!/bin/bash
set -e
cd "$(dirname "$0")" || exit 1

# Function to get current version from pyproject.toml
get_current_version() {
    grep -E '^version =' pyproject.toml | sed -E 's/version = "([^"]+)"/\1/' | head -1
}

# Function to update version in pyproject.toml
update_pyproject_version() {
    local version="$1"
    sed -i '' -E "s/^version = \"[^\"]+\"/version = \"$version\"/" pyproject.toml
}

# Function to update version in setup.py
update_setup_version() {
    local version="$1"
    sed -i '' -E "s/version=\"[^\"]+\"/version=\"$version\"/" setup.py
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

# Update version in both files
echo "Updating version to $NEW_VERSION..."
update_pyproject_version "$NEW_VERSION"
update_setup_version "$NEW_VERSION"

echo "Building Python package..."
# Ensure we're using the correct Python
python3 -m pip install --upgrade pip
python3 -m pip install --upgrade build
python3 -m build

echo "Publishing Python package..."
# Upload to PyPI using twine
python3 -m pip install --upgrade twine

# Ask for confirmation before publishing
read -p "Publish $NEW_VERSION to PyPI? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python3 -m twine upload dist/*
    echo "Published $NEW_VERSION to PyPI"
else
    echo "Skipping publish. You can publish manually later with:"
    echo "  python3 -m twine upload dist/*"
fi
