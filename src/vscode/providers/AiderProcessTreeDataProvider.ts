// import * as vscode from 'vscode';
// import { TestTreeItem } from '../TestTreeItem';
// import { TreeItemType } from '../types';
// import { BaseTreeDataProvider } from './BaseTreeDataProvider';
// import { getApiUrl, getApiPath, wsApi, GetAiderResponse } from '../../api';

// export class AiderProcessTreeDataProvider extends BaseTreeDataProvider {
//   private graphData: GetAiderResponse | null = null;
//   private configuredAgents: any[] = [];

//   constructor() {
//     super();
//     console.log('[AiderProcessTreeDataProvider] Constructor called');
//     setTimeout(() => {
//       this.loadGraphData().then(() => {
//         this._onDidChangeTreeData.fire();
//       }).catch(error => {
//         console.error('[AiderProcessTreeDataProvider] Initial load failed:', error);
//         this._onDidChangeTreeData.fire();
//       });
//     }, 100);
//   }

//   private async loadGraphData(): Promise<void> {
//     try {
//       console.log('[AiderProcessTreeDataProvider] Loading graph data from aider API endpoint');
//       await this.fetchAiderProcessesDirectly();
//       await this.fetchConfiguredAgents();
//     } catch (error) {
//       console.error('[AiderProcessTreeDataProvider] Error loading graph data from API:', error);
//       this.graphData = null;
//       this.configuredAgents = [];
//       console.error(`[AiderProcessTreeDataProvider] Error details: ${error instanceof Error ? error.message : String(error)}`);
//       console.error(`[AiderProcessTreeDataProvider] Make sure server is running on http://localhost:3000`);
//     }
//   }

//   private async fetchConfiguredAgents(): Promise<void> {
//     try {
//       const agentsUrl = getApiUrl('getAllAgents');
//       const response = await fetch(agentsUrl, {
//         method: 'GET',
//         headers: { 'Accept': 'application/json' },
//       });
//       if (response.ok) {
//         const data = await response.json();
//         const agents = data.agents || [];
//         this.configuredAgents = agents.map((agent: any) => ({
//           agentName: agent.name || agent.key || 'unknown',
//           config: agent.config || {},
//         }));
//         console.log(`[AiderProcessTreeDataProvider] Loaded ${this.configuredAgents.length} configured agents`);
//       } else {
//         console.warn(`[AiderProcessTreeDataProvider] Failed to fetch agents: ${response.status}`);
//       }
//     } catch (error) {
//       console.error('[AiderProcessTreeDataProvider] Error fetching configured agents:', error);
//     }
//   }

//   private async fetchAiderProcessesDirectly(): Promise<void> {
//     try {
//       const aiderUrl = getApiUrl('getAider');
//       const response = await fetch(aiderUrl, {
//         method: 'GET'
//       });
//       if (response.ok) {
//         const data: GetAiderResponse = await response.json();
//         console.log('[AiderProcessTreeDataProvider] Raw aider data:', JSON.stringify(data, null, 2));
        
//         if (!data || typeof data !== 'object' || !Array.isArray(data.nodes)) {
//           console.warn('[AiderProcessTreeDataProvider] Invalid response format, missing nodes array');
//           this.graphData = { nodes: [], edges: [] };
//           return;
//         }
        
//         this.graphData = { nodes: [], edges: [] };
        
//         const aiderProcessNodes = data.nodes.filter((node: any) => 
//           node.type === 'aider_process'
//         );
        
//         aiderProcessNodes.forEach((node: any) => {
//           this.graphData!.nodes.push({
//             id: node.id,
//             type: node.type,
//             label: node.label,
//             metadata: node.metadata
//           });
//         });
        
//         console.log(`[AiderProcessTreeDataProvider] Successfully fetched ${aiderProcessNodes.length} aider processes`);
        
//         if (aiderProcessNodes.length === 0) {
//           console.log('[AiderProcessTreeDataProvider] No aider processes found in /~/aider endpoint');
//         }
//         return;
//       } else {
//         console.warn(`[AiderProcessTreeDataProvider] Failed to fetch from ${aiderUrl}:`, response.status);
//       }
//     } catch (error) {
//       console.error(`[AiderProcessTreeDataProvider] Error fetching from getAider API:`, error);
//     }
//   }

