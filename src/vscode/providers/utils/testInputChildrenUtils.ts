import { TestTreeItem } from '../TestTreeItem';
import { buildTreeItemsFromInputFilesTree } from './buildTreeItemsFromInputFilesTree';

export function getTestInputChildren(
    filePath: string,
    inputFilesTree: Record<string, any>
): TestTreeItem[] {
    const parts = filePath.split('/').filter(part => part.length > 0);
    let currentNode = inputFilesTree;

    for (const part of parts) {
        if (currentNode[part]) {
            const node = currentNode[part];
            if (node.type === 'directory' && node.children) {
                currentNode = node.children;
            } else if (Array.isArray(node)) {
                return [];
            } else {
                return [];
            }
        } else {
            return [];
        }
    }

    return buildTreeItemsFromInputFilesTree(currentNode, 'test-inputs', filePath);
}
