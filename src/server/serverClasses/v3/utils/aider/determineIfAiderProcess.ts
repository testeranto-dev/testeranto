export function determineIfAiderProcess(processNode: any): boolean {
  return processNode?.type?.includes('aider') || false;
}
