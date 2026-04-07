import { assert } from "chai";
import type { ITestImplementation } from "../../../lib/tiposkripto/src/CoreTypes";
import { 
  Server_GraphManagerCore,
  type GraphData,
  type GraphNode,
  type GraphEdge
} from "./Server_GraphManagerCore";
import type { I } from "./Server_GraphManagerCore.test.adapter";
import type { O } from "./Server_GraphManagerCore.test.specification";

// Mock data for testing
const mockGraphDataWithFeatures: GraphData = {
  nodes: [
    { 
      id: "feature:feature1", 
      type: "feature",
      label: "Feature 1",
      status: "todo"
    },
    { 
      id: "feature:feature2", 
      type: "feature",
      label: "Feature 2",
      status: "inProgress"
    },
    {
      id: "entrypoint:test1",
      type: "entrypoint",
      label: "Test 1"
    }
  ],
  edges: []
};

const mockGraphDataWithDependencies: GraphData = {
  nodes: [
    { id: "feature:feature1", type: "feature" },
    { id: "feature:feature2", type: "feature" }
  ],
  edges: [
    { 
      source: "feature:feature1", 
      target: "feature:feature2", 
      attributes: { type: "dependsUpon" } 
    }
  ]
};

const mockGraphDataWithBlocks: GraphData = {
  nodes: [
    { id: "feature:feature1", type: "feature" },
    { id: "feature:feature2", type: "feature" }
  ],
  edges: [
    { 
      source: "feature:feature1", 
      target: "feature:feature2", 
      attributes: { type: "blocks" } 
    }
  ]
};

const mockAgents = {
  agent1: {
    markdownFile: "agent1.md",
    sliceFunction: () => ({ nodes: [], edges: [] })
  }
};

export const Server_GraphManagerCoreTestImplementation: ITestImplementation<
  I,
  O
> = {
  suites: {
    Default: "Test suite for Server_GraphManagerCore",
  },

  // BDD Pattern
  givens: {
    Default: () => {
      return new Server_GraphManagerCore();
    },
    WithGraphData: () => {
      const core = new Server_GraphManagerCore();
      return { core, graphData: mockGraphDataWithFeatures, agents: {} };
    },
    WithFeatureNodes: () => {
      const core = new Server_GraphManagerCore();
      return { core, graphData: mockGraphDataWithFeatures, agents: {} };
    },
    WithDependencyEdges: () => {
      const core = new Server_GraphManagerCore();
      return { core, graphData: mockGraphDataWithDependencies, agents: {} };
    },
    WithBlockEdges: () => {
      const core = new Server_GraphManagerCore();
      return { core, graphData: mockGraphDataWithBlocks, agents: {} };
    },
  },

  whens: {
    generateFeatureTree: () => (context: any) => {
      const { core, graphData } = context;
      const tree = core.generateFeatureTree(graphData);
      return { core, tree, graphData };
    },
    getAgentSlice: (agentName: string) => (context: any) => {
      const { core, graphData, agents } = context;
      try {
        const slice = core.getAgentSlice(graphData, agents, agentName);
        return { core, slice, agentName, error: null };
      } catch (error) {
        return { core, slice: null, agentName, error };
      }
    },
  },

  thens: {
    shouldHaveTreeStructure: () => (result: any) => {
      const { tree } = result;
      assert.isObject(tree);
      assert.isDefined(tree["feature:feature1"]);
      assert.isDefined(tree["feature:feature2"]);
      return result;
    },
    shouldHaveFeatureNodes: (expectedCount: number) => (result: any) => {
      const { tree } = result;
      const featureKeys = Object.keys(tree).filter(key => key.startsWith("feature:"));
      assert.equal(featureKeys.length, expectedCount);
      return result;
    },
    shouldHaveDependencies: (expectedCount: number) => (result: any) => {
      const { tree } = result;
      const feature1 = tree["feature:feature1"];
      const feature2 = tree["feature:feature2"];
      assert.isArray(feature1.parents);
      assert.isArray(feature2.children);
      // feature1 depends on feature2, so feature1 should have feature2 as parent
      // and feature2 should have feature1 as child
      assert.include(feature1.parents, "feature:feature2");
      assert.include(feature2.children, "feature:feature1");
      return result;
    },
    shouldHaveBlocks: (expectedCount: number) => (result: any) => {
      const { tree } = result;
      const feature1 = tree["feature:feature1"];
      const feature2 = tree["feature:feature2"];
      // feature1 blocks feature2, so feature1 should have feature2 as child
      // and feature2 should have feature1 as parent
      assert.include(feature1.children, "feature:feature2");
      assert.include(feature2.parents, "feature:feature1");
      return result;
    },
    shouldThrowForMissingAgent: () => (result: any) => {
      const { error } = result;
      assert.isDefined(error);
      assert.include(error.message, "No agents configured");
      return result;
    },
    shouldThrowForInvalidAgent: () => (result: any) => {
      const { error } = result;
      assert.isDefined(error);
      assert.include(error.message, "not found in configuration");
      return result;
    },
  },

  // AAA Pattern
  describes: {
    Default: () => {
      const core = new Server_GraphManagerCore();
      return { core, graphData: mockGraphDataWithFeatures, agents: {} };
    },
  },

  its: {
    shouldGenerateFeatureTree: () => (context: any) => {
      const { core, graphData } = context;
      const tree = core.generateFeatureTree(graphData);
      assert.isObject(tree);
      return context;
    },
    shouldHandleAgentSlices: () => (context: any) => {
      const { core, graphData, agents } = context;
      // Test with empty agents
      try {
        core.getAgentSlice(graphData, agents, "agent1");
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "No agents configured");
      }
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

  expecteds: {},
};
