export const buildFilesystemTreePure = (
  dirPath: string,
  existsSync: (path: string) => boolean,
  readdirSync: (path: string) => string[],
  statSync: (path: string) => { isDirectory: () => boolean },
  join: (...paths: string[]) => string,
  relative: (from: string, to: string) => string,
  cwd: () => string,
  consoleError: (message: string, error?: any) => void
): Record<string, any> => {
  const tree: Record<string, any> = {};

  if (!existsSync(dirPath)) {
    return tree;
  }

  try {
    const items = readdirSync(dirPath);

    for (const item of items) {
      const fullPath = join(dirPath, item);
      const stat = statSync(fullPath);
      const relativePath = relative(cwd(), fullPath);

      if (stat.isDirectory()) {
        tree[item] = {
          type: 'directory',
          children: buildFilesystemTreePure(
            fullPath,
            existsSync,
            readdirSync,
            statSync,
            join,
            relative,
            cwd,
            consoleError
          )
        };
      } else {
        tree[item] = {
          type: 'file',
          path: relativePath,
          isJson: item.endsWith('.json'),
          isHtml: item.endsWith('.html'),
          isMd: item.endsWith('.md')
        };
      }
    }
  } catch (error) {
    consoleError(`[DEBUG] Error building filesystem tree for ${dirPath}:`, error);
  }

  return tree;
};

export const mergeFileTreePure = (
  target: Record<string, any>,
  source: Record<string, any>
): void => {
  for (const [key, sourceNode] of Object.entries(source)) {
    if (!target[key]) {
      target[key] = { ...sourceNode };
      if (sourceNode.children) {
        target[key].children = {};
      }
    } else if (sourceNode.type === 'directory' && target[key].type === 'directory') {
      if (sourceNode.children) {
        if (!target[key].children) {
          target[key].children = {};
        }
        mergeFileTreePure(target[key].children, sourceNode.children);
      }
    }
  }
};

export const mergeAllFileTreesPure = (
  trees: Record<string, any>[]
): Record<string, any> => {
  const merged: Record<string, any> = {};

  for (const tree of trees) {
    mergeFileTreePure(merged, tree);
  }

  return merged;
};
