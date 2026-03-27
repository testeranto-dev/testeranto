import { TestTreeItem } from "../TestTreeItem";
import { getRootItems as getRootItemsUtil } from "./utils/rootItemsUtils";
import { DataManagementUtils } from "./utils/dataManagementUtils";
import {
    loadDocumentationData,
    loadTestInputData,
    loadTestResultsData
} from "./utils/dataLoadingMethodsUtils";
import { buildTestResultsTree as buildTestResultsTreeUtil } from "./utils/buildTestResultsTreeFullUtils";
import { getChildrenForElement as getChildrenForElementUtil } from "./utils/getChildrenForElementUtils";
import { loadProcesses } from "./utils/dataLoadingUtils";
import {
    buildTreeItemsFromTestResultsTree as buildTreeItemsFromTestResultsTreeUtil,
} from "./utils/buildTestResultsTreeUtils";
import { buildTreeItemsFromTestResultsTreeForConfig } from "./utils/buildTreeItemsFromTestResultsTreeForConfig";

export class TesterantoTreeDataProviderUtils {
    static async loadInitialData(): Promise<void> {
        await DataManagementUtils.loadInitialData(
            TesterantoTreeDataProviderUtils.loadAllData.bind(
                TesterantoTreeDataProviderUtils,
            ),
        );
    }

    static clearData(): void {
        DataManagementUtils.clearData();
    }

    static getChildrenForElement(element?: TestTreeItem): TestTreeItem[] {
        if (!element) {
            return TesterantoTreeDataProviderUtils.getRootItems();
        }
        return getChildrenForElementUtil(
            element,
            TesterantoTreeDataProviderUtils.buildTreeItemsFromTestResultsTree.bind(
                TesterantoTreeDataProviderUtils
            )
        );
    }

    static getRootItems(): TestTreeItem[] {
        return getRootItemsUtil(
            DataManagementUtils.getDocumentationFiles(),
            DataManagementUtils.getDocumentationTree(),
            DataManagementUtils.getTestInputFiles(),
            DataManagementUtils.getInputFilesTree(),
            DataManagementUtils.getTestResults(),
            DataManagementUtils.getCollatedTestResults(),
            DataManagementUtils.getProcesses()
        );
    }

    static async loadAllData(): Promise<{
        documentationFiles: string[];
        documentationTree: Record<string, any>;
        testInputFiles: Map<string, any[]>;
        inputFilesTree: Record<string, any>;
        testResults: Map<string, any[]>;
        collatedTestResults: Record<string, any>;
        processes: any[];
    }> {
        const [documentationData, testInputData, testResultsData, processes] =
            await Promise.all([
                loadDocumentationData(),
                loadTestInputData(),
                loadTestResultsData(),
                loadProcesses(),
            ]);

        return {
            documentationFiles: documentationData.documentationFiles,
            documentationTree: documentationData.documentationTree,
            testInputFiles: testInputData.testInputFiles,
            inputFilesTree: testInputData.inputFilesTree,
            testResults: testResultsData.testResults,
            collatedTestResults: testResultsData.collatedTestResults,
            processes,
        };
    }

    static buildTreeItemsFromTestResultsTree(
        tree: Record<string, any>,
    ): TestTreeItem[] {
        return buildTreeItemsFromTestResultsTreeUtil(tree);
    }

    static buildTreeItemsFromTestResultsTreeForConfig(
        tree: Record<string, any>,
        configKey: string,
    ): TestTreeItem[] {
        return buildTreeItemsFromTestResultsTreeForConfig(tree, configKey);
    }

    static buildTestResultsTree(
        collatedTestResults: Record<string, any>,
    ): TestTreeItem[] {
        return buildTestResultsTreeUtil(collatedTestResults);
    }
}
