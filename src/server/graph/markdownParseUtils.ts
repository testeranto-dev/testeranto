import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { GraphOperation } from '.';

export function parseMarkdownFilesPure(
    globPattern: string,
    projectRoot: string,
    graphHasNode: (nodeId: string) => boolean
): { operations: GraphOperation[], timestamp: string } {
    const operations: GraphOperation[] = [];
    const timestamp = new Date().toISOString();

    const { glob } = require('glob');

    try {
        // Find all markdown files matching the glob pattern
        const files = glob.sync(globPattern, { cwd: projectRoot });

        for (const file of files) {
            try {
                const filePath = path.join(projectRoot, file);
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
                    const existingNode = graphHasNode(featureId);
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
                }
            } catch (error) {
                console.error(`[markdownParseUtils] Error parsing markdown file ${file}:`, error);
            }
        }
    } catch (error) {
        console.error('[markdownParseUtils] Error in parseMarkdownFiles:', error);
    }

    return { operations, timestamp };
}
