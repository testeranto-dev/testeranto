import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toMarkdown } from 'mdast-util-to-markdown';
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter';
import { frontmatter } from 'micromark-extension-frontmatter';
import { gfmTable } from 'micromark-extension-gfm-table';

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
