#!/bin/bash
set -e
cd "$(dirname "$0")" || exit 1

# Determine which Python to use
if [ -n "$VIRTUAL_ENV" ]; then
    # Use the virtual environment's Python3 if available, otherwise python
    if [ -x "$VIRTUAL_ENV/bin/python3" ]; then
        PYTHON="$VIRTUAL_ENV/bin/python3"
    elif [ -x "$VIRTUAL_ENV/bin/python" ]; then
        PYTHON="$VIRTUAL_ENV/bin/python"
    else
        echo "Error: No Python found in virtual environment at $VIRTUAL_ENV/bin/"
        exit 1
    fi
    echo "Using virtual environment Python: $PYTHON"
elif command -v python3 &> /dev/null; then
    PYTHON=python3
elif command -v python &> /dev/null; then
    PYTHON=python
else
    echo "Error: python not found"
    exit 1
fi

# If we're not in a virtual environment and the detected Python is externally managed, abort
if [ -z "$VIRTUAL_ENV" ]; then
    # Check if Python is externally managed (macOS system Python)
    if $PYTHON -c "import sys; sys.exit(0 if hasattr(sys, '_framework') else 1)" 2>/dev/null; then
        echo "Error: System Python is externally managed and cannot be used for package installation."
        echo "Please activate a virtual environment first:"
        echo "  python3 -m venv venv"
        echo "  source venv/bin/activate"
        echo "Then run this script again."
        exit 1
    fi
fi

echo "Using Python: $(which $PYTHON)"
echo "Python version: $($PYTHON --version)"

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
"$PYTHON" -m pip install --upgrade pip
"$PYTHON" -m pip install --upgrade build
"$PYTHON" -m build 

echo "Publishing Python package..."
# Upload to PyPI using twine
"$PYTHON" -m pip install --upgrade twine

# Ask for confirmation before publishing
read -p "Publish $NEW_VERSION to PyPI? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    "$PYTHON" -m twine upload dist/* --verbose --skip-existing
    echo "Published $NEW_VERSION to PyPI"
else
    echo "Skipping publish. You can publish manually later with:"
    echo "  $PYTHON -m twine upload dist/*"
fi
