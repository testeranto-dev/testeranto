import type { IRunTime, ITesterantoConfig } from "../../../Types";
import type { GraphManager } from "../../graph";
import { consoleError, consoleLog, execSyncWrapper, processCwd } from "../Server_Docker/Server_Docker_Dependents";

export async function launchAllAgentsUtil(
    configs: ITesterantoConfig,
    graphManager: GraphManager,
    addProcessNodeToGraph: (processType: 'aider', runtime: IRunTime, testName: string, configKey: string, configValue: any, checkIndex?: number, graphManager?: any, status?: 'running' | 'stopped' | 'failed') => Promise<void>
): Promise<void> {
    const agents = configs.agents;
    if (!agents || Object.keys(agents).length === 0) {
        consoleLog('[agentUtils] No agents configured');
        return;
    }

    consoleLog(`[agentUtils] Launching ${Object.keys(agents).length} agents at startup...`);

    // Wait a moment for services to fully start
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check if agent services are running and update graph with actual status
    const agentServiceNames = Object.keys(agents).map(agentName => `agent-${agentName}`);
    for (const serviceName of agentServiceNames) {
        try {
            const checkCmd = `docker compose -f "testeranto/docker-compose.yml" ps -q ${serviceName}`;
            const containerId = execSyncWrapper(checkCmd, { cwd: processCwd() }).trim();
            if (containerId) {
                const statusCmd = `docker inspect --format='{{.State.Status}}' ${containerId}`;
                const status = execSyncWrapper(statusCmd, { cwd: processCwd() }).trim();
                consoleLog(`[agentUtils] Agent service ${serviceName}: ${status} (container: ${containerId.substring(0, 12)})`);
                
                // Update the graph with actual container status
                // Extract agent name from service name (agent-{agentName})
                const agentName = serviceName.replace('agent-', '');
                const aiderProcessId = `aider_process:agent:${agentName}`;
                
                if (graphManager && typeof graphManager.applyUpdate === 'function') {
                    const graphData = graphManager.getGraphData();
                    const nodeExists = graphData.nodes.some((node: any) => node.id === aiderProcessId);
                    
                    if (nodeExists) {
                        const timestamp = new Date().toISOString();
                        const update = {
                            operations: [{
                                type: 'updateNode',
                                data: {
                                    id: aiderProcessId,
                                    metadata: {
                                        runtime: 'node',
                                        testName: agentName,
                                        configKey: 'agent',
                                        processType: 'aider',
                                        timestamp: timestamp,
                                        actualStatus: status,
                                        containerName: serviceName,
                                        containerId: containerId
                                    }
                                },
                                timestamp: timestamp
                            }],
                            timestamp: timestamp
                        };
                        graphManager.applyUpdate(update);
                        if (typeof graphManager.saveGraph === 'function') {
                            graphManager.saveGraph();
                        }
                        consoleLog(`[agentUtils] Updated graph for ${aiderProcessId} with status: ${status}`);
                    }
                }
            } else {
                consoleError(`[agentUtils] Agent service ${serviceName} not found`);
            }
        } catch (checkError: any) {
            consoleError(`[agentUtils] Error checking agent service ${serviceName}:`, checkError as string);
        }
    }

    // Add agent nodes to graph
    await createAgentNodesAndAiderProcessesUtil(configs, graphManager, addProcessNodeToGraph);
}

export async function createAgentNodesAndAiderProcessesUtil(
    configs: ITesterantoConfig,
    graphManager: GraphManager,
    addProcessNodeToGraph: (processType: 'aider', runtime: IRunTime, testName: string, configKey: string, configValue: any, checkIndex?: number, graphManager?: any, status?: 'running' | 'stopped' | 'failed') => Promise<void>
): Promise<void> {
    const agents = configs.agents || {};

    for (const [agentName, agentConfig] of Object.entries(agents)) {
        const containerName = `agent-${agentName}`;
        const agentNodeId = `agent:${agentName}`;
        const aiderProcessId = `aider_process:agent:${agentName}`;

        // Create agent node in graph
        await addProcessNodeToGraph(
            'aider',
            'node' as IRunTime, // Agents use node runtime
            agentName,
            'agent',
            agentConfig,
            undefined,
            graphManager,
            'running'
        );

        // Update the aider process node to include container information
        if (graphManager && typeof graphManager.applyUpdate === 'function') {
            // First, check if the node exists in the graph
            const graphData = graphManager.getGraphData();
            const nodeExists = graphData.nodes.some((node: any) => node.id === aiderProcessId);
            
            if (nodeExists) {
                const timestamp = new Date().toISOString();
                const update = {
                    operations: [{
                        type: 'updateNode',
                        data: {
                            id: aiderProcessId,
                            metadata: {
                                runtime: 'node',
                                testName: agentName,
                                configKey: 'agent',
                                processType: 'aider',
                                timestamp: timestamp,
                                actualStatus: 'running',
                                containerName: containerName,
                                containerId: containerName
                            }
                        },
                        timestamp: timestamp
                    }],
                    timestamp: timestamp
                };
                graphManager.applyUpdate(update);
                // Save the graph to persist the changes
                if (typeof graphManager.saveGraph === 'function') {
                    graphManager.saveGraph();
                }
                consoleLog(`[agentUtils] Updated aider process node ${aiderProcessId} with container info: ${containerName}`);
            } else {
                consoleLog(`[agentUtils] Aider process node ${aiderProcessId} not found in graph, cannot update with container info`);
            }
        }

        consoleLog(`[agentUtils] Created agent nodes for ${agentName}`);
    }
}
