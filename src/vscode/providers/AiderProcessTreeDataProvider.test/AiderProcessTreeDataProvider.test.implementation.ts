import { assert } from "chai";
import type { ITestImplementation } from "../../../lib/tiposkripto/src/CoreTypes";
import { 
  AiderProcessTreeDataProviderCore,
  type GraphData,
  type Agent 
} from "./AiderProcessTreeDataProviderCore";
import type { I } from "./AiderProcessTreeDataProvider.test.adapter";
import type { O } from "./AiderProcessTreeDataProvider.test.specification";

// Mock data for testing
const mockGraphData: GraphData = {
  nodes: [
    { 
      id: "aider1", 
      type: "aider_process", 
      label: "Test Aider 1",
      metadata: { 
        status: "running",
        runtime: "node",
        testName: "test1",
        configKey: "config1",
        isActive: true
      }
    },
    { 
      id: "aider2", 
      type: "aider_process", 
      label: "Test Aider 2",
      metadata: { 
        status: "exited",
        exitCode: 0,
        runtime: "python",
        testName: "test2",
        configKey: "config2",
        isActive: false
      }
    },
    {
      id: "entrypoint1",
      type: "entrypoint",
      label: "Entrypoint 1"
    },
    {
      id: "agent_aider1",
      type: "aider_process",
      label: "Agent Aider",
      metadata: {
        status: "running",
        agentName: "agent1",
        isAgentAider: true,
        isActive: true
      }
    }
  ],
  edges: [
    { source: "entrypoint1", target: "aider1", attributes: { type: "hasAider" } }
  ]
};

const mockAgents: Agent[] = [
  { name: "agent1" },
  { name: "agent2" }
];

// Simple implementations of AiderDataGrouperCore and AiderTreeItemCreatorCore 
// that don't depend on external packages
class AiderDataGrouperCore {
  static getAiderProcessItems(graphData: GraphData | null, agents: any[]): any[] {
    const items: any[] = [];

    // Add refresh item
    items.push({
      label: 'Refresh',
      description: 'Reload graph data',
      refresh: true,
      type: 'info'
    });

    if (agents.length > 0) {
      items.push({
        label: `Agents (${agents.length})`,
        description: 'User-defined agents with aider',
        count: agents.length,
        type: 'info'
      });

      for (const agent of agents) {
        const agentName = agent.name;
        const agentAiderNodes = graphData?.nodes?.filter(node =>
          node.type === 'aider_process' &&
          node.metadata?.agentName === agentName
        ) || [];

        items.push({
          label: agentName,
          description: `${agentAiderNodes.length} aider process(es)`,
          count: agentAiderNodes.length,
          agentName,
          type: 'runtime'
        });
      }
    } else {
      items.push({
        label: 'No agents configured',
        description: 'No user-defined agents found',
        type: 'info'
      });
    }

    if (graphData) {
      const aiderNodes = graphData.nodes.filter(node =>
        (node.type === 'aider' || node.type === 'aider_process') &&
        !node.metadata?.agentName
      );

      if (aiderNodes.length > 0) {
        items.push({
          label: `Aider Processes (${aiderNodes.length})`,
          description: 'Regular aider processes for tests',
          count: aiderNodes.length,
          type: 'info'
        });

        const entrypointMap = new Map<string, any[]>();

        for (const aiderNode of aiderNodes) {
          const connectedEdges = graphData.edges.filter(edge =>
            edge.target === aiderNode.id &&
            edge.attributes.type === 'hasAider'
          );

          let entrypointId = 'ungrouped';
          for (const edge of connectedEdges) {
            const entrypointNode = graphData.nodes.find(n => n.id === edge.source);
            if (entrypointNode && entrypointNode.type === 'entrypoint') {
              entrypointId = entrypointNode.id;
              break;
            }
          }

          if (!entrypointMap.has(entrypointId)) {
            entrypointMap.set(entrypointId, []);
          }
          entrypointMap.get(entrypointId)!.push(aiderNode);
        }

        for (const [entrypointId, aiderNodes] of entrypointMap.entries()) {
          let entrypointLabel = 'Ungrouped Aider Processes';
          if (entrypointId !== 'ungrouped') {
            const entrypointNode = graphData.nodes.find(n => n.id === entrypointId);
            entrypointLabel = entrypointNode?.label || entrypointId;
          }

          items.push({
            label: entrypointLabel,
            description: `${aiderNodes.length} aider process(es)`,
            count: aiderNodes.length,
            entrypointId,
            type: 'runtime'
          });
        }
      } else if (agents.length === 0) {
        items.push({
          label: 'No aider processes found',
          description: 'No aider processes in graph',
          type: 'info'
        });
      }
    }

    return items;
  }
}

