/**
 * Read a file from the filesystem
 */
export async function readFile(path: string): Promise<string> {
  // Basic implementation using Bun.file
  try {
    const file = Bun.file(path);
    return await file.text();
  } catch (error) {
    // Fallback for Node.js or other environments
    const fs = await import('fs/promises');
    return await fs.readFile(path, 'utf-8');
  }
}
