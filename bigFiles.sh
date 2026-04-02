#!/bin/bash

# Function to display usage
usage() {
    echo "Usage: $0 [directory]"
    echo "Summarizes and finds the largest .ts, .tsx, .rb, .rs, .java, .py, .go files in the specified directory (recursively)"
    echo "If no directory is provided, uses the current directory"
}

# Check if help is requested
if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    usage
    exit 0
fi

# Set the target directory
TARGET_DIR="${1:-.}"

# Check if directory exists
if [[ ! -d "$TARGET_DIR" ]]; then
    echo "Error: Directory '$TARGET_DIR' does not exist" >&2
    exit 1
fi

echo "Searching for .ts, .tsx, .rb, .rs, .java, .py, .go files in '$TARGET_DIR' (excluding node_modules, venv, target/package, and lib/rusto/target)..."
echo ""

# Detect platform for appropriate stat command
platform=$(uname)
case $platform in
    Darwin)
        # macOS (BSD)
        STAT_CMD="stat -f %z"
        ;;
    Linux)
        # Linux (GNU)
        STAT_CMD="stat -c %s"
        ;;
    *)
        # Fallback
        STAT_CMD="stat -c %s 2>/dev/null || stat -f %z"
        ;;
esac

# Temporary file to store results
TEMP_FILE=$(mktemp)
TOTAL_SIZE=0
FILE_COUNT=0

# Find files and process them
while IFS= read -r -d '' file; do
    # Get file size using appropriate stat command
    size=$(eval "$STAT_CMD \"$file\" 2>/dev/null")
    if [[ -n "$size" ]]; then
        printf "%d %s\n" "$size" "$file" >> "$TEMP_FILE"
        TOTAL_SIZE=$((TOTAL_SIZE + size))
        FILE_COUNT=$((FILE_COUNT + 1))
    fi
done < <(find "$TARGET_DIR" \( -name "node_modules" -o -name "venv" -o -name "target/package" -o -path "*/lib/rusto/target" -o -path "*/lib/rusto/target/*" -o -path "*/dist/*" \) -prune -o \
    -type f \( \
    -name "*.ts" -o \
    -name "*.tsx" -o \
    -name "*.rb" -o \
    -name "*.rs" -o \
    -name "*.java" -o \
    -name "*.py" -o \
    -name "*.go" \
\) -print0)

# Check if any files were found
if [[ ! -s "$TEMP_FILE" ]]; then
    echo "No files with the specified extensions found in '$TARGET_DIR' (excluding node_modules and venv)"
    rm -f "$TEMP_FILE"
    exit 0
fi

# Display summary first
echo "Summary:"
echo "  Number of files found: $FILE_COUNT"
# Show total in bytes for verification
echo "  Total size in bytes: $TOTAL_SIZE"
# Convert total size to human readable format
if command -v numfmt >/dev/null 2>&1; then
    human_total_size=$(numfmt --to=iec --suffix=B "$TOTAL_SIZE" 2>/dev/null)
else
    # Use awk to format size
    if [ "$TOTAL_SIZE" -ge 1073741824 ]; then
        human_total_size=$(awk "BEGIN {printf \"%.2fGB\", $TOTAL_SIZE/1073741824}")
    elif [ "$TOTAL_SIZE" -ge 1048576 ]; then
        human_total_size=$(awk "BEGIN {printf \"%.2fMB\", $TOTAL_SIZE/1048576}")
    elif [ "$TOTAL_SIZE" -ge 1024 ]; then
        human_total_size=$(awk "BEGIN {printf \"%.2fKB\", $TOTAL_SIZE/1024}")
    else
        human_total_size="${TOTAL_SIZE}B"
    fi
fi
echo "  Total size (human): $human_total_size"
echo ""
echo "All files sorted by size (largest first):"
echo ""

# Sort by size (numeric, reverse)
sort -nr "$TEMP_FILE" | while read size path; do
    # Convert size to human readable format
    # Try numfmt (GNU) first, then fallback to awk for macOS
    if command -v numfmt >/dev/null 2>&1; then
        human_size=$(numfmt --to=iec --suffix=B "$size" 2>/dev/null)
    else
        # Use awk to format size
        if [ "$size" -ge 1073741824 ]; then
            human_size=$(awk "BEGIN {printf \"%.2fGB\", $size/1073741824}")
        elif [ "$size" -ge 1048576 ]; then
            human_size=$(awk "BEGIN {printf \"%.2fMB\", $size/1048576}")
        elif [ "$size" -ge 1024 ]; then
            human_size=$(awk "BEGIN {printf \"%.2fKB\", $size/1024}")
        else
            human_size="${size}B"
        fi
    fi
    printf "%10s  %s\n" "$human_size" "$path"
done

# Clean up
rm -f "$TEMP_FILE" 2>/dev/null
