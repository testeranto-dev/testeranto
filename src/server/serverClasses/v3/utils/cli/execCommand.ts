/**
 * Execute a command and return its output
 */
export async function execCommand(
  command: string, 
  options?: any
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const { spawn } = await import('child_process');
  const { promisify } = await import('util');
  const exec = promisify(spawn);
  
  const [cmd, ...args] = command.split(' ');
  const child = exec(cmd, args, { ...options, shell: true });
  
  let stdout = '';
  let stderr = '';
  
  child.stdout?.on('data', (data) => {
    stdout += data.toString();
  });
  
  child.stderr?.on('data', (data) => {
    stderr += data.toString();
  });
  
  const exitCode = await new Promise<number>((resolve) => {
    child.on('close', (code) => {
      resolve(code || 0);
    });
  });
  
  return { stdout, stderr, exitCode };
}
