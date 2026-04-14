#!/bin/sh
echo "Connecting to container: cd4a700521ae0c664e4c37a489d41c678e0bcf276fc6ac2b89c27643c6805eaf"
echo "Service: cd4a700521ae0c664e4c37a489d41c678e0bcf276fc6ac2b89c27643c6805eaf"
echo "Label: aider: prodirek"
echo ""
echo "To detach from the container without stopping it:"
echo "  Press Ctrl+P, Ctrl+Q"
echo "To send Ctrl+C to the container:"
echo "  Press Ctrl+C"
echo ""

# Disable bracketed paste mode to fix copy-paste issues
# This prevents terminal from sending ^[[200~ and ^[[201~ sequences
printf '\e[?2004l'

# Simply attach to the container
# Using 'exec' replaces the shell process, so Ctrl+C goes directly to docker attach
exec docker attach cd4a700521ae0c664e4c37a489d41c678e0bcf276fc6ac2b89c27643c6805eaf
