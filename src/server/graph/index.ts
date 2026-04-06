import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { ITesterantoConfig } from "../../Types";
import { graphToData } from '../../graph/graphToData';
import {
  type GraphData,
  type GraphEdgeAttributes,
  type GraphNodeAttributes,
  type GraphOperation,
  type GraphUpdate,
  type TesterantoGraph,
} from '../../graph/index';
import type { TestResult } from "../types/testResults";
import { cleanupAttributeNodesPure } from './cleanupAttributeNodesPure';
import { createFolderNodesAndEdgesPure } from './createFolderNodesAndEdgesPure';
import { createGraphDataFilePure } from './createGraphDataFilePure';
import { generateEdgesPure } from './generateEdgesPure';
import { getGraphStatsPure } from './getGraphStatsPure';
import { hasFeatureUpdatesPure } from './hasFeatureUpdatesPure';
import { loadGraphPure } from './loadGraphPure';
import { processFeatureUrlPure } from './processFeatureUrlPure';
import { updateFromTestResultsPure } from './updateFromTestResultsPure';
import { createAiderNodeGraphOperationsPure } from '../serverClasses/Server_Docker/utils/launchAiderPure';

export class GraphManager {
  private graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>;
  private graphDataPath: string;

  private featureIngestor?: (url: string) => Promise<{ data: string; filepath: string }>;

  constructor(
    private projectRoot: string,
    featureIngestor?: (url: string) => Promise<{ data: string; filepath: string }>,
    private config?: ITesterantoConfig
  ) {
    this.featureIngestor = featureIngestor;

    // Use the same file that the stakeholder app reads from
    this.graphDataPath = path.join(projectRoot, 'testeranto', 'reports', 'graph-data.json');

    // Load graph using pure function
    this.graph = loadGraphPure(this.graphDataPath, projectRoot);
  }

  // Load graph from file or create new
  private loadGraph(): TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes> {
    // Note: This method is kept for compatibility but not used in constructor
    // since we always start fresh
    return loadGraphPure(this.graphDataPath, this.projectRoot);
  }

