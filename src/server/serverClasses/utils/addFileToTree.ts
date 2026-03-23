
/**
 * Add a file to a tree structure
 */
export function addFileToTree(tree: any, filePath: string, type: string): void {
  const parts = filePath.split('/').filter(part => part.length > 0);
  let currentNode = tree.children;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = i === parts.length - 1;

    if (!currentNode[part]) {
      if (isLast) {
        currentNode[part] = {
          type: 'file',
          name: part,
          path: filePath,
          fileType: type,
          content: null
        };
      } else {
        currentNode[part] = {
          type: 'directory',
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          children: {}
        };
      }
    } else if (isLast && currentNode[part].type === 'file') {
      // Update existing file
      currentNode[part].fileType = type;
    }

    if (!isLast) {
      if (currentNode[part].type === 'directory') {
        currentNode = currentNode[part].children;
      } else {
        // Convert file to directory if needed
        const temp = currentNode[part];
        currentNode[part] = {
          type: 'directory',
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          children: {}
        };
        currentNode = currentNode[part].children;
      }
    }
  }
}