//   refresh(): void {
//     console.log('[AiderProcessTreeDataProvider] Manual refresh triggered');
//     this.graphData = null;
//     this.configuredAgents = [];
//     this._onDidChangeTreeData.fire();
    
//     this.loadGraphData()
//       .then(() => {
//         this._onDidChangeTreeData.fire();
//       })
//       .catch(error => {
//         console.error('[AiderProcessTreeDataProvider] Error in refresh:', error);
//         this._onDidChangeTreeData.fire();
//       });
//   }

//   getTreeItem(element: TestTreeItem): vscode.TreeItem {
//     return element;
//   }

//   async getChildren(element?: TestTreeItem): Promise<TestTreeItem[]> {
//     if (!this.graphData) {
//       this.loadGraphData();
//     }

//     if (!element) {
//       return this.getRootItems();
//     }

//     const elementData = element.data || {};

//     // If the element is a configured agent, show its running instances + launch action
//     if (elementData.agentName && elementData.isConfiguredAgent) {
//       return this.getAgentChildren(elementData.agentName);
//     }

//     return [];
//   }

//   private getRootItems(): TestTreeItem[] {
//     const items: TestTreeItem[] = [];
    
//     // Refresh item
//     items.push(
//       new TestTreeItem(
//         'Refresh',
//         TreeItemType.Action,
//         vscode.TreeItemCollapsibleState.None,
//         { 
//           action: 'refresh',
//           info: 'Refresh the view to try loading data again.'
//         },
//         {
//           command: 'testeranto.refreshAiderProcesses',
//           title: 'Refresh',
//           arguments: []
//         },
//         new vscode.ThemeIcon('refresh')
//       )
//     );
    
//     // Launch Agent item (top-level)
//     items.push(
//       new TestTreeItem(
//         'Launch Agent',
//         TreeItemType.Action,
//         vscode.TreeItemCollapsibleState.None,
//         { 
//           action: 'launchAgent',
//           info: 'Launch a new agent using the unified spawn endpoint.'
//         },
//         {
//           command: 'testeranto.launchAgent',
//           title: 'Launch Agent',
//           arguments: []
//         },
//         new vscode.ThemeIcon('add')
//       )
//     );
    
//     // Check if we have graph data
//     if (!this.graphData) {
//       items.push(
//         new TestTreeItem(
//           'Cannot connect to server',
//           TreeItemType.Info,
//           vscode.TreeItemCollapsibleState.None,
//           { 
//             info: 'Testeranto server is not running on port 3000.',
//             startServer: true
//           },
//           {
//             command: 'testeranto.startServer',
//             title: 'Start Server',
//             arguments: []
//           },
//           new vscode.ThemeIcon('warning')
//         )
//       );
//       return items;
//     }
    
//     // Show configured agents as collapsible items
//     if (this.configuredAgents.length === 0) {
//       items.push(
//         new TestTreeItem(
//           'No configured agents',
//           TreeItemType.Info,
//           vscode.TreeItemCollapsibleState.None,
//           { 
//             info: 'No agents are configured. Add agent profiles to testeranto config.'
//           },
//           undefined,
//           new vscode.ThemeIcon('info')
//         )
//       );
//       return items;
//     }
    
//     for (const agent of this.configuredAgents) {
//       const agentName = agent.agentName;
//       const loadCount = agent.config?.load?.length || 0;
      
//       const item = new TestTreeItem(
//         agentName,
//         TreeItemType.Info,
//         vscode.TreeItemCollapsibleState.Collapsed,
//         {
//           description: `${loadCount} load file(s)`,
//           agentName: agentName,
//           isConfiguredAgent: true,
//           action: 'launchAgent'
//         },
//         {
//           command: 'testeranto.launchAgent',
//           title: 'Launch Agent',
//           arguments: [agentName]
//         },
//         new vscode.ThemeIcon('person'),
//         'agentItem'
//       );
      
//       let tooltip = `Agent: ${agentName}\n`;
//       tooltip += `Load files: ${loadCount}\n`;
//       if (agent.config?.message) {
//         const msgPreview = agent.config.message.substring(0, 100) + (agent.config.message.length > 100 ? '...' : '');
//         tooltip += `Message: ${msgPreview}\n`;
//       }
//       item.tooltip = tooltip;
      
//       items.push(item);
//     }
    
//     return items;
//   }

//   private getAgentChildren(agentName: string): TestTreeItem[] {
//     const children: TestTreeItem[] = [];
    
