// import type { IRunTime } from "../../../../Types";
// import { BuildKitBuilder } from "../../../buildkit/BuildKit_Utils";
// import { cleanTestName, generateUid, getAiderServiceName } from "../Server_Docker_Constants";
// import { consoleError, consoleLog, consoleWarn, execSyncWrapper, existsSync, readFileSync, writeFileSync } from "../Server_Docker_Dependents";
// import { getCwdPure } from "../Server_Docker_Utils";

// // Pure function to handle aider processes
// export const handleAiderProcessesPure = (
//   configs: any,
//   getProcessSummary: () => any,
// ): any => {
//   const summary = getProcessSummary();
//   const aiderProcesses = getAiderProcessesPure(configs, summary.processes);
//   return {
//     aiderProcesses: aiderProcesses,
//     timestamp: new Date().toISOString(),
//     message: "Success",
//   };
// };


// export const getAiderProcessesPure = (
//   configs: any,
//   processes: any[],
// ): any[] => {
//   const aiderProcesses = processes.filter(
//     (process: any) => process.name && process.name.includes("-aider"),
//   );

//   return aiderProcesses.map((process: any) => {
//     let runtime = "";
//     let testName = "";
//     let configKey = "";

//     const name = process.name || process.containerName || "";
//     if (name.includes("-aider")) {
//       // Parse container name to extract runtime and test name
//       // Format: {configKey}-{testName}-aider
//       const match = name.match(/^(.+?)-(.+)-aider$/);
//       if (match) {
//         configKey = match[1];
//         const testPart = match[2];

//         //   find the runtime from configs
//         for (const [key, configValue] of Object.entries(configs.runtimes)) {
//           if (key === configKey) {
//             runtime = configValue.runtime;
//             for (const t of configValue.tests) {
//               const cleanedTestName = cleanTestName(t);
//               if (cleanedTestName === testPart) {
//                 testName = t;
//                 break;
//               }
//             }
//             break;
//           }
//         }
//       }
//     }

//     const connectCommand = `docker exec -it ${process.containerId} aider`;

//     return {
//       ...process,
//       name: name,
//       containerId: process.containerId || "",
//       runtime: runtime,
//       testName: testName,
//       configKey: configKey,
//       status: process.status || "",
//       state: process.state || "",
//       isActive: process.isActive || false,
//       exitCode: process.exitCode || null,
//       startedAt: process.startedAt || null,
//       finishedAt: process.finishedAt || null,
//       connectCommand: connectCommand,
//       terminalCommand: connectCommand,
//       containerName: name,
//       timestamp: new Date().toISOString(),
//     };
//   });
// };

// export const informAiderPure = async (
//   runtime: IRunTime,
//   testName: string,
//   configKey: string,
//   configValue: any,
//   inputFiles: any,
//   captureExistingLogs: (serviceName: string, runtime: string) => void,
//   writeConfigForExtension: () => void,
// ): Promise<void> => {
//   const uid = generateUid(configKey, testName);
//   const aiderServiceName = getAiderServiceName(uid);
//   const inputFilesPath = `testeranto/bundles/${runtime}/${testName}-inputFiles.json`;

//   try {
//     const containerIdCmd = `docker compose -f "testeranto/docker-compose.yml" ps -q ${aiderServiceName}`;
//     const containerId = execSyncWrapper(containerIdCmd, {
//       encoding: "utf-8",
//     }).trim();

//     if (!containerId) {
//       throw `[Server_Docker] No container found for aider service: ${aiderServiceName}`;
//     }

//     const inputContent = readFileSync(inputFilesPath, "utf-8");

//     // Send the input content to the aider process's stdin
//     // We'll use docker exec to write to the main process's stdin (PID 1)
//     // The -i flag keeps stdin open, and we pipe the content
//     const sendInputCmd = `echo ${JSON.stringify(inputContent)} | docker exec -i ${containerId} sh -c 'cat > /proc/1/fd/0'`;

//     execSyncWrapper(sendInputCmd, {
//       encoding: "utf-8",
//       stdio: "pipe",
//     });
//   } catch (error: any) {
//     consoleError(
//       `[Server_Docker] Failed to inform aider service ${aiderServiceName}: ${error.message}`,
//     );
//     captureExistingLogs(aiderServiceName, runtime);
//   }
// };


// // Pure function to build aider image
// export const buildAiderImagePure = async (): Promise<void> => {
//   const dockerfilePath = "aider.Dockerfile";

//   if (!existsSync(dockerfilePath)) {
//     consoleWarn(
//       `[Server_Docker] ⚠️ aider.Dockerfile not found at ${dockerfilePath}. Aider services may not work correctly.`,
//     );

//     const defaultAiderDockerfile = `FROM python:3.11-slim
// WORKDIR /workspace
// RUN pip install --no-cache-dir aider-chat
// USER 1000
// CMD ["tail", "-f", "/dev/null"]`;

//     writeFileSync(dockerfilePath, defaultAiderDockerfile);
//     consoleLog(`[Server_Docker] Created default ${dockerfilePath}`);
//   }

//   const buildKitOptions = {
//     runtime: "aider",
//     configKey: "aider",
//     dockerfilePath: dockerfilePath,
//     buildContext: getCwdPure(),
//     cacheMounts: [],
//     targetStage: undefined,
//     buildArgs: {},
//   };

//   const result = await BuildKitBuilder.buildImage({
//     ...buildKitOptions,
//     // Override the image name
//     runtime: "aider",
//     configKey: "aider",
//   });

//   if (result.success) {
//     consoleLog(
//       `[Server_Docker] ✅ Aider image built successfully in ${result.duration}ms`,
//     );
//   } else {
//     consoleError(
//       `[Server_Docker] ❌ Aider image build failed: ${result.error}`,
//     );
//     // Don't throw here, just log the error
//     consoleWarn(
//       `[Server_Docker] Aider services may not work, but continuing with other builds`,
//     );
//   }
// };



// export const aiderDockerComposeFile = (container_name: string) => {
//   return {
//     image: "testeranto-aider:latest",
//     container_name,
//     environment: {
//       NODE_ENV: "production",
//     },
//     volumes: [
//       `${processCwd()}/.aider.conf.yml:/workspace/.aider.conf.yml`,
//       // Mount the entire workspace to allow aider to access files
//       `${processCwd()}:/workspace`,
//     ],
//     working_dir: "/workspace",
//     command: "tail -f /dev/null", // Keep container running
//     networks: ["allTests_network"],
//     tty: true,
//     stdin_open: true,
//   };
// };
