// This component shows a tree
// It first breaksdown matching the file structure.
// tests.json are further broken done via given-when-then
// features are also spread into the tree
// example: "testeranto/reports/allTests/example/node.Calculator.test.ts.json"
// the tree should spread to "example/Calculator.test.ts"
// then the json file is spread from there
//  • example(folder)
//     • Calculator.test.ts(file)
//        • node(runtime - specific results)
//           • Overall status
//           • Features
//           • Test Scenarios
//              • Scenario 1: ...
//                 • GIVEN: ...
//                 • Features
//                 • WHEN Steps
//                 • THEN Assertions
//        • python(runtime - specific results)
//           • ...

import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { FeaturesTreeDataProviderUtils } from './FeaturesTreeDataProviderUtils';

interface TestResult {
    name: string;
    status: boolean;
    features: string[];
    fails?: number;
    givens?: any[];
    error?: string;
}

export class FeaturesTreeDataProvider implements vscode.TreeDataProvider<TestTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TestTreeItem | undefined | null | void> = new vscode.EventEmitter<TestTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TestTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private resultsDir: string;
    private documentationDir: string;

    constructor() {
        // Determine the workspace root
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            this.resultsDir = path.join(workspaceRoot, 'testeranto', 'reports', 'allTests', 'example');
            this.documentationDir = path.join(workspaceRoot, 'testeranto');
        } else {
            const cwd = process.cwd();
            this.resultsDir = path.join(cwd, 'testeranto', 'reports', 'allTests', 'example');
            this.documentationDir = path.join(cwd, 'testeranto');
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TestTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TestTreeItem): Thenable<TestTreeItem[]> {
        if (!element) {
            return Promise.resolve(this.getSourceStructure());
        } else {
            const data = element.data;
            if (data?.sourcePath) {
                // Always get children for the source path
                return Promise.resolve(this.getSourceChildren(data.sourcePath));
            } else if (data?.testFile && data.testResultIndex === undefined) {
                // This handles the case when we're showing test results
                return Promise.resolve(this.getTestResults(data.testFile));
            } else if (data?.testResultIndex !== undefined) {
                return Promise.resolve(this.getTestDetails(data.testFile, data.testResultIndex));
            }
        }
        return Promise.resolve([]);
    }

    private getSourceStructure(): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        
        // Always add documentation section, even if documentation.json doesn't exist yet
        const documentationPath = path.join(this.documentationDir, 'documentation.json');
        let docDescription = 'No documentation files found';
        let hasDocumentation = false;
        
        if (fs.existsSync(documentationPath)) {
            try {
                const documentationContent = fs.readFileSync(documentationPath, 'utf-8');
                const documentationData = JSON.parse(documentationContent);
                if (documentationData.files && Array.isArray(documentationData.files)) {
                    docDescription = `${documentationData.files.length} files`;
                    hasDocumentation = true;
                }
            } catch (error) {
                console.error('Error reading documentation.json:', error);
                docDescription = 'Error reading documentation';
            }
        } else {
            docDescription = 'Server not running or no documentation configured';
        }
        
        const docItem = new TestTreeItem(
            'Documentation',
            TreeItemType.File,
            hasDocumentation ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
            {
                sourcePath: 'documentation',
                isFile: false,
                description: docDescription
            },
            undefined,
            new vscode.ThemeIcon('book')
        );
        items.push(docItem);

        // Add test results section
        const testResultsItem = new TestTreeItem(
            'Test Results',
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.Collapsed,
            {
                sourcePath: 'test-results',
                isFile: false,
                description: 'Test execution results'
            },
            undefined,
            new vscode.ThemeIcon('beaker')
        );
        items.push(testResultsItem);

        return items;
    }

    private getSourceChildren(sourcePath: string): TestTreeItem[] {
        const parts = sourcePath.split('/').filter(p => p.length > 0);

        if (parts.length === 0) {
            // Root level: show both Documentation and Test Results
            return this.getSourceStructure();
        }

        if (parts.length === 1) {
            if (parts[0] === 'documentation') {
                return FeaturesTreeDataProviderUtils.getDocumentationFiles(this.documentationDir);
            } else if (parts[0] === 'test-results') {
                return FeaturesTreeDataProviderUtils.getTestResultsRoot(this.resultsDir);
            }
        }

        if (parts.length === 2 && parts[0] === 'test-results') {
            // Handle test results structure
            return FeaturesTreeDataProviderUtils.getTestResultsChildren(this.resultsDir, parts[1]);
        }

        // For deeper levels, fall back to existing logic
        return this.getLegacySourceChildren(sourcePath);
    }

    private getLegacySourceChildren(sourcePath: string): TestTreeItem[] {
        // This handles the old structure for backward compatibility
        const parts = sourcePath.split('/').filter(p => p.length > 0);
        if (parts.length === 3 && parts[0] === 'test-results') {
            const testName = parts[1];
            const runtime = parts[2];
            const fileName = `${runtime}.${testName}.json`;
            return FeaturesTreeDataProviderUtils.getTestResults(this.resultsDir, fileName);
        }
        return [];
    }

    private getTestResults(testFile: string): TestTreeItem[] {
        return FeaturesTreeDataProviderUtils.getTestResults(this.resultsDir, testFile);
    }

    private getTestDetails(testFile: string, index: number): TestTreeItem[] {
        return FeaturesTreeDataProviderUtils.getTestDetails(this.resultsDir, testFile, index);
    }
}
