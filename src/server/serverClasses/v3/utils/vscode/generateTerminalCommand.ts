export function generateTerminalCommand(
  containerId: string,
  containerName: string,
  label: string,
  isAiderProcess: boolean,
): string {
  // Always attach to the running process inside the container
  return `docker attach ${containerId}`;
}

// Re-export for backward compatibility
export { generateTerminalCommand as openProcessTerminal };
