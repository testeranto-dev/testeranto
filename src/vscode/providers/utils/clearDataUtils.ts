export class ClearDataUtils {
    static clearData(
        documentationFiles: string[],
        documentationTree: Record<string, any>,
        testInputFiles: Map<string, any[]>,
        inputFilesTree: Record<string, any>,
        testResults: Map<string, any[]>,
        collatedTestResults: Record<string, any>,
        processes: any[]
    ): void {
        documentationFiles.length = 0;
        documentationTree = {};
        testInputFiles.clear();
        inputFilesTree = {};
        testResults.clear();
        collatedTestResults = {};
        processes.length = 0;
    }
}
export class ClearDataUtils {
    static clearData(
        documentationFiles: string[],
        documentationTree: Record<string, any>,
        testInputFiles: Map<string, any[]>,
        inputFilesTree: Record<string, any>,
        testResults: Map<string, any[]>,
        collatedTestResults: Record<string, any>,
        processes: any[]
    ): void {
        // Clear array by setting length to 0
        documentationFiles.length = 0;
        
        // Clear objects by deleting all keys
        for (const key in documentationTree) {
            if (documentationTree.hasOwnProperty(key)) {
                delete documentationTree[key];
            }
        }
        
        // Clear Maps
        testInputFiles.clear();
        
        // Clear inputFilesTree object
        for (const key in inputFilesTree) {
            if (inputFilesTree.hasOwnProperty(key)) {
                delete inputFilesTree[key];
            }
        }
        
        // Clear testResults Map
        testResults.clear();
        
        // Clear collatedTestResults object
        for (const key in collatedTestResults) {
            if (collatedTestResults.hasOwnProperty(key)) {
                delete collatedTestResults[key];
            }
        }
        
        // Clear processes array
        processes.length = 0;
    }
}
