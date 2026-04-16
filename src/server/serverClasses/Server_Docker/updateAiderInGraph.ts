export function updateAiderInGraph(
  testName: string,
  configKey: string,
  files?: any,
  applyUpdate?: (update: any) => void
): any {
  const timestamp = new Date().toISOString();
  const aiderProcessId = `aider_process:${configKey}:${testName}`;

  const update = {
    operations: [{
      type: 'updateNode' as const,
      data: {
        id: aiderProcessId,
        metadata: {
          filesUpdated: timestamp,
          files: files
        }
      },
      timestamp
    }],
    timestamp
  };

  if (applyUpdate) {
    applyUpdate(update);
  }
  
  return update;
}
