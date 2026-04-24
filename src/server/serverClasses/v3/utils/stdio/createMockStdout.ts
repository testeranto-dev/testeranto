import { Writable } from 'stream';

export function createMockStdout(): { stream: Writable; getOutput: () => string } {
  let output = '';
  const mockStdout = new Writable({
    write(chunk, encoding, callback) {
      output += chunk.toString();
      callback();
    },
  });

  return {
    stream: mockStdout,
    getOutput: () => output,
  };
}
