import { execSync } from "child_process";
import { existsSync } from "fs";
import type { ITesterantoConfig } from "../../../../src/server/Types";
import { checkBundlesReady } from "./checkBundlesReady";
import { processCwd } from "../Server_Docker_Dependents";

export async function waitForBundlesPure({
  configs,
  // processCwd,
  failedBuilderConfigs,
  consoleLog,
  consoleWarn,
  maxWaitTime = 30000,
  checkInterval = 500,
}: {
  configs: ITesterantoConfig;
  // processCwd: () => string;
  failedBuilderConfigs: Set<string>;
  consoleLog: (message: string) => void;
  consoleWarn: (message: string) => void;
  maxWaitTime?: number;
  checkInterval?: number;
}): Promise<Set<string>> {
  consoleLog('[Server_Docker] Waiting for bundles to be ready...');
  const startTime = Date.now();
  let bundlesReady = false;
  let lastProgressReport = 0;

  // Create a new Set to avoid mutating the input parameter
  const updatedFailedBuilderConfigs = new Set(failedBuilderConfigs);

  while (Date.now() - startTime < maxWaitTime && !bundlesReady) {
    bundlesReady = checkBundlesReady(configs, processCwd(), updatedFailedBuilderConfigs);

    if (bundlesReady) {
      consoleLog('[Server_Docker] ✅ All bundles are ready');
      break;
    }

    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    if (elapsed % 3 === 0 && elapsed !== lastProgressReport) {
      consoleLog(`[Server_Docker] Still waiting for bundles... (${elapsed}s elapsed)`);
      lastProgressReport = elapsed;

      try {
        const psCmd = 'docker compose -f "testeranto/docker-compose.yml" ps --format json';
        const psOutput = execSync(psCmd, { cwd: processCwd() }).toString();
        const containers = JSON.parse(psOutput);

        const builderContainers = containers.filter((c: any) =>
          c.Service.includes('builder') || c.Service.includes('build')
        );

        if (builderContainers.length > 0) {
          consoleLog(`[Server_Docker] Builder containers status:`);
          builderContainers.forEach((c: any) => {
            consoleLog(`  - ${c.Service}: ${c.State} (${c.Status})`);
          });
        }
      } catch (error) {
        // Ignore errors in status check
      }
    }

    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  if (!bundlesReady) {
    consoleWarn('[Server_Docker] ⚠️ Bundles not ready after waiting, proceeding anyway...');
    for (const [configKey] of Object.entries(configs.runtimes)) {
      if (updatedFailedBuilderConfigs.has(configKey)) {
        continue;
      }

      const bundleDir = `${processCwd()}/testeranto/bundles/${configKey}`;
      const inputFilesPath = `${bundleDir}/inputFiles.json`;

      if (!existsSync(inputFilesPath)) {
        consoleWarn(`[Server_Docker] ❌ Bundle missing for config ${configKey}`);
        updatedFailedBuilderConfigs.add(configKey);
      }
    }
  }

  return updatedFailedBuilderConfigs;
}
