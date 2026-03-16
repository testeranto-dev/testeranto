import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { TestTreeItem } from "../TestTreeItem";
import { TreeItemType } from "../types";
import { FeaturesTreeDataProviderUtils } from "./FeaturesTreeDataProviderUtils";

export class FeaturesTreeDataProvider implements vscode.TreeDataProvider<TestTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<
        TestTreeItem | undefined | null | void
    > = new vscode.EventEmitter<TestTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<
        TestTreeItem | undefined | null | void
    > = this._onDidChangeTreeData.event;

    private resultsDir: string;
    private documentationDir: string;

    constructor() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            this.resultsDir = path.join(
                workspaceRoot,
                "testeranto",
                "reports",
                "allTests",
                "example",
            );
            this.documentationDir = path.join(workspaceRoot, "testeranto");
        } else {
            const cwd = process.cwd();
            this.resultsDir = path.join(
                cwd,
                "testeranto",
                "reports",
                "allTests",
                "example",
            );
            this.documentationDir = path.join(cwd, "testeranto");
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
                return Promise.resolve(this.getSourceChildren(data.sourcePath));
            } else if (data?.testFile && data.testResultIndex === undefined) {
                return Promise.resolve(this.getTestResults(data.testFile));
            } else if (data?.testResultIndex !== undefined) {
                return Promise.resolve(
                    this.getTestDetails(data.testFile, data.testResultIndex),
                );
            }
        }
        return Promise.resolve([]);
    }

    private getSourceStructure(): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        const documentationPath = path.join(
            this.documentationDir,
            "documentation.json",
        );
        let docDescription = "No documentation files found";
        let hasDocumentation = false;

        if (fs.existsSync(documentationPath)) {
            try {
                const documentationContent = fs.readFileSync(
                    documentationPath,
                    "utf-8",
                );
                const documentationData = JSON.parse(documentationContent);
                if (documentationData.files && Array.isArray(documentationData.files)) {
                    docDescription = `${documentationData.files.length} files`;
                    hasDocumentation = true;
                }
            } catch (error) {
                docDescription = "Error reading documentation";
            }
        } else {
            docDescription = "Server not running or no documentation configured";
        }

        const docItem = new TestTreeItem(
            "Documentation",
            TreeItemType.File,
            hasDocumentation
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None,
            {
                sourcePath: "documentation",
                isFile: false,
                description: docDescription,
            },
            undefined,
            new vscode.ThemeIcon("book"),
        );
        items.push(docItem);

        const testResultsItem = new TestTreeItem(
            "Test Results",
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.Collapsed,
            {
                sourcePath: "test-results",
                isFile: false,
                description: "Test execution results",
            },
            undefined,
            new vscode.ThemeIcon("beaker"),
        );
        items.push(testResultsItem);

        return items;
    }

    private getSourceChildren(sourcePath: string): TestTreeItem[] {
        const parts = sourcePath.split("/").filter((p) => p.length > 0);
        if (parts.length === 0) {
            return this.getSourceStructure();
        }
        if (parts.length === 1) {
            if (parts[0] === "documentation") {
                return FeaturesTreeDataProviderUtils.getDocumentationFiles(
                    this.documentationDir,
                );
            } else if (parts[0] === "test-results") {
                return FeaturesTreeDataProviderUtils.getTestResultsRoot(
                    this.resultsDir,
                );
            }
        }
        if (parts.length === 2 && parts[0] === "test-results") {
            return FeaturesTreeDataProviderUtils.getTestResultsChildren(
                this.resultsDir,
                parts[1],
            );
        }
        return this.getLegacySourceChildren(sourcePath);
    }

    private getLegacySourceChildren(sourcePath: string): TestTreeItem[] {
        const parts = sourcePath.split("/").filter((p) => p.length > 0);
        if (parts.length === 3 && parts[0] === "test-results") {
            const testName = parts[1];
            const runtime = parts[2];
            const fileName = `${runtime}.${testName}.json`;
            return FeaturesTreeDataProviderUtils.getTestResults(
                this.resultsDir,
                fileName,
            );
        }
        return [];
    }

    private getTestResults(testFile: string): TestTreeItem[] {
        return FeaturesTreeDataProviderUtils.getTestResults(
            this.resultsDir,
            testFile,
        );
    }

    private getTestDetails(testFile: string, index: number): TestTreeItem[] {
        return FeaturesTreeDataProviderUtils.getTestDetails(
            this.resultsDir,
            testFile,
            index,
        );
    }
}
