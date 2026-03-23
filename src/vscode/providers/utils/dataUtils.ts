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
        documentationFiles.length = 0;
        Object.keys(documentationTree).forEach(key => delete documentationTree[key]);
        testInputFiles.clear();
        Object.keys(inputFilesTree).forEach(key => delete inputFilesTree[key]);
        testResults.clear();
        Object.keys(collatedTestResults).forEach(key => delete collatedTestResults[key]);
        processes.length = 0;
    }
}
