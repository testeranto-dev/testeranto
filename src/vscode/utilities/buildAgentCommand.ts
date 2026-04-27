/**
 * Build the Docker command to run an agent container.
 *
 * Returns the full `docker run` command string that the user can execute
 * in a terminal.  The command is composed locally so that the server does
 * not need to be contacted for agent spawning.
 *
 * @param profile         Agent profile name (e.g. "arko", "prodirek")
 * @param personaBody     The body of the persona markdown (the message)
 * @param readFiles       File paths to add as read‑only (`--read`)
 * @param addFiles        File paths to add as read‑write (`--file`)
 * @param personaFilePath Absolute path to the persona markdown file (will be read first)
 * @param workspaceRoot   The workspace root path (from VSCode or process.cwd())
 * @param model           Optional model override
 * @returns               The full docker run command string
 */
export function buildAgentCommand(
  profile: string,
  personaBody: string,
  readFiles: string[],
  addFiles: string[],
  personaFilePath: string,
  workspaceRoot: string,
  model?: string,
): string {
  const imageName = "testeranto-aider:latest";
  const agentName = `${profile}-${Date.now()}`;
  const containerName = `agent-${agentName}`;

  const volumes = [
    `-v "${workspaceRoot}/src:/workspace/src"`,
    `-v "${workspaceRoot}/test:/workspace/test"`,
    `-v "${workspaceRoot}/SOUL.md:/workspace/SOUL.md"`,
    `-v "${workspaceRoot}:/workspace"`,
    `-v "${workspaceRoot}/.aider.conf.yml:/workspace/.aider.conf.yml"`,
  ];

  // Build --file and --read arguments
  const fileArgs: string[] = [];
  const readArgs: string[] = [];

  // The persona markdown file MUST be read first (if provided)
  if (personaFilePath) {
    readArgs.push(`--read "${personaFilePath}"`);
  }

  for (const filePath of addFiles) {
    fileArgs.push(`--file "${filePath}"`);
  }
  for (const filePath of readFiles) {
    readArgs.push(`--read "${filePath}"`);
  }

  // Build a single-line command (no backslash-newline continuations)
  const aiderArgs = [
    '--no-analytics',
    '--no-show-model-warnings',
    '--no-show-release-notes',
    '--no-check-update',
    ...fileArgs,
    ...readArgs,
  ];

  // Only add --message if the persona body is not empty
  if (personaBody) {
    // Escape single and double quotes inside the message for the shell inside the container
    const escapedMessage = personaBody.replace(/'/g, "'\\''").replace(/"/g, '\\"');
    aiderArgs.push(`--message "${escapedMessage}"`);
  }

  const aiderArgsString = aiderArgs.join(' ');

  const command = `docker run -it --rm --name ${containerName} ${volumes.join(' ')} --add-host host.docker.internal:host-gateway ${imageName} sh -c 'aider ${aiderArgsString}'`;

  return command;
}

/**
 * Build the Docker command to run a specific runtime test.
 *
 * Returns the full `docker run` command string that the user can execute
 * in a terminal.  The command is composed locally so that the server does
 * not need to be contacted for test spawning.
 *
 * @param runtimeName     The runtime name (e.g. "nodetests", "webtests")
 * @param testFilePath    The path to the test file to run
 * @param inputFiles      Additional input files to include (e.g. from agent's read/add lists)
 * @param workspaceRoot   The workspace root path (from VSCode or process.cwd())
 * @returns               The full docker run command string
 */
export function buildRuntimeTestCommand(
  runtimeName: string,
  testFilePath: string,
  inputFiles: string[],
  workspaceRoot: string,
  message?: string
): string {
  const imageName = "testeranto-aider:latest";
  const containerName = `test-${runtimeName}-${Date.now()}`;

  const volumes = [
    `-v "${workspaceRoot}/src:/workspace/src"`,
    `-v "${workspaceRoot}/test:/workspace/test"`,
    `-v "${workspaceRoot}/SOUL.md:/workspace/SOUL.md"`,
    `-v "${workspaceRoot}:/workspace"`,
    `-v "${workspaceRoot}/.aider.conf.yml:/workspace/.aider.conf.yml"`,
  ];

  // Build --read arguments for input files
  const readArgs: string[] = [];

  // Normalize file paths: remove leading slash if present
  const normalizePath = (p: string) => p.startsWith('/') ? p.substring(1) : p;

  // The test file itself must be read
  const normalizedTestPath = normalizePath(testFilePath);
  readArgs.push(`--read ${normalizedTestPath}`);

  // Add input files, avoiding duplicates
  const seenPaths = new Set<string>();
  seenPaths.add(normalizedTestPath);

  for (const filePath of inputFiles) {
    const normalizedPath = normalizePath(filePath);
    if (!seenPaths.has(normalizedPath)) {
      seenPaths.add(normalizedPath);
      readArgs.push(`--read ${normalizedPath}`);
    }
  }

  // Build aider arguments as a single line
  const aiderArgs: string[] = [
    '--no-analytics',
    '--no-show-model-warnings',
    '--no-show-release-notes',
    '--no-check-update',
    ...readArgs,
  ];

  if (message && message.trim()) {
    // Escape double quotes inside the message for the shell inside the container
    const escapedMessage = message.replace(/"/g, '\\"');
    aiderArgs.push(`--message "${escapedMessage}"`);
  }

  // Escape double quotes and backslashes in each argument for use inside double-quoted shell command
  const escapedArgs = aiderArgs.map(arg => arg.replace(/[\\"$`]/g, '\\$&')).join(' ');
  const command = `docker run -it --rm --name ${containerName} ${volumes.join(' ')} --add-host host.docker.internal:host-gateway ${imageName} sh -c "aider ${escapedArgs}"`;

  return command;
}
