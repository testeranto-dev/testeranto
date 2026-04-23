import { execSync } from 'child_process';

export async function dockerComposeStop(services?: string[]): Promise<void> {
  const args = ['compose', 'stop'];
  if (services && services.length > 0) {
    args.push(...services);
  }
  
  execSync(`docker ${args.join(' ')}`, { stdio: 'inherit' });
}