  // Save graph to file in unified format
  public saveGraph(): void {
    try {
      const graphData = graphToData(this.graph);
      const dir = path.dirname(this.graphDataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Use pure function to create graph data file structure
      const graphDataFile = createGraphDataFilePure(graphData);

      // DO NOT try to preserve old data - always write new unified format
      fs.writeFileSync(this.graphDataPath, JSON.stringify(graphDataFile, null, 2), 'utf-8');
    } catch (error) {
      console.error('[GraphManager] Error saving graph:', error);
    }
  }

  // Get current graph data
  public getGraphData(): GraphData {
    return graphToData(this.graph);
  }

  // Apply graph updates
  public applyUpdate(update: GraphUpdate): GraphData {
    update.operations.forEach(op => {
      try {
        switch (op.type) {
          case 'addNode':
            this.graph.addNode(op.data.id, op.data);
            break;
          case 'updateNode':
            // For feature nodes, we need to update metadata.content and metadata.frontmatter when attributes change
            const existingAttrs = this.graph.getNodeAttributes(op.data.id);
            if (existingAttrs.type === 'feature') {
              // Merge the new attributes, but preserve existing metadata if not provided
              const currentMetadata = existingAttrs.metadata || {};
              const updatedMetadata = op.data.metadata || {};

              // Create merged metadata
              const mergedMetadata = {
                ...currentMetadata,
                ...updatedMetadata
              };

              // Create merged attributes
              const mergedAttrs = {
                ...op.data,
                metadata: mergedMetadata
              };

              // Merge the attributes
              this.graph.mergeNodeAttributes(op.data.id, mergedAttrs);

              // Get the updated attributes
              const updatedAttrs = this.graph.getNodeAttributes(op.data.id);

              // Generate updated markdown content
              const content = this.generateMarkdownContent(updatedAttrs);
              if (content) {
                // Parse the new frontmatter from the generated content
                const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
                const match = content.match(frontmatterRegex);
                let newFrontmatter: Record<string, any> = {};

                if (match) {
                  try {
                    const yamlContent = match[1];
                    newFrontmatter = yaml.load(yamlContent) || {};
                  } catch (error) {
                    console.error(`[GraphManager] Error parsing YAML frontmatter from generated content:`, error);
                  }
                }

                // Update metadata.content and metadata.frontmatter
                this.graph.mergeNodeAttributes(op.data.id, {
                  metadata: {
                    ...updatedAttrs.metadata,
                    content: content,
                    frontmatter: newFrontmatter
                  }
                });
              }
            } else {
              this.graph.mergeNodeAttributes(op.data.id, op.data);
            }
            break;
          case 'removeNode':
            this.graph.dropNode(op.data.id);
            break;
          case 'addEdge':
            this.graph.addEdge(op.data.source, op.data.target, op.data.attributes);
            break;
          case 'updateEdge':
            const edge = this.graph.edge(op.data.source, op.data.target);
            if (edge) {
              this.graph.mergeEdgeAttributes(edge, op.data.attributes);
            }
            break;
          case 'removeEdge':
            const edgeToRemove = this.graph.edge(op.data.source, op.data.target);
            if (edgeToRemove) {
              this.graph.dropEdge(edgeToRemove);
            }
            break;
        }
      } catch (error) {
        // console.warn(`[GraphManager] Error applying operation ${op.type}:`, error);
      }
    });

    this.saveGraph();

    // Check if there are feature updates and serialize to markdown
    const hasFeatureUpdates = hasFeatureUpdatesPure(update.operations, this.graph);
    if (hasFeatureUpdates) {
      this.serializeToMarkdown();
    }

    return this.getGraphData();
  }

  // Parse markdown files with YAML frontmatter to extract graph nodes
  public parseMarkdownFiles(globPattern: string): GraphUpdate {
    const operations: GraphOperation[] = [];
    const timestamp = new Date().toISOString();

    const fs = require('fs');
    const path = require('path');
    const yaml = require('js-yaml');
    const { glob } = require('glob');

    try {
      // Find all markdown files matching the glob pattern
      const files = glob.sync(globPattern, { cwd: this.projectRoot });

      for (const file of files) {
        try {
          const filePath = path.join(this.projectRoot, file);
          const content = fs.readFileSync(filePath, 'utf-8');

          // Parse YAML frontmatter
          const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
          const match = content.match(frontmatterRegex);

          if (match) {
            const yamlContent = match[1];
            const frontmatter = yaml.load(yamlContent) || {};

            // Create a feature node from the markdown file
            const featureName = path.basename(file, '.md');
            const featureId = `feature:${featureName}`;

            // Extract status from frontmatter
            const status = frontmatter.status || 'todo';
            const priority = frontmatter.priority || 'medium';
            const label = frontmatter.title || featureName;
            const description = frontmatter.description || `Feature: ${featureName}`;

            // Check if node already exists
            const existingNode = this.graph.hasNode(featureId);
            const operationType = existingNode ? 'updateNode' : 'addNode';

            operations.push({
              type: operationType,
              data: {
                id: featureId,
                type: 'feature',
                label,
                description,
                status,
                priority,
                icon: 'document',
                metadata: {
                  ...frontmatter,
                  localPath: filePath,
                  content: content,
                  contentPreview: content.substring(0, 200) + (content.length > 200 ? '...' : '')
                }
              },
              timestamp
            });

            // console.log(`[GraphManager] Created feature node from ${file} with status: ${status}`);
          }
        } catch (error) {
          console.error(`[GraphManager] Error parsing markdown file ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('[GraphManager] Error in parseMarkdownFiles:', error);
    }

    return {
      operations,
      timestamp
    };
  }

  // Helper to create folder nodes and connect them in a hierarchy for both local file paths and URLs
  private createFolderNodesAndEdges(
    pathStr: string,
    operations: GraphOperation[],
    timestamp: string
  ): string {
    return createFolderNodesAndEdgesPure(
      pathStr,
      this.projectRoot,
      operations,
      timestamp
    );
  }

  // Helper to process a feature URL using featureIngestor
  private async processFeatureUrl(featureUrl: string): Promise<{ content: string; localPath?: string }> {
    return processFeatureUrlPure(
      featureUrl,
      this.projectRoot,
      this.featureIngestor
    );
  }

  // Update graph from test results
  public async updateFromTestResults(testResults: TestResult | TestResult[]): Promise<GraphUpdate> {
    return updateFromTestResultsPure(
      testResults,
      this.graph,
      this.projectRoot,
      this.featureIngestor,
      this.config
    );
  }

  // Update graph with input files for a specific test
  public async updateGraphWithInputFiles(
    runtime: string,
    testName: string,
    configKey: string,
    inputFiles: string[]
  ): Promise<GraphUpdate> {
    const timestamp = new Date().toISOString();
    const operations: GraphOperation[] = [];

    // Find or create the entrypoint node for this test
    const entrypointId = `entrypoint:${testName}`;
    const existingEntrypointNode = this.graph.hasNode(entrypointId);

    if (!existingEntrypointNode) {
      // Create entrypoint node if it doesn't exist
      operations.push({
        type: 'addNode',
        data: {
          id: entrypointId,
          type: 'entrypoint',
          label: testName.split('/').pop() || testName,
          description: `Test entrypoint: ${testName}`,
          status: 'todo',
          icon: 'file-text',
          metadata: {
            configKey,
            filePath: testName,
            runtime,
            timestamp
          }
        },
        timestamp
      });
    }

    // Process each input file
    for (const inputFile of inputFiles) {
      // Create file node for input file
      const fileNodeId = `file:${inputFile}`;
      const existingFileNode = this.graph.hasNode(fileNodeId);

      if (!existingFileNode) {
        operations.push({
          type: 'addNode',
          data: {
            id: fileNodeId,
            type: 'file',
            label: inputFile.split('/').pop() || inputFile,
            description: `Input file: ${inputFile}`,
            metadata: {
              filePath: inputFile,
              localPath: inputFile,
              url: `file://${inputFile}`,
              isInputFile: true
            }
          },
          timestamp
        });
      } else {
        // console.log(`[GraphManager] File node already exists: ${fileNodeId}`);
      }

      // Create folder nodes for the input file's path
      const parentFolderId = this.createFolderNodesAndEdges(
        inputFile,
        operations,
        timestamp
      );

      // Connect input file to its parent folder
      if (parentFolderId !== '') {
        const folderEdgeExists = this.graph.hasEdge(parentFolderId, fileNodeId);
        if (!folderEdgeExists) {
          operations.push({
            type: 'addEdge',
            data: {
              source: parentFolderId,
              target: fileNodeId,
              attributes: {
                type: 'locatedIn',

              }
            },
            timestamp
          });
        }
      }

      // Connect entrypoint to input file
      const entrypointToFileEdgeExists = this.graph.hasEdge(entrypointId, fileNodeId);
      if (!entrypointToFileEdgeExists) {
        operations.push({
          type: 'addEdge',
          data: {
            source: entrypointId,
            target: fileNodeId,
            attributes: {
              type: 'associatedWith',

            }
          },
          timestamp
        });
      }
    }

