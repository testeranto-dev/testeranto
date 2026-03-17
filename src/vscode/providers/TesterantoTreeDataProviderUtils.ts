import * as path from 'path';

interface TreeNode {
    name: string;
    children: Map<string, TreeNode>;
    fullPath: string;
    isFile: boolean;
    originalPath?: string;
}

export class TesterantoTreeDataProviderUtils {
    static async loadDocumentationFiles(): Promise<string[]> {
        try {
            const response = await fetch('http://localhost:3000/~/collated-documentation');
            const data = await response.json();
            // The collated endpoint returns a tree structure, but we need to extract the files
            // For now, return the files array directly
            return data.files || [];
        } catch (error) {
            console.error('Error loading collated documentation:', error);
            // Fallback to the regular endpoint
            const response = await fetch('http://localhost:3000/~/documentation');
            const data = await response.json();
            return data.files || [];
        }
    }

    static buildTreeFromPaths(filePaths: string[]): TreeNode {
        const root: TreeNode = { 
            name: '', 
            children: new Map(), 
            fullPath: '', 
            isFile: false 
        };

        for (const filePath of filePaths) {
            // Normalize the path
            const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
            const parts = normalizedPath.split('/').filter(part => part.length > 0 && part !== '.');
            
            if (parts.length === 0) continue;
            
            let currentNode = root;
            
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isLast = i === parts.length - 1;
                
                if (!currentNode.children.has(part)) {
                    currentNode.children.set(part, {
                        name: part,
                        children: new Map(),
                        fullPath: parts.slice(0, i + 1).join('/'),
                        isFile: isLast,
                        originalPath: isLast ? filePath : undefined
                    });
                }
                currentNode = currentNode.children.get(part)!;
            }
        }
        
        return root;
    }

    static async loadTestInputFiles(): Promise<Map<string, any[]>> {
        const testInputFiles = new Map<string, any[]>();
        
        try {
            // Use the collated input files endpoint
            const response = await fetch('http://localhost:3000/~/collated-inputfiles');
            const data = await response.json();
            
            if (data.fsTree) {
                // Process the filesystem tree to extract test information
                // We'll still maintain the old Map structure for compatibility
                this.processFilesystemTree(data.fsTree, testInputFiles);
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
                // Fallback to individual requests
                console.log('Collated input files not available, falling back to individual requests');
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
                                console.error(`Failed to fetch input files for ${runtimeKey}/${testName}:`, error);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading collated test input files:', error);
        }
        
        return testInputFiles;
    }

    private static processFilesystemTree(tree: Record<string, any>, testInputFiles: Map<string, any[]>): void {
        const processNode = (node: any, path: string = ''): void => {
            if (!node) return;
            
            if (node.type === 'test') {
                // Extract runtime from node data
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
            
            // Process children
            if (node.children) {
                for (const [childName, childNode] of Object.entries(node.children)) {
                    const childPath = path ? `${path}/${childName}` : childName;
                    processNode(childNode, childPath);
                }
            }
            
            // Handle arrays (multiple entries at same path)
            if (Array.isArray(node)) {
                for (const item of node) {
                    processNode(item, path);
                }
            }
        };
        
        // Start processing from root
        for (const [key, value] of Object.entries(tree)) {
            processNode(value, key);
        }
    }

    static async loadTestResults(): Promise<Map<string, any[]>> {
        const testResults = new Map<string, any[]>();
        
        try {
            // Try collated endpoint first
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
                    return testResults;
                }
            }
            
            // Fallback to regular endpoint
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
            console.error('Error loading test results:', error);
        }
        
        return testResults;
    }

    static async loadProcesses(): Promise<any[]> {
        try {
            const response = await fetch('http://localhost:3000/~/processes');
            const data = await response.json();
            return data.processes || [];
        } catch (error) {
            console.error('Error loading processes:', error);
            return [];
        }
    }
}
