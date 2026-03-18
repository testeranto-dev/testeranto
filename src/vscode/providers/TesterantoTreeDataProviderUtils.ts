import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { buildTreeFromPaths } from './utils/buildTreeFromPaths';
import { buildTreeItemsFromNode } from './utils/buildTreeItemsFromNode';
import { buildTreeItemsFromCollatedTree } from './utils/buildTreeItemsFromCollatedTree';
import { buildTreeItemsFromTestResultsTreeForConfig } from './utils/buildTreeItemsFromTestResultsTreeForConfig';

interface TreeNode {
    name: string;
    children: Map<string, TreeNode>;
    fullPath: string;
    isFile: boolean;
    originalPath?: string;
}

export class TesterantoTreeDataProviderUtils {
    private static documentationFiles: string[] = [];
    private static documentationTree: Record<string, any> = {};
    private static testInputFiles: Map<string, any[]> = new Map();
    private static inputFilesTree: Record<string, any> = {};
    private static testResults: Map<string, any[]> = new Map();
    private static collatedTestResults: Record<string, any> = {};
    private static processes: any[] = [];

    static async loadInitialData(): Promise<void> {
        const loadedData = await TesterantoTreeDataProviderUtils.loadAllData();
        TesterantoTreeDataProviderUtils.documentationFiles = loadedData.documentationFiles;
        TesterantoTreeDataProviderUtils.documentationTree = loadedData.documentationTree;
        TesterantoTreeDataProviderUtils.testInputFiles = loadedData.testInputFiles;
        TesterantoTreeDataProviderUtils.inputFilesTree = loadedData.inputFilesTree;
        TesterantoTreeDataProviderUtils.testResults = loadedData.testResults;
        TesterantoTreeDataProviderUtils.collatedTestResults = loadedData.collatedTestResults;
        TesterantoTreeDataProviderUtils.processes = loadedData.processes;
    }

    static clearData(): void {
        TesterantoTreeDataProviderUtils.documentationFiles = [];
        TesterantoTreeDataProviderUtils.documentationTree = {};
        TesterantoTreeDataProviderUtils.testInputFiles.clear();
        TesterantoTreeDataProviderUtils.inputFilesTree = {};
        TesterantoTreeDataProviderUtils.testResults.clear();
        TesterantoTreeDataProviderUtils.collatedTestResults = {};
        TesterantoTreeDataProviderUtils.processes = [];
    }

    static getChildrenForElement(element?: TestTreeItem): TestTreeItem[] {
        if (!element) {
            return TesterantoTreeDataProviderUtils.getRootItems();
        }

        const elementData = element.data as any;
        if (elementData?.section === 'documentation') {
            return TesterantoTreeDataProviderUtils.getDocumentationItems();
        } else if (elementData?.section === 'test-inputs') {
            return TesterantoTreeDataProviderUtils.getTestInputItems();
        } else if (elementData?.section === 'test-inputs-runtime') {
            return TesterantoTreeDataProviderUtils.getTestInputRuntimeItems(elementData.runtime);
        } else if (elementData?.section === 'test-inputs-test') {
            return TesterantoTreeDataProviderUtils.getTestInputTestItems(elementData.runtime, elementData.testName);
        } else if (elementData?.section === 'test-results') {
            return TesterantoTreeDataProviderUtils.getTestResultItems();
        } else if (elementData?.testName && elementData?.section === undefined) {
            return TesterantoTreeDataProviderUtils.getTestResultChildren(elementData.testName);
        } else if (elementData?.testName && elementData?.runtime && elementData?.section === undefined) {
            return TesterantoTreeDataProviderUtils.getTestResultRuntimeChildren(elementData.testName, elementData.runtime);
        } else if (elementData?.section === 'processes') {
            return TesterantoTreeDataProviderUtils.getProcessItems();
        } else if (elementData?.section === 'reports') {
            return TesterantoTreeDataProviderUtils.getReportItems();
        } else if (elementData?.section === 'test-results-config') {
            return TesterantoTreeDataProviderUtils.getTestResultsConfigItems(elementData.configKey);
        } else if (elementData?.section === 'test-results-directory') {
            return TesterantoTreeDataProviderUtils.getTestResultsDirectoryItems(elementData.path, elementData.parentRuntime);
        } else if (elementData?.filePath && elementData?.context === 'documentation') {
            return TesterantoTreeDataProviderUtils.getDocumentationChildren(elementData.filePath);
        } else if (elementData?.filePath && elementData?.context === 'test-inputs') {
            return TesterantoTreeDataProviderUtils.getTestInputChildren(elementData.filePath);
        } else if (elementData?.filePath) {
            return [];
        }

        return [];
    }

