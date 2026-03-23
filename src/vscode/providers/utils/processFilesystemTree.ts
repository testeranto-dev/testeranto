export function processFilesystemTree(tree: Record<string, any>, testInputFiles: Map<string, any[]>): void {
    const processNode = (node: any, path: string = ''): void => {
        if (!node) return;

        if (node.type === 'test') {
            const runtime = node.runtime || 'unknown';
            const testName = node.path || path;
            const inputFiles = node.inputFiles || [];

            if (!testInputFiles.has(runtime)) {
                testInputFiles.set(runtime, []);
            }

            testInputFiles.get(runtime)!.push({
                testName: testName,
                files: inputFiles,
                count: node.count || 0
            });
        }

        if (node.children) {
            for (const [childName, childNode] of Object.entries(node.children)) {
                const childPath = path ? `${path}/${childName}` : childName;
                processNode(childNode, childPath);
            }
        }

        if (Array.isArray(node)) {
            for (const item of node) {
                processNode(item, path);
            }
        }
    };

    for (const [key, value] of Object.entries(tree)) {
        processNode(value, key);
    }
}
