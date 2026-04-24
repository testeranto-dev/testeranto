import { Writable } from 'stream';

export function streamDockerBuildLogs(
  stream: NodeJS.ReadableStream,
  writeStdout: (data: string | Buffer) => boolean,
  writeStderr: (data: string | Buffer) => boolean,
): void {
  stream.on('data', (chunk: Buffer | string) => {
    writeStdout(chunk);
  });
  stream.on('error', (err: Error) => {
    writeStderr(`[DockerBuild] error: ${err.message}\n`);
  });
}
