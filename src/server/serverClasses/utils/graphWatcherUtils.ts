import type { GraphManager } from "../../graph";
import type { IRunTime } from "../../../Types";

export function startGraphWatcherUtil(
  graphManager: GraphManager,
  configs: any,
  launchBddTest: (runtime: IRunTime, testName: string, configKey: string, configValue: any) => Promise<void>,
  launchChecks: (runtime: IRunTime, testName: string, configKey: string, configValue: any) => Promise<void>,
  launchAider: (runtime: IRunTime, testName: string, configKey: string, configValue: any) => Promise<void>,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): NodeJS.Timeout {
  consoleLog('[GraphWatcher] Starting graph watcher');
  
  return setInterval(async () => {
    try {
      const graphData = graphManager.getGraphData();
      const entrypointNodes = graphData.nodes.filter((n: any) => n.type === 'entrypoint');
      consoleLog(`[GraphWatcher] Checking ${entrypointNodes.length} entrypoint nodes`);
      
      for (const node of entrypointNodes) {
        const metadata = node.metadata || {};
        const needsServiceStart = metadata.needsServiceStart;
        
        if (needsServiceStart && Array.isArray(needsServiceStart) && needsServiceStart.length > 0) {
          const testName = node.id.replace('entrypoint:', '');
          const configKey = metadata.configKey;
          const runtime = metadata.runtime;
          
          consoleLog(`[GraphWatcher] ${testName} needs ${needsServiceStart.join(', ')} services started`);
          
          // Clear the flags
          await graphManager.applyUpdate({
            operations: [{
              type: 'updateNode',
              data: {
                id: node.id,
                metadata: {
                  ...metadata,
                  needsServiceStart: [],
                  serviceStartAttempted: new Date().toISOString()
                }
              },
              timestamp: new Date().toISOString()
            }],
            timestamp: new Date().toISOString()
          });
          
          // Start each needed service
          for (const serviceType of needsServiceStart) {
            try {
              const configValue = configs.runtimes[configKey];
              if (serviceType === 'bdd') {
                await launchBddTest(runtime, testName, configKey, configValue);
              } else if (serviceType === 'checks') {
                await launchChecks(runtime, testName, configKey, configValue);
              } else if (serviceType === 'aider') {
                await launchAider(runtime, testName, configKey, configValue);
              }
            } catch (error) {
              consoleError(`[GraphWatcher] Failed to start ${serviceType} service for ${testName}:`, error);
            }
          }
        }
      }
    } catch (error) {
      consoleError('[GraphWatcher] Error in graph watcher:', error);
    }
  }, 2000);
}
