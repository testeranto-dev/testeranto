import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { TesterantoTreeDataProviderUtils } from './TesterantoTreeDataProviderUtils';

export class TesterantoTreeDataProvider implements vscode.TreeDataProvider<TestTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TestTreeItem | undefined | null | void> = new
        vscode.EventEmitter<TestTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TestTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private documentationFiles: string[] = [];
    private testInputFiles: Map<string, string[]> = new Map();
    private testResults: Map<string, any[]> = new Map();
    private processes: any[] = [];
    private ws: WebSocket | null = null;

    constructor() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            this.loadInitialData();
            this.connectWebSocket();
        }
        this.setupWorkspaceWatcher();
    }

    refresh(): void {
        this.loadInitialData();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TestTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TestTreeItem): Thenable<TestTreeItem[]> {
        if (!element) {
            return Promise.resolve(this.getRootItems());
        }
        
        const data = element.data;
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
        } else if (data?.filePath) {
            return Promise.resolve(this.getFileChildren(data.filePath));
        }
        
        return Promise.resolve([]);
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
        const files = await TesterantoTreeDataProviderUtils.loadDocumentationFiles();
        console.log(`[TesterantoTreeDataProvider] Loaded ${files.length} documentation files:`, files);
        this.documentationFiles = files;
    }


    private async loadTestInputFiles(): Promise<void> {
        console.log('[TesterantoTreeDataProvider] Loading test input files...');
        try {
            const response = await fetch('http://localhost:3000/~/configs');
            const data = await response.json();
            const configs = data.configs;
            
            if (configs?.runtimes) {
                console.log(`[TesterantoTreeDataProvider] Found ${Object.keys(configs.runtimes).length} runtimes`);
                
                // Clear existing data
                this.testInputFiles.clear();
                
                for (const [runtimeKey, runtimeConfig] of Object.entries(configs.runtimes as any)) {
                    const config = runtimeConfig as any;
                    const tests = config.tests || [];
                    console.log(`[TesterantoTreeDataProvider] Runtime ${runtimeKey} has ${tests.length} tests`);
                    
                    for (const testName of tests) {
                        console.log(`[TesterantoTreeDataProvider] Fetching input files for ${runtimeKey}/${testName}`);
                        try {
                            const inputResponse = await fetch(
                                `http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtimeKey)}&testName=${encodeURIComponent(testName)}`
                            );
                            const inputData = await inputResponse.json();
                            const files = inputData.inputFiles || [];
                            
                            console.log(`[TesterantoTreeDataProvider] Found ${files.length} input files for ${runtimeKey}/${testName}`);
                            
                            if (!this.testInputFiles.has(runtimeKey)) {
                                this.testInputFiles.set(runtimeKey, []);
                            }
                            // Store test name and files as an object
                            this.testInputFiles.get(runtimeKey)!.push({
                                testName: testName,
                                files: files
                            });
                        } catch (error) {
                            console.error(`[TesterantoTreeDataProvider] Failed to fetch input files for ${runtimeKey}/${testName}:`, error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[TesterantoTreeDataProvider] Error loading test input files:', error);
        }
    }

    private async loadTestResults(): Promise<void> {
        try {
            console.log('[TesterantoTreeDataProvider] Loading test results...');
            const response = await fetch('http://localhost:3000/~/testresults');
            if (!response.ok) {
                console.error(`[TesterantoTreeDataProvider] Failed to fetch test results: ${response.status} ${response.statusText}`);
                // Try to get all test results without parameters
                const allResponse = await fetch('http://localhost:3000/~/testresults');
                if (allResponse.ok) {
                    const allData = await allResponse.json();
                    this.processTestResults(allData);
                }
                return;
            }
            const data = await response.json();
            console.log(`[TesterantoTreeDataProvider] Received test results data:`, data);
            
            this.processTestResults(data);
            
        } catch (error) {
            console.error('[TesterantoTreeDataProvider] Error loading test results:', error);
        }
    }

    private processTestResults(data: any): void {
        // Clear existing results
        this.testResults.clear();
        
        // Process the test results
        if (data.testResults && Array.isArray(data.testResults)) {
            console.log(`[TesterantoTreeDataProvider] Processing ${data.testResults.length} test results`);
            for (const testResult of data.testResults) {
                // Try to get test name from various possible locations
                let testName = testResult.testName || 
                              testResult.result?.name || 
                              testResult.file?.replace('.json', '') || 
                              'Unknown';
                
                // If testName contains runtime prefix, remove it
                if (testResult.runtime && testName.startsWith(`${testResult.runtime}.`)) {
                    testName = testName.substring(testResult.runtime.length + 1);
                }
                
                // Also try to extract from file name if it contains test info
                if (testName === 'Unknown' && testResult.file) {
                    const fileName = testResult.file;
                    // Try to extract test name from filename patterns
                    const patterns = [
                        /^[^\.]+\.(.+)\.json$/,  // runtime.testname.json
                        /^(.+)\.json$/           // testname.json
                    ];
                    
                    for (const pattern of patterns) {
                        const match = fileName.match(pattern);
                        if (match && match[1]) {
                            testName = match[1];
                            break;
                        }
                    }
                }
                
                console.log(`[TesterantoTreeDataProvider] Processing test result for: ${testName}`);
                
                if (!this.testResults.has(testName)) {
                    this.testResults.set(testName, []);
                }
                this.testResults.get(testName)!.push(testResult);
            }
        } else {
            console.log('[TesterantoTreeDataProvider] No testResults array found in response');
        }
        
        console.log(`[TesterantoTreeDataProvider] Loaded ${this.testResults.size} unique tests`);
    }

    private async loadProcesses(): Promise<void> {
        const response = await fetch('http://localhost:3000/~/processes');
        const data = await response.json();
        this.processes = data.processes;
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

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return [
                new TestTreeItem(
                    'No workspace folder open',
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        description: 'Open a workspace to view documentation'
                    },
                    undefined,
                    new vscode.ThemeIcon('warning')
                )
            ];
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const cwd = process.cwd();
        
        return this.documentationFiles.map(file => {
            const fileName = path.basename(file);
            // Try to create an absolute path
            let fullPath: string;
            if (path.isAbsolute(file)) {
                fullPath = file;
            } else {
                // First try relative to workspace root
                fullPath = path.join(workspaceRoot, file);
                // If it doesn't exist, try relative to cwd
                if (!fs.existsSync(fullPath)) {
                    fullPath = path.join(cwd, file);
                }
            }
            
            const description = path.dirname(file);
            return new TestTreeItem(
                fileName,
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    filePath: file,
                    description: description !== '.' ? description : ''
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

    private getTestResultItems(): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        
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
        
        // Build a tree structure from file paths
        const treeRoot: any = { name: '', children: new Map(), fullPath: '', isFile: false };
        
        for (const filePath of entry.files) {
            const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
            const parts = normalizedPath.split('/').filter(part => part.length > 0 && part !== '.');
            
            if (parts.length === 0) continue;
            
            let currentNode = treeRoot;
            
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isLast = i === parts.length - 1;
                
                if (!currentNode.children.has(part)) {
                    currentNode.children.set(part, {
                        name: part,
                        children: new Map(),
                        fullPath: parts.slice(0, i + 1).join('/'),
                        isFile: isLast
                    });
                }
                currentNode = currentNode.children.get(part);
            }
        }
        
        // Convert tree to TestTreeItems
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const workspaceRoot = workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : process.cwd();
        
        const buildItems = (node: any): TestTreeItem[] => {
            const items: TestTreeItem[] = [];
            const sortedChildren = Array.from(node.children.values()).sort((a: any, b: any) => {
                if (!a.isFile && b.isFile) return -1;
                if (a.isFile && !b.isFile) return 1;
                return a.name.localeCompare(b.name);
            });
            
            for (const child of sortedChildren) {
                const collapsibleState = child.isFile 
                    ? vscode.TreeItemCollapsibleState.None 
                    : vscode.TreeItemCollapsibleState.Collapsed;
                
                let fileUri: vscode.Uri | undefined;
                if (child.isFile) {
                    const fullPath = path.isAbsolute(child.fullPath) 
                        ? child.fullPath 
                        : path.join(workspaceRoot, child.fullPath);
                    fileUri = vscode.Uri.file(fullPath);
                }
                
                const treeItem = new TestTreeItem(
                    child.name,
                    TreeItemType.File,
                    collapsibleState,
                    {
                        filePath: child.fullPath,
                        isFile: child.isFile,
                        runtime: runtime,
                        testName: testName
                    },
                    child.isFile && fileUri ? {
                        command: 'vscode.open',
                        title: 'Open File',
                        arguments: [fileUri]
                    } : undefined,
                    child.isFile ? new vscode.ThemeIcon('file-text') : new vscode.ThemeIcon('folder')
                );
                
                items.push(treeItem);
            }
            
            return items;
        };
        
        return buildItems(treeRoot);
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
    
    private getFileChildren(filePath: string): TestTreeItem[] {
        return [];
    }

    private connectWebSocket(): void {
        this.ws = new WebSocket('ws://localhost:3000');
        
        this.ws.onopen = () => {
            console.log('[TesterantoTreeDataProvider] WebSocket connected');
        };
        
        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'resourceChanged') {
                    console.log(`[TesterantoTreeDataProvider] Resource changed: ${message.url}`);
                    // Refresh all data when any resource changes
                    this.loadInitialData().then(() => {
                        this._onDidChangeTreeData.fire();
                    });
                }
            } catch (error) {
                console.error('[TesterantoTreeDataProvider] Error handling WebSocket message:', error);
            }
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        this.ws.onclose = () => {
            console.log('WebSocket closed');
        };
    }

    public dispose(): void {
        if (this.ws) {
            this.ws.close();
        }
    }

    private setupWorkspaceWatcher(): void {
        vscode.workspace.onDidChangeWorkspaceFolders((event) => {
            if (event.added.length > 0) {
                this.loadInitialData();
                this.connectWebSocket();
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
