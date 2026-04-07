import type { Ibdd_out, ITestSpecification } from "../../../lib/tiposkripto/src/CoreTypes";

export type O = Ibdd_out<
  // Givens
  {
    Default: [];
    WithGraphData: [];
    WithAgents: [];
    Empty: [];
  },
  // Whens
  {
    processGraphData: [];
    createTreeItemData: [];
    filterAiderProcessesForEntrypoint: [string];
    groupNodesByType: [];
    processGraphDataWithGrouper: [];
    createTreeItemDataWithCreator: [];
  },
  // Thens
  {
    shouldHaveItems: [number];
    shouldHaveRefreshItem: [];
    shouldHandleAgents: [number];
    shouldCreateValidTreeItemData: [];
    shouldFilterCorrectly: [number];
    shouldGroupNodes: [number];
    shouldHaveGrouperItems: [number];
    shouldHaveCreatorItemProperties: [];
  },
  // Describes
  {
    Default: [];
  },
  // Its
  {
    shouldProcessGraphData: [];
    shouldCreateTreeItemData: [];
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

export const AiderProcessTreeDataProviderTestSpecification: ITestSpecification<
  I,
  O
> = (Given, When, Then, Describe, It, Confirm, Value, Should) => {
  return [
    // BDD Pattern tests for AiderProcessTreeDataProviderCore
    Given.Default(undefined)(
      [When.processGraphData()],
      [Then.shouldHaveItems(1), Then.shouldHaveRefreshItem()],
      ["Test core processing of graph data"],
    ),
    Given.WithGraphData(undefined)(
      [When.processGraphData(), When.createTreeItemData()],
      [Then.shouldHaveItems(3), Then.shouldCreateValidTreeItemData()],
      ["Test with mock graph data"],
    ),
    Given.WithAgents(undefined)(
      [When.processGraphData()],
      [Then.shouldHandleAgents(2)],
      ["Test handling of agents"],
    ),
    Given.WithGraphData(undefined)(
      [When.filterAiderProcessesForEntrypoint("entrypoint1")],
      [Then.shouldFilterCorrectly(1)],
      ["Test filtering aider processes for entrypoint"],
    ),
    Given.WithGraphData(undefined)(
      [When.groupNodesByType()],
      [Then.shouldGroupNodes(2)],
      ["Test grouping nodes by type"],
    ),
    Given.Empty(undefined)(
      [When.processGraphData()],
      [Then.shouldHaveItems(2)],
      ["Test with empty data"],
    ),
    
    // BDD Pattern tests for AiderDataGrouperCore
    Given.WithGraphData(undefined)(
      [When.processGraphDataWithGrouper()],
      [Then.shouldHaveGrouperItems(1), Then.shouldHaveRefreshItem()],
      ["Test AiderDataGrouperCore processing"],
    ),
    Given.WithAgents(undefined)(
      [When.processGraphDataWithGrouper()],
      [Then.shouldHaveGrouperItems(3), Then.shouldHandleAgents(2)],
      ["Test AiderDataGrouperCore with agents"],
    ),
    
    // BDD Pattern tests for AiderTreeItemCreatorCore
    Given.WithGraphData(undefined)(
      [When.createTreeItemDataWithCreator()],
      [Then.shouldHaveCreatorItemProperties()],
      ["Test AiderTreeItemCreatorCore item creation"],
    ),
    
    // AAA Pattern tests
    Describe.Default(undefined)(
      [It.shouldProcessGraphData(), It.shouldCreateTreeItemData()],
      ["Test Describe-It pattern for AiderProcessTreeDataProviderCore"],
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
