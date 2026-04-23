/**
 * Get stdout from a process
 */
export async function getStdout(processId: string): Promise<string> {
  console.log(`[getStdout] Getting stdout for process ${processId}`);
  return `stdout from process ${processId}`;
}
