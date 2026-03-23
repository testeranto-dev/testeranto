import { TestTreeItem } from '../TestTreeItem';
import { buildTreeItemsFromTestResultsTreeForConfig } from './buildTreeItemsFromTestResultsTreeForConfig';

export function getTestResultsConfigItems(
    configKey: string,
    collatedTestResults: Record<string, any>
): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    if (!collatedTestResults[configKey]) {
        return items;
    }

    const configData = collatedTestResults[configKey];
    const tests = configData.tests || {};

    const treeRoot: Record<string, any> = {};

    for (const [testName, testInfo] of Object.entries(tests)) {
        const info = testInfo as any;
        const results = info.results || [];

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

        const parts = testName.split('/').filter(part => part.length > 0);
        let currentNode = treeRoot;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;

            if (!currentNode[part]) {
                if (isLast) {
                    currentNode[part] = {
                        type: 'test',
                        name: part,
                        fullPath: testName,
                        configKey: configKey,
                        runtime: configData.runtime,
                        passed: passed,
                        failed: failed,
                        total: results.length,
                        results: results
                    };
                } else {
                    currentNode[part] = {
                        type: 'directory',
                        name: part,
                        children: {}
                    };
                }
            } else if (isLast) {
                currentNode[part].passed = passed;
                currentNode[part].failed = failed;
                currentNode[part].total = results.length;
                currentNode[part].results = results;
            }

            if (!isLast && currentNode[part].type === 'directory') {
                currentNode = currentNode[part].children;
            }
        }
    }

    return buildTreeItemsFromTestResultsTreeForConfig(treeRoot, configKey);
}
