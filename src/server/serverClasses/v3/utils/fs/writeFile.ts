/**
 * Write content to a file
 */
export async function writeFile(path: string, content: string): Promise<void> {
  try {
    await Bun.write(path, content);
  } catch (error) {
    const fs = await import('fs/promises');
    await fs.writeFile(path, content, 'utf-8');
  }
}
