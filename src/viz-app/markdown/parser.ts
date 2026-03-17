import { MarkdownFile } from '../types';
import { GraphData } from '../viz';

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

export function parseMarkdownFile(path: string, content: string): MarkdownFile {
  const match = content.match(FRONTMATTER_REGEX);
  
  if (match) {
    const [, frontmatterStr, body] = match;
    const frontmatter = parseYAML(frontmatterStr);
    
    return {
      path,
      content,
      frontmatter,
      body: body.trim()
    };
  }
  
  // No frontmatter - treat entire content as body
  return {
    path,
    content,
    frontmatter: {},
    body: content.trim()
  };
}

function parseYAML(yamlStr: string): Record<string, any> {
  try {
    // Simple YAML parser for basic key-value pairs
    const result: Record<string, any> = {};
    const lines = yamlStr.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        let value = trimmed.substring(colonIndex + 1).trim();
        
        // Try to parse values
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (value === 'null') value = null;
        else if (!isNaN(Number(value)) && value !== '') value = Number(value);
        else if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        
        result[key] = value;
      }
    }
    
    return result;
  } catch (error) {
    console.warn('Failed to parse YAML frontmatter:', error);
    return {};
  }
}

export function markdownFilesToGraphData(
  files: MarkdownFile[],
  attributeMapping: { idAttribute: string; xAttribute?: string; yAttribute?: string }
): GraphData {
  const nodes = files.map(file => {
    const id = file.frontmatter[attributeMapping.idAttribute] || 
               file.path.split('/').pop()?.replace('.md', '') || 
               `node-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id,
      attributes: {
        ...file.frontmatter,
        _path: file.path,
        _body: file.body
      }
    };
  });
  
  return { nodes };
}

export function updateMarkdownFile(
  file: MarkdownFile,
  updatedAttributes: Record<string, any>
): MarkdownFile {
  const newFrontmatter = { ...file.frontmatter, ...updatedAttributes };
  
  // Remove internal attributes that shouldn't be in frontmatter
  delete newFrontmatter._path;
  delete newFrontmatter._body;
  
  // Convert frontmatter back to YAML
  const frontmatterLines = Object.entries(newFrontmatter)
    .map(([key, value]) => {
      if (value === null || value === undefined) return `${key}: null`;
      if (typeof value === 'string') return `${key}: "${value}"`;
      if (typeof value === 'boolean') return `${key}: ${value}`;
      return `${key}: ${value}`;
    });
  
  const newContent = `---\n${frontmatterLines.join('\n')}\n---\n\n${file.body}`;
  
  return {
    ...file,
    content: newContent,
    frontmatter: newFrontmatter
  };
}
