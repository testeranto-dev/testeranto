import { execSync } from 'child_process';

export async function getServiceLogs(serviceName: string, tail: number = 100): Promise<string> {
  const output = execSync(`docker compose logs --tail ${tail} ${serviceName}`, {
    encoding: 'utf-8'
  });
  
  return output;
}
