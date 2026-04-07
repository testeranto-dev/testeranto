import type { Ibdd_out, ITestSpecification } from "../../../lib/tiposkripto/src/CoreTypes";

export type O = Ibdd_out<
  // Givens
  {
    Default: [];
    WithGraphData: [];
    WithFeatureNodes: [];
    WithDependencyEdges: [];
    WithBlockEdges: [];
  },
  // Whens
  {
    generateFeatureTree: [];
    getAgentSlice: [string];
  },
  // Thens
  {
    shouldHaveTreeStructure: [];
    shouldHaveFeatureNodes: [number];
    shouldHaveDependencies: [number];
    shouldHaveBlocks: [number];
    shouldThrowForMissingAgent: [];
    shouldThrowForInvalidAgent: [];
  },
  // Describes
  {
    Default: [];
  },
  // Its
  {
    shouldGenerateFeatureTree: [];
    shouldHandleAgentSlices: [];
  },
  // Confirms
  {
    addition: [];
  },
  // Values
  {
    of: [number, number];
  },
  // Shoulds
  {
    beEqualTo: [number];
    beGreaterThan: [number];
  }
>;

export type I = any;

export const Server_GraphManagerCoreTestSpecification: ITestSpecification<
  I,
  O
> = (Given, When, Then, Describe, It, Confirm, Value, Should) => {
  return [
    // BDD Pattern tests for Server_GraphManagerCore
    Given.WithFeatureNodes(undefined)(
      [When.generateFeatureTree()],
      [Then.shouldHaveTreeStructure(), Then.shouldHaveFeatureNodes(2)],
      ["Test generating feature tree with feature nodes"],
    ),
    Given.WithDependencyEdges(undefined)(
      [When.generateFeatureTree()],
      [Then.shouldHaveDependencies(1)],
      ["Test feature tree with dependency edges"],
    ),
    Given.WithBlockEdges(undefined)(
      [When.generateFeatureTree()],
      [Then.shouldHaveBlocks(1)],
      ["Test feature tree with block edges"],
    ),
    Given.WithGraphData(undefined)(
      [When.getAgentSlice("agent1")],
      [Then.shouldThrowForMissingAgent()],
      ["Test agent slice with missing agent configuration"],
    ),
    Given.WithGraphData(undefined)(
      [When.getAgentSlice("invalidAgent")],
      [Then.shouldThrowForInvalidAgent()],
      ["Test agent slice with invalid agent function"],
    ),
    
    // AAA Pattern tests
    Describe.Default(undefined)(
      [It.shouldGenerateFeatureTree(), It.shouldHandleAgentSlices()],
      ["Test Describe-It pattern for Server_GraphManagerCore"],
    ),
    
    // TDT Pattern tests
    Confirm.addition(
      [
        [Value.of(1, 2), Should.beEqualTo(3)],
        [Value.of(4, 5), Should.beGreaterThan(8)],
      ],
      ["Test table-driven testing for addition"],
    ),
  ];
};
