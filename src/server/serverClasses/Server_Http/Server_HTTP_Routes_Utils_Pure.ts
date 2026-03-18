import fs from "fs";
import path from "path";
import { Server_HTTP_utils } from "./Server_HTTP_utils";

export const handleRoutePure = (
  routeName: string,
  request: Request,
  url: URL,
  server: any
): Response => {
    // Handle OPTIONS requests
    if (request.method === 'OPTIONS') {
        return Server_HTTP_utils.handleOptions();
    }

    // Only handle GET requests for now
    if (request.method !== 'GET') {
        return Server_HTTP_utils.jsonResponse({
            error: `Method ${request.method} not allowed`
        }, 405);
    }

    switch (routeName) {
        case 'configs':
            return handleConfigs(server);
        case 'processes':
            return handleProcesses(server);
        case 'inputfiles':
            return handleInputFiles(url, server);
        case 'outputfiles':
            return handleOutputFiles(url, server);
        case 'testresults':
            return handleTestResults(url, server);
        case 'collated-testresults':
            return handleCollatedTestResults(server);
        case 'collated-inputfiles':
            return handleCollatedInputFiles(server);
        case 'collated-documentation':
            return handleCollatedDocumentation();
        case 'documentation':
            return handleDocumentation();
        case 'reports':
            return handleReports();
        case 'html-report':
            return handleHtmlReport();
        case 'aider-processes':
            return handleAiderProcesses(server);
        case 'collated-files':
            return handleCollatedFiles(server);
        default:
            return Server_HTTP_utils.jsonResponse({
                error: `Route not found: ${routeName}`
            }, 404);
    }
};

const handleConfigs = (server: any): Response => {
    if (!server.configs) {
        return Server_HTTP_utils.jsonResponse({
            error: 'Server configs not available'
        }, 503);
    }
    return Server_HTTP_utils.jsonResponse({
        configs: server.configs,
        message: 'Success'
    });
};

const handleProcesses = (server: any): Response => {
    const getProcessSummary = server.getProcessSummary;
    if (typeof getProcessSummary !== 'function') {
        return Server_HTTP_utils.jsonResponse({
            processes: [],
            message: 'Process summary not available'
        });
    }
    const summary = getProcessSummary();
    return Server_HTTP_utils.jsonResponse({
        processes: summary.processes || [],
        total: summary.total || 0,
        message: 'Success'
    });
};

const handleInputFiles = (url: URL, server: any): Response => {
    const runtime = url.searchParams.get('runtime');
    const testName = url.searchParams.get('testName');
    
    if (!runtime || !testName) {
        return Server_HTTP_utils.jsonResponse({
            error: 'Missing runtime or testName'
        }, 400);
    }
    
    // First, try to use the server's getInputFiles method if available
    const getInputFiles = server.getInputFiles;
    if (typeof getInputFiles === 'function') {
        const inputFiles = getInputFiles(runtime, testName);
        if (inputFiles && inputFiles.length > 0) {
            return Server_HTTP_utils.jsonResponse({
                runtime,
                testName,
                inputFiles: inputFiles,
                message: 'Success'
            });
        }
    }
    
    // Fallback: try to read inputFiles.json directly
    const inputFilesPath = path.join(process.cwd(), 'testeranto', 'bundles', runtime, 'inputFiles.json');
    
    if (!fs.existsSync(inputFilesPath)) {
        return Server_HTTP_utils.jsonResponse({
            runtime,
            testName,
            inputFiles: [],
            message: 'Input files not found'
        });
    }
    
    try {
        const content = fs.readFileSync(inputFilesPath, 'utf-8');
        const inputFilesData = JSON.parse(content);
        
        // Try to find matching test entry
        let matchedFiles: string[] = [];
        
        // 1. Exact match
        if (inputFilesData[testName] && inputFilesData[testName].files) {
            matchedFiles = inputFilesData[testName].files;
        } else {
            // 2. Try variations
            const possibleKeys = Object.keys(inputFilesData);
            
            // Common pattern: testName might be src/ts/Calculator.test.ts but key is src/ts/Calculator.test.node.ts
            // Try to find a key that contains the testName (without extension) as a substring
            const testNameWithoutExt = testName.replace(/\.[^/.]+$/, '');
            
            for (const key of possibleKeys) {
                const keyWithoutExt = key.replace(/\.[^/.]+$/, '');
                if (keyWithoutExt.includes(testNameWithoutExt) || testNameWithoutExt.includes(keyWithoutExt)) {
                    matchedFiles = inputFilesData[key].files || [];
                    break;
                }
            }
            
            // 3. If still not found, try any key that ends with the same filename
            if (matchedFiles.length === 0) {
                const testFileName = path.basename(testName);
                for (const key of possibleKeys) {
                    const keyFileName = path.basename(key);
                    if (keyFileName.includes(testFileName) || testFileName.includes(keyFileName)) {
                        matchedFiles = inputFilesData[key].files || [];
                        break;
                    }
                }
            }
        }
        
        return Server_HTTP_utils.jsonResponse({
            runtime,
            testName,
            inputFiles: matchedFiles,
            message: matchedFiles.length > 0 ? 'Success' : 'No matching input files found'
        });
        
    } catch (error: any) {
        return Server_HTTP_utils.jsonResponse({
            runtime,
            testName,
            inputFiles: [],
            message: `Error reading input files: ${error.message}`
        });
    }
};

