export function generateTerminalCommand(
  containerId: string,
  containerName: string,
  label: string,
  isAiderProcess: boolean,
): string {
  // IMPORTANT: Use docker attach, NOT docker exec -it bash.
  // docker attach connects to the container's main process (aider),
  // allowing the user to interact with aider directly.
  // docker exec -it bash would create a separate shell, not attach to aider.
  return `docker attach ${containerId}`;
}

// Re-export for backward compatibility
export { generateTerminalCommand as openProcessTerminal };