    static getRootItems(): TestTreeItem[] {
        const items: TestTreeItem[] = [
            new TestTreeItem(
                '📚 Documentation',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.Collapsed,
                {
                    section: 'documentation',
                    description: `${TesterantoTreeDataProviderUtils.documentationFiles.length} files`
                },
                undefined,
                new vscode.ThemeIcon('book')
            ),
            new TestTreeItem(
                '🧪 Test Inputs',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.Collapsed,
                {
                    section: 'test-inputs',
                    description: 'Source files for tests'
                },
                undefined,
                new vscode.ThemeIcon('beaker')
            ),
            new TestTreeItem(
                '📊 Test Results',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.Collapsed,
                {
                    section: 'test-results',
                    description: `${TesterantoTreeDataProviderUtils.testResults.size} tests`
                },
                undefined,
                new vscode.ThemeIcon('graph')
            ),
            new TestTreeItem(
                '🐳 Docker Processes',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.Collapsed,
                {
                    section: 'processes',
                    description: `${TesterantoTreeDataProviderUtils.processes.length} containers`
                },
                undefined,
                new vscode.ThemeIcon('server')
            ),
            new TestTreeItem(
                '🌐 HTML Report',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    section: 'reports',
                    description: 'Static report for stakeholders'
                },
                {
                    command: 'testeranto.generateHtmlReport',
                    title: 'Generate and Open HTML Report'
                },
                new vscode.ThemeIcon('globe')
            )
        ];

