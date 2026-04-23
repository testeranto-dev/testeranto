/**
 * Inform aider about changes
 */
export async function informAider(
  testName: string, 
  configKey: string, 
  files?: any
): Promise<void> {
  console.log(`[informAider] Informing aider for test ${testName}, config ${configKey}`);
}
