export function determineIfAiderProcess(processNode: { type?: string | { type: string; category: string } }): boolean {
  if (!processNode?.type) return false;
  if (typeof processNode.type === 'string') {
    return processNode.type.includes('aider');
  }
  if (typeof processNode.type === 'object' && processNode.type !== null) {
    return processNode.type.type === 'aider' || processNode.type.category === 'aider';
  }
  return false;
}
