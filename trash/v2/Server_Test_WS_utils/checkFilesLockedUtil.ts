export async function checkFilesLockedUtil(
  graphManager?: any
): Promise<boolean> {
  if (graphManager && graphManager.graph) {
    // const lockManager = new LockManager(graphManager.graph);
    return lockManager.hasLockedFiles();
  }
  return false;
}
