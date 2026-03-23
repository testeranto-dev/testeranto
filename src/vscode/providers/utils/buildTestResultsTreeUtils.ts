import * as vscode from 'vscode';
import { TestTreeItem } from '../../TestTreeItem';
import { TreeItemType } from '../../types';

export function buildTestResultsTree(collatedTestResults: Record<string, any>): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    if (Object.keys(collatedTestResults).length === 0) {
        items.push(
            new TestTreeItem(
                'No test results found',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    description: 'Run tests to generate results'
                },
                undefined,
                new vscode.ThemeIcon('info')
            )
        );
        return items;
    }

    const treeRoot: Record<string, any> = {};

    for (const [configKey, configData] of Object.entries(collatedTestResults)) {
        const configInfo = configData as any;
        const tests = configInfo.tests || {};
        const files = configInfo.files || [];

        if (!treeRoot[configKey]) {
            treeRoot[configKey] = {
                type: 'config',
                configKey: configKey,
                runtime: configInfo.runtime,
                children: {},
                files: files
            };
        }

        for (const [testName, testInfo] of Object.entries(tests)) {
            const info = testInfo as any;
            const results = info.results || [];
            const testFiles = info.files || [];

            let passed = 0;
            let failed = 0;

            for (const result of results) {
                const status = result?.status;
                const failedFlag = result?.failed;

                if (status === true || failedFlag === false) {
                    passed++;
                } else {
                    failed++;
                }
            }

            const parts = testName.split('/').filter(part => part.length > 0);
            let currentNode = treeRoot[configKey].children;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isLast = i === parts.length - 1;

                if (!currentNode[part]) {
                    if (isLast) {
                        currentNode[part] = {
                            type: 'test',
                            name: part,
                            fullPath: testName,
                            configKey: configKey,
                            runtime: configInfo.runtime,
                            passed: passed,
                            failed: failed,
                            total: results.length,
                            results: results,
                            files: testFiles,
                            fileCount: info.fileCount || 0
                        };
                    } else {
                        currentNode[part] = {
                            type: 'directory',
                            name: part,
                            children: {}
                        };
                    }
                } else if (isLast) {
                    currentNode[part].passed = passed;
                    currentNode[part].failed = failed;
                    currentNode[part].total = results.length;
                    currentNode[part].results = results;
                    currentNode[part].files = testFiles;
                    currentNode[part].fileCount = info.fileCount || 0;
                }

                if (!isLast && currentNode[part].type === 'directory') {
                    currentNode = currentNode[part].children;
                }
            }
        }

        const otherFiles = configInfo.otherFiles || [];
        if (otherFiles.length > 0) {
            if (!treeRoot[configKey].children['other']) {
                treeRoot[configKey].children['other'] = {
                    type: 'directory',
                    name: 'other',
                    children: {}
                };
            }

            for (const file of otherFiles) {
                const fileName = file.name;
                treeRoot[configKey].children['other'].children[fileName] = {
                    type: 'file',
                    name: fileName,
                    path: file.path,
                    isJson: file.isJson,
                    size: file.size,
                    modified: file.modified
                };
            }
        }
    }

    // We need to import buildTreeItemsFromTestResultsTree, but to avoid circular dependencies,
    // we'll pass it as a parameter
    // For now, we'll leave this part to be handled by the caller
    return [];
}

// This function will be used to build the tree items from the tree structure
export function buildTreeItemsFromTestResultsTree(treeRoot: Record<string, any>): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    const keys = Object.keys(treeRoot).sort((a, b) => {
        const aNode = treeRoot[a];
        const bNode = treeRoot[b];

        const aIsDir = aNode.type === 'directory' || aNode.type === 'runtime';
        const bIsDir = bNode.type === 'directory' || bNode.type === 'runtime';

        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.localeCompare(b);
    });

    for (const key of keys) {
        const node = treeRoot[key];

        if (node.type === 'config') {
            let totalPassed = 0;
            let totalFailed = 0;
            let totalTests = 0;

            const calculateStats = (currentNode: any) => {
                if (currentNode.type === 'test') {
                    totalPassed += currentNode.passed || 0;
                    totalFailed += currentNode.failed || 0;
                    totalTests += currentNode.total || 0;
                } else if (currentNode.type === 'directory' && currentNode.children) {
                    for (const childKey in currentNode.children) {
                        calculateStats(currentNode.children[childKey]);
                    }
                }
            };

            for (const childKey in node.children) {
                calculateStats(node.children[childKey]);
            }

            const description = `${totalPassed} passed, ${totalFailed} failed (${totalTests} total)`;
            const icon = totalFailed === 0 ?
                new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed')) :
                new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));

            items.push(
                new TestTreeItem(
                    `${key} (${node.runtime})`,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    {
                        section: 'test-results-config',
                        configKey: key,
                        runtime: node.runtime,
                        description: description,
                        passed: totalPassed,
                        failed: totalFailed,
                        total: totalTests
                    },
                    undefined,
                    icon
                )
            );
        } else if (node.type === 'directory') {
            items.push(
                new TestTreeItem(
                    key,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    {
                        section: 'test-results-directory',
                        path: key,
                        description: 'Directory'
                    },
                    undefined,
                    new vscode.ThemeIcon('folder')
                )
            );
        } else if (node.type === 'test') {
            const description = `${node.passed} passed, ${node.failed} failed (${node.total} total) - ${node.fileCount || 0} files`;
            const icon = node.failed === 0 ?
                new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed')) :
                new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));

            items.push(
                new TestTreeItem(
                    key,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    {
                        testName: node.fullPath,
                        runtime: node.runtime,
                        description: description,
                        passed: node.passed,
                        failed: node.failed,
                        total: node.total,
                        results: node.results,
                        files: node.files,
                        fileCount: node.fileCount || 0
                    },
                    undefined,
                    icon
                )
            );
        } else if (node.type === 'file') {
            const description = `${node.isJson ? 'JSON' : 'File'} - ${node.size} bytes`;
            const icon = node.isJson ?
                new vscode.ThemeIcon('json') :
                new vscode.ThemeIcon('file');

            items.push(
                new TestTreeItem(
                    key,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        fileName: node.name,
                        filePath: node.path,
                        isJson: node.isJson,
                        size: node.size,
                        modified: node.modified,
                        description: description
                    },
                    undefined,
                    icon
                )
            );
        }
    }

    return items;
}
