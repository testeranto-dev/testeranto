#!/bin/sh
echo "Connecting to container: b14a340824d9ab6b3d3ab1b85a218e49542ecee5cfea7f90f47e1fdc478e6c4f"
echo "Service: b14a340824d9ab6b3d3ab1b85a218e49542ecee5cfea7f90f47e1fdc478e6c4f"
echo "Label: aider: prodirek"
echo ""
echo "Setting up terminal for proper operation..."
echo ""

# Disable bracketed paste mode to fix copy-paste issues
# This prevents terminal from sending ^[[200~ and ^[[201~ sequences
printf '\e[?2004l'

# Save current terminal settings
SAVED_STTY=$(stty -g 2>/dev/null)

# Function to restore terminal settings on exit
cleanup() {
    if [ -n "$SAVED_STTY" ]; then
        stty "$SAVED_STTY" 2>/dev/null
    fi
    exit 0
}

# Set up trap to restore terminal settings
trap cleanup INT TERM EXIT

# Check if we can use script command for better terminal handling
if command -v script >/dev/null 2>&1; then
    echo "Using enhanced terminal mode..."
    # Use script to create a proper pseudo-terminal
    # -q for quiet mode, -c to run the command
    # This handles terminal signals and modes better
    # Note: script will forward signals like Ctrl+C to the child process
    exec script -q -c "docker attach b14a340824d9ab6b3d3ab1b85a218e49542ecee5cfea7f90f47e1fdc478e6c4f" /dev/null
else
    echo "Using basic terminal mode..."
    echo "Note: For best results, install 'script' command (part of bsdutils or util-linux)"
    echo ""
    # Simple attach - ensure bracketed paste mode is disabled
    printf '\e[?2004l'
    exec docker attach b14a340824d9ab6b3d3ab1b85a218e49542ecee5cfea7f90f47e1fdc478e6c4f
fi
