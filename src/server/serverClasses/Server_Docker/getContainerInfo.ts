import { execSync } from "child_process";
import { processCwd, consoleError } from "./Server_Docker_Dependents";

export const getContainerInfo = (serviceName: string) => {
  try {

    const cmd = `docker compose -f "${processCwd()}/testeranto/docker-compose.yml" ps ${serviceName} --format json`;
    const output = execSync(cmd, { cwd: processCwd() }).toString();
    const containers = JSON.parse(output);
    if (containers && containers.length > 0) {
      return containers[0];
    }
  } catch (error) {
    consoleError(`[Server_Docker] Error getting container info for ${serviceName}:`, error as string);
  }
  return null;

}