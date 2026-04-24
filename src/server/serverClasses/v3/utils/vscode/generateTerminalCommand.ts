export function generateTerminalCommand(
  containerId: string,
  containerName: string,
  label: string,
  isAiderProcess: boolean,
): string {
  if (isAiderProcess) {
    return `docker exec -it ${containerId} aider`;
  } else {
    return `docker exec -it ${containerId} /bin/bash`;
  }
}
