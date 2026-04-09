import type { Ibdd_out, ITestSpecification } from "../../../lib/tiposkripto/src/CoreTypes";

export type O = Ibdd_out<
  // Givens
  {
    Default: [];
    WithGraphData: [];
    WithEmptyGraph: [];
    WithMixedNodes: [];
    WithNestedFolders: [];
    WithFilesOnly: [];
    WithFoldersOnly: [];
    WithSpecialPaths: [];
  },
  // Whens
  {
    filterFolderNodes: [];
    filterFileNodes: [];
    filterFolderNodesByPath: [string];
    filterFileNodesByPath: [string];
    getFolderName: [];
    getFileName: [];
    buildTreeStructure: [];
    countFilesInTree: [];
    getFileIcon: [];
    setAndGetGraphData: [];
    hasGraphData: [];
    basename: [string];
    dirname: [string];
  },
  // Thens
  {
    shouldHaveFolderCount: [number];
    shouldHaveFileCount: [number];
    shouldHaveFilteredFolderCount: [number];
    shouldHaveFilteredFileCount: [number];
    shouldHaveFolderName: [string];
    shouldHaveFileName: [string];
    shouldHaveTreeStructure: [];
    shouldHaveFileCountInTree: [number];
    shouldHaveFileIcon: [string];
    shouldHaveGraphData: [];
    shouldNotHaveGraphData: [];
    shouldHaveBasename: [string];
    shouldHaveDirname: [string];
  },
  // Describes
  {
    Default: [];
  },
  // Its
  {
    shouldHandleGraphData: [];
    shouldBuildTreeCorrectly: [];
    shouldFilterNodesCorrectly: [];
    shouldComputePathsCorrectly: [];
  },
  // Confirms
  {
    addition: [];
    pathOperations: [];
  },
  // Values
  {
    of: [number, number];
    path: [string];
  },
  // Shoulds
  {
    beEqualTo: [number];
    beGreaterThan: [number];
    beLessThan: [number];
    beWithinRange: [number, number];
    matchString: [string];
  }
>;

export type I = any;

export const FileTreeLogicTestSpecification: ITestSpecification<
  I,
  O
> = (Given, When, Then, Describe, It, Confirm, Value, Should) => {
  return [
    // BDD Pattern tests
    Given.WithGraphData(undefined)(
      [When.filterFolderNodes()],
      [Then.shouldHaveFolderCount(3)],
      ["Test filtering folder nodes from graph data"],
    ),
    Given.WithGraphData(undefined)(
      [When.filterFileNodes()],
      [Then.shouldHaveFileCount(2)],
      ["Test filtering file nodes from graph data"],
    ),
    Given.WithGraphData(undefined)(
      [When.filterFolderNodesByPath("root/folder1")],
      [Then.shouldHaveFilteredFolderCount(1)],
      ["Test filtering folder nodes by path"],
    ),
    Given.WithGraphData(undefined)(
      [When.filterFileNodesByPath("root/folder1")],
      [Then.shouldHaveFilteredFileCount(1)],
      ["Test filtering file nodes by path"],
    ),
    Given.WithGraphData(undefined)(
      [When.getFolderName()],
      [Then.shouldHaveFolderName("folder1")],
      ["Test getting folder name"],
    ),
    Given.WithGraphData(undefined)(
      [When.getFileName()],
      [Then.shouldHaveFileName("file1.txt")],
      ["Test getting file name"],
    ),
    Given.WithGraphData(undefined)(
      [When.buildTreeStructure()],
      [Then.shouldHaveTreeStructure()],
      ["Test building tree structure"],
    ),
    Given.WithGraphData(undefined)(
      [When.countFilesInTree()],
      [Then.shouldHaveFileCountInTree(2)],
      ["Test counting files in tree"],
    ),
    Given.WithGraphData(undefined)(
      [When.getFileIcon()],
      [Then.shouldHaveFileIcon("file-code")],
      ["Test getting file icon"],
    ),
    Given.WithGraphData(undefined)(
      [When.setAndGetGraphData()],
      [Then.shouldHaveGraphData()],
      ["Test setting and getting graph data"],
    ),
    Given.WithEmptyGraph(undefined)(
      [When.hasGraphData()],
      [Then.shouldNotHaveGraphData()],
      ["Test hasGraphData with empty graph"],
    ),
    Given.Default(undefined)(
      [When.basename("/root/folder/file.txt")],
      [Then.shouldHaveBasename("file.txt")],
      ["Test basename function"],
    ),
    Given.Default(undefined)(
      [When.dirname("/root/folder/file.txt")],
      [Then.shouldHaveDirname("root/folder")],
      ["Test dirname function"],
    ),
    
    // Edge cases
    Given.WithEmptyGraph(undefined)(
      [When.filterFolderNodes()],
      [Then.shouldHaveFolderCount(0)],
      ["Test filtering folder nodes from empty graph"],
    ),
    Given.WithFilesOnly(undefined)(
      [When.filterFolderNodes()],
      [Then.shouldHaveFolderCount(0)],
      ["Test filtering folder nodes when only files exist"],
    ),
    Given.WithFoldersOnly(undefined)(
      [When.filterFileNodes()],
      [Then.shouldHaveFileCount(0)],
      ["Test filtering file nodes when only folders exist"],
    ),
    Given.WithSpecialPaths(undefined)(
      [When.basename("/")],
      [Then.shouldHaveBasename("")],
      ["Test basename with root path"],
    ),
    Given.WithSpecialPaths(undefined)(
      [When.dirname("/")],
      [Then.shouldHaveDirname("")],
      ["Test dirname with root path"],
    ),
    
    // AAA Pattern tests
    Describe.Default(undefined)(
      [
        It.shouldHandleGraphData(), 
        It.shouldBuildTreeCorrectly(),
        It.shouldFilterNodesCorrectly(),
        It.shouldComputePathsCorrectly(),
      ],
      ["Test Describe-It pattern for FileTreeLogic"],
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
    Confirm.pathOperations(
      [
        [Value.path("/root/file.txt"), Should.matchString("file.txt")],
        [Value.path("/a/b/c"), Should.matchString("c")],
        [Value.path("relative/path"), Should.matchString("path")],
      ],
      ["Test path operations"],
    ),
  ];
};