const handleOutputFiles = (url: URL, server: any): Response => {
    const runtime = url.searchParams.get('runtime');
    const testName = url.searchParams.get('testName');
    
    if (!runtime || !testName) {
        return Server_HTTP_utils.jsonResponse({
            error: 'Missing runtime or testName'
        }, 400);
    }
    
    // First, try to use the server's getOutputFiles method if available
    const getOutputFiles = server.getOutputFiles;
    if (typeof getOutputFiles === 'function') {
        const outputFiles = getOutputFiles(runtime, testName);
        if (outputFiles && outputFiles.length > 0) {
            return Server_HTTP_utils.jsonResponse({
                runtime,
                testName,
                outputFiles: outputFiles,
                message: 'Success'
            });
        }
    }
    
    // Output files are organized by runtime directory
    // Look for files in testeranto/reports/ - we need to find directories that match either runtime or runtimeKey
    const reportsBaseDir = path.join(process.cwd(), 'testeranto', 'reports');
    const outputFiles: string[] = [];
    
    if (!fs.existsSync(reportsBaseDir)) {
        return Server_HTTP_utils.jsonResponse({
            runtime,
            testName,
            outputFiles: [],
            message: 'No reports directory found'
        });
    }
    
    // Get all directories in reports
    const collectFilesFromReports = (): void => {
        try {
            const items = fs.readdirSync(reportsBaseDir);
            for (const item of items) {
                const fullPath = path.join(reportsBaseDir, item);
                const stat = fs.statSync(fullPath);
                
                // Check if this directory name contains the runtime or is likely related
                if (stat.isDirectory()) {
                    // Include directories that contain the runtime name or are likely matches
                    const dirName = item.toLowerCase();
                    const runtimeLower = runtime.toLowerCase();
                    
                    // Check if directory name contains runtime, or runtime contains directory name
                    // Also check for common patterns like "rusttests" containing "rust"
                    if (dirName.includes(runtimeLower) || runtimeLower.includes(dirName) || 
                        dirName.includes(runtimeLower.replace(/tests$/, '')) || 
                        dirName.includes(runtimeLower.replace(/test$/, ''))) {
                        
                        // Collect all files in this directory
                        const collectAllFiles = (dir: string): void => {
                            try {
                                const subItems = fs.readdirSync(dir);
                                for (const subItem of subItems) {
                                    const subFullPath = path.join(dir, subItem);
                                    const subStat = fs.statSync(subFullPath);
                                    
                                    if (subStat.isDirectory()) {
                                        collectAllFiles(subFullPath);
                                    } else {
                                        const relativePath = path.relative(process.cwd(), subFullPath);
                                        outputFiles.push(relativePath);
                                    }
                                }
                            } catch (error) {
                                console.error(`Error scanning directory ${dir}:`, error);
                            }
                        };
                        
                        collectAllFiles(fullPath);
                    }
                }
            }
        } catch (error) {
            console.error(`Error scanning reports directory:`, error);
        }
    };
    
    collectFilesFromReports();
    
    // Also check for files in testeranto/bundles/
    const bundlesBaseDir = path.join(process.cwd(), 'testeranto', 'bundles');
    if (fs.existsSync(bundlesBaseDir)) {
        const collectFilesFromBundles = (): void => {
            try {
                const items = fs.readdirSync(bundlesBaseDir);
                for (const item of items) {
                    const fullPath = path.join(bundlesBaseDir, item);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory()) {
                        const dirName = item.toLowerCase();
                        const runtimeLower = runtime.toLowerCase();
                        
                        if (dirName.includes(runtimeLower) || runtimeLower.includes(dirName) || 
                            dirName.includes(runtimeLower.replace(/tests$/, '')) || 
                            dirName.includes(runtimeLower.replace(/test$/, ''))) {
                            
                            const collectAllFiles = (dir: string): void => {
                                try {
                                    const subItems = fs.readdirSync(dir);
                                    for (const subItem of subItems) {
                                        const subFullPath = path.join(dir, subItem);
                                        const subStat = fs.statSync(subFullPath);
                                        
                                        if (subStat.isDirectory()) {
                                            collectAllFiles(subFullPath);
                                        } else {
                                            const relativePath = path.relative(process.cwd(), subFullPath);
                                            outputFiles.push(relativePath);
                                        }
                                    }
                                } catch (error) {
                                    console.error(`Error scanning directory ${dir}:`, error);
                                }
                            };
                            
                            collectAllFiles(fullPath);
                        }
                    }
                }
            } catch (error) {
                console.error(`Error scanning bundles directory:`, error);
            }
        };
        collectFilesFromBundles();
    }
    
    // Remove duplicates
    const uniqueFiles = [...new Set(outputFiles)];
    
    return Server_HTTP_utils.jsonResponse({
        runtime,
        testName,
        outputFiles: uniqueFiles,
        message: `Found ${uniqueFiles.length} output files for runtime ${runtime}`
    });
};

