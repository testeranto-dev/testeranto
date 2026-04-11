#!/bin/sh
echo "Attaching to aider_process process: Aider Process: prodirek"
echo "Container: agent-prodirek"
echo "Status: running"
echo ""
echo "Note: Use Ctrl+P, Ctrl+Q to detach without stopping the container"
echo "      Use Ctrl+C to send SIGINT to the process inside the container"
echo ""
# Set up proper terminal handling
stty sane
# Use docker attach with no-stdin to prevent terminal issues
exec docker attach agent-prodirek