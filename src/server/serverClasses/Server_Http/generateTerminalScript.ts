export function generateTerminalScript(params: {
    type: string;
    nodeId: string;
    label?: string;
    containerName: string;
    containerStatus: string;
    isAiderProcess: boolean;
}): string {
    const { type, nodeId, label, containerName, containerStatus, isAiderProcess } = params;

    if (containerStatus === 'running') {
        if (isAiderProcess) {
            return `#!/bin/sh
echo "Opening terminal to ${type} process: ${label || nodeId}"
echo "Container: ${containerName}"
echo "Status: ${containerStatus}"
echo ""
# Check if container exists (running or stopped)
if docker ps -a --format "{{.Names}}" | grep -q "^${containerName}\$"; then
    # Check if it's running
    if docker ps --format "{{.Names}}" | grep -q "^${containerName}\$"; then
        echo "Container is running. Attaching to aider process..."
        echo "Important notes for signal handling:"
        echo "1. To detach from the container without stopping it, press Ctrl+P, Ctrl+Q"
        echo "2. Ctrl+C will send SIGINT to the aider process inside"
        echo "3. For copy-paste to work properly, we're resetting terminal settings"
        echo ""
        # Reset terminal settings to fix copy-paste issues
        stty sane
        # Disable bracketed paste mode which causes ^[[200~ and ^[[201~ codes
        printf '\\e[?2004l'
        # Also disable other problematic terminal modes
        printf '\\e[?1l'
        # Ensure terminal is in cooked mode
        stty cooked
        # Clear any pending input
        printf '\\e[0n'
        # Don't trap any signals - let them pass through to docker
        trap '' INT
        # Use docker attach to connect to the running aider process
        # This allows Ctrl+C to reach the process inside
        exec docker attach ${containerName}
    else
        echo "Container exists but is stopped."
        echo "You can start it with:"
        echo "  docker compose -f testeranto/docker-compose.yml up -d ${containerName}"
        echo ""
        echo "Starting interactive shell..."
        stty sane
        printf '\\e[?2004l'
        printf '\\e[?1l'
        stty cooked
        exec "/bin/sh" -i
    fi
else
    echo "Container does not exist."
    echo "Available containers:"
    docker ps -a --format "{{.Names}}"
    echo ""
    echo "Starting interactive shell..."
    stty sane
    printf '\\e[?2004l'
    printf '\\e[?1l'
    stty cooked
    exec "/bin/sh" -i
fi`;
        } else {
            return `#!/bin/sh
echo "Opening terminal to ${type} process: ${label || nodeId}"
echo "Container: ${containerName}"
echo "Status: ${containerStatus}"
echo ""
# Check if container exists (running or stopped)
if docker ps -a --format "{{.Names}}" | grep -q "^${containerName}\$"; then
    # Check if it's running
    if docker ps --format "{{.Names}}" | grep -q "^${containerName}\$"; then
        echo "Container is running. Opening interactive shell..."
        echo "Note: Using docker exec -it for better signal handling"
        echo "      Ctrl+C will work normally in the shell"
        echo "      Use exit or Ctrl+D to exit"
        echo ""
        # Reset terminal settings to fix various issues
        stty sane
        # Disable bracketed paste mode (causes ^[[200~ and ^[[201~ codes)
        printf '\\e[?2004l'
        # Also disable other problematic terminal modes
        printf '\\e[?1l'
        # Ensure terminal is in cooked mode
        stty cooked
        # Use docker exec -it for better interactive experience
        # This creates a new shell session with proper TTY handling
        exec docker exec -it ${containerName} /bin/sh
    else
        echo "Container exists but is stopped."
        echo "You can start it with:"
        echo "  docker compose -f testeranto/docker-compose.yml up -d ${containerName}"
        echo ""
        echo "Starting interactive shell..."
        stty sane
        printf '\\e[?2004l'
        printf '\\e[?1l'
        stty cooked
        exec "/bin/sh" -i
    fi
else
    echo "Container does not exist."
    echo "Available containers:"
    docker ps -a --format "{{.Names}}"
    echo ""
    echo "Starting interactive shell..."
    stty sane
    printf '\\e[?2004l'
    printf '\\e[?1l'
    stty cooked
    exec "/bin/sh" -i
fi`;
        }
    } else {
        return `#!/bin/sh
echo "Container ${containerName} is not running."
echo "Node ID: ${nodeId}"
echo "Type: ${type}"
echo ""
echo "Available containers:"
docker ps --format "{{.Names}}"
echo ""
echo "You can try to start the container with:"
echo "  docker compose -f testeranto/docker-compose.yml up -d ${containerName}"
echo ""
echo "Starting interactive shell..."
# Reset terminal settings
stty sane
# Disable bracketed paste mode
printf '\\e[?2004l'
# Disable other terminal modes
printf '\\e[?1l'
# Ensure cooked mode
stty cooked
# Don't trap signals
trap '' INT
exec "/bin/sh" -i`;
    }
}