const handleTestResults = (url: URL, server: any): Response => {
    const runtime = url.searchParams.get('runtime');
    const testName = url.searchParams.get('testName');
    
    // Try to find test.json files in the reports directory
    const reportsDir = path.join(process.cwd(), 'testeranto', 'reports');
    
    if (!fs.existsSync(reportsDir)) {
        return Server_HTTP_utils.jsonResponse({
            testResults: [],
            message: 'No reports directory found'
        });
    }
    
    const testResults: any[] = [];
    
    // Helper function to find all tests.json files
    const findAllTestsJsonFiles = (dir: string): string[] => {
        let results: string[] = [];
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                try {
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        results = results.concat(findAllTestsJsonFiles(fullPath));
                    } else if (item === 'tests.json') {
                        results.push(fullPath);
                    }
                } catch {
                    // Skip if we can't stat
                }
            }
        } catch {
            // Skip if we can't read directory
        }
        return results;
    };
    
    // If runtime and testName are provided, look for specific test results
    if (runtime && testName) {
        // First, find all tests.json files
        const allTestsJsonFiles = findAllTestsJsonFiles(reportsDir);
        
        // Try to find a matching file
        for (const filePath of allTestsJsonFiles) {
            // Check if the file path contains runtime and testName patterns
            const normalizedPath = filePath.toLowerCase();
            const runtimeLower = runtime.toLowerCase();
            const testNameLower = testName.toLowerCase();
            
            // Extract test name from path (last directory before tests.json)
            const dirName = path.dirname(filePath);
            const lastDir = path.basename(dirName).toLowerCase();
            
            // Check various patterns
            const containsRuntime = normalizedPath.includes(runtimeLower);
            const containsTestName = normalizedPath.includes(testNameLower) || 
                                     lastDir.includes(testNameLower.replace(/\./g, '')) ||
                                     testNameLower.includes(lastDir);
            
            if (containsRuntime && containsTestName) {
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const testData = JSON.parse(content);
                    testResults.push({
                        file: filePath,
                        data: testData,
                        runtime,
                        testName
                    });
                    // Found a match, break
                    break;
                } catch (error) {
                    // Continue to next file
                }
            }
        }
        
        // If no match found, try to find any tests.json in runtime directory
        if (testResults.length === 0) {
            const runtimeDir = path.join(reportsDir, runtime);
            if (fs.existsSync(runtimeDir)) {
                const runtimeTestsJsonFiles = findAllTestsJsonFiles(runtimeDir);
                for (const filePath of runtimeTestsJsonFiles) {
                    try {
                        const content = fs.readFileSync(filePath, 'utf-8');
                        const testData = JSON.parse(content);
                        testResults.push({
                            file: filePath,
                            data: testData,
                            runtime,
                            testName
                        });
                        // Take the first one
                        break;
                    } catch (error) {
                        // Continue
                    }
                }
            }
        }
    } else {
        // Find all test.json files
        const allTestsJsonFiles = findAllTestsJsonFiles(reportsDir);
        
        for (const filePath of allTestsJsonFiles) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const testData = JSON.parse(content);
                testResults.push({
                    file: filePath,
                    data: testData
                });
            } catch (error) {
                // Skip invalid JSON
            }
        }
    }
    
    return Server_HTTP_utils.jsonResponse({
        testResults,
        message: 'Success'
    });
};

