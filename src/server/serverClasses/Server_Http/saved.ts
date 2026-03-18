

//   private handleHttpGetTestResults(request: Request, url: URL): Response {
//   const runtime = url.searchParams.get('runtime');
//   const testName = url.searchParams.get('testName');

//   console.log(`[DEBUG] handleHttpGetTestResults: runtime=${runtime}, testName=${testName}`);

//   const getTestResults = (this as any).getTestResults;
//   if (typeof getTestResults !== 'function') {
//     console.log(`[DEBUG] getTestResults method not available`);
//     return this.jsonResponse({
//       error: 'Test results functionality not available',
//       testResults: [],
//       message: 'Server does not support test results'
//     }, 503);
//   }

//   // If runtime and testName are provided, return specific test results
//   if (runtime && testName) {
//     console.log(`[DEBUG] Looking for specific test results for ${runtime}/${testName}`);
//     const testResults = getTestResults(runtime, testName);
//     console.log(`[DEBUG] getTestResults returned:`, testResults);
//     return this.jsonResponse({
//       runtime,
//       testName,
//       testResults: testResults || [],
//       message: 'Success'
//     });
//   }

//   // If no parameters, we need to get all test results
//   console.log(`[DEBUG] No parameters provided, returning all test results`);

//   // Get all runtimes from configs
//   const configs = this.configs;
//   if (!configs || !configs.runtimes) {
//     console.log(`[DEBUG] No runtimes configured`);
//     return this.jsonResponse({
//       testResults: [],
//       message: 'No runtimes configured'
//     });
//   }

//   const allTestResults: any[] = [];

//   // For each runtime and test, call getTestResults
//   for (const [runtimeKey, runtimeConfig] of Object.entries(configs.runtimes)) {
//     const runtime = (runtimeConfig as any).runtime;
//     const tests = (runtimeConfig as any).tests || [];

//     for (const testName of tests) {
//       console.log(`[DEBUG] Getting test results for ${runtime}/${testName}`);
//       try {
//         const testResults = getTestResults(runtime, testName);
//         console.log(`[DEBUG] Results for ${runtime}/${testName}:`, testResults);
//         if (testResults && Array.isArray(testResults)) {
//           allTestResults.push(...testResults);
//         }
//       } catch (error) {
//         console.error(`[DEBUG] Error getting test results for ${runtime}/${testName}:`, error);
//       }
//     }
//   }

//   console.log(`[DEBUG] Returning ${allTestResults.length} total test results`);
//   return this.jsonResponse({
//     testResults: allTestResults,
//     message: 'Success (all test results)'
//   });
// }

//   private handleHttpGetCollatedAllFiles(): Response {
//   console.log(`[DEBUG] handleHttpGetCollatedAllFiles called`);

//   // Get all file types
//   const docsTree = this.getCollatedDocumentationTree();
//   const inputTree = this.getCollatedInputFilesTree();
//   const resultsTree = this.getCollatedTestResultsTree();
//   const reportsTree = this.getReportsTree();

//   // Merge all trees
//   const mergedTree = Server_HTTP_utils.mergeAllFileTrees([docsTree, inputTree, resultsTree, reportsTree]);

//   console.log(`[DEBUG] Returning unified files tree`);
//   return this.jsonResponse({
//     tree: mergedTree,
//     message: 'Success'
//   });
// }

//   private getCollatedDocumentationTree(): Record < string, any > {
//   try {
//     const response = this.handleHttpGetCollatedDocumentation();
//     // Since handleHttpGetCollatedDocumentation returns a Response, we need to extract data differently
//     // For now, return empty tree - the actual implementation would need to be refactored
//     return {};
//   } catch(error) {
//     console.error(`[DEBUG] Error getting documentation tree:`, error);
//     return {};
//   }
// }

//   private getCollatedInputFilesTree(): Record < string, any > {
//   try {
//     const response = this.handleHttpGetCollatedInputFiles();
//     // Similar issue - need to refactor to return data directly
//     return {};
//   } catch(error) {
//     console.error(`[DEBUG] Error getting input files tree:`, error);
//     return {};
//   }
// }

//   private getCollatedTestResultsTree(): Record < string, any > {
//   try {
//     const response = this.handleHttpGetCollatedTestResults();
//     // Similar issue - need to refactor to return data directly
//     return {};
//   } catch(error) {
//     console.error(`[DEBUG] Error getting test results tree:`, error);
//     return {};
//   }
// }

//   private getReportsTree(): Record < string, any > {
//   const reportsDir = path.join(process.cwd(), 'testeranto', 'reports');
//   return Server_HTTP_utils.buildFilesystemTree(reportsDir);
// }

//   private buildFilesystemTree(dirPath: string): Record < string, any > {
//   const tree: Record<string, any> = { };

