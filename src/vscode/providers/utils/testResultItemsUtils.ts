import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';

export function getTestResultItems(
    testResults: Map<string, any[]>,
    collatedTestResults: Record<string, any>
): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    if (Object.keys(collatedTestResults).length > 0) {
        // We need to call buildTreeItemsFromTestResultsTree
        // Since this is a static method, we'll need to pass it as a parameter
        // For now, we'll return an empty array and handle this differently
        // Let's create a separate function for this
        return [];
    }

    if (testResults.size === 0) {
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
        items.push(
            new TestTreeItem(
                'Refresh Test Results',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    description: 'Check for new test results'
                },
                {
                    command: 'testeranto.refresh',
                    title: 'Refresh Test Results'
                },
                new vscode.ThemeIcon('refresh')
            )
        );
        return items;
    }

    for (const [testName, results] of testResults.entries()) {
        let passed = 0;
        let failed = 0;
        let total = results.length;

        for (const result of results) {
            const status = result.result?.status;
            const failedFlag = result.result?.failed;

            if (status === true || failedFlag === false) {
                passed++;
            } else {
                failed++;
            }
        }

        const description = `${passed} passed, ${failed} failed (${total} total)`;
        const icon = failed === 0 ?
            new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed')) :
            new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));

        items.push(
            new TestTreeItem(
                testName,
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.Collapsed,
                {
                    testName: testName,
                    description: description,
                    passed: passed,
                    failed: failed,
                    total: total
                },
                undefined,
                icon
            )
        );
    }

    items.sort((a, b) => {
        const aFailed = a.data?.failed || 0;
        const bFailed = b.data?.failed || 0;

        if (aFailed === 0 && bFailed > 0) return -1;
        if (aFailed > 0 && bFailed === 0) return 1;

        return a.label!.localeCompare(b.label!);
    });

    return items;
}
import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';

export function getTestResultItems(
    testResults: Map<string, any[]>,
    collatedTestResults: Record<string, any>,
    buildTreeItemsFromTestResultsTree: (tree: Record<string, any>) => TestTreeItem[]
): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    if (Object.keys(collatedTestResults).length > 0) {
        return buildTreeItemsFromTestResultsTree(collatedTestResults);
    }

    if (testResults.size === 0) {
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
        items.push(
            new TestTreeItem(
                'Refresh Test Results',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    description: 'Check for new test results'
                },
                {
                    command: 'testeranto.refresh',
                    title: 'Refresh Test Results'
                },
                new vscode.ThemeIcon('refresh')
            )
        );
        return items;
    }

    for (const [testName, results] of testResults.entries()) {
        let passed = 0;
        let failed = 0;
        let total = results.length;

        for (const result of results) {
            const status = result.result?.status;
            const failedFlag = result.result?.failed;

            if (status === true || failedFlag === false) {
                passed++;
            } else {
                failed++;
            }
        }

        const description = `${passed} passed, ${failed} failed (${total} total)`;
        const icon = failed === 0 ?
            new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed')) :
            new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));

        items.push(
            new TestTreeItem(
                testName,
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.Collapsed,
                {
                    testName: testName,
                    description: description,
                    passed: passed,
                    failed: failed,
                    total: total
                },
                undefined,
                icon
            )
        );
    }

    items.sort((a, b) => {
        const aFailed = a.data?.failed || 0;
        const bFailed = b.data?.failed || 0;

        if (aFailed === 0 && bFailed > 0) return -1;
        if (aFailed > 0 && bFailed === 0) return 1;

        return a.label!.localeCompare(b.label!);
    });

    return items;
}
