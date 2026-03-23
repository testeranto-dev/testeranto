import { captureContainerExitCode } from ".";
import {
  getLogFilePath,
  getExitCodeFilePath,
  DOCKER_COMPOSE_BASE,
} from "../Server_Docker_Constants";
import {
  spawnWrapper,
  execSyncWrapper,
  consoleWarn,
  createWriteStream,
  writeFileSync,
} from "../Server_Docker_Dependents";

export const startServiceLoggingPure = (
  serviceName: string,
  runtime: string,
  cwd: string,
  logProcesses: Map<string, { process: any; serviceName: string }>,
  runtimeConfigKey: string,
): Map<string, { process: any; serviceName: string }> => {
  const logFilePath = getLogFilePath(
    cwd,
    runtime,
    serviceName,
    runtimeConfigKey,
  );
  const exitCodeFilePath = getExitCodeFilePath(
    cwd,
    runtimeConfigKey,
    serviceName,
  );

  // Start a process to capture logs - use a more robust approach
  // We'll use a shell script that handles waiting for the container
  const logScript = `
      # Wait for container to exist
      for i in {1..30}; do
        if docker compose -f "testeranto/docker-compose.yml" ps -q ${serviceName} > /dev/null 2>&1; then
          break
        fi
        sleep 1
      done
      # Capture logs from the beginning
      docker compose -f "testeranto/docker-compose.yml" logs --no-color -f ${serviceName}
    `;

  // Open in overwrite mode to replace old logs
  const logStream = createWriteStream(logFilePath, { flags: "w" });
  const timestamp = new Date().toISOString();
  logStream.write(
    `=== Log started at ${timestamp} for service ${runtime} ===\n\n`,
  );

  const child = spawnWrapper("bash", ["-c", logScript], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  const containerId = execSyncWrapper(
    `${DOCKER_COMPOSE_BASE} ps -q ${serviceName}`,
    {
      cwd: cwd,
    },
  ).trim();

  child.stdout?.on("data", (data: any) => {
    logStream.write(data);
  });

  child.stderr?.on("data", (data: any) => {
    logStream.write(data);
  });

  child.on("error", (error: { message: any }) => {
    logStream.write(`\n=== Log process error: ${error.message} ===\n`);
    logStream.end();
    writeFileSync(exitCodeFilePath, "-1");
  });

  child.on("close", (code: { toString: () => any }) => {
    const endTimestamp = new Date().toISOString();
    logStream.write(
      `\n=== Log ended at ${endTimestamp}, process exited with code ${code} ===\n`,
    );
    logStream.end();

    writeFileSync(exitCodeFilePath, code?.toString() || "0");

    captureContainerExitCode(serviceName, runtime, runtimeConfigKey);

    if (containerId) {
      logProcesses.delete(containerId);
    } else {
      consoleWarn("containerId should exist");
    }
  });

  const trackingKey = containerId || serviceName;
  const newLogProcesses = new Map(logProcesses);
  newLogProcesses.set(trackingKey, { process: child, serviceName });
  return newLogProcesses;
};
