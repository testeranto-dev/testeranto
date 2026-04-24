import {
  getContainerInspectFormat,
  isContainerActive,
} from "../Server_Docker_Constants";
import { execSyncWrapper } from "../Server_Docker_Dependents";

export const getProcessSummaryPure = (): any => {
  const cmd =
    'docker ps -a --format "{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}|{{.State}}|{{.Command}}|{{.ID}}"';

  const output: string = execSyncWrapper(cmd);

  const lines = output
    .trim()
    .split("\n")
    .filter((line) => line.trim());

  const processes = lines.map((line) => {
    const parts = line.split("|");
    // Ensure we have at least 7 parts, fill missing ones with empty strings
    const [
      name = "",
      image = "",
      status = "",
      ports = "",
      state = "",
      command = "",
      containerId = "",
    ] = parts;

    let exitCode = null;
    let startedAt = null;
    let finishedAt = null;

    const inspectCmd = `docker inspect --format='${getContainerInspectFormat()}' ${containerId} 2>/dev/null || echo ""`;
    const inspectOutput = execSyncWrapper(inspectCmd).trim();

    const [exitCodeStr, startedAtStr, finishedAtStr] = inspectOutput.split("|");
    if (exitCodeStr && exitCodeStr !== "" && exitCodeStr !== "<no value>") {
      exitCode = parseInt(exitCodeStr, 10);
    }
    if (startedAtStr && startedAtStr !== "" && startedAtStr !== "<no value>") {
      startedAt = startedAtStr;
    }
    if (
      finishedAtStr &&
      finishedAtStr !== "" &&
      finishedAtStr !== "<no value>"
    ) {
      finishedAt = finishedAtStr;
    }

    return {
      processId: name || containerId,
      containerId: containerId,
      command: command || image,
      image: image,
      timestamp: new Date().toISOString(),
      status: status,
      state: state,
      ports: ports,
      exitCode: exitCode,
      startedAt: startedAt,
      finishedAt: finishedAt,
      isActive: isContainerActive(state),

      health: "unknown", // We could add health check status here
    };
  });

  return {
    processes: processes,
    total: processes.length,
    timestamp: new Date().toISOString(),
  };
};
