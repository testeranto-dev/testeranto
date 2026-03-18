// import * as vscode from 'vscode';
// import { TestTreeItem } from '../TestTreeItem';
// import { TreeItemType } from '../types';

// export class FeaturesTreeDataProviderUtils {
//     // This class is now a placeholder for future utility functions
//     // The main functionality has been moved to FeaturesTreeDataProvider
//     // to use HTTP endpoints instead of file system access
    
//     static async fetchAllFiles(): Promise<Record<string, any>> {
//         // This method can be used to fetch all files from HTTP endpoints
//         // It's kept here for potential reuse in other providers
//         try {
//             const [docs, inputs, results, reports] = await Promise.all([
//                 this.fetchDocumentationFiles(),
//                 this.fetchInputFiles(),
//                 this.fetchTestResultFiles(),
//                 this.fetchReportFiles()
//             ]);
            
//             // Merge all trees into one
//             return this.mergeTrees([docs, inputs, results, reports]);
//         } catch (error) {
//             console.error('[FeaturesTreeDataProviderUtils] Error fetching all files:', error);
//             return {};
//         }
//     }

//     private static async fetchDocumentationFiles(): Promise<Record<string, any>> {
//         try {
//             const response = await fetch('http://localhost:3000/~/collated-documentation');
//             const data = await response.json();
//             return data.tree || {};
//         } catch (error) {
//             console.error('[FeaturesTreeDataProviderUtils] Error fetching documentation:', error);
//             return {};
//         }
//     }

//     private static async fetchInputFiles(): Promise<Record<string, any>> {
//         try {
//             const response = await fetch('http://localhost:3000/~/collated-inputfiles');
//             const data = await response.json();
//             return data.fsTree || {};
//         } catch (error) {
//             console.error('[FeaturesTreeDataProviderUtils] Error fetching input files:', error);
//             return {};
//         }
//     }

//     private static async fetchTestResultFiles(): Promise<Record<string, any>> {
//         try {
//             const response = await fetch('http://localhost:3000/~/collated-testresults');
//             const data = await response.json();
//             return this.extractFilesFromTestResults(data.collatedTestResults || {});
//         } catch (error) {
//             console.error('[FeaturesTreeDataProviderUtils] Error fetching test results:', error);
//             return {};
//         }
//     }

//     private static async fetchReportFiles(): Promise<Record<string, any>> {
//         try {
//             const response = await fetch('http://localhost:3000/~/reports');
//             const data = await response.json();
//             return data.tree || {};
//         } catch (error) {
//             console.error('[FeaturesTreeDataProviderUtils] Error fetching reports:', error);
//             return {};
//         }
//     }

//     private static extractFilesFromTestResults(testResults: any): Record<string, any> {
//         const tree: Record<string, any> = {};
        
//         for (const [configKey, configData] of Object.entries(testResults)) {
//             const configInfo = configData as any;
//             const files = configInfo.files || [];
            
//             for (const file of files) {
//                 // Add file to tree
//                 const parts = file.path.split('/').filter((p: string) => p.length > 0);
//                 let currentNode = tree;
                
//                 for (let i = 0; i < parts.length; i++) {
//                     const part = parts[i];
//                     const isLast = i === parts.length - 1;
                    
//                     if (!currentNode[part]) {
//                         currentNode[part] = isLast 
//                             ? { type: 'file', path: file.path, isJson: file.isJson }
//                             : { type: 'directory', children: {} };
//                     }
                    
//                     if (!isLast && currentNode[part].type === 'directory') {
//                         currentNode = currentNode[part].children;
//                     }
//                 }
//             }
//         }
        
//         return tree;
//     }

//     private static mergeTrees(trees: Record<string, any>[]): Record<string, any> {
//         const merged: Record<string, any> = {};
        
//         for (const tree of trees) {
//             this.mergeNode(merged, tree);
//         }
        
//         return merged;
//     }

//     private static mergeNode(target: Record<string, any>, source: Record<string, any>): void {
//         for (const [key, sourceNode] of Object.entries(source)) {
//             if (!target[key]) {
//                 target[key] = { ...sourceNode };
//                 if (sourceNode.children) {
//                     target[key].children = {};
//                 }
//             } else if (sourceNode.type === 'directory' && target[key].type === 'directory') {
//                 // Merge children
//                 if (sourceNode.children) {
//                     if (!target[key].children) {
//                         target[key].children = {};
//                     }
//                     this.mergeNode(target[key].children, sourceNode.children);
//                 }
//             }
//             // If both are files, keep the first one (don't overwrite)
//         }
//     }
// }
