import { getRuntimeLabel } from "../Server_Docker_Constants";
import { join, writeFileSync } from "../Server_Docker_Dependents";

export const writeConfigForExtensionPure = (
  configs: any,
  mode: string,
  processSummary: any,
  cwd: string,
): void => {
  const configDir = join(cwd, "testeranto");
  const configPath = join(configDir, "extension-config.json");

  const runtimesArray: Array<{
    key: string;
    runtime: string;
    label: string;
    tests: string[];
  }> = [];

  for (const [key, value] of Object.entries(configs.runtimes)) {
    const runtimeObj = value as any;
    if (runtimeObj && typeof runtimeObj === "object") {
      const runtime = runtimeObj.runtime;
      const tests = runtimeObj.tests || [];

      if (runtime) {
        runtimesArray.push({
          key,
          runtime: runtime,
          label: getRuntimeLabel(runtime),
          tests: Array.isArray(tests) ? tests : [],
        });
      } else {
        throw `[Server_Docker] No runtime property found for key: ${key}`;
      }
    } else {
      throw `[Server_Docker] Invalid runtime configuration for key: ${key}, value type: ${typeof value}`;
    }
  }

  const configData = {
    runtimes: runtimesArray,
    timestamp: new Date().toISOString(),
    source: "testeranto.ts",
    serverStarted: true,
    processes: processSummary.processes || [],
    totalProcesses: processSummary.total || 0,
    lastUpdated: new Date().toISOString(),
  };

  const configJson = JSON.stringify(configData, null, 2);
  writeFileSync(configPath, configJson);
};
