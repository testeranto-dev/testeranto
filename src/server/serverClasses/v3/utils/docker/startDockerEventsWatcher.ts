import { spawn } from 'child_process';

export async function startDockerEventsWatcher(callback: (event: any) => void): Promise<() => void> {
  const process = spawn('docker', ['events', '--format', 'json']);
  
  process.stdout.on('data', (data) => {
    const events = data.toString().trim().split('\n');
    for (const eventStr of events) {
      if (eventStr) {
        try {
          const event = JSON.parse(eventStr);
          callback(event);
        } catch {
          // Invalid JSON, skip
        }
      }
    }
  });
  
  process.stderr.on('data', (data) => {
    // Errors are allowed to propagate through the process
  });
  
  return () => {
    process.kill();
  };
}