// if (!fs.existsSync(dirPath)) {
//   return tree;
// }

// try {
//   const items = fs.readdirSync(dirPath);

//   for (const item of items) {
//     const fullPath = path.join(dirPath, item);
//     const stat = fs.statSync(fullPath);
//     const relativePath = path.relative(process.cwd(), fullPath);

//     if (stat.isDirectory()) {
//       tree[item] = {
//         type: 'directory',
//         children: this.buildFilesystemTree(fullPath)
//       };
//     } else {
//       tree[item] = {
//         type: 'file',
//         path: relativePath,
//         isJson: item.endsWith('.json'),
//         isHtml: item.endsWith('.html'),
//         isMd: item.endsWith('.md')
//       };
//     }
//   }
// } catch (error) {
//   console.error(`[DEBUG] Error building filesystem tree for ${dirPath}:`, error);
// }

// return tree;
//   }

//   private mergeAllFileTrees(trees: Record < string, any > []): Record < string, any > {
//   const merged: Record<string, any> = { };

// for (const tree of trees) {
//   this.mergeFileTree(merged, tree);
// }

// return merged;
//   }

//   private mergeFileTree(target: Record<string, any>, source: Record<string, any>): void {
//   for(const [key, sourceNode] of Object.entries(source)) {
//   if (!target[key]) {
//     target[key] = { ...sourceNode };
//     if (sourceNode.children) {
//       target[key].children = {};
//     }
//   } else if (sourceNode.type === 'directory' && target[key].type === 'directory') {
//     // Merge children
//     if (sourceNode.children) {
//       if (!target[key].children) {
//         target[key].children = {};
//       }
//       this.mergeFileTree(target[key].children, sourceNode.children);
//     }
//   }
//   // If both are files, keep the first one (don't overwrite)
// }
//   }

//   private handleHttpGetCollatedTestResults(): Response {
//   console.log(`[DEBUG] handleHttpGetCollatedTestResults called`);

//   const getTestResults = (this as any).getTestResults;
//   if (typeof getTestResults !== 'function') {
//     console.log(`[DEBUG] getTestResults method not available`);
//     return this.jsonResponse({
//       error: 'Test results functionality not available',
//       collatedTestResults: {},
//       message: 'Server does not support test results'
//     }, 503);
//   }

//   // Get all runtimes from configs
//   const configs = this.configs;
//   if (!configs || !configs.runtimes) {
//     console.log(`[DEBUG] No runtimes configured`);
//     return this.jsonResponse({
//       collatedTestResults: {},
//       message: 'No runtimes configured'
//     });
//   }

//   const collatedTestResults: Record<string, any> = {};

//   // For each runtime and test, call getTestResults
//   for (const [runtimeKey, runtimeConfig] of Object.entries(configs.runtimes)) {
//     const runtime = (runtimeConfig as any).runtime;
//     const tests = (runtimeConfig as any).tests || [];

//     if (!collatedTestResults[runtimeKey]) {
//       collatedTestResults[runtimeKey] = {
//         runtime: runtime,
//         tests: {},
//         files: []
//       };
//     }

//     // Get all files for this configKey (runtimeKey is actually configKey)
//     const allFiles = getTestResults(runtimeKey);
//     console.log(`[DEBUG] Found ${allFiles.length} files for configKey ${runtimeKey}`);

//     // Organize files by test
//     const filesByTest: Record<string, any[]> = {};
//     const allFilesList: any[] = [];

//     for (const file of allFiles) {
//       // Only include files from this configKey
//       if (file.configKey === runtimeKey) {
//         allFilesList.push({
//           name: file.file,
//           path: file.relativePath,
//           isJson: file.isJson,
//           size: file.size,
//           modified: file.modified,
//           testName: file.testName,
//           result: file.result
//         });

//         // Group by test name
//         const testName = file.testName || 'unknown';
//         if (!filesByTest[testName]) {
//           filesByTest[testName] = [];
//         }
//         filesByTest[testName].push(file);
//       }
//     }

//     collatedTestResults[runtimeKey].files = allFilesList;

//     // Process each test
//     for (const testName of tests) {
//       console.log(`[DEBUG] Getting test results for ${runtimeKey}/${testName}`);
//       try {
//         const testFiles = filesByTest[testName] || [];
//         const testResults = testFiles.filter(file => file.isJson && file.result);

//         console.log(`[DEBUG] Found ${testFiles.length} files, ${testResults.length} JSON results for ${runtimeKey}/${testName}`);

