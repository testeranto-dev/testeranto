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
