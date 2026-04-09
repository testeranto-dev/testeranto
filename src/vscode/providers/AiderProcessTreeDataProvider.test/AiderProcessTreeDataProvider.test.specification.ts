import type { Ibdd_out, ITestSpecification } from "../../../lib/tiposkripto/src/CoreTypes";

export type O = Ibdd_out<
  // Givens
  {
    Default: [];
    WithGraphData: [];
    WithAgents: [];
    WithGraphDataAndAgents: [];
    Empty: [];
    WithMalformedData: [];
    WithLargeDataSet: [];
    WithMixedStatusProcesses: [];
    WithDuplicateEntrypoints: [];
    WithProcessesHavingNoStatus: [];
    WithProcessesHavingInvalidExitCodes: [];
    WithSpecialCharactersInLabels: [];
    WithVeryLongLabels: [];
    WithConcurrentProcesses: [];
    WithStoppedProcesses: [];
    WithProcessesHavingMissingProperties: [];
    WithGraphDataHavingCycles: [];
    WithInconsistentNodeTypes: [];
    WithProcessesHavingFutureTimestamps: [];
    WithProcessesHavingPastTimestamps: [];
  },
  // Whens
  {
    processGraphData: [];
    createTreeItemData: [];
    filterAiderProcessesForEntrypoint: [string];
    groupNodesByType: [];
    processGraphDataWithGrouper: [];
    createTreeItemDataWithCreator: [];
    createTreeItemDataForNode: [string];
    processGraphDataWithInvalidInput: [];
    filterWithEmptyEntrypoint: [];
    filterWithSpecialCharactersEntrypoint: [];
    groupWithEmptyNodeList: [];
    createTreeItemForNonExistentNode: [];
    processGraphDataWithPerformanceCheck: [];
    validateTreeItemDataConsistency: [];
    handleConcurrentDataUpdates: [];
    refreshTreeView: [];
    expandTreeItem: [string];
    collapseTreeItem: [string];
    selectTreeItem: [string];
    updateProcessStatus: [string, string];
    addNewProcess: [string, string];
    removeProcess: [string];
    updateProcessExitCode: [string, number];
    filterByStatus: [string];
    sortByRuntime: [];
    groupByContainer: [];
    searchProcesses: [string];
    clearFilters: [];
    exportTreeData: [];
    importTreeData: [string];
    toggleAutoRefresh: [];
    setRefreshInterval: [number];
    batchUpdateProcesses: [string[]];
    simulateProcessTermination: [string];
    simulateProcessStart: [string];
    navigateToProcessDetails: [string];
    copyProcessInfo: [string];
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
    shouldHaveValidTreeItemDataWithExitCode: [number];
    shouldThrowForMalformedData: [];
    shouldHandleLargeDataSetWithinTimeLimit: [];
    shouldProcessMixedStatusesCorrectly: [];
    shouldHandleDuplicateEntrypoints: [];
    shouldHandleProcessesWithNoStatus: [];
    shouldHandleInvalidExitCodes: [];
    shouldHandleSpecialCharactersInLabels: [];
    shouldHandleVeryLongLabels: [];
    shouldHandleConcurrentProcesses: [];
    shouldHandleStoppedProcesses: [];
    shouldHandleMissingProperties: [];
    shouldDetectGraphCycles: [];
    shouldHandleInconsistentNodeTypes: [];
    shouldHandleFutureTimestamps: [];
    shouldHandlePastTimestamps: [];
    shouldThrowForEmptyEntrypoint: [];
    shouldHandleSpecialCharactersInEntrypoint: [];
    shouldHandleEmptyNodeList: [];
    shouldThrowForNonExistentNode: [];
    shouldMeetPerformanceRequirements: [];
    shouldMaintainDataConsistency: [];
    shouldHandleConcurrentUpdates: [];
    shouldRefreshTreeView: [];
    shouldExpandTreeItem: [string];
    shouldCollapseTreeItem: [string];
    shouldSelectTreeItem: [string];
    shouldUpdateProcessStatus: [string];
    shouldAddNewProcess: [string];
    shouldRemoveProcess: [];
    shouldUpdateProcessExitCode: [string, number];
    shouldFilterByStatus: [number];
    shouldSortByRuntime: [];
    shouldGroupByContainer: [number];
    shouldSearchProcesses: [number];
    shouldClearFilters: [];
    shouldExportTreeData: [];
    shouldImportTreeData: [number];
    shouldToggleAutoRefresh: [];
    shouldSetRefreshInterval: [number];
    shouldBatchUpdateProcesses: [number];
    shouldSimulateProcessTermination: [string];
    shouldSimulateProcessStart: [string];
    shouldNavigateToProcessDetails: [string];
    shouldCopyProcessInfo: [string];
    shouldMaintainTreeState: [];
    shouldHandleUserInteractions: [];
    shouldPreserveSelectionState: [];
    shouldUpdateTreeInRealTime: [];
    shouldHandleMultipleSimultaneousOperations: [];
    shouldRecoverFromErrors: [];
    shouldMaintainPerformanceUnderLoad: [];
  },
  // Describes
  {
    Default: [];
  },
  // Its
  {
    shouldProcessGraphData: [];
    shouldCreateTreeItemData: [];
    shouldHandleEdgeCases: [];
    shouldMaintainPerformance: [];
    shouldEnsureDataIntegrity: [];
    shouldHandleRealWorldScenarios: [];
  },
  // Confirms
  {
    addition: [];
    processValidation: [];
  },
  // Values
  {
    of: [number, number];
    processCount: [number];
  },
  // Shoulds
  {
    beEqualTo: [number];
    beGreaterThan: [number];
    beLessThan: [number];
    beWithinRange: [number, number];
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
      [When.processGraphData()],
      [Then.shouldHaveItems(5)],
      ["Test with mock graph data - processGraphData"],
    ),
    Given.WithGraphData(undefined)(
      [When.createTreeItemData()],
      [Then.shouldCreateValidTreeItemData()],
      ["Test with mock graph data - createTreeItemData"],
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
      [Then.shouldHaveItems(3)],
      ["Test with empty data"],
    ),
    
    // New expanded tests
    Given.WithGraphDataAndAgents(undefined)(
      [When.processGraphData()],
      [Then.shouldHaveItems(7), Then.shouldHandleAgents(2)],
      ["Test with both graph data and agents"],
    ),
    Given.WithGraphData(undefined)(
      [When.filterAiderProcessesForEntrypoint("nonexistent")],
      [Then.shouldFilterCorrectly(0)],
      ["Test filtering with non-existent entrypoint"],
    ),
    Given.WithGraphData(undefined)(
      [When.createTreeItemDataForNode("aider2")],
      [Then.shouldHaveValidTreeItemDataWithExitCode(0)],
      ["Test tree item data creation for exited aider"],
    ),
    
    // BDD Pattern tests for AiderDataGrouperCore
    Given.WithGraphData(undefined)(
      [When.processGraphDataWithGrouper()],
      [Then.shouldHaveGrouperItems(5), Then.shouldHaveRefreshItem()],
      ["Test AiderDataGrouperCore processing"],
    ),
    Given.WithAgents(undefined)(
      [When.processGraphDataWithGrouper()],
      [Then.shouldHaveGrouperItems(7), Then.shouldHandleAgents(2)],
      ["Test AiderDataGrouperCore with agents"],
    ),
    
    // BDD Pattern tests for AiderTreeItemCreatorCore
    Given.WithGraphData(undefined)(
      [When.createTreeItemDataWithCreator()],
      [Then.shouldHaveCreatorItemProperties()],
      ["Test AiderTreeItemCreatorCore item creation"],
    ),
    
    // Edge case tests
    Given.WithMalformedData(undefined)(
      [When.processGraphDataWithInvalidInput()],
      [Then.shouldThrowForMalformedData()],
      ["Test error handling for malformed data"],
    ),
    Given.WithLargeDataSet(undefined)(
      [When.processGraphDataWithPerformanceCheck()],
      [Then.shouldHandleLargeDataSetWithinTimeLimit()],
      ["Test performance with large data set"],
    ),
    Given.WithMixedStatusProcesses(undefined)(
      [When.processGraphData()],
      [Then.shouldProcessMixedStatusesCorrectly()],
      ["Test processing of processes with mixed statuses"],
    ),
    Given.WithDuplicateEntrypoints(undefined)(
      [When.processGraphData()],
      [Then.shouldHandleDuplicateEntrypoints()],
      ["Test handling of duplicate entrypoints"],
    ),
    Given.WithProcessesHavingNoStatus(undefined)(
      [When.processGraphData()],
      [Then.shouldHandleProcessesWithNoStatus()],
      ["Test handling of processes with no status"],
    ),
    Given.WithProcessesHavingInvalidExitCodes(undefined)(
      [When.processGraphData()],
      [Then.shouldHandleInvalidExitCodes()],
      ["Test handling of invalid exit codes"],
    ),
    Given.WithSpecialCharactersInLabels(undefined)(
      [When.processGraphData()],
      [Then.shouldHandleSpecialCharactersInLabels()],
      ["Test handling of special characters in labels"],
    ),
    Given.WithVeryLongLabels(undefined)(
      [When.processGraphData()],
      [Then.shouldHandleVeryLongLabels()],
      ["Test handling of very long labels"],
    ),
    Given.WithConcurrentProcesses(undefined)(
      [When.handleConcurrentDataUpdates()],
      [Then.shouldHandleConcurrentProcesses()],
      ["Test handling of concurrent processes"],
    ),
    Given.WithStoppedProcesses(undefined)(
      [When.processGraphData()],
      [Then.shouldHandleStoppedProcesses()],
      ["Test handling of stopped processes"],
    ),
    Given.WithProcessesHavingMissingProperties(undefined)(
      [When.processGraphData()],
      [Then.shouldHandleMissingProperties()],
      ["Test handling of processes with missing properties"],
    ),
    Given.WithGraphDataHavingCycles(undefined)(
      [When.processGraphData()],
      [Then.shouldDetectGraphCycles()],
      ["Test detection of graph cycles"],
    ),
    Given.WithInconsistentNodeTypes(undefined)(
      [When.processGraphData()],
      [Then.shouldHandleInconsistentNodeTypes()],
      ["Test handling of inconsistent node types"],
    ),
    Given.WithProcessesHavingFutureTimestamps(undefined)(
      [When.processGraphData()],
      [Then.shouldHandleFutureTimestamps()],
      ["Test handling of future timestamps"],
    ),
    Given.WithProcessesHavingPastTimestamps(undefined)(
      [When.processGraphData()],
      [Then.shouldHandlePastTimestamps()],
      ["Test handling of past timestamps"],
    ),
    Given.WithGraphData(undefined)(
      [When.filterWithEmptyEntrypoint()],
      [Then.shouldThrowForEmptyEntrypoint()],
      ["Test error handling for empty entrypoint"],
    ),
    Given.WithGraphData(undefined)(
      [When.filterWithSpecialCharactersEntrypoint()],
      [Then.shouldHandleSpecialCharactersInEntrypoint()],
      ["Test handling of special characters in entrypoint"],
    ),
    Given.Empty(undefined)(
      [When.groupWithEmptyNodeList()],
      [Then.shouldHandleEmptyNodeList()],
      ["Test handling of empty node list"],
    ),
    Given.WithGraphData(undefined)(
      [When.createTreeItemForNonExistentNode()],
      [Then.shouldThrowForNonExistentNode()],
      ["Test error handling for non-existent node"],
    ),
    Given.WithLargeDataSet(undefined)(
      [When.validateTreeItemDataConsistency()],
      [Then.shouldMaintainDataConsistency()],
      ["Test data consistency validation"],
    ),
    
    // Stateful behavior tests with multiple Whens and Thens
    Given.WithGraphData(undefined)(
      [
        When.refreshTreeView(),
        When.expandTreeItem("process1"),
        When.selectTreeItem("process1"),
        When.navigateToProcessDetails("process1")
      ],
      [
        Then.shouldRefreshTreeView(),
        Then.shouldExpandTreeItem("process1"),
        Then.shouldSelectTreeItem("process1"),
        Then.shouldNavigateToProcessDetails("process1")
      ],
      ["Test user interaction flow with tree view"],
    ),
    Given.WithGraphData(undefined)(
      [
        When.addNewProcess("newProcess", "running"),
        When.updateProcessStatus("newProcess", "stopped"),
        When.updateProcessExitCode("newProcess", 0),
        When.simulateProcessTermination("newProcess")
      ],
      [
        Then.shouldAddNewProcess("newProcess"),
        Then.shouldUpdateProcessStatus("newProcess"),
        Then.shouldUpdateProcessExitCode("newProcess", 0),
        Then.shouldSimulateProcessTermination("newProcess")
      ],
      ["Test process lifecycle management"],
    ),
    Given.WithGraphData(undefined)(
      [
        When.filterByStatus("running"),
        When.sortByRuntime(),
        When.groupByContainer(),
        When.searchProcesses("aider"),
        When.clearFilters()
      ],
      [
        Then.shouldFilterByStatus(2),
        Then.shouldSortByRuntime(),
        Then.shouldGroupByContainer(2),
        Then.shouldSearchProcesses(3),
        Then.shouldClearFilters()
      ],
      ["Test filtering, sorting, grouping, and searching operations"],
    ),
    Given.WithGraphData(undefined)(
      [
        When.toggleAutoRefresh(),
        When.setRefreshInterval(5000),
        When.batchUpdateProcesses(["process1", "process2", "process3"]),
        When.exportTreeData(),
        When.importTreeData('{"processes": ["imported"]}')
      ],
      [
        Then.shouldToggleAutoRefresh(),
        Then.shouldSetRefreshInterval(5000),
        Then.shouldBatchUpdateProcesses(3),
        Then.shouldExportTreeData(),
        Then.shouldImportTreeData(1)
      ],
      ["Test configuration and data management operations"],
    ),
    Given.WithGraphData(undefined)(
      [
        When.simulateProcessStart("stoppedProcess"),
        When.updateProcessStatus("stoppedProcess", "running"),
        When.collapseTreeItem("stoppedProcess"),
        When.copyProcessInfo("stoppedProcess")
      ],
      [
        Then.shouldSimulateProcessStart("stoppedProcess"),
        Then.shouldUpdateProcessStatus("stoppedProcess"),
        Then.shouldCollapseTreeItem("stoppedProcess"),
        Then.shouldCopyProcessInfo("stoppedProcess")
      ],
      ["Test process control and UI interactions"],
    ),
    Given.WithGraphData(undefined)(
      [
        When.processGraphData(),
        When.refreshTreeView(),
        When.expandTreeItem("process1"),
        When.selectTreeItem("process1"),
        When.updateProcessStatus("process1", "completed"),
        When.refreshTreeView()
      ],
      [
        Then.shouldHaveItems(5),
        Then.shouldRefreshTreeView(),
        Then.shouldExpandTreeItem("process1"),
        Then.shouldSelectTreeItem("process1"),
        Then.shouldUpdateProcessStatus("process1"),
        Then.shouldMaintainTreeState()
      ],
      ["Test complete workflow with state preservation"],
    ),
    Given.WithGraphData(undefined)(
      [
        When.addNewProcess("procA", "running"),
        When.addNewProcess("procB", "running"),
        When.removeProcess("procA"),
        When.updateProcessStatus("procB", "stopped"),
        When.filterByStatus("stopped"),
        When.clearFilters()
      ],
      [
        Then.shouldAddNewProcess("procA"),
        Then.shouldAddNewProcess("procB"),
        Then.shouldRemoveProcess(),
        Then.shouldUpdateProcessStatus("procB"),
        Then.shouldFilterByStatus(1),
        Then.shouldClearFilters(),
        Then.shouldHandleMultipleSimultaneousOperations()
      ],
      ["Test complex state transitions with multiple processes"],
    ),
    Given.WithGraphData(undefined)(
      [
        When.processGraphDataWithInvalidInput(),
        When.refreshTreeView(),
        When.processGraphData(),
        When.validateTreeItemDataConsistency()
      ],
      [
        Then.shouldThrowForMalformedData(),
        Then.shouldRefreshTreeView(),
        Then.shouldHaveItems(5),
        Then.shouldMaintainDataConsistency(),
        Then.shouldRecoverFromErrors()
      ],
      ["Test error recovery and state restoration"],
    ),
    Given.WithLargeDataSet(undefined)(
      [
        When.processGraphData(),
        When.sortByRuntime(),
        When.groupByContainer(),
        When.searchProcesses("test"),
        When.filterByStatus("running"),
        When.refreshTreeView()
      ],
      [
        Then.shouldHandleLargeDataSetWithinTimeLimit(),
        Then.shouldSortByRuntime(),
        Then.shouldGroupByContainer(3),
        Then.shouldSearchProcesses(50),
        Then.shouldFilterByStatus(25),
        Then.shouldMaintainPerformanceUnderLoad()
      ],
      ["Test performance with complex operations on large dataset"],
    ),
    
    // AAA Pattern tests
    Describe.Default(undefined)(
      [
        It.shouldProcessGraphData(), 
        It.shouldCreateTreeItemData(),
        It.shouldHandleEdgeCases(),
        It.shouldMaintainPerformance(),
        It.shouldEnsureDataIntegrity(),
        It.shouldHandleRealWorldScenarios(),
      ],
      ["Test Describe-It pattern for AiderProcessTreeDataProviderCore"],
    ),
    
    // TDT Pattern tests
    Confirm.addition(
      [
        [Value.of(1, 2), Should.beEqualTo(3)],
        [Value.of(4, 5), Should.beGreaterThan(8)],
        [Value.of(0, 0), Should.beEqualTo(0)],
        [Value.of(-5, 5), Should.beEqualTo(0)],
        [Value.of(100, 200), Should.beGreaterThan(250)],
      ],
      ["Test table-driven testing for addition"],
    ),
    Confirm.processValidation(
      [
        [Value.processCount(100), Should.beLessThan(1000)],
        [Value.processCount(500), Should.beWithinRange(450, 550)],
      ],
      ["Test process validation performance metrics"],
    ),
  ];
};