//         collatedTestResults[runtimeKey].tests[testName] = {
//           testName: testName,
//           files: testFiles.map(file => ({
//             name: file.file,
//             path: file.relativePath,
//             isJson: file.isJson,
//             size: file.size,
//             modified: file.modified
//           })),
//           results: testResults.map(file => file.result),
//           count: testResults.length,
//           fileCount: testFiles.length
//         };
//       } catch (error: any) {
//         console.error(`[DEBUG] Error getting test results for ${runtimeKey}/${testName}:`, error);
//         collatedTestResults[runtimeKey].tests[testName] = {
//           testName: testName,
//           files: [],
//           results: [],
//           count: 0,
//           fileCount: 0,
//           error: error.message
//         };
//       }
//     }

//     // Also include files that don't belong to any specific test
//     const otherFiles = allFiles.filter((file: any) => {
//       const fileTestName = file.testName || '';
//       return file.configKey === runtimeKey && !tests.some((t: string) => fileTestName.includes(t) || t.includes(fileTestName));
//     });

//     if (otherFiles.length > 0) {
//       collatedTestResults[runtimeKey].otherFiles = otherFiles.map((file: any) => ({
//         name: file.file,
//         path: file.relativePath,
//         isJson: file.isJson,
//         size: file.size,
//         modified: file.modified,
//         testName: file.testName
//       }));
//     }
//   }

//   console.log(`[DEBUG] Returning collated test results for ${Object.keys(collatedTestResults).length} runtimes`);
//   return this.jsonResponse({
//     collatedTestResults: collatedTestResults,
//     message: 'Success'
//   });
// }

//   private handleHttpGetInputFiles(request: Request, url: URL): Response {
//   const runtime = url.searchParams.get('runtime');
//   const testName = url.searchParams.get('testName');

//   console.log(`[DEBUG] handleHttpGetInputFiles: runtime="${runtime}", testName="${testName}"`);

//   if (!runtime || !testName) {
//     console.log(`[DEBUG] Missing runtime or testName parameters`);
//     return this.jsonResponse({
//       error: 'Missing runtime or testName query parameters'
//     }, 400);
//   }

//   const getInputFiles = (this as any).getInputFiles;
//   if (typeof getInputFiles !== 'function') {
//     console.log(`[DEBUG] getInputFiles method not available`);
//     throw new Error('getInputFiles does not exist on this instance');
//   }

//   console.log(`[DEBUG] Calling getInputFiles with runtime="${runtime}", testName="${testName}"`);
//   const inputFiles = getInputFiles(runtime, testName);
//   console.log(`[DEBUG] getInputFiles returned:`, inputFiles);

//   return this.jsonResponse({
//     runtime,
//     testName,
//     inputFiles: inputFiles || [],
//     message: 'Success'
//   });
// }

//   private handleHttpGetAiderProcesses(): Response {
//   const handleAiderProcesses = (this as any).handleAiderProcesses;
//   const getAiderProcesses = (this as any).getAiderProcesses;

//   if (typeof handleAiderProcesses === 'function') {
//     const result = handleAiderProcesses();
//     return this.jsonResponse({
//       aiderProcesses: result.aiderProcesses || [],
//       message: result.message || 'Success'
//     });
//   } else if (typeof getAiderProcesses === 'function') {
//     const aiderProcesses = getAiderProcesses();
//     return this.jsonResponse({
//       aiderProcesses: aiderProcesses || [],
//       message: 'Success'
//     });
//   } else {
//     return this.jsonResponse({
//       aiderProcesses: [],
//       message: 'Aider processes not available'
//     });
//   }
// }

//   private handleHttpGetConfigs(): Response {

//   if (!this.configs) {
//     console.log(`[DEBUG] configs property not available`);
//     return Server_HTTP_utils.jsonResponse({
//       error: 'configs property not available',
//       message: 'Server does not have configs'
//     }, 503);
//   }


//   return Server_HTTP_utils.jsonResponse({
//     configs: this.configs,
//     message: 'Success'
//   });
// }

//   private handleHttpGetDocumentation(): Response {
//   // Documentation files are now embedded in the HTML config
//   // Return empty array for backward compatibility
//   return this.jsonResponse({
//     files: [],
//     message: 'Documentation files are now embedded in HTML config',
//     count: 0
//   });
// }

//   private handleHttpGetCollatedDocumentation(): Response {
//   // Documentation files are now embedded in the HTML config
//   // Return empty for backward compatibility
//   return this.jsonResponse({
//     tree: {},
//     files: [],
//     message: 'Documentation files are now embedded in HTML config'
//   });
// }

//   private handleHttpGetCollatedInputFiles(): Response {
//   // Get configs first to know what runtimes and tests exist
//   if (!this.configs) {
//     console.log(`[DEBUG] configs property not available`);
//     return this.jsonResponse({
//       error: 'configs property not available',
//       message: 'Server does not have configs'
//     }, 503);
//   }

//   const collatedInputFiles: Record<string, any> = {};

//   // For each runtime, fetch input files for each test
//   const runtimes = this.configs.runtimes;
//   // We'll collect promises for all the input file fetches
//   const fetchPromises: Promise<void>[] = [];

