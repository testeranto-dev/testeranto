export async function saveCurrentGraphUtil(
  writeViewSliceFiles: () => Promise<void>,
  updateAllAgentSliceFiles: () => void
): Promise<void> {
  await writeViewSliceFiles();
  updateAllAgentSliceFiles();
}
