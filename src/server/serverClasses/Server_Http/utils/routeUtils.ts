import { execSync } from "child_process";

export function getViewName(key: string): string {
  // Convert key to display name
  switch (key) {
    case 'featuretree':
      return 'Feature Tree';
    case 'debugVisualization':
      return 'Debug Visualization';
    case 'Kanban':
      return 'Kanban Board';
    case 'Gantt':
      return 'Gantt Chart';
    case 'Eisenhower':
      return 'Eisenhower Matrix';
    default:
      // Convert camelCase or snake_case to Title Case
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^./, str => str.toUpperCase())
        .trim();
  }
}

export function checkContainerExists(containerName: string): boolean {
  try {
    const checkCmd = `docker ps -a -q -f name=${containerName}`;
    const result = execSync(checkCmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    return result.length > 0;
  } catch (error) {
    return false;
  }
}

export function generateTerminalScript(params: {
  type: string;
  nodeId: string;
  label?: string;
  containerName: string;
  containerStatus: string;
  isAgentOrAider: boolean;
}): string {
  const { type, nodeId, label, containerName, containerStatus, isAgentOrAider } = params;
  
  if (containerStatus === 'running') {
    if (isAgentOrAider) {
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
        echo "Note: Ctrl+C will send SIGINT to the aider process inside the container"
        echo "      Use Ctrl+P, Ctrl+Q to detach without stopping the container"
        echo ""
        # Don't trap signals - let them pass through to docker
        trap '' INT
        # Reset terminal settings
        stty sane
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
        exec "/bin/sh" -i
    fi
else
    echo "Container does not exist."
    echo "Available containers:"
    docker ps -a --format "{{.Names}}"
    echo ""
    echo "Starting interactive shell..."
    stty sane
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
        echo "Note: Ctrl+C will send SIGINT to the process inside the container"
        echo "      Use exit or Ctrl+D to exit the shell"
        echo ""
        # Don't trap signals - let them pass through to docker
        trap '' INT
        # Reset terminal settings
        stty sane
        # Use exec to replace the shell with docker exec
        exec docker exec -it ${containerName} /bin/sh
    else
        echo "Container exists but is stopped."
        echo "You can start it with:"
        echo "  docker compose -f testeranto/docker-compose.yml up -d ${containerName}"
        echo ""
        echo "Starting interactive shell..."
        stty sane
        exec "/bin/sh" -i
    fi
else
    echo "Container does not exist."
    echo "Available containers:"
    docker ps -a --format "{{.Names}}"
    echo ""
    echo "Starting interactive shell..."
    stty sane
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
# Don't trap signals
trap '' INT
exec "/bin/sh" -i`;
  }
}
