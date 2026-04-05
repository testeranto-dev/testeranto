import { type GraphOperation } from '../../graph/index';
import path from 'path';

// Pure function to create folder nodes and edges
export function createFolderNodesAndEdgesPure(
  pathStr: string,
  projectRoot: string,
  operations: GraphOperation[],
  timestamp: string
): string {
  // Check if it's a URL (http:// or https://)
  const isUrl = pathStr.startsWith('http://') || pathStr.startsWith('https://');

  if (isUrl) {
    // For URLs, create a domain node and virtual folder structure
    try {
      const url = new URL(pathStr);
      const hostname = url.hostname;
      const pathname = url.pathname;

      // Create domain node first
      const domainId = `domain:${hostname}`;
      operations.push({
        type: 'addNode',
        data: {
          id: domainId,
          type: 'domain',
          label: hostname,
          description: `Domain: ${hostname}`,
          status: 'todo',
          icon: 'globe',
          metadata: {
            hostname: hostname,
            isVirtual: true,
            isDomain: true
          }
        },
        timestamp
      });

      // Connect domain to web root folder
      const webRootId = 'folder:web';
      operations.push({
        type: 'addNode',
        data: {
          id: webRootId,
          type: 'folder',
          label: 'web',
          description: 'Web Root',
          status: 'todo',
          icon: 'folder',
          metadata: {
            path: 'web',
            name: 'web',
            isVirtual: true,
            isUrlRoot: true
          }
        },
        timestamp
      });

      // Connect web root to domain
      operations.push({
        type: 'addEdge',
        data: {
          source: webRootId,
          target: domainId,
          attributes: {
            type: 'parentOf',
            weight: 1
          }
        },
        timestamp
      });

      // Create path components under the domain
      const pathParts = pathname.split('/').filter(part => part.trim() !== '');

      if (pathParts.length === 0) {
        // No path components, return domain as parent
        return domainId;
      } else {
        // We have path components
        // The last part is treated as the file, so create folders for all but the last
        let lastFolderId = domainId;

        for (let i = 0; i < pathParts.length - 1; i++) {
          const folderPath = `web/${hostname}/${pathParts.slice(0, i + 1).join('/')}`;
          const folderName = pathParts[i];
          const folderId = `folder:${folderPath}`;

          operations.push({
            type: 'addNode',
            data: {
              id: folderId,
              type: 'folder',
              label: folderName,
              description: `Web Path: ${folderName}`,
              status: 'todo',
              icon: 'folder',
              metadata: {
                path: folderPath,
                name: folderName,
                isVirtual: true,
                hostname: hostname
              }
            },
            timestamp
          });

          // Connect to parent folder/domain
          if (lastFolderId !== '') {
            operations.push({
              type: 'addEdge',
              data: {
                source: lastFolderId,
                target: folderId,
                attributes: {
                  type: 'parentOf',
                  weight: 1
                }
              },
              timestamp
            });
          }

          lastFolderId = folderId;
        }

        return lastFolderId; // Return the immediate parent folder ID
      }
    } catch (error) {
      console.error(`[GraphManager] Error parsing URL ${pathStr}:`, error);
      return '';
    }
  } else {
    // For local file paths, process them
    // Make sure the path is absolute
    let absolutePath = pathStr;
    if (!path.isAbsolute(pathStr)) {
      absolutePath = path.join(projectRoot, pathStr);
    }

    // Get the relative path from project root
    let relativePath: string;
    try {
      relativePath = path.relative(projectRoot, absolutePath);
    } catch {
      // If we can't get relative path, use the original
      relativePath = pathStr;
    }

    // Split the path into parts
    const parts = relativePath.split(path.sep).filter(part => part.trim() !== '');
    
    // If the path is empty (root), create a root folder
    if (parts.length === 0) {
      // Create root folder
      const rootFolderId = 'folder:';
      operations.push({
        type: 'addNode',
        data: {
          id: rootFolderId,
          type: 'folder',
          label: 'root',
          description: 'Root folder',
          status: 'todo',
          metadata: {
            path: '',
            name: 'root',
            absolutePath: projectRoot,
            isVirtual: false,
            isRoot: true
          }
        },
        timestamp
      });
      return rootFolderId;
    }

    // Track the last folder ID to connect the hierarchy
    let lastFolderId = '';

    // Process each directory in the path (excluding the file itself)
    for (let i = 0; i < parts.length - 1; i++) {
      const folderPath = parts.slice(0, i + 1).join('/');
      const folderName = parts[i];
      const folderId = `folder:${folderPath}`;

      // Create folder node
      operations.push({
        type: 'addNode',
        data: {
          id: folderId,
          type: 'folder',
          label: folderName,
          description: `Folder: ${folderPath}`,
          status: 'todo',
          icon: 'folder',
          metadata: {
            path: folderPath,
            name: folderName,
            absolutePath: path.join(projectRoot, folderPath),
            isVirtual: false
          }
        },
        timestamp
      });

      // Connect to parent folder if exists
      if (lastFolderId !== '') {
        operations.push({
          type: 'addEdge',
          data: {
            source: lastFolderId,
            target: folderId,
            attributes: {
              type: 'parentOf',
              weight: 1
            }
          },
          timestamp
        });
      } else {
        // If this is the first folder, connect it to root
        const rootFolderId = 'folder:';
        operations.push({
          type: 'addNode',
          data: {
            id: rootFolderId,
            type: 'folder',
            label: 'root',
            description: 'Root folder',
            status: 'todo',
            icon: 'folder',
            metadata: {
              path: '',
              name: 'root',
              absolutePath: projectRoot,
              isVirtual: false,
              isRoot: true
            }
          },
          timestamp
        });
        operations.push({
          type: 'addEdge',
          data: {
            source: rootFolderId,
            target: folderId,
            attributes: {
              type: 'parentOf',
              weight: 1
            }
          },
          timestamp
        });
        lastFolderId = folderId;
      }

      lastFolderId = folderId;
    }

    // If there are no parent folders (file is at root), create and return root folder
    if (lastFolderId === '') {
      const rootFolderId = 'folder:';
      operations.push({
        type: 'addNode',
        data: {
          id: rootFolderId,
          type: 'folder',
          label: 'root',
          description: 'Root folder',
          status: 'todo',
          metadata: {
            path: '',
            name: 'root',
            absolutePath: projectRoot,
            isVirtual: false,
            isRoot: true
          }
        },
        timestamp
      });
      return rootFolderId;
    }

    return lastFolderId; // Return the immediate parent folder ID
  }
}
