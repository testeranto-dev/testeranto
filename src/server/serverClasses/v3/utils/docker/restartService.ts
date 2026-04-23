import { execSync } from 'child_process';

export async function restartService(serviceName: string): Promise<void> {
  execSync(`docker compose restart ${serviceName}`, { stdio: 'inherit' });
}
