import { Readable } from 'stream';

export function createMockStdin(data: string | Buffer): Readable {
  const mockStdin = new Readable({
    read() {
      this.push(data);
      this.push(null); // EOF
    },
  });
  return mockStdin;
}
