// import { readFileSync } from "fs";
// import { parse } from "yaml";
// import type { ITesterantoConfig } from "../../../../../Types";
// import type { IMode } from "../../../../types";

// /**
//  * Parse the persona markdown file for an agent.
//  * Returns the persona body and the file lists from frontmatter.
//  */
// function parseAgentMarkdown(filePath: string): {
//   personaBody: string;
//   readFiles: string[];
//   addFiles: string[];
// } {
//   const content = readFileSync(filePath, "utf-8");

//   if (!content.startsWith("---")) {
//     return {
//       personaBody: content,
//       readFiles: [],
//       addFiles: [],
//     };
//   }

//   const endOfFrontmatter = content.indexOf("---", 3);
//   if (endOfFrontmatter === -1) {
//     return {
//       personaBody: content,
//       readFiles: [],
//       addFiles: [],
//     };
//   }

//   const frontmatterRaw = content.slice(3, endOfFrontmatter).trim();
//   const body = content.slice(endOfFrontmatter + 3).trim();

//   const frontmatter: { add?: string[]; read?: string[] } = parse(frontmatterRaw) || {};

//   return {
//     personaBody: body,
//     readFiles: frontmatter.read || [],
//     addFiles: frontmatter.add || [],
//   };
// }

// export function generateAgentService(
//   configs: ITesterantoConfig,
//   agentName: string,
//   agentConfig: any,
//   mode: IMode,
//   projectRoot: string,
// ): any {
//   // Resolve the persona file path
//   const personaFile = agentConfig.persona;
//   let personaBody = "";
//   let readFiles: string[] = [];
//   let addFiles: string[] = [];

//   if (personaFile) {
//     const absolutePersonaPath = `${projectRoot}/${personaFile}`;
//     const parsed = parseAgentMarkdown(absolutePersonaPath);
//     personaBody = parsed.personaBody;
//     readFiles = parsed.readFiles;
//     addFiles = parsed.addFiles;
//   }

//   // Build --file and --read arguments
//   const fileArgs: string[] = [];
//   const readArgs: string[] = [];

//   // The persona markdown file MUST be read first
//   if (personaFile) {
//     readArgs.push(`--read "${personaFile}"`);
//   }

//   for (const filePath of addFiles) {
//     fileArgs.push(`--file "${filePath}"`);
//   }
//   for (const filePath of readFiles) {
//     readArgs.push(`--read "${filePath}"`);
//   }

//   // Escape single quotes in the message for the shell command
//   const escapedMessage = personaBody.replace(/'/g, "'\\''");

//   return {
//     image: 'testeranto-aider:latest',
//     container_name: `agent-${agentName}`,
//     volumes: [
//       ...(configs.volumes || []),
//       `${projectRoot}:/workspace`,
//       `${projectRoot}/.aider.conf.yml:/workspace/.aider.conf.yml`,
//     ],
//     working_dir: '/workspace',
//     command: [
//       'sh', '-c',
//       `echo "Starting aider for agent ${agentName}"
//        aider  --no-analytics --no-show-model-warnings --no-show-release-notes --no-check-update \
//        ${fileArgs.join(" \\\n       ")} \
//        ${readArgs.join(" \\\n       ")} \
//        --message ${escapedMessage} 2>&1
//        EXIT_CODE=$?
//        echo "Aider exited with code $EXIT_CODE"
//        # Exit with the same code (no restart)
//        exit $EXIT_CODE`
//     ],
//     environment: {
//       MODE: mode,
//       NODE_ENV: 'production',
//       AGENT_NAME: agentName,
//       EDITOR: 'vim',
//     },
//     restart: 'no',
//     networks: ['allTests_network'],
//     tty: true,
//     stdin_open: true,
//     extra_hosts: ['host.docker.internal:host-gateway'],
//   };
// }
