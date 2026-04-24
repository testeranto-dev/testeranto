import yaml from 'js-yaml';

export function generateContentFromAttributes(attrs: any, metadata: any): string {
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
      console.error(`[markdownUtils] Error generating YAML frontmatter from attributes:`, error);
      // Fall back to just markdown body
      newContent = markdownBody;
    }
  } else {
    // No frontmatter, just return the markdown body
    newContent = markdownBody;
  }

  return newContent;
}
