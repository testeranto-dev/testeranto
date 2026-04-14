import { execSync } from "child_process";

export function checkContainerExists(containerName: string): boolean {
  try {
    const checkCmd = `docker ps -a -q -f name=${containerName}`;
    const result = execSync(checkCmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    return result.length > 0;
  } catch (error) {
    return false;
  }
}