        return items;
    }

    static getDocumentationItems(): TestTreeItem[] {
        if (TesterantoTreeDataProviderUtils.documentationFiles.length === 0) {
            return [
                new TestTreeItem(
                    'No documentation files found',
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        description: 'Configure documentationGlob in testeranto config'
                    },
                    undefined,
                    new vscode.ThemeIcon('info')
                )
            ];
        }

        if (Object.keys(TesterantoTreeDataProviderUtils.documentationTree).length > 0) {
            return buildTreeItemsFromCollatedTree(TesterantoTreeDataProviderUtils.documentationTree, 'documentation');
        }

        const treeRoot = buildTreeFromPaths(TesterantoTreeDataProviderUtils.documentationFiles);
        return TesterantoTreeDataProviderUtils.buildTreeItemsFromNode(treeRoot, 'documentation');
    }

    static getTestInputItems(): TestTreeItem[] {
        const items: TestTreeItem[] = [];

        if (TesterantoTreeDataProviderUtils.testInputFiles.size === 0) {
            items.push(
                new TestTreeItem(
                    'No test input files found',
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        description: 'Run tests to generate input files'
                    },
                    undefined,
                    new vscode.ThemeIcon('info')
                )
            );
            return items;
        }

        if (Object.keys(TesterantoTreeDataProviderUtils.inputFilesTree).length > 0) {
            return TesterantoTreeDataProviderUtils.buildTreeItemsFromInputFilesTree(TesterantoTreeDataProviderUtils.inputFilesTree, 'test-inputs');
        }

        for (const [runtime, testEntries] of TesterantoTreeDataProviderUtils.testInputFiles.entries()) {
            let totalFiles = 0;
            for (const entry of testEntries) {
                totalFiles += entry.files.length;
            }

            items.push(
                new TestTreeItem(
                    runtime,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    {
                        section: 'test-inputs-runtime',
                        runtime: runtime,
                        description: `${testEntries.length} tests, ${totalFiles} files`
                    },
                    undefined,
                    new vscode.ThemeIcon('symbol-namespace')
                )
            );
        }

        return items;
    }

    static getTestResultItems(): TestTreeItem[] {
        const items: TestTreeItem[] = [];

        if (Object.keys(TesterantoTreeDataProviderUtils.collatedTestResults).length > 0) {
            return TesterantoTreeDataProviderUtils.buildTreeItemsFromTestResultsTree(TesterantoTreeDataProviderUtils.collatedTestResults);
        }

        if (TesterantoTreeDataProviderUtils.testResults.size === 0) {
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

        for (const [testName, results] of TesterantoTreeDataProviderUtils.testResults.entries()) {
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

    static getProcessItems(): TestTreeItem[] {
        if (TesterantoTreeDataProviderUtils.processes.length === 0) {
            return [
                new TestTreeItem(
                    'No Docker processes found',
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        description: 'Start the Testeranto server'
                    },
                    undefined,
                    new vscode.ThemeIcon('info')
                )
            ];
        }

        return TesterantoTreeDataProviderUtils.processes.map(process => {
            const isActive = process.isActive === true;
            return new TestTreeItem(
                process.name || process.containerId,
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    processId: process.containerId,
                    status: process.status,
                    isActive: isActive,
                    runtime: process.runtime,
                    description: `${process.status} - ${process.runtime}`
                },
                undefined,
                isActive ?
                    new vscode.ThemeIcon('play', new vscode.ThemeColor('testing.iconPassed')) :
                    new vscode.ThemeIcon('stop', new vscode.ThemeColor('testing.iconFailed'))
            );
        });
    }

    static getReportItems(): TestTreeItem[] {
        return [
            new TestTreeItem(
                'Generate HTML Report',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    description: 'Create static report for stakeholders'
                },
                {
                    command: 'testeranto.generateHtmlReport',
                    title: 'Generate Report'
                },
                new vscode.ThemeIcon('file-code')
            )
        ];
    }

    static getTestInputRuntimeItems(runtime: string): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        const testEntries = TesterantoTreeDataProviderUtils.testInputFiles.get(runtime);

        if (!testEntries || testEntries.length === 0) {
            items.push(
                new TestTreeItem(
                    'No tests found',
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        description: 'This runtime has no tests configured'
                    },
                    undefined,
                    new vscode.ThemeIcon('info')
                )
            );
            return items;
        }

        for (const entry of testEntries) {
            items.push(
                new TestTreeItem(
                    entry.testName,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    {
                        section: 'test-inputs-test',
                        runtime: runtime,
                        testName: entry.testName,
                        description: `${entry.files.length} files`
                    },
                    undefined,
                    new vscode.ThemeIcon('beaker')
                )
            );
        }

        return items;
    }

    static getTestInputTestItems(runtime: string, testName: string): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        const testEntries = TesterantoTreeDataProviderUtils.testInputFiles.get(runtime);

        if (!testEntries) {
            return items;
        }

        const entry = testEntries.find(e => e.testName === testName);
        if (!entry || entry.files.length === 0) {
            items.push(
                new TestTreeItem(
                    'No files found',
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        description: 'This test has no input files'
                    },
                    undefined,
                    new vscode.ThemeIcon('info')
                )
            );
            return items;
        }

        const treeRoot = buildTreeFromPaths(entry.files);
        return TesterantoTreeDataProviderUtils.buildTreeItemsFromNode(treeRoot, 'test-input');
    }

    static getTestResultChildren(testName: string): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        const results = TesterantoTreeDataProviderUtils.testResults.get(testName);

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

    static getTestResultRuntimeChildren(testName: string, runtime: string): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        const results = TesterantoTreeDataProviderUtils.testResults.get(testName);

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

    static getTestResultsConfigItems(configKey: string): TestTreeItem[] {
        const items: TestTreeItem[] = [];

        if (!TesterantoTreeDataProviderUtils.collatedTestResults[configKey]) {
            return items;
        }

        const configData = TesterantoTreeDataProviderUtils.collatedTestResults[configKey];
        const tests = configData.tests || {};

        const treeRoot: Record<string, any> = {};

        for (const [testName, testInfo] of Object.entries(tests)) {
            const info = testInfo as any;
            const results = info.results || [];

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
            let currentNode = treeRoot;

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
                            runtime: configData.runtime,
                            passed: passed,
                            failed: failed,
                            total: results.length,
                            results: results
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
                }

                if (!isLast && currentNode[part].type === 'directory') {
                    currentNode = currentNode[part].children;
                }
            }
        }

        return TesterantoTreeDataProviderUtils.buildTreeItemsFromTestResultsTreeForConfig(treeRoot, configKey);
    }

    static getTestResultsDirectoryItems(path: string, parentRuntime?: string): TestTreeItem[] {
        return [];
    }

    static getDocumentationChildren(filePath: string): TestTreeItem[] {
        const parts = filePath.split('/').filter(part => part.length > 0);
        let currentNode = TesterantoTreeDataProviderUtils.documentationTree;

        for (const part of parts) {
            if (currentNode[part] && currentNode[part].type === 'directory') {
                currentNode = currentNode[part].children;
            } else {
                return [];
            }
        }

        return buildTreeItemsFromCollatedTree(currentNode, 'documentation', filePath);
    }

    static getTestInputChildren(filePath: string): TestTreeItem[] {
        const parts = filePath.split('/').filter(part => part.length > 0);
        let currentNode = TesterantoTreeDataProviderUtils.inputFilesTree;

        for (const part of parts) {
            if (currentNode[part]) {
                const node = currentNode[part];
                if (node.type === 'directory' && node.children) {
                    currentNode = node.children;
                } else if (Array.isArray(node)) {
                    return [];
                } else {
                    return [];
                }
            } else {
                return [];
            }
        }

        return TesterantoTreeDataProviderUtils.buildTreeItemsFromInputFilesTree(currentNode, 'test-inputs', filePath);
    }

    // Keep all the existing static helper methods (fetchCollatedDocumentation, buildTreeFromPaths, etc.)
    // They remain unchanged
    static async fetchCollatedDocumentation(): Promise<any> {
        const response = await fetch('http://localhost:3000/~/collated-documentation');
        return response.json();
    }

    static async fetchCollatedInputFiles(): Promise<any> {
        const response = await fetch('http://localhost:3000/~/collated-inputfiles');
        return response.json();
    }

    static async fetchCollatedTestResults(): Promise<any> {
        const response = await fetch('http://localhost:3000/~/collated-testresults');
        return response.json();
    }

    static async loadDocumentationFiles(): Promise<string[]> {
        try {
            const response = await fetch('http://localhost:3000/~/collated-documentation');
            const data = await response.json();
            return data.files || [];
        } catch (error) {
            const response = await fetch('http://localhost:3000/~/documentation');
            const data = await response.json();
            return data.files || [];
        }
    }


    static async loadTestInputFiles(): Promise<Map<string, any[]>> {
        const testInputFiles = new Map<string, any[]>();

        try {
            const response = await fetch('http://localhost:3000/~/collated-inputfiles');
            const data = await response.json();

            if (data.fsTree) {
                TesterantoTreeDataProviderUtils.processFilesystemTree(data.fsTree, testInputFiles);
            } else if (data.collatedInputFiles) {
                for (const [runtimeKey, runtimeData] of Object.entries(data.collatedInputFiles as any)) {
                    const runtimeInfo = runtimeData as any;
                    const tests = runtimeInfo.tests || {};

                    const testEntries = [];
                    for (const [testName, testInfo] of Object.entries(tests)) {
                        const info = testInfo as any;
                        testEntries.push({
                            testName: testName,
                            files: info.inputFiles || [],
                            count: info.count || 0
                        });
                    }

                    if (testEntries.length > 0) {
                        testInputFiles.set(runtimeKey, testEntries);
                    }
                }
            } else {
                const configsResponse = await fetch('http://localhost:3000/~/configs');
                const configsData = await configsResponse.json();
                const configs = configsData.configs;

                if (configs?.runtimes) {
                    for (const [runtimeKey, runtimeConfig] of Object.entries(configs.runtimes as any)) {
                        const config = runtimeConfig as any;
                        const tests = config.tests || [];

                        for (const testName of tests) {
                            try {
                                const inputResponse = await fetch(
                                    `http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtimeKey)}&testName=${encodeURIComponent(testName)}`
                                );
                                const inputData = await inputResponse.json();
                                const files = inputData.inputFiles || [];

                                if (!testInputFiles.has(runtimeKey)) {
                                    testInputFiles.set(runtimeKey, []);
                                }

                                testInputFiles.get(runtimeKey)!.push({
                                    testName: testName,
                                    files: files
                                });
                            } catch (error) {
                            }
                        }
                    }
                }
            }
        } catch (error) {
        }

        return testInputFiles;
    }

    static processFilesystemTree(tree: Record<string, any>, testInputFiles: Map<string, any[]>): void {
        const processNode = (node: any, path: string = ''): void => {
            if (!node) return;

            if (node.type === 'test') {
                const runtime = node.runtime || 'unknown';
                const testName = node.path || path;
                const inputFiles = node.inputFiles || [];

                if (!testInputFiles.has(runtime)) {
                    testInputFiles.set(runtime, []);
                }

                testInputFiles.get(runtime)!.push({
                    testName: testName,
                    files: inputFiles,
                    count: node.count || 0
                });
            }

            if (node.children) {
                for (const [childName, childNode] of Object.entries(node.children)) {
                    const childPath = path ? `${path}/${childName}` : childName;
                    processNode(childNode, childPath);
                }
            }

            if (Array.isArray(node)) {
                for (const item of node) {
                    processNode(item, path);
                }
            }
        };

        for (const [key, value] of Object.entries(tree)) {
            processNode(value, key);
        }
    }

    static async loadTestResults(): Promise<Map<string, any[]>> {
        const testResults = new Map<string, any[]>();

        try {
            const response = await fetch('http://localhost:3000/~/collated-testresults');
            if (response.ok) {
                const data = await response.json();

                if (data.collatedTestResults) {
                    for (const [configKey, configData] of Object.entries(data.collatedTestResults as any)) {
                        const configInfo = configData as any;
                        const tests = configInfo.tests || {};

                        for (const [testName, testInfo] of Object.entries(tests)) {
                            const info = testInfo as any;
                            const results = info.results || [];

                            if (!testResults.has(testName)) {
                                testResults.set(testName, []);
                            }

                            const resultsWithConfig = results.map((result: any) => ({
                                ...result,
                                configKey: configKey,
                                runtime: configInfo.runtime,
                                runtimeType: configInfo.runtime
                            }));

                            testResults.get(testName)!.push(...resultsWithConfig);
                        }
                    }
                    return testResults;
                }
            }

            const fallbackResponse = await fetch('http://localhost:3000/~/testresults');
            if (!fallbackResponse.ok) {
                return testResults;
            }

            const fallbackData = await fallbackResponse.json();

            if (fallbackData.testResults && Array.isArray(fallbackData.testResults)) {
                for (const testResult of fallbackData.testResults) {
                    let testName = testResult.testName ||
                        testResult.result?.name ||
                        testResult.file?.replace('.json', '') ||
                        'Unknown';

                    if (testResult.runtime && testName.startsWith(`${testResult.runtime}.`)) {
                        testName = testName.substring(testResult.runtime.length + 1);
                    }

                    if (testName === 'Unknown' && testResult.file) {
                        const fileName = testResult.file;
                        const patterns = [
                            /^[^\.]+\.(.+)\.json$/,
                            /^(.+)\.json$/
                        ];

                        for (const pattern of patterns) {
                            const match = fileName.match(pattern);
                            if (match && match[1]) {
                                testName = match[1];
                                break;
                            }
                        }
                    }

                    if (!testResults.has(testName)) {
                        testResults.set(testName, []);
                    }
                    testResults.get(testName)!.push(testResult);
                }
            }
        } catch (error) {
        }

        return testResults;
    }

    static async loadProcesses(): Promise<any[]> {
        try {
            const response = await fetch('http://localhost:3000/~/processes');
            const data = await response.json();
            return data.processes || [];
        } catch (error) {
            return [];
        }
    }

    static async loadAllData(): Promise<{
        documentationFiles: string[];
        documentationTree: Record<string, any>;
        testInputFiles: Map<string, any[]>;
        inputFilesTree: Record<string, any>;
        testResults: Map<string, any[]>;
        collatedTestResults: Record<string, any>;
        processes: any[];
    }> {
        await new Promise(resolve => setTimeout(resolve, 100));

        const [
            documentationData,
            testInputData,
            testResultsData,
            processes
        ] = await Promise.all([
            TesterantoTreeDataProviderUtils.loadDocumentationData(),
            TesterantoTreeDataProviderUtils.loadTestInputData(),
            TesterantoTreeDataProviderUtils.loadTestResultsData(),
            TesterantoTreeDataProviderUtils.loadProcesses()
        ]);

        return {
            documentationFiles: documentationData.documentationFiles,
            documentationTree: documentationData.documentationTree,
            testInputFiles: testInputData.testInputFiles,
            inputFilesTree: testInputData.inputFilesTree,
            testResults: testResultsData.testResults,
            collatedTestResults: testResultsData.collatedTestResults,
            processes
        };
    }

    static async loadDocumentationData(): Promise<{
        documentationFiles: string[];
        documentationTree: Record<string, any>;
    }> {
        const documentationFiles: string[] = [];
        let documentationTree: Record<string, any> = {};

        try {
            const response = await fetch('http://localhost:3000/~/collated-documentation');
            const data = await response.json();

            if (data.tree) {
                documentationTree = data.tree;
                documentationFiles.push(...(data.files || []));
            } else {
                const files = await TesterantoTreeDataProviderUtils.loadDocumentationFiles();
                documentationFiles.push(...files);
            }
        } catch (error) {
            const files = await TesterantoTreeDataProviderUtils.loadDocumentationFiles();
            documentationFiles.push(...files);
        }

        return { documentationFiles, documentationTree };
    }

    static async loadTestInputData(): Promise<{
        testInputFiles: Map<string, any[]>;
        inputFilesTree: Record<string, any>;
    }> {
        const testInputFiles = new Map<string, any[]>();
        let inputFilesTree: Record<string, any> = {};

        try {
            const response = await fetch('http://localhost:3000/~/collated-inputfiles');
            const data = await response.json();

            if (data.fsTree) {
                inputFilesTree = data.fsTree;
                TesterantoTreeDataProviderUtils.processFilesystemTree(data.fsTree, testInputFiles);
            } else if (data.collatedInputFiles) {
                for (const [runtimeKey, runtimeData] of Object.entries(data.collatedInputFiles as any)) {
                    const runtimeInfo = runtimeData as any;
                    const tests = runtimeInfo.tests || {};

                    const testEntries = [];
                    for (const [testName, testInfo] of Object.entries(tests)) {
                        const info = testInfo as any;
                        testEntries.push({
                            testName: testName,
                            files: info.inputFiles || [],
                            count: info.count || 0
                        });
                    }

                    if (testEntries.length > 0) {
                        testInputFiles.set(runtimeKey, testEntries);
                    }
                }
            } else {
                const files = await TesterantoTreeDataProviderUtils.loadTestInputFiles();
                for (const [key, value] of files.entries()) {
                    testInputFiles.set(key, value);
                }
            }
        } catch (error) {
            const files = await TesterantoTreeDataProviderUtils.loadTestInputFiles();
            for (const [key, value] of files.entries()) {
                testInputFiles.set(key, value);
            }
        }

        return { testInputFiles, inputFilesTree };
    }

    static async loadTestResultsData(): Promise<{
        testResults: Map<string, any[]>;
        collatedTestResults: Record<string, any>;
    }> {
        const testResults = new Map<string, any[]>();
        let collatedTestResults: Record<string, any> = {};

        try {
            const response = await fetch('http://localhost:3000/~/collated-testresults');
            const data = await response.json();

            if (data.collatedTestResults) {
                collatedTestResults = data.collatedTestResults;

                for (const [configKey, configData] of Object.entries(data.collatedTestResults as any)) {
                    const configInfo = configData as any;
                    const tests = configInfo.tests || {};

                    for (const [testName, testInfo] of Object.entries(tests)) {
                        const info = testInfo as any;
                        const results = info.results || [];

                        if (!testResults.has(testName)) {
                            testResults.set(testName, []);
                        }

                        const resultsWithConfig = results.map((result: any) => ({
                            ...result,
                            configKey: configKey,
                            runtime: configInfo.runtime,
                            runtimeType: configInfo.runtime
                        }));

                        testResults.get(testName)!.push(...resultsWithConfig);
                    }
                }
            } else {
                const results = await TesterantoTreeDataProviderUtils.loadTestResults();
                for (const [key, value] of results.entries()) {
                    testResults.set(key, value);
                }
            }
        } catch (error) {
            const results = await TesterantoTreeDataProviderUtils.loadTestResults();
            for (const [key, value] of results.entries()) {
                testResults.set(key, value);
            }
        }

        return { testResults, collatedTestResults };
    }

    // Keep all the existing buildTreeItemsFrom* methods (they remain unchanged)

    static buildTreeItemsFromNode(node: any, context: string): TestTreeItem[] {
        return buildTreeItemsFromNode(node, context);
    }

    static buildTreeItemsFromInputFilesTree(tree: Record<string, any>, context: string, parentPath: string = ''): TestTreeItem[] {
        const items: TestTreeItem[] = [];

        const keys = Object.keys(tree).sort((a, b) => {
            const aNode = tree[a];
            const bNode = tree[b];

            const aIsArray = Array.isArray(aNode);
            const bIsArray = Array.isArray(bNode);

            if (aIsArray || bIsArray) {
                if (aIsArray && !bIsArray) return 1;
                if (!aIsArray && bIsArray) return -1;
            }

            const aIsDir = !aIsArray && aNode.type === 'directory';
            const bIsDir = !bIsArray && bNode.type === 'directory';

            if (aIsDir && !bIsDir) return -1;
            if (!aIsDir && bIsDir) return 1;

            return a.localeCompare(b);
        });

        for (const key of keys) {
            const node = tree[key];

            if (Array.isArray(node)) {
                for (const item of node) {
                    const isTest = item.type === 'test';
                    const isFile = item.type === 'file';
                    const collapsibleState = vscode.TreeItemCollapsibleState.None;

                    let description = '';
                    if (isTest) {
                        description = `Test (${item.count || 0} input files)`;
                    } else if (isFile) {
                        description = `Input file for ${item.testName || 'unknown test'}`;
                    }

                    const treeItem = new TestTreeItem(
                        key,
                        TreeItemType.File,
                        collapsibleState,
                        {
                            filePath: parentPath ? `${parentPath}/${key}` : key,
                            originalPath: item.path,
                            isFile: true,
                            context: context,
                            description: description,
                            runtime: item.runtime,
                            testName: item.testName,
                            inputFiles: item.inputFiles,
                            count: item.count
                        },
                        undefined,
                        isTest ? new vscode.ThemeIcon('beaker') : new vscode.ThemeIcon('file')
                    );
                    items.push(treeItem);
                }
                continue;
            }

            const isDir = node.type === 'directory';
            const isTest = node.type === 'test';
            const isFile = node.type === 'file';

            const collapsibleState = isDir
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None;

            let description = '';
            if (isTest) {
                description = `Test (${node.count || 0} input files)`;
            } else if (isFile) {
                description = `Input file for ${node.testName || 'unknown test'}`;
            } else if (isDir) {
                description = 'Directory';
            }

            const treeItem = new TestTreeItem(
                key,
                TreeItemType.File,
                collapsibleState,
                {
                    filePath: parentPath ? `${parentPath}/${key}` : key,
                    originalPath: node.path,
                    isFile: !isDir,
                    context: context,
                    description: description,
                    runtime: node.runtime,
                    testName: node.testName,
                    inputFiles: node.inputFiles,
                    count: node.count
                },
                undefined,
                isTest ? new vscode.ThemeIcon('beaker') :
                    isFile ? new vscode.ThemeIcon('file') :
                        new vscode.ThemeIcon('folder')
            );

            items.push(treeItem);
        }

        return items;
    }

    static buildTreeItemsFromTestResultsTree(tree: Record<string, any>): TestTreeItem[] {
        const items: TestTreeItem[] = [];

        const keys = Object.keys(tree).sort((a, b) => {
            const aNode = tree[a];
            const bNode = tree[b];

            const aIsDir = aNode.type === 'directory' || aNode.type === 'runtime';
            const bIsDir = bNode.type === 'directory' || bNode.type === 'runtime';

            if (aIsDir && !bIsDir) return -1;
            if (!aIsDir && bIsDir) return 1;
            return a.localeCompare(b);
        });

        for (const key of keys) {
            const node = tree[key];

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

    static buildTreeItemsFromTestResultsTreeForConfig(tree: Record<string, any>, configKey: string): TestTreeItem[] {
        return buildTreeItemsFromTestResultsTreeForConfig(tree, configKey);
    }

    static buildTestResultsTree(collatedTestResults: Record<string, any>): TestTreeItem[] {
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

        return TesterantoTreeDataProviderUtils.buildTreeItemsFromTestResultsTree(treeRoot);
    }
}
