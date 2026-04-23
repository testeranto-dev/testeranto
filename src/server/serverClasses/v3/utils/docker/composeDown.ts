/**
 * Stop Docker Compose services
 */
export async function dockerComposeDown(): Promise<void> {
  const { execCommand } = await import('../cli/execCommand');
  const command = 'docker compose down';
  
  const result = await execCommand(command);
  if (result.exitCode !== 0) {
    throw new Error(`docker compose down failed: ${result.stderr}`);
  }
}
