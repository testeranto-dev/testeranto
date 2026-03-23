import { TestTreeItem } from "../../TestTreeItem";
import { getDocumentationItems } from "./documentationItemsUtils";
import { getTestInputItems } from "./testInputItemsUtils";
import { getTestInputRuntimeItems } from "./testInputRuntimeUtils";
import { getTestInputTestItems } from "./testInputTestUtils";
import { getTestResultItems } from "./testResultItemsUtils";
import { getTestResultChildren } from "./testResultChildrenUtils";
import { getTestResultRuntimeChildren } from "./testResultChildrenUtils";
import { getProcessItems } from "./processUtils";
import { getReportItems } from "./reportUtils";
import { getTestResultsConfigItems } from "./testResultsConfigUtils";
import { getTestResultsDirectoryItems } from "./testResultsDirectoryUtils";
import { getDocumentationChildren } from "./documentationChildrenUtils";
import { getTestInputChildren } from "./testInputChildrenUtils";
import { DataManagementUtils } from "./dataManagementUtils";

export function getChildrenForElement(
    element?: TestTreeItem,
    buildTreeItemsFromTestResultsTree?: (tree: Record<string, any>) => TestTreeItem[]
): TestTreeItem[] {
    if (!element) {
        // This should be handled by the caller
        return [];
    }

    const elementData = element.data as any;
    if (elementData?.section === "documentation") {
        return getDocumentationItems(
            DataManagementUtils.getDocumentationFiles(),
            DataManagementUtils.getDocumentationTree(),
        );
    } else if (elementData?.section === "test-inputs") {
        return getTestInputItems(
            DataManagementUtils.getTestInputFiles(),
            DataManagementUtils.getInputFilesTree(),
        );
    } else if (elementData?.section === "test-inputs-runtime") {
        return getTestInputRuntimeItems(
            elementData.runtime,
            DataManagementUtils.getTestInputFiles(),
        );
    } else if (elementData?.section === "test-inputs-test") {
        return getTestInputTestItems(
            elementData.runtime,
            elementData.testName,
            DataManagementUtils.getTestInputFiles(),
        );
    } else if (elementData?.section === "test-results") {
        if (!buildTreeItemsFromTestResultsTree) {
            return [];
        }
        return getTestResultItems(
            DataManagementUtils.getTestResults(),
            DataManagementUtils.getCollatedTestResults(),
            buildTreeItemsFromTestResultsTree,
        );
    } else if (elementData?.testName && elementData?.section === undefined) {
        return getTestResultChildren(
            elementData.testName,
            DataManagementUtils.getTestResults(),
        );
    } else if (
        elementData?.testName &&
        elementData?.runtime &&
        elementData?.section === undefined
    ) {
        return getTestResultRuntimeChildren(
            elementData.testName,
            elementData.runtime,
            DataManagementUtils.getTestResults(),
        );
    } else if (elementData?.section === "processes") {
        return getProcessItems(DataManagementUtils.getProcesses());
    } else if (elementData?.section === "reports") {
        return getReportItems();
    } else if (elementData?.section === "test-results-config") {
        return getTestResultsConfigItems(
            elementData.configKey,
            DataManagementUtils.getCollatedTestResults(),
        );
    } else if (elementData?.section === "test-results-directory") {
        return getTestResultsDirectoryItems(
            elementData.path,
            elementData.parentRuntime,
        );
    } else if (
        elementData?.filePath &&
        elementData?.context === "documentation"
    ) {
        return getDocumentationChildren(
            elementData.filePath,
            DataManagementUtils.getDocumentationTree(),
        );
    } else if (
        elementData?.filePath &&
        elementData?.context === "test-inputs"
    ) {
        return getTestInputChildren(
            elementData.filePath,
            DataManagementUtils.getInputFilesTree(),
        );
    } else if (elementData?.filePath) {
        return [];
    }

    return [];
}
