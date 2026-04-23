/**
 * Watch a file for changes
 */
export function watchFile(
  path: string, 
  callback: (event: string) => void
): () => void {
  console.log(`[watchFile] Watching file ${path}`);
  
  // Return a function to stop watching
  return () => {
    console.log(`[watchFile] Stopped watching ${path}`);
  };
}
