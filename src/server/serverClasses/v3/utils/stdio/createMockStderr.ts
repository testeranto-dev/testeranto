import { Writable } from 'stream';

export function createMockStderr(): { stream: Writable; getOutput: () => string } {
  let output = '';
  const mockStderr = new Writable({
    write(chunk, encoding, callback) {
      output += chunk.toString();
      callback();
    },
  });

  return {
    stream: mockStderr,
    getOutput: () => output,
  };
}
