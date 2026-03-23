import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { buildTreeFromPaths } from './buildTreeFromPaths';
import { buildTreeItemsFromCollatedTree } from './buildTreeItemsFromCollatedTree';

export function getDocumentationItems(
    documentationFiles: string[],
    documentationTree: Record<string, any>
): TestTreeItem[] {
    if (documentationFiles.length === 0) {
        return [
            new TestTreeItem(
                'No documentation files found',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    description: 'Configure documentationGlob in testeranto config'
                },
                undefined,
                new vscode.ThemeIcon('info')
            )
        ];
    }

    if (Object.keys(documentationTree).length > 0) {
        return buildTreeItemsFromCollatedTree(documentationTree, 'documentation');
    }

    const treeRoot = buildTreeFromPaths(documentationFiles);
    // We need to import buildTreeItemsFromNode, but it's already in the class
    // For now, we'll call it through the class
    // We'll need to pass a function to build items from node
    // Let's assume we have a function to do this
    // We'll need to import it
    // Since this is a utility, we need to make sure all dependencies are available
    // Let's import buildTreeItemsFromNode
    import { buildTreeItemsFromNode } from './buildTreeItemsFromNode';
    return buildTreeItemsFromNode(treeRoot, 'documentation');
}
import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { buildTreeFromPaths } from './buildTreeFromPaths';
import { buildTreeItemsFromCollatedTree } from './buildTreeItemsFromCollatedTree';
import { buildTreeItemsFromNode } from './buildTreeItemsFromNode';

export function getDocumentationItems(
    documentationFiles: string[],
    documentationTree: Record<string, any>
): TestTreeItem[] {
    if (documentationFiles.length === 0) {
        return [
            new TestTreeItem(
                'No documentation files found',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    description: 'Configure documentationGlob in testeranto config'
                },
                undefined,
                new vscode.ThemeIcon('info')
            )
        ];
    }

    if (Object.keys(documentationTree).length > 0) {
        return buildTreeItemsFromCollatedTree(documentationTree, 'documentation');
    }

    const treeRoot = buildTreeFromPaths(documentationFiles);
    return buildTreeItemsFromNode(treeRoot, 'documentation');
}