//     // Launch action for this specific agent
//     children.push(
//       new TestTreeItem(
//         'Launch Agent',
//         TreeItemType.Action,
//         vscode.TreeItemCollapsibleState.None,
//         {
//           agentName: agentName,
//           action: 'launchAgent',
//           description: 'Click to launch this agent as a Docker container'
//         },
//         {
//           command: 'testeranto.launchAgent',
//           title: 'Launch Agent',
//           arguments: [agentName]
//         },
//         new vscode.ThemeIcon('play'),
//         'agentLaunchItem'
//       )
//     );
    
//     // Find running instances (aider_process nodes) for this agent
//     const runningInstances = (this.graphData?.nodes || []).filter((node: any) => {
//       const metadata = node.metadata || {};
//       return node.type === 'aider_process' && 
//              (metadata.agentName === agentName || node.label === agentName);
//     });
    
//     if (runningInstances.length === 0) {
//       children.push(
//         new TestTreeItem(
//           'No running instances',
//           TreeItemType.Info,
//           vscode.TreeItemCollapsibleState.None,
//           { info: `No running instances of ${agentName}` },
//           undefined,
//           new vscode.ThemeIcon('info')
//         )
//       );
//       return children;
//     }
    
//     for (const node of runningInstances) {
//       const metadata = node.metadata || {};
//       const containerName = metadata.containerName || '';
//       const label = node.label || agentName;
//       const status = node.status || 'running';
      
//       let icon: vscode.ThemeIcon;
//       if (status === 'running') {
//         icon = new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('testing.iconPassed'));
//       } else if (status === 'stopped') {
//         icon = new vscode.ThemeIcon('circle-slash', new vscode.ThemeColor('testing.iconUnset'));
//       } else {
//         icon = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('testing.iconUnset'));
//       }
      
//       const item = new TestTreeItem(
//         label,
//         TreeItemType.Info,
//         vscode.TreeItemCollapsibleState.None,
//         {
//           description: `Container: ${containerName}`,
//           status,
//           containerName,
//           agentName,
//           metadata,
//           isAiderProcess: true,
//           nodeId: node.id
//         },
//         {
//           command: 'testeranto.openAiderTerminal',
//           title: 'Open Aider Terminal',
//           arguments: [containerName, label, agentName]
//         },
//         icon
//       );
      
//       let tooltip = `Agent: ${agentName}\n`;
//       tooltip += `ID: ${node.id}\n`;
//       tooltip += `Container: ${containerName}\n`;
//       tooltip += `Status: ${status}\n`;
//       if (metadata.containerId) {
//         tooltip += `Container ID: ${metadata.containerId}\n`;
//       }
//       if (metadata.timestamp) {
//         tooltip += `Created: ${metadata.timestamp}\n`;
//       }
//       item.tooltip = tooltip;
      
//       children.push(item);
//     }
    
//     return children;
//   }

//   protected handleWebSocketMessage(message: any): void {
//     super.handleWebSocketMessage(message);
//     console.log(`[AiderProcessTreeDataProvider] Received message type: ${message.type}, url: ${message.url}`);

//     if (message.type === 'resourceChanged') {
//       const aiderPath = getApiPath('getAider');
//       const userAgentsPath = getApiPath('getUserAgents');
//       const isAgentRelated = message.url && (
//         message.url === userAgentsPath ||
//         message.url.startsWith('/~/agents/') ||
//         message.url === '/~/agents'
//       );
      
//       if (message.url === aiderPath || 
//           isAgentRelated || 
//           message.url === '/~/graph') {
//         console.log('[AiderProcessTreeDataProvider] Relevant update, refreshing');
//         this.refresh();
//       }

//       if (message.url === '/~/agents/spawn' && message.agentName && message.containerName) {
//         console.log(`[AiderProcessTreeDataProvider] Agent spawned: ${message.agentName}, skipping terminal open (already handled by extension)`);
//       }
//     } else if (message.type === 'graphUpdated') {
//       console.log('[AiderProcessTreeDataProvider] Graph updated, refreshing');
//       this.refresh();
//     }
//   }

//   protected subscribeToGraphUpdates(): void {
//     super.subscribeToGraphUpdates();
//     this.subscribeToSlice(wsApi.slices.aider);
//     this.subscribeToSlice(wsApi.slices.agents);
//     this.subscribeToSlice(wsApi.slices.graph);
//   }
// }
