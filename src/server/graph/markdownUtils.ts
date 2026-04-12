import yaml from 'js-yaml';

export function generateMarkdownContent(attrs: any): string | null {
    const metadata = attrs.metadata || {};
    const originalContent = metadata.content as string | undefined;

    // Handle missing content
    if (originalContent === undefined) {
        console.log(`[markdownUtils] Feature ${attrs.id} has no content field in metadata, generating from attributes`);
        // Generate content from node attributes
        return generateContentFromAttributes(attrs, metadata);
    }

    if (originalContent === '') {
        console.log(`[markdownUtils] Feature ${attrs.id} has empty content, generating from attributes`);
        // Generate content from node attributes
        return generateContentFromAttributes(attrs, metadata);
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
            console.error(`[markdownUtils] Error parsing YAML frontmatter:`, error);
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
            console.error(`[markdownUtils] Error generating YAML frontmatter:`, error);
            // Fall back to original content if YAML generation fails
            return originalContent;
        }
    } else {
        // No frontmatter, just return the markdown body
        newContent = markdownBody;
    }

    return newContent;
}

function generateContentFromAttributes(attrs: any, metadata: any): string | null {
    throw new Error('Function not implemented.');
}

