export function readLine(stdin: NodeJS.ReadStream): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    const onData = (chunk: Buffer | string) => {
      const str = chunk.toString();
      const newlineIndex = str.indexOf('\n');
      if (newlineIndex !== -1) {
        // Found newline
        data += str.substring(0, newlineIndex);
        // Remove listeners
        stdin.off('data', onData);
        stdin.off('end', onEnd);
        resolve(data);
      } else {
        data += str;
      }
    };

    const onEnd = () => {
      stdin.off('data', onData);
      stdin.off('end', onEnd);
      resolve(data);
    };

    stdin.on('data', onData);
    stdin.on('end', onEnd);

    // If stdin is already ended, resolve with empty string
    if (stdin.readableEnded) {
      stdin.off('data', onData);
      stdin.off('end', onEnd);
      resolve('');
    }
  });
}
