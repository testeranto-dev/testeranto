import { TestTreeItem } from "../TestTreeItem";
import { TreeItemType } from "../types";
import { ApiUtils } from "./utils/apiUtils";

export const getTestFileItems = async (runtimeKey: string, testName: string) => {
  const response = await fetch(ApiUtils.getUnifiedTestTreeUrl());
  console.log(`[TestTreeDataProvider] Fetch response status: ${response.status}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  // The response structure is { tree: ..., message: ... }
  const unifiedTree = data.tree || {};
  console.log(`[TestTreeDataProvider] Received unified tree, has ${Object.keys(unifiedTree).length} runtimes`);

  // Find the specific runtime and test
  const runtimeEntry = unifiedTree[runtimeKey];
  if (!runtimeEntry) {
    console.log(`[TestTreeDataProvider] Runtime "${runtimeKey}" not found in unified tree`);
    return this.createNoFilesItems(runtimeKey, testName);
  }

  const testEntry = runtimeEntry.tests?.[testName];
  if (!testEntry) {
    console.log(`[TestTreeDataProvider] Test "${testName}" not found in runtime "${runtimeKey}"`);
    return this.createNoFilesItems(runtimeKey, testName);
  }

  console.log(`[TestTreeDataProvider] Found test entry with ${testEntry.sourceFiles?.length || 0} source files, ${testEntry.logs?.length || 0} logs, ${testEntry.results ? 'results' : 'no results'}, ${testEntry.outputFiles?.length || 0} output files`);

  // Build tree items
  const items: TestTreeItem[] = [];

  // Source files section
  if (testEntry.sourceFiles && testEntry.sourceFiles.length > 0) {
    const sourceFolder = new TestTreeItem(
      'Source Files',
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.Collapsed,
      {
        description: `${testEntry.sourceFiles.length} file(s)`,
        runtimeKey,
        testName,
      },
      undefined,
      new vscode.ThemeIcon('folder')
    );
    sourceFolder.children = testEntry.sourceFiles.map((file: any) => {
      const fileName = typeof file === 'string' ? file : file.path;
      return new TestTreeItem(
        fileName,
        TreeItemType.File,
        vscode.TreeItemCollapsibleState.None,
        {
          fileName: fileName,
          runtime: runtimeKey,
          testName: testName,
          isFile: true,
          fileType: 'source'
        },
        {
          command: 'testeranto.openFile',
          title: 'Open File',
          arguments: [{
            fileName: fileName,
            runtime: runtimeKey,
            testName: testName,
            isFile: true,
            fileType: 'source'
          }]
        },
        new vscode.ThemeIcon('file')
      );
    });
    items.push(sourceFolder);
  }

  // Logs section
  if (testEntry.logs && testEntry.logs.length > 0) {
    const logsFolder = new TestTreeItem(
      'Logs',
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.Collapsed,
      {
        description: `${testEntry.logs.length} file(s)`,
        runtimeKey,
        testName,
      },
      undefined,
      new vscode.ThemeIcon('output')
    );
    logsFolder.children = testEntry.logs.map((logPath: string) => {
      const fileName = logPath.split('/').pop() || logPath;
      return new TestTreeItem(
        fileName,
        TreeItemType.File,
        vscode.TreeItemCollapsibleState.None,
        {
          fileName: logPath,
          runtime: runtimeKey,
          testName: testName,
          isFile: true,
          fileType: 'log'
        },
        {
          command: 'testeranto.openFile',
          title: 'Open File',
          arguments: [{
            fileName: logPath,
            runtime: runtimeKey,
            testName: testName,
            isFile: true,
            fileType: 'log'
          }]
        },
        new vscode.ThemeIcon('file-text')
      );
    });
    items.push(logsFolder);
  }

  // Results file
  if (testEntry.results && typeof testEntry.results === 'string') {
    const resultsFile = new TestTreeItem(
      'Test Results',
      TreeItemType.File,
      vscode.TreeItemCollapsibleState.None,
      {
        fileName: testEntry.results,
        runtime: runtimeKey,
        testName: testName,
        isFile: true,
        fileType: 'results'
      },
      {
        command: 'testeranto.openFile',
        title: 'Open File',
        arguments: [{
          fileName: testEntry.results,
          runtime: runtimeKey,
          testName: testName,
          isFile: true,
          fileType: 'results'
        }]
      },
      new vscode.ThemeIcon('checklist')
    );
    items.push(resultsFile);
  }

  // Output files section
  if (testEntry.outputFiles && testEntry.outputFiles.length > 0) {
    const outputFolder = new TestTreeItem(
      'Output Files',
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.Collapsed,
      {
        description: `${testEntry.outputFiles.length} file(s)`,
        runtimeKey,
        testName,
      },
      undefined,
      new vscode.ThemeIcon('folder-opened')
    );
    outputFolder.children = testEntry.outputFiles.map((outputPath: string) => {
      const fileName = outputPath.split('/').pop() || outputPath;
      return new TestTreeItem(
        fileName,
        TreeItemType.File,
        vscode.TreeItemCollapsibleState.None,
        {
          fileName: outputPath,
          runtime: runtimeKey,
          testName: testName,
          isFile: true,
          fileType: 'output'
        },
        {
          command: 'testeranto.openFile',
          title: 'Open File',
          arguments: [{
            fileName: outputPath,
            runtime: runtimeKey,
            testName: testName,
            isFile: true,
            fileType: 'output'
          }]
        },
        new vscode.ThemeIcon('file')
      );
    });
    items.push(outputFolder);
  }

  if (items.length === 0) {
    return this.createNoFilesItems(runtimeKey, testName);
  }
}