export class DataUtils {
    static clearData(
        documentationFiles: string[],
        documentationTree: Record<string, any>,
        testInputFiles: Map<string, any[]>,
        inputFilesTree: Record<string, any>,
        testResults: Map<string, any[]>,
        collatedTestResults: Record<string, any>,
        processes: any[]
    ): void {
        // Clear arrays
        documentationFiles.length = 0;
        
        // Clear objects
        for (const key in documentationTree) {
            delete documentationTree[key];
        }
        
        // Clear maps
        testInputFiles.clear();
        
        // Clear objects
        for (const key in inputFilesTree) {
            delete inputFilesTree[key];
        }
        
        // Clear maps
        testResults.clear();
        
        // Clear objects
        for (const key in collatedTestResults) {
            delete collatedTestResults[key];
        }
        
        // Clear array
        processes.length = 0;
    }
}
