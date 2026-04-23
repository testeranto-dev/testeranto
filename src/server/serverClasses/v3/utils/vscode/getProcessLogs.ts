/**
 * Get logs for a process
 */
export async function getProcessLogs(processId: string): Promise<string[]> {
  console.log(`[getProcessLogs] Getting logs for process ${processId}`);
  return [`Log entry 1 for ${processId}`, `Log entry 2 for ${processId}`];
}
