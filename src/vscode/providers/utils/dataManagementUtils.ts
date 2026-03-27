import { DataUtils } from './dataUtils';

export class DataManagementUtils {
    private static documentationFiles: string[] = [];
    private static documentationTree: Record<string, any> = {};
    private static testInputFiles: Map<string, any[]> = new Map();
    private static inputFilesTree: Record<string, any> = {};
    private static testResults: Map<string, any[]> = new Map();
    private static collatedTestResults: Record<string, any> = {};
    private static processes: any[] = [];

    static async loadInitialData(loadAllDataFn: () => Promise<any>): Promise<void> {
        try {
            const data = await loadAllDataFn();
            
            this.documentationFiles = data.documentationFiles || [];
            this.documentationTree = data.documentationTree || {};
            this.testInputFiles = data.testInputFiles || new Map();
            this.inputFilesTree = data.inputFilesTree || {};
            this.testResults = data.testResults || new Map();
            this.collatedTestResults = data.collatedTestResults || {};
            this.processes = data.processes || [];
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    static clearData(): void {
        DataUtils.clearData(
            this.documentationFiles,
            this.documentationTree,
            this.testInputFiles,
            this.inputFilesTree,
            this.testResults,
            this.collatedTestResults,
            this.processes
        );
    }

    static getDocumentationFiles(): string[] {
        return this.documentationFiles;
    }

    static getDocumentationTree(): Record<string, any> {
        return this.documentationTree;
    }

    static getTestInputFiles(): Map<string, any[]> {
        return this.testInputFiles;
    }

    static getInputFilesTree(): Record<string, any> {
        return this.inputFilesTree;
    }

    static getTestResults(): Map<string, any[]> {
        return this.testResults;
    }

    static getCollatedTestResults(): Record<string, any> {
        return this.collatedTestResults;
    }

    static getProcesses(): any[] {
        return this.processes;
    }
}
