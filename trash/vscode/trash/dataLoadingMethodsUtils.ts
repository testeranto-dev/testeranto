// import * as vscode from 'vscode';
// import { fetchCollatedDocumentation } from './fetchUtils';
// import { fetchCollatedInputFiles } from './fetchCollatedUtils';
// import { fetchCollatedTestResults } from './fetchCollatedUtils';

// export async function loadDocumentationData(): Promise<{
//     documentationFiles: string[];
//     documentationTree: Record<string, any>;
// }> {
//     try {
//         const data = await fetchCollatedDocumentation();
//         return {
//             documentationFiles: data.files || [],
//             documentationTree: data.tree || {}
//         };
//     } catch (error) {
//         console.error('Error loading documentation data:', error);
//         return {
//             documentationFiles: [],
//             documentationTree: {}
//         };
//     }
// }

// export async function loadTestInputData(): Promise<{
//     testInputFiles: Map<string, any[]>;
//     inputFilesTree: Record<string, any>;
// }> {
//     try {
//         const data = await fetchCollatedInputFiles();
        
//         // Convert array to Map
//         const testInputFiles = new Map<string, any[]>();
//         if (data.files && Array.isArray(data.files)) {
//             for (const file of data.files) {
//                 const runtime = file.runtime || 'unknown';
//                 if (!testInputFiles.has(runtime)) {
//                     testInputFiles.set(runtime, []);
//                 }
//                 testInputFiles.get(runtime)!.push(file);
//             }
//         }
        
//         return {
//             testInputFiles,
//             inputFilesTree: data.tree || {}
//         };
//     } catch (error) {
//         console.error('Error loading test input data:', error);
//         return {
//             testInputFiles: new Map(),
//             inputFilesTree: {}
//         };
//     }
// }

// export async function loadTestResultsData(): Promise<{
//     testResults: Map<string, any[]>;
//     collatedTestResults: Record<string, any>;
// }> {
//     console.log('[dataLoadingMethodsUtils] loadTestResultsData called');
//     const debugChannel = vscode.window.createOutputChannel("Testeranto Debug");
//     debugChannel.appendLine(`[${new Date().toISOString()}] loadTestResultsData called`);
    
//     try {
//         debugChannel.appendLine(`[${new Date().toISOString()}] Fetching collated test results...`);
//         const data = await fetchCollatedTestResults();
//         debugChannel.appendLine(`[${new Date().toISOString()}] Fetched data: ${JSON.stringify(data).substring(0, 200)}...`);
        
//         // Convert to Map
//         const testResults = new Map<string, any[]>();
//         if (data.results && Array.isArray(data.results)) {
//             debugChannel.appendLine(`[${new Date().toISOString()}] Processing ${data.results.length} results`);
//             for (const result of data.results) {
//                 const testName = result.testName || 'unknown';
//                 if (!testResults.has(testName)) {
//                     testResults.set(testName, []);
//                 }
//                 testResults.get(testName)!.push(result);
//             }
//         }
        
//         debugChannel.appendLine(`[${new Date().toISOString()}] Returning ${testResults.size} test results`);
//         debugChannel.show();
        
//         return {
//             testResults,
//             collatedTestResults: data.collated || {}
//         };
//     } catch (error) {
//         debugChannel.appendLine(`[${new Date().toISOString()}] Error loading test results data: ${error}`);
//         console.error('Error loading test results data:', error);
//         debugChannel.show();
//         return {
//             testResults: new Map(),
//             collatedTestResults: {}
//         };
//     }
// }
