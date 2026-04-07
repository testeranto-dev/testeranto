import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toMarkdown } from 'mdast-util-to-markdown';
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter';
import { frontmatter } from 'micromark-extension-frontmatter';
import { gfmTable } from 'micromark-extension-gfm-table';

/**
 * Stakeholder-specific markdown operations
 */

/**
 * Update markdown file with new frontmatter
 * According to SOUL.md: no fallbacks, no guessing
 */
export async function updateMarkdownFile(
  projectRoot: string,
  filePath: string,
  frontmatterData: Record<string, any>,
  contentBody?: string
): Promise<void> {
  // Handle both relative and absolute paths
  let fullPath: string;
  if (path.isAbsolute(filePath)) {
    fullPath = filePath;
  } else {
    fullPath = path.join(projectRoot, filePath);
  }
  
  // Read existing file to preserve the body if not provided
  let body = contentBody;
  if (body === undefined && fs.existsSync(fullPath)) {
    const existingContent = fs.readFileSync(fullPath, 'utf-8');
    // Parse to extract body (content after frontmatter)
    const tree = fromMarkdown(existingContent, {
      extensions: [frontmatter(['yaml', 'toml']), gfmTable],
      mdastExtensions: [frontmatterFromMarkdown(['yaml', 'toml'])]
    });
    
    // Find the frontmatter node
    let frontmatterIndex = -1;
    for (let i = 0; i < tree.children.length; i++) {
      const node = tree.children[i];
      if (node.type === 'yaml' || node.type === 'toml') {
        frontmatterIndex = i;
        break;
      }
    }
    
    // Reconstruct body from nodes after frontmatter
    if (frontmatterIndex >= 0) {
      const bodyNodes = tree.children.slice(frontmatterIndex + 1);
      body = toMarkdown({ type: 'root', children: bodyNodes });
    } else {
      body = existingContent;
    }
  }
  
  // Convert frontmatter to YAML
  const yamlContent = yaml.dump(frontmatterData, { lineWidth: -1 });
  
  // Build the markdown content
  const frontmatterBlock = `---\n${yamlContent}---\n`;
  const finalContent = frontmatterBlock + (body || '');
  
  // Write the file
  fs.writeFileSync(fullPath, finalContent, 'utf-8');
}

/**
 * Read markdown file and extract frontmatter and body
 */
export async function readMarkdownFile(
  projectRoot: string,
  filePath: string
): Promise<{ frontmatter: Record<string, any>; body: string }> {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Markdown file not found: ${filePath}`);
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  
  // Parse markdown with frontmatter
  const tree = fromMarkdown(content, {
    extensions: [frontmatter(['yaml', 'toml']), gfmTable],
    mdastExtensions: [frontmatterFromMarkdown(['yaml', 'toml'])]
  });
  
  // Extract frontmatter
  let frontmatterData: Record<string, any> = {};
  for (const node of tree.children) {
    if (node.type === 'yaml' || node.type === 'toml') {
      try {
        frontmatterData = yaml.load((node as any).value) || {};
      } catch (error) {
        console.warn(`Failed to parse frontmatter in ${filePath}:`, error);
      }
      break;
    }
  }
  
  // Extract body
  let frontmatterIndex = -1;
  for (let i = 0; i < tree.children.length; i++) {
    const node = tree.children[i];
    if (node.type === 'yaml' || node.type === 'toml') {
      frontmatterIndex = i;
      break;
    }
  }
  
  let body = '';
  if (frontmatterIndex >= 0) {
    const bodyNodes = tree.children.slice(frontmatterIndex + 1);
    body = toMarkdown({ type: 'root', children: bodyNodes });
  } else {
    body = content;
  }
  
  return { frontmatter: frontmatterData, body };
}

/**
 * Handle markdown file changes by updating the specific file in the graph
 */
export async function handleMarkdownFileChange(
  projectRoot: string,
  filePath: string,
  graphManager: any
): Promise<any> {
  console.log(`[Stakeholder] Handling markdown file change: ${filePath}`);

  try {
    if (!graphManager) {
      console.log('[Stakeholder] Graph manager not available');
      return null;
    }

    const fullPath = path.join(projectRoot, filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`[Stakeholder] File ${filePath} no longer exists, skipping`);
      return null;
    }

    const { frontmatter: frontmatterData, body } = await readMarkdownFile(projectRoot, filePath);
    
    // Create feature ID from the file path
    const featureName = path.basename(filePath, '.md');
    const featureId = `feature:${featureName}`;

    // Extract status from frontmatter
    const status = frontmatterData.status || 'todo';
    const priority = frontmatterData.priority || 'medium';
    const label = frontmatterData.title || featureName;
    const description = frontmatterData.description || `Feature: ${featureName}`;

    // Check if node exists
    const graph = (graphManager as any).graph;
    const existingNode = graph.hasNode(featureId);
    const operationType = existingNode ? 'updateNode' : 'addNode';

    const timestamp = new Date().toISOString();
    const operation = {
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
          frontmatter: frontmatterData,
          localPath: fullPath,
          url: `file://${fullPath}`,
          content: body,
          contentPreview: body.substring(0, 200) + (body.length > 200 ? '...' : '')
        }
      },
      timestamp
    };

    // Apply the operation
    const update = { operations: [operation], timestamp };
    graphManager.applyUpdate(update);

    console.log(`[Stakeholder] Updated feature node ${featureId} with status: ${status}`);

    // Save the updated graph
    graphManager.saveGraph();

    return graphManager.getGraphData();
  } catch (error) {
    console.error(`[Stakeholder] Error handling markdown file change:`, error);
    throw error;
  }
}

/**
 * Create markdown file from graph node data
 */
export async function createMarkdownFileFromNode(
  projectRoot: string,
  nodeData: any,
  targetPath: string
): Promise<void> {
  const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(projectRoot, targetPath);
  
  // Extract frontmatter from node metadata
  const frontmatterData = nodeData.metadata?.frontmatter || {};
  
  // Add node attributes to frontmatter
  if (nodeData.status) frontmatterData.status = nodeData.status;
  if (nodeData.priority) frontmatterData.priority = nodeData.priority;
  if (nodeData.label) frontmatterData.title = nodeData.label;
  if (nodeData.description) frontmatterData.description = nodeData.description;
  
  // Get content from metadata or use default
  const content = nodeData.metadata?.content || `# ${nodeData.label}\n\n${nodeData.description}`;
  
  // Convert frontmatter to YAML
  const yamlContent = yaml.dump(frontmatterData, { lineWidth: -1 });
  
  // Build the markdown content
  const finalContent = `---\n${yamlContent}---\n\n${content}`;
  
  // Ensure directory exists
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write the file
  fs.writeFileSync(fullPath, finalContent, 'utf-8');
}
