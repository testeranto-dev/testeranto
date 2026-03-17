import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { TesterantoTreeDataProviderUtils } from './TesterantoTreeDataProviderUtils';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';

export class TesterantoTreeDataProvider extends BaseTreeDataProvider {
    private documentationFiles: string[] = [];
    private documentationTree: Record<string, any> = {};
    private testInputFiles: Map<string, any[]> = new Map();
    private inputFilesTree: Record<string, any> = {};
    private testResults: Map<string, any[]> = new Map();
    private collatedTestResults: Record<string, any> = {};
    private processes: any[] = [];

    constructor() {
        super();
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            this.loadInitialData();
        }
        this.setupWorkspaceWatcher();
    }

    refresh(): void {
        this.loadInitialData();
        super.refresh();
    }

    getTreeItem(element: TestTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TestTreeItem): Thenable<TestTreeItem[]> {
        if (!element) {
            return Promise.resolve(this.getRootItems());
        }
        
        const data = element.data as any;
        if (data?.section === 'documentation') {
            return Promise.resolve(this.getDocumentationItems());
        } else if (data?.section === 'test-inputs') {
            return Promise.resolve(this.getTestInputItems());
        } else if (data?.section === 'test-inputs-runtime') {
            return Promise.resolve(this.getTestInputRuntimeItems(data.runtime));
        } else if (data?.section === 'test-inputs-test') {
            return Promise.resolve(this.getTestInputTestItems(data.runtime, data.testName));
        } else if (data?.section === 'test-results') {
            return Promise.resolve(this.getTestResultItems());
        } else if (data?.testName && data?.section === undefined) {
            // This is a test result item being expanded
            return Promise.resolve(this.getTestResultChildren(data.testName));
        } else if (data?.testName && data?.runtime && data?.section === undefined) {
            // This is a runtime item under a test result being expanded
            return Promise.resolve(this.getTestResultRuntimeChildren(data.testName, data.runtime));
        } else if (data?.section === 'processes') {
            return Promise.resolve(this.getProcessItems());
        } else if (data?.section === 'reports') {
            return Promise.resolve(this.getReportItems());
        } else if (data?.section === 'test-results-config') {
            return Promise.resolve(this.getTestResultsConfigItems(data.configKey));
        } else if (data?.section === 'test-results-directory') {
            return Promise.resolve(this.getTestResultsDirectoryItems(data.path, data.parentRuntime));
        } else if (data?.filePath && data?.context === 'documentation') {
            // Handle expanding documentation tree nodes
            return Promise.resolve(this.getDocumentationChildren(data.filePath));
        } else if (data?.filePath && data?.context === 'test-inputs') {
            // Handle expanding test input tree nodes
            return Promise.resolve(this.getTestInputChildren(data.filePath));
        } else if (data?.filePath) {
            return Promise.resolve(this.getFileChildren(data.filePath));
        }
        
        return Promise.resolve([]);
    }

    private getTestInputChildren(filePath: string): TestTreeItem[] {
        // Navigate through the input files tree to find the node
        const parts = filePath.split('/').filter(part => part.length > 0);
        let currentNode = this.inputFilesTree;
        
        for (const part of parts) {
            if (currentNode[part]) {
                const node = currentNode[part];
                // Check if this is a directory with children
                if (node.type === 'directory' && node.children) {
                    currentNode = node.children;
                } else if (Array.isArray(node)) {
                    // If it's an array, we're at a leaf node
                    return [];
                } else {
                    // Node not found or not a directory
                    return [];
                }
            } else {
                // Node not found
                return [];
            }
        }
        
        // Build tree items for this node's children
        return this.buildTreeItemsFromInputFilesTree(currentNode, 'test-inputs', filePath);
    }

    private async loadInitialData(): Promise<void> {
        // Load documentation files first with a small delay to ensure server is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        await Promise.all([
            this.loadDocumentationFiles(),
            this.loadTestInputFiles(),
            this.loadTestResults(),
            this.loadProcesses()
        ]);
    }

    private async loadDocumentationFiles(): Promise<void> {
        console.log('[TesterantoTreeDataProvider] Loading documentation files...');
        try {
            // Try to get the collated documentation which includes tree structure
            const response = await fetch('http://localhost:3000/~/collated-documentation');
            const data = await response.json();
            
            if (data.tree) {
                console.log('[TesterantoTreeDataProvider] Loaded collated documentation tree');
                // Store the tree structure for later use
                this.documentationTree = data.tree;
                // Also store the files array
                this.documentationFiles = data.files || [];
            } else {
                // Fallback to regular endpoint
                const files = await TesterantoTreeDataProviderUtils.loadDocumentationFiles();
                console.log(`[TesterantoTreeDataProvider] Loaded ${files.length} documentation files:`, files);
                this.documentationFiles = files;
            }
        } catch (error) {
            console.error('[TesterantoTreeDataProvider] Error loading collated documentation:', error);
            // Fallback to regular endpoint
            const files = await TesterantoTreeDataProviderUtils.loadDocumentationFiles();
            console.log(`[TesterantoTreeDataProvider] Loaded ${files.length} documentation files:`, files);
            this.documentationFiles = files;
        }
    }

    private async loadTestInputFiles(): Promise<void> {
        console.log('[TesterantoTreeDataProvider] Loading test input files...');
        try {
            // Try to get collated input files
            const response = await fetch('http://localhost:3000/~/collated-inputfiles');
            const data = await response.json();
            
            if (data.fsTree) {
                console.log(`[TesterantoTreeDataProvider] Loaded filesystem tree for input files`);
                // Store the filesystem tree for display
                this.inputFilesTree = data.fsTree;
                // Also convert to the old Map format for compatibility
                const testInputFiles = new Map<string, any[]>();
                TesterantoTreeDataProviderUtils.processFilesystemTree(data.fsTree, testInputFiles);
                this.testInputFiles = testInputFiles;
            } else if (data.collatedInputFiles) {
                console.log(`[TesterantoTreeDataProvider] Loaded collated input files for ${Object.keys(data.collatedInputFiles).length} runtimes`);
                // Convert the collated structure to our Map format
                const testInputFiles = new Map<string, any[]>();
                
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
                
                this.testInputFiles = testInputFiles;
            } else {
                // Fallback to individual requests
                this.testInputFiles = await TesterantoTreeDataProviderUtils.loadTestInputFiles();
                console.log(`[TesterantoTreeDataProvider] Loaded ${this.testInputFiles.size} runtimes with test input files`);
            }
        } catch (error) {
            console.error('[TesterantoTreeDataProvider] Error loading collated input files:', error);
            // Fallback to individual requests
            this.testInputFiles = await TesterantoTreeDataProviderUtils.loadTestInputFiles();
            console.log(`[TesterantoTreeDataProvider] Loaded ${this.testInputFiles.size} runtimes with test input files`);
        }
    }

    private async loadTestResults(): Promise<void> {
        console.log('[TesterantoTreeDataProvider] Loading test results...');
        try {
            // Try to get collated test results which includes tree structure
            const response = await fetch('http://localhost:3000/~/collated-testresults');
            const data = await response.json();
            
            if (data.collatedTestResults) {
                console.log(`[TesterantoTreeDataProvider] Loaded collated test results for ${Object.keys(data.collatedTestResults).length} runtimes`);
                // Store the collated structure for building tree
                this.collatedTestResults = data.collatedTestResults;
                
                // Also convert to the old Map format for compatibility
                const testResults = new Map<string, any[]>();
                
                for (const [configKey, configData] of Object.entries(data.collatedTestResults as any)) {
                    const configInfo = configData as any;
                    const tests = configInfo.tests || {};
                    
                    for (const [testName, testInfo] of Object.entries(tests)) {
                        const info = testInfo as any;
                        const results = info.results || [];
                        
                        if (!testResults.has(testName)) {
                            testResults.set(testName, []);
                        }
                        
                        // Add configKey and runtime information to each result
                        const resultsWithConfig = results.map((result: any) => ({
                            ...result,
                            configKey: configKey,
                            runtime: configInfo.runtime,
                            runtimeType: configInfo.runtime
                        }));
                        
                        testResults.get(testName)!.push(...resultsWithConfig);
                    }
                }
                
                this.testResults = testResults;
            } else {
                // Fallback to regular endpoint
                this.testResults = await TesterantoTreeDataProviderUtils.loadTestResults();
                console.log(`[TesterantoTreeDataProvider] Loaded ${this.testResults.size} unique tests from regular endpoint`);
            }
        } catch (error) {
            console.error('[TesterantoTreeDataProvider] Error loading collated test results:', error);
            // Fallback to regular endpoint
            this.testResults = await TesterantoTreeDataProviderUtils.loadTestResults();
            console.log(`[TesterantoTreeDataProvider] Loaded ${this.testResults.size} unique tests from fallback`);
        }
    }

    private async loadProcesses(): Promise<void> {
        console.log('[TesterantoTreeDataProvider] Loading processes...');
        this.processes = await TesterantoTreeDataProviderUtils.loadProcesses();
        console.log(`[TesterantoTreeDataProvider] Loaded ${this.processes.length} processes`);
    }

    private getRootItems(): TestTreeItem[] {
        const items: TestTreeItem[] = [
            new TestTreeItem(
                '📚 Documentation',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.Collapsed,
                {
                    section: 'documentation',
                    description: `${this.documentationFiles.length} files`
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
                    description: `${this.testResults.size} tests`
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
                    description: `${this.processes.length} containers`
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

    private getDocumentationItems(): TestTreeItem[] {
        if (this.documentationFiles.length === 0) {
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

        // If we have a tree structure from the collated endpoint, use it
        if (Object.keys(this.documentationTree).length > 0) {
            return this.buildTreeItemsFromCollatedTree(this.documentationTree, 'documentation');
        }

        // Otherwise, build a tree from file paths
        const treeRoot = TesterantoTreeDataProviderUtils.buildTreeFromPaths(this.documentationFiles);
        
        // Convert tree to TestTreeItems
        return this.buildTreeItemsFromNode(treeRoot, 'documentation');
    }

    private buildTreeItemsFromCollatedTree(tree: Record<string, any>, context: string, parentPath: string = ''): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        
        // Get all keys and sort them
        const keys = Object.keys(tree).sort((a, b) => {
            const aIsDir = tree[a].type === 'directory';
            const bIsDir = tree[b].type === 'directory';
            
            if (aIsDir && !bIsDir) return -1;
            if (!aIsDir && bIsDir) return 1;
            return a.localeCompare(b);
        });

        for (const key of keys) {
            const node = tree[key];
            const isFile = node.type === 'file';
            const collapsibleState = isFile 
                ? vscode.TreeItemCollapsibleState.None 
                : vscode.TreeItemCollapsibleState.Collapsed;

            let command: vscode.Command | undefined;
            if (isFile && node.path) {
                // Create absolute path for the file
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders && workspaceFolders.length > 0) {
                    const workspaceRoot = workspaceFolders[0].uri.fsPath;
                    const cwd = process.cwd();
                    
                    let fullPath: string;
                    if (path.isAbsolute(node.path)) {
                        fullPath = node.path;
                    } else {
                        // Try relative to workspace root first
                        fullPath = path.join(workspaceRoot, node.path);
                        if (!fs.existsSync(fullPath)) {
                            fullPath = path.join(cwd, node.path);
                        }
                    }
                    
                    command = {
                        command: 'vscode.open',
                        title: 'Open File',
                        arguments: [vscode.Uri.file(fullPath)]
                    };
                }
            }

            const treeItem = new TestTreeItem(
                key,
                TreeItemType.File,
                collapsibleState,
                {
                    filePath: parentPath ? `${parentPath}/${key}` : key,
                    originalPath: node.path,
                    isFile: isFile,
                    context: context,
                    description: isFile ? path.dirname(node.path || '') : ''
                },
                command,
                isFile ? new vscode.ThemeIcon('markdown') : new vscode.ThemeIcon('folder')
            );

            items.push(treeItem);
        }

        return items;
    }

    private buildTreeItemsFromNode(node: any, context: string): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        
        // Sort children: folders first, then files, alphabetically
        const sortedChildren = Array.from(node.children.values()).sort((a: any, b: any) => {
            if (!a.isFile && b.isFile) return -1;
            if (a.isFile && !b.isFile) return 1;
            return a.name.localeCompare(b.name);
        });

        for (const child of sortedChildren) {
            const collapsibleState = child.isFile 
                ? vscode.TreeItemCollapsibleState.None 
                : vscode.TreeItemCollapsibleState.Collapsed;

            let command: vscode.Command | undefined;
            if (child.isFile && child.originalPath) {
                // Create absolute path for the file
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders && workspaceFolders.length > 0) {
                    const workspaceRoot = workspaceFolders[0].uri.fsPath;
                    const cwd = process.cwd();
                    
                    let fullPath: string;
                    if (path.isAbsolute(child.originalPath)) {
                        fullPath = child.originalPath;
                    } else {
                        // Try relative to workspace root first
                        fullPath = path.join(workspaceRoot, child.originalPath);
                        if (!fs.existsSync(fullPath)) {
                            fullPath = path.join(cwd, child.originalPath);
                        }
                    }
                    
                    command = {
                        command: 'vscode.open',
                        title: 'Open File',
                        arguments: [vscode.Uri.file(fullPath)]
                    };
                }
            }

            const treeItem = new TestTreeItem(
                child.name,
                TreeItemType.File,
                collapsibleState,
                {
                    filePath: child.fullPath,
                    originalPath: child.originalPath,
                    isFile: child.isFile,
                    context: context,
                    description: child.isFile ? path.dirname(child.originalPath || '') : ''
                },
                command,
                child.isFile ? new vscode.ThemeIcon('markdown') : new vscode.ThemeIcon('folder')
            );

            items.push(treeItem);
        }

        return items;
    }

    private getTestInputItems(): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        
        if (this.testInputFiles.size === 0) {
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
        
        // If we have a filesystem tree, use it to display a hierarchical view
        if (Object.keys(this.inputFilesTree).length > 0) {
            return this.buildTreeItemsFromInputFilesTree(this.inputFilesTree, 'test-inputs');
        }
        
        // Otherwise, fall back to the runtime-based view
        for (const [runtime, testEntries] of this.testInputFiles.entries()) {
            // Count total files across all tests for this runtime
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

    private buildTreeItemsFromInputFilesTree(tree: Record<string, any>, context: string, parentPath: string = ''): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        
        // Get all keys and sort them
        const keys = Object.keys(tree).sort((a, b) => {
            const aNode = tree[a];
            const bNode = tree[b];
            
            // Handle arrays
            const aIsArray = Array.isArray(aNode);
            const bIsArray = Array.isArray(bNode);
            
            if (aIsArray || bIsArray) {
                // Arrays come last
                if (aIsArray && !bIsArray) return 1;
                if (!aIsArray && bIsArray) return -1;
            }
            
            // Directories before files/tests
            const aIsDir = !aIsArray && aNode.type === 'directory';
            const bIsDir = !bIsArray && bNode.type === 'directory';
            
            if (aIsDir && !bIsDir) return -1;
            if (!aIsDir && bIsDir) return 1;
            
            return a.localeCompare(b);
        });

        for (const key of keys) {
            const node = tree[key];
            
            // Handle arrays (multiple entries at same path)
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

    private getTestResultItems(): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        
        // If we have collated test results, build a tree structure
        if (Object.keys(this.collatedTestResults).length > 0) {
            return this.buildTestResultsTree();
        }
        
        // Fallback to the old flat structure
        if (this.testResults.size === 0) {
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
            // Add a refresh button
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
        
        for (const [testName, results] of this.testResults.entries()) {
            // Calculate passed/failed counts
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
        
        // Sort items: passed tests first, then by name
        items.sort((a, b) => {
            const aFailed = a.data?.failed || 0;
            const bFailed = b.data?.failed || 0;
            
            if (aFailed === 0 && bFailed > 0) return -1;
            if (aFailed > 0 && bFailed === 0) return 1;
            
            return a.label!.localeCompare(b.label!);
        });
        
        return items;
    }

    private buildTestResultsTree(): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        
        if (Object.keys(this.collatedTestResults).length === 0) {
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
        
        // Build tree from collated test results
        const treeRoot: Record<string, any> = {};
        
        // First, organize by configKey
        for (const [configKey, configData] of Object.entries(this.collatedTestResults)) {
            const configInfo = configData as any;
            const tests = configInfo.tests || {};
            const files = configInfo.files || [];
            
            // Add config node
            if (!treeRoot[configKey]) {
                treeRoot[configKey] = {
                    type: 'config',
                    configKey: configKey,
                    runtime: configInfo.runtime,
                    children: {},
                    files: files
                };
            }
            
            // Add test nodes under config
            for (const [testName, testInfo] of Object.entries(tests)) {
                const info = testInfo as any;
                const results = info.results || [];
                const testFiles = info.files || [];
                
                // Calculate stats for this test
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
                
                // Split test name into path parts
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
                        // Update existing test node
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
            
            // Also add files that aren't associated with specific tests
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
        
        // Convert tree to TestTreeItems
        return this.buildTreeItemsFromTestResultsTree(treeRoot);
    }

    private buildTreeItemsFromTestResultsTree(tree: Record<string, any>): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        
        // Sort keys: directories first, then files
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
                // Calculate total stats for this config
                let totalPassed = 0;
                let totalFailed = 0;
                let totalTests = 0;
                
                // Helper function to traverse and calculate stats
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

    private getProcessItems(): TestTreeItem[] {
        if (this.processes.length === 0) {
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

        return this.processes.map(process => {
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

    private getReportItems(): TestTreeItem[] {
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

    private getTestInputRuntimeItems(runtime: string): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        const testEntries = this.testInputFiles.get(runtime);
        
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

    private getTestInputTestItems(runtime: string, testName: string): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        const testEntries = this.testInputFiles.get(runtime);
        
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
        
        // Build a tree structure from file paths using the utility function
        const treeRoot = TesterantoTreeDataProviderUtils.buildTreeFromPaths(entry.files);
        
        // Convert tree to TestTreeItems
        return this.buildTreeItemsFromNode(treeRoot, 'test-input');
    }

    private getTestResultChildren(testName: string): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        const results = this.testResults.get(testName);
        
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
        
        // Group results by runtime
        const resultsByRuntime = new Map<string, any[]>();
        for (const result of results) {
            const runtime = result.runtime || 'unknown';
            if (!resultsByRuntime.has(runtime)) {
                resultsByRuntime.set(runtime, []);
            }
            resultsByRuntime.get(runtime)!.push(result);
        }
        
        // Create items for each runtime
        for (const [runtime, runtimeResults] of resultsByRuntime.entries()) {
            // Calculate stats for this runtime
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
    
    private getTestResultsConfigItems(configKey: string): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        
        if (!this.collatedTestResults[configKey]) {
            return items;
        }
        
        const configData = this.collatedTestResults[configKey];
        const tests = configData.tests || {};
        
        // Build a tree from test names
        const treeRoot: Record<string, any> = {};
        
        for (const [testName, testInfo] of Object.entries(tests)) {
            const info = testInfo as any;
            const results = info.results || [];
            
            // Calculate stats for this test
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
            
            // Split test name into path parts
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
                    // Update existing test node
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
        
        // Convert tree to TestTreeItems
        return this.buildTreeItemsFromTestResultsTreeForConfig(treeRoot, configKey);
    }

    private buildTreeItemsFromTestResultsTreeForConfig(tree: Record<string, any>, configKey: string): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        
        // Sort keys: directories first, then files
        const keys = Object.keys(tree).sort((a, b) => {
            const aNode = tree[a];
            const bNode = tree[b];
            
            const aIsDir = aNode.type === 'directory';
            const bIsDir = bNode.type === 'directory';
            
            if (aIsDir && !bIsDir) return -1;
            if (!aIsDir && bIsDir) return 1;
            return a.localeCompare(b);
        });
        
        for (const key of keys) {
            const node = tree[key];
            
            if (node.type === 'directory') {
                items.push(
                    new TestTreeItem(
                        key,
                        TreeItemType.File,
                        vscode.TreeItemCollapsibleState.Collapsed,
                        {
                            section: 'test-results-directory',
                            path: key,
                            parentRuntime: runtime,
                            description: 'Directory'
                        },
                        undefined,
                        new vscode.ThemeIcon('folder')
                    )
                );
            } else if (node.type === 'test') {
                const description = `${node.passed} passed, ${node.failed} failed (${node.total} total)`;
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
                            runtime: runtime,
                            description: description,
                            passed: node.passed,
                            failed: node.failed,
                            total: node.total,
                            results: node.results
                        },
                        undefined,
                        icon
                    )
                );
            }
        }
        
        return items;
    }

    private getTestResultsDirectoryItems(path: string, parentRuntime?: string): TestTreeItem[] {
        // This would navigate deeper into the directory tree
        // For now, return empty array
        return [];
    }

    private getTestResultRuntimeChildren(testName: string, runtime: string): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        const results = this.testResults.get(testName);
        
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
    
    private getDocumentationChildren(filePath: string): TestTreeItem[] {
        // Navigate through the documentation tree to find the node
        const parts = filePath.split('/').filter(part => part.length > 0);
        let currentNode = this.documentationTree;
        
        for (const part of parts) {
            if (currentNode[part] && currentNode[part].type === 'directory') {
                currentNode = currentNode[part].children;
            } else {
                // Node not found
                return [];
            }
        }
        
        // Build tree items for this node's children
        return this.buildTreeItemsFromCollatedTree(currentNode, 'documentation', filePath);
    }

    private getFileChildren(filePath: string): TestTreeItem[] {
        return [];
    }

    protected handleWebSocketMessage(message: any): void {
        console.log(`[TesterantoTreeDataProvider] WebSocket message: ${message.type}`);
        if (message.type === 'resourceChanged') {
            console.log(`[TesterantoTreeDataProvider] Resource changed: ${message.url}`);
            // Refresh all data when any resource changes
            this.loadInitialData().then(() => {
                this.refresh();
            });
        }
    }

    public dispose(): void {
        super.dispose();
    }

    private setupWorkspaceWatcher(): void {
        vscode.workspace.onDidChangeWorkspaceFolders((event) => {
            if (event.added.length > 0) {
                this.loadInitialData();
                // Reconnect WebSocket when workspace is added
                this.setupWebSocket();
            } else if (event.removed.length > 0) {
                // Clear data if workspace is removed
                this.documentationFiles = [];
                this.testInputFiles.clear();
                this.testResults.clear();
                this.processes = [];
                this._onDidChangeTreeData.fire();
            }
        });
    }
}
