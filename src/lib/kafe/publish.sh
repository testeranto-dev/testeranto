#!/bin/bash
set -e
cd "$(dirname "$0")" || exit 1

# Function to get current version from pom.xml
get_current_version() {
    grep -E '<version>[^<]+</version>' pom.xml | head -1 | sed -E 's/.*<version>([^<]+)<\/version>.*/\1/'
}

# Function to update version in pom.xml
update_pom_version() {
    local version="$1"
    sed -i '' -E "s/(<version>)[^<]+(<\/version>)/\1$version\2/" pom.xml
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
update_pom_version "$NEW_VERSION"

echo "Building Java package..."
# Use Maven to build
mvn clean compile

echo "Publishing Java package..."
read -p "Deploy $NEW_VERSION to Maven Central? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    mvn deploy
    echo "Deployed $NEW_VERSION to Maven Central"
else
    echo "Skipping deploy. You can deploy manually later with:"
    echo "  mvn deploy"
fi