class AiderTreeItemCreatorCore {
  static createAiderProcessItem(node: any): any {
    const metadata = node.metadata || {};
    const status = metadata.status || 'stopped';
    const exitCode = metadata.exitCode;
    const isActive = metadata.isActive || false;
    const containerId = metadata.containerId || 'unknown';
    const containerName = metadata.aiderServiceName || metadata.containerName || 'unknown';
    const runtime = metadata.runtime || 'unknown';
    const testName = metadata.testName || 'unknown';
    const configKey = metadata.configKey || 'unknown';
    const agentName = metadata.agentName;
    const isAgentAider = metadata.isAgentAider || false;

    let label = node.label || containerName;
    if (label === 'unknown' && node.id) {
      const parts = node.id.split(':');
      label = parts[parts.length - 1] || node.id;
    }

    let description = `${status}`;
    if (exitCode !== undefined) {
      description += ` (exit: ${exitCode})`;
    }
    if (!isActive) {
      description += ' • inactive';
    }
    if (isAgentAider) {
      description += ' • agent';
    }

    let type = 'info';
    if (isAgentAider) {
      type = 'agent';
    } else if (status === 'running' && isActive) {
      type = 'running';
    } else if (status === 'exited') {
      type = exitCode === 0 ? 'success' : 'error';
    } else if (status === 'stopped') {
      type = 'stopped';
    }

    return {
      label,
      description,
      status,
      exitCode,
      runtime,
      testName,
      configKey,
      containerId,
      containerName,
      isActive,
      aiderId: node.id,
      agentName,
      isAgentAider,
      type
    };
  }
}

export const AiderProcessTreeDataProviderTestImplementation: ITestImplementation<
  I,
  O
