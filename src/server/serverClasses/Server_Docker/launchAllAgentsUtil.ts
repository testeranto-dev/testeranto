import type { IRunTime, ITesterantoConfig } from "../../../Types";
import { consoleError, consoleLog, execSyncWrapper, processCwd } from "./Server_Docker_Dependents";

export async function launchAllAgentsUtil(
    configs: ITesterantoConfig,
    addProcessNodeToGraph: (processType: 'aider', runtime: IRunTime, testName: string, configKey: string, configValue: any, checkIndex?: number, status?: 'running' | 'stopped' | 'failed') => Promise<void>,
    updateProcessNodeWithContainerInfo?: (processId: string, containerId: string, serviceName: string, status: string) => Promise<void>
): Promise<void> {
    const agents = configs.agents;
    if (!agents || Object.keys(agents).length === 0) {
        consoleLog('[agentUtils] No agents configured');
        return;
    }

    consoleLog(`[agentUtils] Launching ${Object.keys(agents).length} agents at startup...`);

    // Add agent process nodes to graph first
    for (const [agentName, agentConfig] of Object.entries(agents)) {
        await addProcessNodeToGraph(
            'aider',
            'node' as IRunTime,
            agentName,
            'agent',
            agentConfig,
            undefined,
            'todo' // Set to 'todo' initially, will update when container starts
        );
    }

    // Wait for Docker Compose to start agent services with retries
    consoleLog(`[agentUtils] Waiting for agent services to start...`);
    const maxRetries = 10;
    const retryDelay = 2000; // 2 seconds
    
    const agentServiceNames = Object.keys(agents).map(agentName => `agent-${agentName}`);
    
    for (let retry = 0; retry < maxRetries; retry++) {
        consoleLog(`[agentUtils] Attempt ${retry + 1}/${maxRetries} to check agent services...`);
        
        let allFound = true;
        const foundContainers: Array<{serviceName: string, containerId: string}> = [];
        
        for (const serviceName of agentServiceNames) {
            try {
                const checkCmd = `docker compose -f "testeranto/docker-compose.yml" ps -q ${serviceName}`;
                const containerId = execSyncWrapper(checkCmd, { cwd: processCwd() }).trim();
                if (containerId) {
                    foundContainers.push({serviceName, containerId});
                } else {
                    allFound = false;
                    consoleLog(`[agentUtils] Agent service ${serviceName} not found yet`);
                }
            } catch (checkError: any) {
                allFound = false;
                consoleLog(`[agentUtils] Error checking agent service ${serviceName}: ${checkError.message}`);
            }
        }
        
        if (allFound && foundContainers.length === agentServiceNames.length) {
            consoleLog(`[agentUtils] All agent services found, updating graph...`);
            
            // Update graph with container info for all found containers
            for (const {serviceName, containerId} of foundContainers) {
                try {
                    const statusCmd = `docker inspect --format='{{.State.Status}}' ${containerId}`;
                    const status = execSyncWrapper(statusCmd, { cwd: processCwd() }).trim();
                    consoleLog(`[agentUtils] Agent service ${serviceName}: ${status} (container: ${containerId.substring(0, 12)})`);
                    
                    // Extract agent name from service name
                    const agentName = serviceName.replace('agent-', '');
                    const processId = `aider_process:agent:${agentName}`;
                    
                    // Update the process node with container info if callback is provided
                    if (updateProcessNodeWithContainerInfo) {
                        await updateProcessNodeWithContainerInfo(processId, containerId, serviceName, status);
                        consoleLog(`[agentUtils] Updated process node ${processId} with container info`);
                    } else {
                        consoleLog(`[agentUtils] No update callback provided for agent ${agentName}`);
                    }
                } catch (error: any) {
                    consoleError(`[agentUtils] Error updating container info for ${serviceName}:`, error.message);
                }
            }
            
            consoleLog(`[agentUtils] All agent containers checked and graph updated`);
            return;
        }
        
        if (retry < maxRetries - 1) {
            consoleLog(`[agentUtils] Waiting ${retryDelay}ms before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
    
    consoleError(`[agentUtils] Failed to find all agent containers after ${maxRetries} attempts`);
}

/**
 * This function has been simplified and integrated into launchAllAgentsUtil
 * to follow the principle that Server_Graph should call utility functions,
 * not the other way around.
 */
