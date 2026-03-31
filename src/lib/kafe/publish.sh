#!/bin/bash
set -e
cd "$(dirname "$0")" || exit 1

# Ensure we're in the right directory
if [ ! -f "pom.xml" ]; then
    echo "Error: pom.xml not found in current directory"
    exit 1
fi

# Function to get current version from pom.xml
get_current_version() {
    grep -E '<version>[^<]+</version>' pom.xml | head -1 | sed -E 's/.*<version>([^<]+)<\/version>.*/\1/'
}

# Function to update version in pom.xml
update_pom_version() {
    local version="$1"
    # For macOS (BSD sed) and Linux (GNU sed) compatibility
    # Match the project version (should be the first <version> tag in the file)
    # We'll be more specific: match lines that start with 4 spaces and then <version>
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # First, let's clear the Maven cache for the plugin
        rm -rf ~/.m2/repository/org/apache/maven/plugins/maven-compiler-plugin/0.1.2 2>/dev/null || true
        # Update the project version (indented with 4 spaces)
        sed -i '' -E "s/^(    <version>)[^<]+(<\/version>)/\1$version\2/" pom.xml
    else
        rm -rf ~/.m2/repository/org/apache/maven/plugins/maven-compiler-plugin/0.1.2 2>/dev/null || true
        sed -i -E "s/^(    <version>)[^<]+(<\/version>)/\1$version\2/" pom.xml
    fi
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
# Use Maven to build with minimal dependencies
mvn clean compile -DskipTests

echo "Packaging..."
mvn package -DskipTests

echo "Publishing Java package..."
echo "Installing version $NEW_VERSION to local Maven repository..."
mvn clean install -DskipTests

echo "Local installation complete."
echo "To use this version in your projects, add to build.gradle:"
echo "  implementation 'com.testeranto:testeranto.kafe:$NEW_VERSION'"
echo ""
echo "Note: For Docker builds, ensure the Kafe source is mounted at /workspace/kafe-src"
echo "      or the local Maven repository is mounted at /root/.m2/repository"

echo "Build complete. JAR file created in target/ directory."
echo "To run Kafe: java -jar target/testeranto.kafe-${NEW_VERSION}.jar"
echo ""
echo "To verify installation:"
echo "  ls ~/.m2/repository/com/testeranto/testeranto.kafe/${NEW_VERSION}/"