const handleCollatedTestResults = (server: any): Response => {
    return Server_HTTP_utils.jsonResponse({
        collatedTestResults: {},
        message: 'Success'
    });
};

const handleCollatedInputFiles = (server: any): Response => {
    return Server_HTTP_utils.jsonResponse({
        collatedInputFiles: {},
        fsTree: {},
        message: 'Success'
    });
};

const handleCollatedDocumentation = (): Response => {
    return Server_HTTP_utils.jsonResponse({
        tree: {},
        files: [],
        message: 'Success'
    });
};

const handleDocumentation = (): Response => {
    return Server_HTTP_utils.jsonResponse({
        files: [],
        message: 'Success'
    });
};

const handleReports = (): Response => {
    return Server_HTTP_utils.jsonResponse({
        tree: {},
        message: 'Success'
    });
};

const handleHtmlReport = (): Response => {
    return Server_HTTP_utils.jsonResponse({
        message: 'HTML report would be generated here',
        url: '/testeranto/reports/index.html'
    });
};

const handleCollatedFiles = (server: any): Response => {
    // Get all runtimes from configs
    const configs = server.configs;
    if (!configs || !configs.runtimes) {
        return Server_HTTP_utils.jsonResponse({
            tree: {},
            message: 'No runtimes configured'
        });
    }

    // Build a unified tree of all files across all runtimes
    const treeRoot: Record<string, any> = {};

    // For each runtime, fetch input and output files for each test
    const runtimes = configs.runtimes;
    const promises: Promise<void>[] = [];

    for (const [runtimeKey, runtimeConfig] of Object.entries(runtimes)) {
        const config = runtimeConfig as any;
        const runtime = config.runtime;
        const tests = config.tests || [];

        for (const testName of tests) {
            promises.push(
                (async () => {
                    try {
                        // Fetch input files
                        const inputResponse = await fetch(`http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtime)}&testName=${encodeURIComponent(testName)}`);
                        const inputData = inputResponse.ok ? await inputResponse.json() : { inputFiles: [] };
                        const inputFiles = inputData.inputFiles || [];

                        // Fetch output files
                        const outputResponse = await fetch(`http://localhost:3000/~/outputfiles?runtime=${encodeURIComponent(runtime)}&testName=${encodeURIComponent(testName)}`);
                        const outputData = outputResponse.ok ? await outputResponse.json() : { outputFiles: [] };
                        const outputFiles = outputData.outputFiles || [];

                        console.log(`[DEBUG] Processing ${runtime}/${testName}: inputFiles=${inputFiles.length}, outputFiles=${outputFiles.length}`);
                        
                        // Add all input files to the tree
                        for (const file of inputFiles) {
                            const normalizedPath = file.startsWith('/') ? file.substring(1) : file;
                            const parts = normalizedPath.split('/').filter(part => part.length > 0 && part !== '.');
                            
                            if (parts.length === 0) continue;
                            
                            let currentNode = treeRoot;
                            
                            for (let i = 0; i < parts.length; i++) {
                                const part = parts[i];
                                const isLast = i === parts.length - 1;
                                
                                if (!currentNode[part]) {
                                    if (isLast) {
                                        currentNode[part] = {
                                            type: 'file',
                                            path: file,
                                            runtime,
                                            testName,
                                            fileType: 'input'
                                        };
                                    } else {
                                        currentNode[part] = {
                                            type: 'directory',
                                            children: {}
                                        };
                                    }
                                } else if (isLast) {
                                    // If it's already a file, update with additional info
                                    if (currentNode[part].type === 'file') {
                                        // For output files, we should update the fileType but not add to runtimes/tests arrays
                                        // unless it's actually used by multiple runtimes/tests
                                        // For now, just update the fileType if needed
                                        if (currentNode[part].fileType === 'input') {
                                            // If it was already marked as input, now it's both
                                            currentNode[part].fileType = 'both';
                                        } else if (currentNode[part].fileType !== 'both') {
                                            currentNode[part].fileType = 'output';
                                        }
                                        // Don't update runtimes and tests arrays for output files
                                        // as they should only be associated with their original runtime/test
                                    }
                                }
                                
                                if (!isLast && currentNode[part].type === 'directory') {
                                    currentNode = currentNode[part].children;
                                }
                            }
                        }

                        // Add all output files to the tree
                        for (const file of outputFiles) {
                            console.log(`[DEBUG] Adding output file: ${file}`);
                            const normalizedPath = file.startsWith('/') ? file.substring(1) : file;
                            const parts = normalizedPath.split('/').filter(part => part.length > 0 && part !== '.');
                            
                            if (parts.length === 0) continue;
                            
                            let currentNode = treeRoot;
                            
                            for (let i = 0; i < parts.length; i++) {
                                const part = parts[i];
                                const isLast = i === parts.length - 1;
                                
                                if (!currentNode[part]) {
                                    if (isLast) {
                                        currentNode[part] = {
                                            type: 'file',
                                            path: file,
                                            runtime,
                                            testName,
                                            fileType: 'output'
                                        };
                                    } else {
                                        currentNode[part] = {
                                            type: 'directory',
                                            children: {}
                                        };
                                    }
                                } else if (isLast) {
                                    // If it's already a file, update with additional info
                                    if (currentNode[part].type === 'file') {
                                        // Update fileType to include both if needed
                                        if (currentNode[part].fileType === 'input') {
                                            // If it was already marked as input, now it's both
                                            currentNode[part].fileType = 'both';
                                        } else if (currentNode[part].fileType !== 'both') {
                                            currentNode[part].fileType = 'output';
                                        }
                                        // Don't update runtimes and tests arrays
                                    }
                                }
                                
                                if (!isLast && currentNode[part].type === 'directory') {
                                    currentNode = currentNode[part].children;
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`Error processing ${runtimeKey}/${testName}:`, error);
                    }
                })()
            );
        }
    }

    // Wait for all fetches to complete
    return Promise.all(promises).then(() => {
        return Server_HTTP_utils.jsonResponse({
            tree: treeRoot,
            message: 'Success'
        });
    }).catch(error => {
        return Server_HTTP_utils.jsonResponse({
            error: 'Failed to collate files',
            message: error.message,
            tree: {}
        }, 500);
    });
};

const handleAiderProcesses = (server: any): Response => {
    const getAiderProcesses = server.getAiderProcesses;
    if (typeof getAiderProcesses === 'function') {
        const aiderProcesses = getAiderProcesses();
        return Server_HTTP_utils.jsonResponse({
            aiderProcesses: aiderProcesses || [],
            message: 'Success'
        });
    }
    return Server_HTTP_utils.jsonResponse({
        aiderProcesses: [],
        message: 'Aider processes not available'
    });
};
