#!/bin/sh
echo "Container unknown is not running."
echo "Node ID: aider_process:agent:prodirek"
echo "Type: aider_process"
echo ""
echo "Available containers:"
docker ps --format "{{.Names}}"
echo ""
echo "Starting interactive shell..."
exec "/bin/sh" -i