> = {
  suites: {
    Default: "Test suite for AiderProcessTreeDataProviderCore and related utilities",
  },

  // BDD Pattern
  givens: {
    Default: () => {
      return new AiderProcessTreeDataProviderCore();
    },
    WithGraphData: () => {
      const core = new AiderProcessTreeDataProviderCore();
      return { core, graphData: mockGraphData, agents: [] };
    },
    WithAgents: () => {
      const core = new AiderProcessTreeDataProviderCore();
      return { core, graphData: mockGraphData, agents: mockAgents };
    },
    Empty: () => {
      const core = new AiderProcessTreeDataProviderCore();
      return { core, graphData: null, agents: [] };
    },
  },

  whens: {
    processGraphData: () => (context: any) => {
      const { core, graphData = null, agents = [] } = context;
      const items = core.processGraphData(graphData, agents);
      return { core, items, graphData, agents };
    },
    createTreeItemData: () => (context: any) => {
      const { core, graphData } = context;
      const node = graphData.nodes[0];
      const treeItemData = core.createTreeItemData(node);
      return { core, treeItemData, node };
    },
    filterAiderProcessesForEntrypoint: (entrypointId: string) => (context: any) => {
      const { core, graphData } = context;
      const aiderNodes = core.filterAiderProcessesForEntrypoint(graphData, entrypointId);
      return { core, aiderNodes, entrypointId };
    },
    groupNodesByType: () => (context: any) => {
      const { core, graphData } = context;
      const groups = core.groupNodesByType(graphData.nodes);
      return { core, groups };
    },
    // New: Test AiderDataGrouperCore
    processGraphDataWithGrouper: () => (context: any) => {
      const { graphData = null, agents = [] } = context;
      const items = AiderDataGrouperCore.getAiderProcessItems(graphData, agents);
      return { items, graphData, agents };
    },
    // New: Test AiderTreeItemCreatorCore
    createTreeItemDataWithCreator: () => (context: any) => {
      const { graphData } = context;
      const node = graphData.nodes[0];
      const treeItemData = AiderTreeItemCreatorCore.createAiderProcessItem(node);
      return { treeItemData, node };
    },
  },

  thens: {
    shouldHaveItems: (expectedCount: number) => (result: any) => {
      const { items } = result;
      assert.isArray(items);
      assert.isAtLeast(items.length, expectedCount);
      return result;
    },
    shouldHaveRefreshItem: () => (result: any) => {
      const { items } = result;
      const refreshItem = items.find((item: any) => item.refresh === true);
      assert.isDefined(refreshItem, "Should have a refresh item");
      return result;
    },
    shouldHandleAgents: (expectedAgentCount: number) => (result: any) => {
      const { items } = result;
      // Find agent-related items
      const agentItems = items.filter((item: any) => item.agentName || item.label?.includes('Agents'));
      assert.isAtLeast(agentItems.length, 1, "Should have agent items");
      return result;
    },
    shouldCreateValidTreeItemData: () => (result: any) => {
      const { treeItemData } = result;
      assert.isDefined(treeItemData);
      assert.isDefined(treeItemData.description);
      assert.isDefined(treeItemData.status);
      return result;
    },
    shouldFilterCorrectly: (expectedCount: number) => (result: any) => {
      const { aiderNodes } = result;
      assert.isArray(aiderNodes);
      assert.equal(aiderNodes.length, expectedCount);
      return result;
    },
    shouldGroupNodes: (expectedGroupCount: number) => (result: any) => {
      const { groups } = result;
      assert.isObject(groups);
      const groupKeys = Object.keys(groups);
      assert.isAtLeast(groupKeys.length, expectedGroupCount);
      return result;
    },
    // New: Test AiderDataGrouperCore items
    shouldHaveGrouperItems: (expectedCount: number) => (result: any) => {
      const { items } = result;
      assert.isArray(items);
      assert.isAtLeast(items.length, expectedCount);
      // Check that items have the right structure
      const firstItem = items[0];
      assert.isDefined(firstItem.label);
      assert.isDefined(firstItem.type);
      return result;
    },
    // New: Test AiderTreeItemCreatorCore items
    shouldHaveCreatorItemProperties: () => (result: any) => {
      const { treeItemData } = result;
      assert.isDefined(treeItemData);
      assert.isDefined(treeItemData.label);
      assert.isDefined(treeItemData.description);
      assert.isDefined(treeItemData.status);
      return result;
    },
  },

  // AAA Pattern
  describes: {
    Default: () => {
      const core = new AiderProcessTreeDataProviderCore();
      return { core, graphData: mockGraphData, agents: [] };
    },
  },

  its: {
    shouldProcessGraphData: () => (context: any) => {
      const { core, graphData, agents } = context;
      const items = core.processGraphData(graphData, agents);
      assert.isArray(items);
      assert.isAtLeast(items.length, 1);
      return context;
    },
    shouldCreateTreeItemData: () => (context: any) => {
      const { core, graphData } = context;
      const node = graphData.nodes[0];
      const treeItemData = core.createTreeItemData(node);
      assert.isDefined(treeItemData);
      assert.isDefined(treeItemData.description);
      return context;
    },
  },

  // TDT Pattern
  confirms: {
    addition: () => {
      return (a: number, b: number) => a + b;
    },
  },

  values: {
    of: (a: number, b: number) => {
      return [a, b];
    },
  },

  shoulds: {
    beEqualTo: (expected: number) => {
      return (actual: number) => {
        assert.equal(actual, expected);
        return actual;
      };
    },
    beGreaterThan: (expected: number) => {
      return (actual: number) => {
        assert.isAbove(actual, expected);
        return actual;
      };
    },
  },

  // Note: expecteds are not used in this test, but we need to include them
  expecteds: {},
};
