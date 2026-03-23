import { TestTreeItem } from '../TestTreeItem';
import { buildTreeItemsFromCollatedTree } from './buildTreeItemsFromCollatedTree';

export function getDocumentationChildren(
    filePath: string,
    documentationTree: Record<string, any>
): TestTreeItem[] {
    const parts = filePath.split('/').filter(part => part.length > 0);
    let currentNode = documentationTree;

    for (const part of parts) {
        if (currentNode[part] && currentNode[part].type === 'directory') {
            currentNode = currentNode[part].children;
        } else {
            return [];
        }
    }

    return buildTreeItemsFromCollatedTree(currentNode, 'documentation', filePath);
}
