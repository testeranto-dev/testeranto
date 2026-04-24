import { execSync } from 'child_process';

export function execGit(command: string): string {
  const cwd = process.cwd();
  return execSync(command, { cwd }).toString().trim();
}
// import { execSync } from 'child_process';

// export function execGit(command: string): string {
//   const cwd = process.cwd();
//   return execSync(command, { cwd }).toString().trim();
// }
