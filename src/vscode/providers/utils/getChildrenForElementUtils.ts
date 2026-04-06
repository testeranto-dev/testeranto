import type { TestTreeItem } from "../../TestTreeItem";


export function getChildrenForElement(
    element: TestTreeItem,
    buildTreeItemsFromTestResultsTree: (tree: Record<string, any>) => TestTreeItem[]
): TestTreeItem[] {
    const data = element.data;

    if (!data) {
        return [];
    }

    const section = data.section;

    // Handle different sections
    switch (section) {
        case 'documentation':
            return getDocumentationChildren(
                data.path || '',
                element.context?.getDocumentationTree?.() || {}
            );
        case 'test-inputs':
            return getTestInputItems(
                element.context?.getTestInputFiles?.() || new Map(),
                element.context?.getInputFilesTree?.() || {}
            );
        case 'test-inputs-runtime':
            return getTestInputRuntimeItems(
                data.runtime,
                element.context?.getTestInputFiles?.() || new Map()
            );
        case 'test-inputs-test':
            return getTestInputTestItems(
                data.runtime,
                data.testName,
                element.context?.getTestInputFiles?.() || new Map()
            );
        case 'test-results':
            return buildTreeItemsFromTestResultsTree(
                element.context?.getCollatedTestResults?.() || {}
            );
        case 'test-results-config':
            return getTestResultsConfigItems(
                data.configKey,
                element.context?.getCollatedTestResults?.() || {}
            );
        case 'test-results-directory':
            return getTestResultsDirectoryItems(
                data.path || '',
                data.parentRuntime
            );
        default:
            // Handle test result children
            if (data.testName && data.runtime) {
                return getTestResultRuntimeChildren(
                    data.testName,
                    data.runtime,
                    element.context?.getTestResults?.() || new Map()
                );
            } else if (data.testName) {
                return getTestResultChildren(
                    data.testName,
                    element.context?.getTestResults?.() || new Map()
                );
            }
            break;
    }

    return [];
}
