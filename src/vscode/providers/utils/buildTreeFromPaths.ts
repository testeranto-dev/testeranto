export interface TreeNode {
    name: string;
    children: Map<string, TreeNode>;
    fullPath: string;
    isFile: boolean;
    originalPath?: string;
}

export function buildTreeFromPaths(filePaths: string[]): TreeNode {
    const root: TreeNode = { 
        name: '', 
        children: new Map(), 
        fullPath: '', 
        isFile: false 
    };

    for (const filePath of filePaths) {
        const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        const parts = normalizedPath.split('/').filter(part => part.length > 0 && part !== '.');
        
        if (parts.length === 0) continue;
        
        let currentNode = root;
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;
            
            if (!currentNode.children.has(part)) {
                currentNode.children.set(part, {
                    name: part,
                    children: new Map(),
                    fullPath: parts.slice(0, i + 1).join('/'),
                    isFile: isLast,
                    originalPath: isLast ? filePath : undefined
                });
            }
            currentNode = currentNode.children.get(part)!;
        }
    }
    
    return root;
}
