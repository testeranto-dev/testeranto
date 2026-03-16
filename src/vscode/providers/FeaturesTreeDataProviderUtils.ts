import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
    name: string;
    status: boolean;
    features: string[];
    fails?: number;
    givens?: any[];
    error?: string;
}

export class FeaturesTreeDataProviderUtils {
    static buildSourceTreeItems(node: any): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        const sortedChildren = Array.from(node.children.values()).sort((a: any, b: any) => {
            if (a.isFile && !b.isFile) return 1;
            if (!a.isFile && b.isFile) return -1;
            return a.name.localeCompare(b.name);
        });

        for (const child of sortedChildren) {
            const collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            const treeItem = new TestTreeItem(
                child.name,
                TreeItemType.File,
                collapsibleState,
                {
                    sourcePath: child.fullPath,
                    testFile: child.fileName,
                    fileName: child.fileName,
                    isFile: child.isFile
                },
                undefined,
                child.isFile ? new vscode.ThemeIcon("file-code") : new vscode.ThemeIcon("folder")
            );
            items.push(treeItem);
        }
        return items;
    }

    static getDocumentationFiles(documentationDir: string): TestTreeItem[] {
        const documentationPath = path.join(documentationDir, 'documentation.json');
        if (!fs.existsSync(documentationPath)) {
            return [];
        }
        const documentationContent = fs.readFileSync(documentationPath, 'utf-8');
        const documentationData = JSON.parse(documentationContent);
        const files = documentationData.files || [];
        return files.map((file: string) => {
            const fullPath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
            return new TestTreeItem(
                path.basename(file),
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    fileName: file,
                    isFile: true,
                    description: path.dirname(file)
                },
                {
                    command: 'vscode.open',
                    title: 'Open File',
                    arguments: [vscode.Uri.file(fullPath)]
                },
                new vscode.ThemeIcon('markdown')
            );
        });
    }

    static getTestResultsRoot(resultsDir: string): TestTreeItem[] {
        if (!fs.existsSync(resultsDir)) {
            return [
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
            ];
        }
        const files = fs.readdirSync(resultsDir).filter(file => file.endsWith('.json'));
        if (files.length === 0) {
            return [
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
            ];
        }
        const testFiles = new Map<string, string[]>();
        for (const file of files) {
            const match = file.match(/^(\w+)\.(.+)\.json$/);
            if (match) {
                const runtime = match[1];
                const testName = match[2];
                if (!testFiles.has(testName)) {
                    testFiles.set(testName, []);
                }
                testFiles.get(testName)!.push(file);
            }
        }
        const items: TestTreeItem[] = [];
        for (const [testName, runtimeFiles] of testFiles) {
            let passedCount = 0;
            let failedCount = 0;
            for (const file of runtimeFiles) {
                try {
                    const filePath = path.join(resultsDir, file);
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const result = JSON.parse(content) as TestResult;
                    if (result.status === true || result.failed === false) {
                        passedCount++;
                    } else {
                        failedCount++;
                    }
                } catch {
                }
            }
            const description = `${passedCount} passed, ${failedCount} failed`;
            items.push(
                new TestTreeItem(
                    testName,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    {
                        sourcePath: `test-results/${testName}`,
                        testName: testName,
                        isFile: true,
                        description: description
                    },
                    undefined,
                    failedCount === 0 ?
                        new vscode.ThemeIcon('file-code', new vscode.ThemeColor('testing.iconPassed')) :
                        new vscode.ThemeIcon('file-code', new vscode.ThemeColor('testing.iconFailed'))
                )
            );
        }
        return items.sort((a, b) => a.label!.localeCompare(b.label!));
    }

    static getTestResultsChildren(resultsDir: string, testName: string): TestTreeItem[] {
        if (!fs.existsSync(resultsDir)) {
            return [];
        }
        const files = fs.readdirSync(resultsDir).filter(file => file.endsWith('.json'));
        const runtimeFiles = files.filter(file => {
            const match = file.match(/^(\w+)\.(.+)\.json$/);
            return match && match[2] === testName;
        });
        return runtimeFiles.map(file => {
            const match = file.match(/^(\w+)\.(.+)\.json$/);
            const runtime = match ? match[1] : 'unknown';
            let icon = new vscode.ThemeIcon('file-code');
            let description = '';
            try {
                const filePath = path.join(resultsDir, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                const result = JSON.parse(content) as TestResult;
                if (result.status === true || result.failed === false) {
                    icon = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
                    description = 'PASSED';
                } else {
                    icon = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
                    description = `FAILED: ${result.fails || 0} failures`;
                }
            } catch {
                description = 'Error reading file';
                icon = new vscode.ThemeIcon('warning');
            }
            return new TestTreeItem(
                runtime,
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.Collapsed,
                {
                    sourcePath: `test-results/${testName}/${runtime}`,
                    testFile: file,
                    fileName: file,
                    isFile: true,
                    description: description
                },
                undefined,
                icon
            );
        }).sort((a, b) => a.label!.localeCompare(b.label!));
    }

    static getTestResults(resultsDir: string, testFile: string): TestTreeItem[] {
        const filePath = path.join(resultsDir, testFile);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const result = JSON.parse(content) as TestResult;
            const items: TestTreeItem[] = [];
            const overallPassed = result.status === true || result.failed === false;
            items.push(
                new TestTreeItem(
                    `Overall: ${overallPassed ? 'PASSED' : 'FAILED'}`,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        description: `Fails: ${result.fails || 0} | Features: ${result.features?.length || 0}`
                    },
                    undefined,
                    overallPassed ?
                        new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed')) :
                        new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'))
                )
            );
            if (result.features && result.features.length > 0) {
                const featuresItem = new TestTreeItem(
                    `Features (${result.features.length})`,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    {
                        description: 'All test features'
                    },
                    undefined,
                    new vscode.ThemeIcon('symbol-array')
                );
                items.push(featuresItem);
            }
            if (result.givens && result.givens.length > 0) {
                const givensItem = new TestTreeItem(
                    `Test Scenarios (${result.givens.length})`,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    {
                        description: 'Given-When-Then test cases'
                    },
                    undefined,
                    new vscode.ThemeIcon('list-tree')
                );
                items.push(givensItem);
                for (let i = 0; i < result.givens.length; i++) {
                    const given = result.givens[i];
                    const givenPassed = given.status === true || given.failed === false;
                    const givenItem = new TestTreeItem(
                        `Scenario ${i + 1}: ${given.key || 'Unnamed'}`,
                        TreeItemType.File,
                        vscode.TreeItemCollapsibleState.Collapsed,
                        {
                            testFile: testFile,
                            testResultIndex: i,
                            description: givenPassed ? 'PASSED' : 'FAILED'
                        },
                        undefined,
                        givenPassed ?
                            new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed')) :
                            new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'))
                    );
                    items.push(givenItem);
                }
            }
            return items;
        } catch (error) {
            return [
                new TestTreeItem(
                    'Error reading test results',
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        description: String(error)
                    },
                    undefined,
                    new vscode.ThemeIcon('error')
                )
            ];
        }
    }

    static getTestDetails(resultsDir: string, testFile: string, index: number): TestTreeItem[] {
        const filePath = path.join(resultsDir, testFile);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const result = JSON.parse(content) as TestResult;
            if (!result.givens || index >= result.givens.length) {
                return [
                    new TestTreeItem(
                        'Test scenario not found',
                        TreeItemType.File,
                        vscode.TreeItemCollapsibleState.None,
                        { description: 'Invalid test scenario index' },
                        undefined,
                        new vscode.ThemeIcon('warning')
                    )
                ];
            }
            const given = result.givens[index];
            const items: TestTreeItem[] = [];
            const givenPassed = given.status === true || given.failed === false;
            items.push(
                new TestTreeItem(
                    `GIVEN: ${given.key || 'Test Scenario'}`,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.None,
                    { description: givenPassed ? 'PASSED' : 'FAILED' },
                    undefined,
                    givenPassed ?
                        new vscode.ThemeIcon('check') :
                        new vscode.ThemeIcon('error')
                )
            );
            if (given.features && given.features.length > 0) {
                const featuresItem = new TestTreeItem(
                    `Features (${given.features.length})`,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    { description: 'Features tested in this scenario' },
                    undefined,
                    new vscode.ThemeIcon('symbol-array')
                );
                items.push(featuresItem);
                for (const feature of given.features) {
                    items.push(
                        new TestTreeItem(
                            feature,
                            TreeItemType.File,
                            vscode.TreeItemCollapsibleState.None,
                            { description: 'Feature' },
                            undefined,
                            new vscode.ThemeIcon('symbol-string')
                        )
                    );
                }
            }
            if (given.whens && given.whens.length > 0) {
                const whensItem = new TestTreeItem(
                    `WHEN Steps (${given.whens.length})`,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    { description: 'Actions performed' },
                    undefined,
                    new vscode.ThemeIcon('list-ordered')
                );
                items.push(whensItem);
                for (let i = 0; i < given.whens.length; i++) {
                    const when = given.whens[i];
                    items.push(
                        new TestTreeItem(
                            `Step ${i + 1}: ${when.name || 'Action'}`,
                            TreeItemType.File,
                            vscode.TreeItemCollapsibleState.None,
                            {
                                description: when.status || 'No status',
                                tooltip: when.error ? `Error: ${when.error}` : undefined
                            },
                            undefined,
                            when.error ?
                                new vscode.ThemeIcon('error') :
                                new vscode.ThemeIcon('circle')
                        )
                    );
                }
            }
            if (given.thens && given.thens.length > 0) {
                const thensItem = new TestTreeItem(
                    `THEN Assertions (${given.thens.length})`,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    { description: 'Expected outcomes' },
                    undefined,
                    new vscode.ThemeIcon('checklist')
                );
                items.push(thensItem);
                for (let i = 0; i < given.thens.length; i++) {
                    const then = given.thens[i];
                    const assertionPassed = !then.error;
                    items.push(
                        new TestTreeItem(
                            `Assertion ${i + 1}: ${then.name || 'Check'}`,
                            TreeItemType.File,
                            vscode.TreeItemCollapsibleState.None,
                            {
                                description: assertionPassed ? 'PASSED' : 'FAILED',
                                tooltip: then.error ? `Error: ${then.error}` : undefined
                            },
                            undefined,
                            assertionPassed ?
                                new vscode.ThemeIcon('check') :
                                new vscode.ThemeIcon('error')
                        )
                    );
                }
            }
            if (given.error) {
                items.push(
                    new TestTreeItem(
                        'Error Details',
                        TreeItemType.File,
                        vscode.TreeItemCollapsibleState.None,
                        { description: given.error },
                        undefined,
                        new vscode.ThemeIcon('warning')
                    )
                );
            }
            return items;
        } catch (error) {
            return [
                new TestTreeItem(
                    'Error reading test details',
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.None,
                    { description: String(error) },
                    undefined,
                    new vscode.ThemeIcon('error')
                )
            ];
        }
    }
}
