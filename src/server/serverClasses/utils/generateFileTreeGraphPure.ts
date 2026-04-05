import fs from 'fs';
import path from 'path';
import type { AllTestResults, RuntimeTestResults, TestResult } from "../../types/testResults";
import type { ITesterantoConfig } from "../../../Types";

export interface FileTreeNode {
  id: string;
  type: 'file' | 'url';
  label: string;
  description: string;
  icon?: string;
  metadata: {
    path?: string;
    url?: string;
    isDirectory: boolean;
    isEntryFile: boolean;
    isInputFile: boolean;
    isFeature: boolean;
    isUrl: boolean;
    runtimeKey?: string;
    usedByTest?: string;
  };
}

export interface FileTreeEdge {
  source: string;
  target: string;
  attributes: { type: 'locatedIn' };
}

export interface FileTreeGraph {
  nodes: FileTreeNode[];
  edges: FileTreeEdge[];
}

/**
 * Pure stateless function to generate a file tree graph based on project structure.
 * Only includes: entry files, input files used by entry files, and feature references (URLs or files).
 */
export function generateFileTreeGraphPure(
  projectRoot: string,
  configs: ITesterantoConfig | null,
  testResults: AllTestResults
): FileTreeGraph {
  const nodes: FileTreeNode[] = [];
  const edges: FileTreeEdge[] = [];

  // Track which files/URLs we've already added to avoid duplicates
  const addedItems = new Set<string>();

  // Helper to add a file node if not already added
  const addFileNode = (filePath: string): string | null => {
    const relativePath = path.relative(projectRoot, filePath);
    if (addedItems.has(relativePath)) {
      return null;
    }

    const nodeId = `file:${relativePath}`;
    const isDirectory = fs.existsSync(filePath) && fs.statSync(filePath).isDirectory();

    nodes.push({
      id: nodeId,
      type: 'file',
      label: path.basename(filePath),
      description: isDirectory ? `Directory: ${relativePath}` : `File: ${relativePath}`,
      icon: isDirectory ? 'folder' : 'document',
      metadata: {
        path: relativePath,
        isDirectory,
        isEntryFile: false,
        isInputFile: false,
        isFeature: false,
        isUrl: false
      }
    });

    addedItems.add(relativePath);

    // Add parent directory structure
    if (!isDirectory) {
      const dirPath = path.dirname(filePath);
      const dirRelativePath = path.relative(projectRoot, dirPath);
      const dirNodeId = `file:${dirRelativePath}`;

      // Add parent directory if not already added
      if (!addedItems.has(dirRelativePath) && fs.existsSync(dirPath)) {
        nodes.push({
          id: dirNodeId,
          type: 'file',
          label: path.basename(dirPath),
          description: `Directory: ${dirRelativePath}`,
          metadata: {
            path: dirRelativePath,
            isDirectory: true,
            isEntryFile: false,
            isInputFile: false,
            isFeature: false,
            isUrl: false
          }
        });
        addedItems.add(dirRelativePath);

        // Connect file to directory
        edges.push({
          source: dirNodeId,
          target: nodeId,
          attributes: { type: 'locatedIn' }
        });
      } else if (addedItems.has(dirRelativePath)) {
        // Connect file to existing directory
        edges.push({
          source: dirNodeId,
          target: nodeId,
          attributes: { type: 'locatedIn' }
        });
      }
    }

    return nodeId;
  };

  // Helper to add a URL node
  const addUrlNode = (url: string): string | null => {
    if (addedItems.has(url)) {
      return null;
    }

    const nodeId = `url:${url}`;
    nodes.push({
      id: nodeId,
      type: 'url',
      label: url.split('/').pop() || url,
      description: `URL: ${url}`,
      icon: 'globe',
      metadata: {
        url: url,
        isDirectory: false,
        isEntryFile: false,
        isInputFile: false,
        isFeature: true,
        isUrl: true
      }
    });

    addedItems.add(url);
    return nodeId;
  };

  // 1. Add entry files (test files from configs)
  if (configs?.runtimes) {
    for (const [runtimeKey, runtimeConfig] of Object.entries(configs.runtimes)) {
      const tests = (runtimeConfig as any).tests || [];
      for (const testPath of tests) {
        const absoluteTestPath = path.isAbsolute(testPath) ? testPath : path.join(projectRoot, testPath);
        if (fs.existsSync(absoluteTestPath)) {
          const nodeId = addFileNode(absoluteTestPath);
          if (nodeId) {
            // Mark as entry file in metadata
            const nodeIndex = nodes.findIndex(n => n.id === nodeId);
            if (nodeIndex !== -1) {
              nodes[nodeIndex].metadata.isEntryFile = true;
              nodes[nodeIndex].metadata.runtimeKey = runtimeKey;
            }
          }
        }
      }
    }
  }

  // 2. Add input files used by entry files
  // We need to get input files from the bundles directory
  const bundlesDir = path.join(projectRoot, 'testeranto', 'bundles');
  if (fs.existsSync(bundlesDir)) {
    try {
      const runtimeDirs = fs.readdirSync(bundlesDir, { withFileTypes: true })
        .filter(item => item.isDirectory())
        .map(dir => dir.name);

      for (const runtimeDir of runtimeDirs) {
        const inputFilesPath = path.join(bundlesDir, runtimeDir, 'inputFiles.json');
        if (fs.existsSync(inputFilesPath)) {
          try {
            const inputFilesData = JSON.parse(fs.readFileSync(inputFilesPath, 'utf-8'));
            for (const [testName, testData] of Object.entries(inputFilesData)) {
              if (testData && typeof testData === 'object' && 'files' in testData) {
                const files = (testData as any).files || [];
                for (const filePath of files) {
                  const absoluteFilePath = path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath);
                  if (fs.existsSync(absoluteFilePath)) {
                    const nodeId = addFileNode(absoluteFilePath);
                    if (nodeId) {
                      // Mark as input file in metadata
                      const nodeIndex = nodes.findIndex(n => n.id === nodeId);
                      if (nodeIndex !== -1) {
                        nodes[nodeIndex].metadata.isInputFile = true;
                        nodes[nodeIndex].metadata.usedByTest = testName;
                      }
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error(`[generateFileTreeGraphPure] Error reading input files for ${runtimeDir}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('[generateFileTreeGraphPure] Error reading bundles directory:', error);
    }
  }

  // 3. Add feature references from test results (URLs or files)
  if (testResults && typeof testResults === 'object') {
    const featureUrls = new Set<string>();

    // Collect all features from test results
    for (const [runtime, runtimeResults] of Object.entries(testResults as Record<string, RuntimeTestResults>)) {
      if (runtimeResults && typeof runtimeResults === 'object') {
        for (const [testName, testResult] of Object.entries(runtimeResults as Record<string, TestResult>)) {
          if (testResult && typeof testResult === 'object') {
            // Check for features in individualResults
            if (Array.isArray(testResult.individualResults)) {
              for (const individualResult of testResult.individualResults) {
                if (individualResult && Array.isArray(individualResult.features)) {
                  for (const feature of individualResult.features) {
                    if (typeof feature === 'string') {
                      featureUrls.add(feature);
                    }
                  }
                }
              }
            }
            // Check for features at the top level
            if (Array.isArray(testResult.features)) {
              for (const feature of testResult.features) {
                if (typeof feature === 'string') {
                  featureUrls.add(feature);
                }
              }
            }
          }
        }
      }
    }

    // Add feature URLs as nodes
    for (const featureUrl of featureUrls) {
      // Check if it's a URL or a local file path
      if (featureUrl.startsWith('http://') || featureUrl.startsWith('https://')) {
        // It's a URL
        addUrlNode(featureUrl);
      } else {
        // It might be a local file path
        // Check if it exists as a file
        const absoluteFeaturePath = path.isAbsolute(featureUrl) ? featureUrl : path.join(projectRoot, featureUrl);
        if (fs.existsSync(absoluteFeaturePath)) {
          const nodeId = addFileNode(absoluteFeaturePath);
          if (nodeId) {
            // Mark as feature in metadata
            const nodeIndex = nodes.findIndex(n => n.id === nodeId);
            if (nodeIndex !== -1) {
              nodes[nodeIndex].metadata.isFeature = true;
            }
          }
        } else {
          // If it doesn't exist as a file, treat it as a URL or path reference
          addUrlNode(featureUrl);
        }
      }
    }
  }

  return { nodes, edges };
}
