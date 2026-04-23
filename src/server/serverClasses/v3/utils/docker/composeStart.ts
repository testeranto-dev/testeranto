import { execSync } from 'child_process';

export async function dockerComposeStart(services?: string[]): Promise<void> {
  const args = ['compose', 'start'];
  if (services && services.length > 0) {
    args.push(...services);
  }
  
  execSync(`docker ${args.join(' ')}`, { stdio: 'inherit' });
}
