import * as vscode from 'vscode';
import { TestTreeItem } from '../../TestTreeItem';
import { TreeItemType } from '../../types';

export function getTestResultChildren(testName: string, testResults: Map<string, any[]>): TestTreeItem[] {
    const items: TestTreeItem[] = [];
    const results = testResults.get(testName);

    if (!results || results.length === 0) {
        items.push(
            new TestTreeItem(
                'No detailed results available',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    description: 'Test result details not found'
                },
                undefined,
                new vscode.ThemeIcon('info')
            )
        );
        return items;
    }

    const resultsByRuntime = new Map<string, any[]>();
    for (const result of results) {
        const runtime = result.runtime || 'unknown';
        if (!resultsByRuntime.has(runtime)) {
            resultsByRuntime.set(runtime, []);
        }
        resultsByRuntime.get(runtime)!.push(result);
    }

    for (const [runtime, runtimeResults] of resultsByRuntime.entries()) {
        let passed = 0;
        let failed = 0;

        for (const result of runtimeResults) {
            const status = result.result?.status;
            const failedFlag = result.result?.failed;

            if (status === true || failedFlag === false) {
                passed++;
            } else {
                failed++;
            }
        }

        const description = `${passed} passed, ${failed} failed`;
        const icon = failed === 0 ?
            new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed')) :
            new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));

        items.push(
            new TestTreeItem(
                runtime,
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.Collapsed,
                {
                    testName: testName,
                    runtime: runtime,
                    description: description,
                    passed: passed,
                    failed: failed,
                    total: runtimeResults.length
                },
                undefined,
                icon
            )
        );
    }

    return items;
}

export function getTestResultRuntimeChildren(testName: string, runtime: string, testResults: Map<string, any[]>): TestTreeItem[] {
    const items: TestTreeItem[] = [];
    const results = testResults.get(testName);

    if (!results) {
        return items;
    }

    const runtimeResults = results.filter(r => r.runtime === runtime);

    for (const result of runtimeResults) {
        const status = result.result?.status;
        const failedFlag = result.result?.failed;
        const isPassed = status === true || failedFlag === false;

        const fileName = result.file || 'Unknown file';
        const description = isPassed ? 'PASSED' : 'FAILED';
        const icon = isPassed ?
            new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed')) :
            new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));

        items.push(
            new TestTreeItem(
                fileName,
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    testName: testName,
                    runtime: runtime,
                    fileName: fileName,
                    description: description,
                    isPassed: isPassed,
                    result: result.result
                },
                undefined,
                icon
            )
        );
    }

    return items;
}
