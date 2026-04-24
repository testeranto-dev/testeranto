export function readStdin(
  stdin: NodeJS.ReadStream,
  encoding: BufferEncoding = 'utf-8',
): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    stdin.setEncoding(encoding);
    stdin.on('data', (chunk) => {
      data += chunk;
    });
    stdin.on('end', () => {
      resolve(data);
    });
    stdin.on('error', reject);

    // If stdin is already ended (e.g., piped input), we need to handle it
    if (stdin.readableEnded) {
      resolve(data);
    }
  });
}
