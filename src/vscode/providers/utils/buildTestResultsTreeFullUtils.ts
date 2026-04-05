import { buildTreeItemsFromTestResultsTree as buildTreeItemsFromTestResultsTreeUtil } from './buildTestResultsTreeUtils';
import { TestTreeItem } from '../../TestTreeItem';

export function buildTestResultsTree(
    collatedTestResults: Record<string, any>
): TestTreeItem[] {
    // First, build the tree structure
    const treeRoot: Record<string, any> = {};

    for (const [configKey, configData] of Object.entries(collatedTestResults)) {
        const configInfo = configData as any;
        const tests = configInfo.tests || {};
        const files = configInfo.files || [];

        if (!treeRoot[configKey]) {
            treeRoot[configKey] = {
                type: "config",
                configKey: configKey,
                runtime: configInfo.runtime,
                children: {},
                files: files,
            };
        }

        for (const [testName, testInfo] of Object.entries(tests)) {
            const info = testInfo as any;
            const results = info.results || [];
            const testFiles = info.files || [];

            let passed = 0;
            let failed = 0;

            for (const result of results) {
                const status = result?.status;
                const failedFlag = result?.failed;

                if (status === true || failedFlag === false) {
                    passed++;
                } else {
                    failed++;
                }
            }

            const parts = testName.split("/").filter((part) => part.length > 0);
            let currentNode = treeRoot[configKey].children;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isLast = i === parts.length - 1;

                if (!currentNode[part]) {
                    if (isLast) {
                        currentNode[part] = {
                            type: "test",
                            name: part,
                            fullPath: testName,
                            configKey: configKey,
                            runtime: configInfo.runtime,
                            passed: passed,
                            failed: failed,
                            total: results.length,
                            results: results,
                            files: testFiles,
                            fileCount: info.fileCount || 0,
                        };
                    } else {
                        currentNode[part] = {
                            type: "directory",
                            name: part,
                            children: {},
                        };
                    }
                } else if (isLast) {
                    currentNode[part].passed = passed;
                    currentNode[part].failed = failed;
                    currentNode[part].total = results.length;
                    currentNode[part].results = results;
                    currentNode[part].files = testFiles;
                    currentNode[part].fileCount = info.fileCount || 0;
                }

                if (!isLast && currentNode[part].type === "directory") {
                    currentNode = currentNode[part].children;
                }
            }
        }

        const otherFiles = configInfo.otherFiles || [];
        if (otherFiles.length > 0) {
            if (!treeRoot[configKey].children["other"]) {
                treeRoot[configKey].children["other"] = {
                    type: "directory",
                    name: "other",
                    children: {},
                };
            }

            for (const file of otherFiles) {
                const fileName = file.name;
                treeRoot[configKey].children["other"].children[fileName] = {
                    type: "file",
                    name: fileName,
                    path: file.path,
                    // isJson: file.isJson,
                    // size: file.size,
                    // modified: file.modified,
                };
            }
        }
    }

    // Then, build the tree items from the tree structure
    return buildTreeItemsFromTestResultsTreeUtil(treeRoot);
}
