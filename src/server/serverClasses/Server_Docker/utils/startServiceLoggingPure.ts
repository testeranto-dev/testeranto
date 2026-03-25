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

// TODO: TICKET-001 - Refactor logging system to separate test and builder services
// Current hack: Using testName presence to distinguish between test services (BDD/check) and builder services
// Problem: This is a fragile heuristic that mixes two different concepts
// Solution needed: Create separate functions for startTestLogging and startBuilderLogging
// with clear interfaces and separate path generation logic

// Helper to clean test name for file paths (preserves directory structure)
const cleanTestNameForPath = (testName: string): string => {
  // Convert to lowercase
  let result = testName.toLowerCase();
  // Replace dots with hyphens in the filename part only
  const parts = result.split('/');
  const lastPart = parts[parts.length - 1];
  const cleanedLastPart = lastPart.replace(/\./g, '-');
  parts[parts.length - 1] = cleanedLastPart;
  result = parts.join('/');
  // Remove any other invalid characters (keep slashes, hyphens, underscores, alphanumeric)
  result = result.replace(/[^a-z0-9_\-/]/g, '');
  return result;
};

export const startServiceLoggingPure = (
  serviceName: string,
  runtime: string,
  cwd: string,
  logProcesses: Map<string, { process: any; serviceName: string }>,
  runtimeConfigKey: string,
  testName?: string,
): Map<string, { process: any; serviceName: string }> => {
  // Determine the base name for file paths
  // If testName is provided, it's a test service → use test-based paths
  // If testName is not provided, it's a builder service → use serviceName-based paths
  let baseName: string;
  if (testName) {
    // For test services, we need to extract the suffix from serviceName and append it with underscore
    const cleanedTestName = cleanTestNameForPath(testName);
    
    // Extract suffix from serviceName (e.g., "-bdd", "-check-0")
    // serviceName format: {configKey}-{cleanedTestName}-{suffix}
    // where suffix can be "bdd", "check-0", etc.
    const suffixMatch = serviceName.match(/-(bdd|check-\d+|aider|builder)$/);
    if (suffixMatch) {
      const suffix = suffixMatch[1]; // "bdd", "check-0", etc.
      baseName = `${cleanedTestName}_${suffix}`;
    } else {
      // Fallback: use serviceName
      baseName = serviceName;
    }
  } else {
    // For builder services, use serviceName as is
    baseName = serviceName;
  }
  
  const logFilePath = `${cwd}/testeranto/reports/${runtimeConfigKey}/${baseName}.log`;
  const exitCodeFilePath = `${cwd}/testeranto/reports/${runtimeConfigKey}/${baseName}.exitcode`;

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

    captureContainerExitCode(serviceName, runtime, runtimeConfigKey, testName);

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
