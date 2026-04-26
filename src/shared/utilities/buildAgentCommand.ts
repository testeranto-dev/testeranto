// /**
//  * Build the Docker command to run an agent container.
//  *
//  * Returns the full `docker run` command string that the user can execute
//  * in a terminal.  The command is composed locally so that the server does
//  * not need to be contacted for agent spawning.
//  *
//  * @param profile         Agent profile name (e.g. "arko", "prodirek")
//  * @param personaBody     The body of the persona markdown (the message)
//  * @param readFiles       File paths to add as read‑only (`--read`)
//  * @param addFiles        File paths to add as read‑write (`--file`)
//  * @param personaFilePath Absolute path to the persona markdown file (will be read first)
//  * @param workspaceRoot   The workspace root path (from VSCode or process.cwd())
//  * @param model           Optional model override
//  * @returns               The full docker run command string
//  */
// export function buildAgentCommand(
//   profile: string,
//   personaBody: string,
//   readFiles: string[],
//   addFiles: string[],
//   personaFilePath: string,
//   workspaceRoot: string,
//   model?: string,
// ): string {
//   const imageName = "testeranto-aider:latest";
//   const agentName = `${profile}-${Date.now()}`;
//   const containerName = `agent-${agentName}`;

//   const volumes = [
//     `-v "${workspaceRoot}/src:/workspace/src"`,
//     `-v "${workspaceRoot}/test:/workspace/test"`,
//     `-v "${workspaceRoot}/SOUL.md:/workspace/SOUL.md"`,
//     `-v "${workspaceRoot}:/workspace"`,
//     `-v "${workspaceRoot}/.aider.conf.yml:/workspace/.aider.conf.yml"`,
//   ];

//   // Build --file and --read arguments
//   const fileArgs: string[] = [];
//   const readArgs: string[] = [];

//   // The persona markdown file MUST be read first (if provided)
//   if (personaFilePath) {
//     readArgs.push(`--read "${personaFilePath}"`);
//   }

//   for (const filePath of addFiles) {
//     fileArgs.push(`--file "${filePath}"`);
//   }
//   for (const filePath of readFiles) {
//     readArgs.push(`--read "${filePath}"`);
//   }

//   const command = `
// docker run -it --rm --name ${containerName} \
// ${volumes.join(" ")} \
// --add-host host.docker.internal:host-gateway ${imageName} \
// sh -c 'aider \
//   --no-analytics --no-show-model-warnings --no-show-release-notes --no-check-update \
//   ${fileArgs.join(" \\\n  ")} \
//   ${readArgs.join(" \\\n  ")} \
//   --message '${personaBody.replace(/'/g, "'\\''")}'
//   '`;

//   return command;
// }
