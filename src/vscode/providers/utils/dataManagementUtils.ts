import { ClearDataUtils } from './clearDataUtils';

export class DataManagementUtils {
    static documentationFiles: string[] = [];
    static documentationTree: Record<string, any> = {};
    static testInputFiles: Map<string, any[]> = new Map();
    static inputFilesTree: Record<string, any> = {};
    static testResults: Map<string, any[]> = new Map();
    static collatedTestResults: Record<string, any> = {};
    static processes: any[] = [];

    static async loadInitialData(
        loadAllData: () => Promise<{
            documentationFiles: string[];
            documentationTree: Record<string, any>;
            testInputFiles: Map<string, any[]>;
            inputFilesTree: Record<string, any>;
            testResults: Map<string, any[]>;
            collatedTestResults: Record<string, any>;
            processes: any[];
        }>
    ): Promise<void> {
        const loadedData = await loadAllData();
        DataManagementUtils.documentationFiles = loadedData.documentationFiles;
        DataManagementUtils.documentationTree = loadedData.documentationTree;
        DataManagementUtils.testInputFiles = loadedData.testInputFiles;
        DataManagementUtils.inputFilesTree = loadedData.inputFilesTree;
        DataManagementUtils.testResults = loadedData.testResults;
        DataManagementUtils.collatedTestResults = loadedData.collatedTestResults;
        DataManagementUtils.processes = loadedData.processes;
    }

    static clearData(): void {
        ClearDataUtils.clearData(
            DataManagementUtils.documentationFiles,
            DataManagementUtils.documentationTree,
            DataManagementUtils.testInputFiles,
            DataManagementUtils.inputFilesTree,
            DataManagementUtils.testResults,
            DataManagementUtils.collatedTestResults,
            DataManagementUtils.processes
        );
    }

    static getDocumentationFiles(): string[] {
        return DataManagementUtils.documentationFiles;
    }

    static getDocumentationTree(): Record<string, any> {
        return DataManagementUtils.documentationTree;
    }

    static getTestInputFiles(): Map<string, any[]> {
        return DataManagementUtils.testInputFiles;
    }

    static getInputFilesTree(): Record<string, any> {
        return DataManagementUtils.inputFilesTree;
    }

    static getTestResults(): Map<string, any[]> {
        return DataManagementUtils.testResults;
    }

    static getCollatedTestResults(): Record<string, any> {
        return DataManagementUtils.collatedTestResults;
    }

    static getProcesses(): any[] {
        return DataManagementUtils.processes;
    }
}
