/**
 * Start Docker Compose services
 */
export async function dockerComposeUp(services?: string[]): Promise<void> {
  const { execCommand } = await import('../cli/execCommand');
  const serviceArgs = services ? services : [];
  const command = `docker compose up -d ${serviceArgs.join(' ')}`.trim();
  
  const result = await execCommand(command);
  if (result.exitCode !== 0) {
    throw new Error(`docker compose up failed: ${result.stderr}`);
  }
}