//   for (const [runtimeKey, runtimeConfig] of Object.entries(runtimes)) {
//     const config = runtimeConfig as any;
//     const runtime = config.runtime;
//     const tests = config.tests || [];

//     if (!collatedInputFiles[runtimeKey]) {
//       collatedInputFiles[runtimeKey] = {
//         runtime: runtime,
//         tests: {},
//         tree: {}
//       };
//     }

//     for (const testName of tests) {
//       fetchPromises.push(
//         this.fetchInputFilesForTest(runtimeKey, testName)
//           .then(inputFiles => {
//             // Store test entry
//             collatedInputFiles[runtimeKey].tests[testName] = {
//               testName: testName,
//               inputFiles: inputFiles,
//               count: inputFiles.length
//             };

//             // Build tree structure for this test
//             this.buildInputFilesTree(collatedInputFiles[runtimeKey].tree, testName, inputFiles);
//           })
//           .catch(error => {
//             console.error(`[DEBUG] Failed to fetch input files for ${runtimeKey}/${testName}:`, error);
//             collatedInputFiles[runtimeKey].tests[testName] = {
//               testName: testName,
//               inputFiles: [],
//               count: 0,
//               error: error.message
//             };
//             // Still build tree with empty files
//             this.buildInputFilesTree(collatedInputFiles[runtimeKey].tree, testName, []);
//           })
//       );
//     }
//   }

//   // Wait for all fetches to complete
//   return Promise.all(fetchPromises)
//     .then(() => {
//       // After building all trees, we need to merge them into a single tree structure
//       // that mirrors the filesystem layout
//       const fsTree = this.buildFilesystemTree(collatedInputFiles);

//       console.log(`[DEBUG] Collated input files:`, JSON.stringify(collatedInputFiles, null, 2));
//       console.log(`[DEBUG] Filesystem tree:`, JSON.stringify(fsTree, null, 2));

//       return this.jsonResponse({
//         collatedInputFiles: collatedInputFiles,
//         fsTree: fsTree,
//         message: 'Success'
//       });
//     })
//     .catch(error => {
//       console.error(`[DEBUG] Error collating input files:`, error);
//       return this.jsonResponse({
//         error: 'Failed to collate input files',
//         message: error.message
//       }, 500);
//     });
// }

//   private buildInputFilesTree(tree: Record<string, any>, testName: string, inputFiles: string[]): void {
//   // Add test entry to tree
//   const testNode = {
//     type: 'test',
//     path: testName,
//     inputFiles: inputFiles,
//     count: inputFiles.length
//   };

//   // Split testName into parts (e.g., "src/java/test/java/com/example/calculator/CalculatorTest.java")
//   const parts = testName.split('/').filter(part => part.length > 0);

//   let currentNode = tree;

//   // Navigate through the path, creating directories as needed
//   for(let i = 0; i <parts.length; i++) {
//   const part = parts[i];
//   const isLast = i === parts.length - 1;

//   if (!currentNode[part]) {
//     if (isLast) {
//       currentNode[part] = testNode;
//     } else {
//       currentNode[part] = {
//         type: 'directory',
//         children: {}
//       };
//     }
//   } else if (isLast) {
//     // If this is the last part and it already exists, it should be a test node
//     // Update it with input files
//     if (currentNode[part].type === 'test') {
//       currentNode[part].inputFiles = inputFiles;
//       currentNode[part].count = inputFiles.length;
//     }
//   }

//   if (!isLast) {
//     currentNode = currentNode[part].children;
//   }
// }
//   }

//   private async fetchInputFilesForTest(runtimeKey: string, testName: string): Promise < string[] > {
//   console.log(`[DEBUG] Fetching input files for ${runtimeKey}/${testName}`);

//   const getInputFiles = (this as any).getInputFiles;
//   if(typeof getInputFiles === 'function') {
//   console.log(`[DEBUG] Using getInputFiles method`);
//   const inputFiles = getInputFiles(runtimeKey, testName);
//   console.log(`[DEBUG] getInputFiles returned ${inputFiles.length} files for ${runtimeKey}/${testName}`);
//   return inputFiles;
// }

// // Fallback to HTTP fetch
// try {
//   const response = await fetch(`http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtimeKey)}&testName=${encodeURIComponent(testName)}`);
//   if (!response.ok) {
//     throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//   }
//   const data = await response.json();
//   const inputFiles = data.inputFiles || [];
//   console.log(`[DEBUG] HTTP fetch returned ${inputFiles.length} files for ${runtimeKey}/${testName}`);
//   return inputFiles;
// } catch (error) {
//   console.error(`[DEBUG] HTTP fetch failed for ${runtimeKey}/${testName}:`, error);
//   return [];
// }
//   }