    // Apply the operations
    if (operations.length > 0) {
      const update = { operations, timestamp };
      this.applyUpdate(update);
      // console.log(`[GraphManager] Applied ${operations.length} operations for input files`);
      return update;
    }

    return { operations: [], timestamp };
  }

  // Clean up attribute nodes (nodes that should be attributes of other nodes)
  public cleanupAttributeNodes(): GraphUpdate {
    const timestamp = new Date().toISOString();
    const graphData = graphToData(this.graph);
    const operations = cleanupAttributeNodesPure(graphData, timestamp);
    return { operations, timestamp };
  }

  // Generate edges between related nodes
  public generateEdges(): GraphUpdate {
    const timestamp = new Date().toISOString();
    const graphData = graphToData(this.graph);
    const operations = generateEdgesPure(graphData, this.config, timestamp, this.projectRoot);
    return { operations, timestamp };
  }

  public getGraphStats(): { nodes: number; edges: number; nodeTypes: Record<string, number>; edgeTypes: Record<string, number> } {
    return getGraphStatsPure(this.graph);
  }

  // Serialize graph changes back to markdown frontmatter
  public serializeToMarkdown(): void {
    // Get all feature nodes from the graph
    const featureNodes = this.graph.nodes().filter(nodeId => {
      const attrs = this.graph.getNodeAttributes(nodeId);
      return attrs.type === 'feature';
    });
    let writtenCount = 0;
    let errorCount = 0;

    for (const nodeId of featureNodes) {
      try {
        const attrs = this.graph.getNodeAttributes(nodeId);
        const metadata = attrs.metadata || {};
        const localPath = metadata.localPath as string | undefined;

        // Generate markdown content with YAML frontmatter from node attributes
        const content = this.generateMarkdownContent(attrs);

        fs.writeFileSync(localPath, content, 'utf-8');

        // Update the node's metadata.content to keep graph in sync
        this.graph.mergeNodeAttributes(nodeId, {
          metadata: {
            ...metadata,
            content: content
          }
        });

        writtenCount++;

      } catch (error) {
        console.error(`[GraphManager] Error serializing feature ${nodeId}:`, error);
        errorCount++;
      }
    }

  }

  // Generate markdown content with YAML frontmatter from node attributes
  public generateMarkdownContent(attrs: any): string | null {
    const metadata = attrs.metadata || {};
    const originalContent = metadata.content as string | undefined;

    // Handle missing content
    if (originalContent === undefined) {
      console.log(`[GraphManager] Feature ${attrs.id} has no content field in metadata, generating from attributes`);
      // Generate content from node attributes
      return this.generateContentFromAttributes(attrs, metadata);
    }

    if (originalContent === '') {
      console.log(`[GraphManager] Feature ${attrs.id} has empty content, generating from attributes`);
      // Generate content from node attributes
      return this.generateContentFromAttributes(attrs, metadata);
    }

    // Extract YAML frontmatter from original content
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = originalContent.match(frontmatterRegex);

    let frontmatter: Record<string, any> = {};
    let markdownBody = originalContent;

    if (match) {
      try {
        // Parse YAML frontmatter
        const yamlContent = match[1];
        frontmatter = yaml.load(yamlContent) || {};
        markdownBody = originalContent.slice(match[0].length);
      } catch (error) {
        console.error(`[GraphManager] Error parsing YAML frontmatter:`, error);
        // If YAML parsing fails, use empty frontmatter
        frontmatter = {};
      }
    }

    // Start with the frontmatter from metadata if it exists (this preserves all original fields)
    if (metadata.frontmatter && typeof metadata.frontmatter === 'object') {
      // Merge metadata.frontmatter into our frontmatter, but don't overwrite with undefined
      for (const [key, value] of Object.entries(metadata.frontmatter)) {
        if (value !== undefined) {
          frontmatter[key] = value;
        }
      }
    }

    // Update frontmatter with node attributes (these should override metadata.frontmatter)
    // Map graph attributes to frontmatter fields
    if (attrs.status !== undefined) {
      frontmatter.status = attrs.status;
    }
    if (attrs.priority !== undefined) {
      frontmatter.priority = attrs.priority;
    }
    if (attrs.label !== undefined) {
      frontmatter.title = attrs.label;
    }
    if (attrs.description !== undefined) {
      frontmatter.description = attrs.description;
    }

    // Also include any other metadata that should be in frontmatter
    // Skip internal fields and the frontmatter field itself
    const internalFields = ['content', 'contentPreview', 'localPath', 'url', 'frontmatter'];
    for (const [key, value] of Object.entries(metadata)) {
      if (!internalFields.includes(key) && value !== undefined) {
        // Always update with metadata values, as they may have been updated
        frontmatter[key] = value;
      }
    }

    // Generate new YAML frontmatter
    let newContent = '';
    if (Object.keys(frontmatter).length > 0) {
      try {
        const yamlStr = yaml.dump(frontmatter, { lineWidth: -1 });
        newContent = `---\n${yamlStr}---\n${markdownBody}`;
      } catch (error) {
        console.error(`[GraphManager] Error generating YAML frontmatter:`, error);
        // Fall back to original content if YAML generation fails
        return originalContent;
      }
    } else {
      // No frontmatter, just return the markdown body
      newContent = markdownBody;
    }

    return newContent;
  }

  // Generate markdown content from node attributes when no content exists
  private generateContentFromAttributes(attrs: any, metadata: any): string {
    const frontmatter: Record<string, any> = {};

    // Start with the frontmatter from metadata if it exists
    if (metadata.frontmatter && typeof metadata.frontmatter === 'object') {
      for (const [key, value] of Object.entries(metadata.frontmatter)) {
        if (value !== undefined) {
          frontmatter[key] = value;
        }
      }
    }

    // Map graph attributes to frontmatter fields (override metadata.frontmatter)
    if (attrs.status !== undefined) {
      frontmatter.status = attrs.status;
    }
    if (attrs.priority !== undefined) {
      frontmatter.priority = attrs.priority;
    }
    if (attrs.label !== undefined) {
      frontmatter.title = attrs.label;
    }
    if (attrs.description !== undefined) {
      frontmatter.description = attrs.description;
    }

    // Also include any other metadata that should be in frontmatter
    // Skip internal fields and the frontmatter field itself
    const internalFields = ['content', 'contentPreview', 'localPath', 'url', 'frontmatter'];
    for (const [key, value] of Object.entries(metadata)) {
      if (!internalFields.includes(key) && value !== undefined) {
        // Don't overwrite if already set from metadata.frontmatter or node attributes
        if (frontmatter[key] === undefined) {
          frontmatter[key] = value;
        }
      }
    }

    // Generate markdown body from description or label
    let markdownBody = '';
    if (attrs.description) {
      markdownBody = `# ${attrs.label || attrs.id}\n\n${attrs.description}`;
    } else if (attrs.label) {
      markdownBody = `# ${attrs.label}`;
    } else {
      markdownBody = `# ${attrs.id.replace('feature:', '')}`;
    }

    // Generate YAML frontmatter
    let newContent = '';
    if (Object.keys(frontmatter).length > 0) {
      try {
        const yamlStr = yaml.dump(frontmatter, { lineWidth: -1 });
        newContent = `---\n${yamlStr}---\n\n${markdownBody}`;
      } catch (error) {
        console.error(`[GraphManager] Error generating YAML frontmatter from attributes:`, error);
        // Fall back to just markdown body
        newContent = markdownBody;
      }
    } else {
      // No frontmatter, just return the markdown body
      newContent = markdownBody;
    }

    return newContent;
  }

  public async updateGraphWithAiderNode(params: {
    runtime: string;
    testName: string;
    configKey: string;
    aiderServiceName: string;
    containerId?: string;
  }): Promise<void> {
    const timestamp = new Date().toISOString();
    const operations = createAiderNodeGraphOperationsPure({
      ...params,
      timestamp
    });
    const update: GraphUpdate = {
      operations,
      timestamp
    };
    this.applyUpdate(update);
    this.saveGraph();
  }

  // Create aider node for an entrypoint (for manual testing)
  public createAiderNodeForEntrypoint(entrypointId: string, aiderServiceName: string, containerId?: string): void {
    const timestamp = new Date().toISOString();
    const aiderNodeId = `aider:${aiderServiceName}`;

    // Create aider node
    this.graph.addNode(aiderNodeId, {
      id: aiderNodeId,
      type: 'aider',
      label: `Aider: ${aiderServiceName}`,
      description: `Aider instance for ${entrypointId}`,
      status: 'done',
      icon: 'aider',
      metadata: {
        aiderServiceName,
        containerId,
        timestamp
      }
    });

    // Connect entrypoint to aider node
    if (this.graph.hasNode(entrypointId)) {
      this.graph.addEdge(entrypointId, aiderNodeId, {
        type: 'hasAider',

        timestamp
      });
    }

    // Connect aider to docker process if containerId exists
    if (containerId) {
      const dockerProcessId = `docker_process:${containerId}`;
      if (this.graph.hasNode(dockerProcessId)) {
        this.graph.addEdge(aiderNodeId, dockerProcessId, {
          type: 'hasProcess',

          timestamp
        });
      }
    }

    this.saveGraph();
  }
}
