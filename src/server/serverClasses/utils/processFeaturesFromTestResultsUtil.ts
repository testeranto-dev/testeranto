export async function processFeaturesFromTestResultsUtil(
  configKey: string,
  testName: string,
  testResults: any,
  timestamp: string,
  featureIngestor: ((s: string) => Promise<{ data: string; filepath: string }>) | undefined,
  getProcessNode: (id: string) => any,
  applyUpdate: (update: any) => void,
  consoleWarn: (message: string, error?: any) => void,
  consoleError: (message: string, error?: any) => void
): Promise<void> {
  const features: string[] = [];

  if (testResults.features && Array.isArray(testResults.features)) {
    features.push(...testResults.features);
  }

  if (testResults.individualResults && Array.isArray(testResults.individualResults)) {
    for (const individualResult of testResults.individualResults) {
      if (individualResult.features && Array.isArray(individualResult.features)) {
        features.push(...individualResult.features);
      }
      if (individualResult.testJob) {
        if (individualResult.testJob.features && Array.isArray(individualResult.testJob.features)) {
          features.push(...individualResult.testJob.features);
        }
        if (individualResult.testJob.givens && Array.isArray(individualResult.testJob.givens)) {
          for (const given of individualResult.testJob.givens) {
            if (given.features && Array.isArray(given.features)) {
              features.push(...given.features);
            }
          }
        }
      }
    }
  }

  const uniqueFeatures = [...new Set(features)];

  if (uniqueFeatures.length === 0) {
    return;
  }

  for (const feature of uniqueFeatures) {
    if (!feature || typeof feature !== 'string') {
      continue;
    }

    const featureId = `feature:${configKey}:${testName}:${feature}`;

    const existingNode = getProcessNode(featureId);
    if (existingNode) {
      continue;
    }

    let frontmatter: Record<string, any> = {};
    let label = `Feature: ${feature}`;
    let description = `Test feature for ${testName}`;
    let status = 'done';
    let priority: string | undefined;
    let content: string | undefined;

    if (feature.startsWith('http://') || feature.startsWith('https://')) {
      if (featureIngestor) {
        try {
          const result = await featureIngestor(feature);
          content = result.data;
          label = `URL: ${feature}`;
          description = `Feature from URL for ${testName}`;
        } catch (error) {
          consoleWarn(`[Server_Docker_Test] Error ingesting feature URL ${feature}:`, error);
        }
      } else {
        label = `URL: ${feature}`;
        description = `Feature from URL for ${testName}`;
      }
    }
    else if (feature.endsWith('.md') || feature.endsWith('.markdown')) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const yaml = await import('js-yaml');

        let filePath = feature;
        if (!path.isAbsolute(filePath)) {
          filePath = path.join(process.cwd(), filePath);
        }

        if (fs.existsSync(filePath)) {
          content = fs.readFileSync(filePath, 'utf-8');

          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
          if (frontmatterMatch) {
            const frontmatterStr = frontmatterMatch[1];
            try {
              frontmatter = yaml.load(frontmatterStr) as Record<string, any> || {};

              if (frontmatter.title) {
                label = frontmatter.title;
              } else if (frontmatter.label) {
                label = frontmatter.label;
              }

              if (frontmatter.description) {
                description = frontmatter.description;
              }

              if (frontmatter.status) {
                status = frontmatter.status;
              }

              if (frontmatter.priority) {
                priority = frontmatter.priority;
              }
            } catch (yamlError) {
              consoleWarn(`[Server_Docker_Test] Error parsing YAML frontmatter for ${filePath}:`, yamlError);
            }
          }
        }
      } catch (error) {
        consoleWarn(`[Server_Docker_Test] Error reading markdown file ${feature}:`, error);
      }
    }
    else if (feature.includes('.') && (feature.includes('/') || feature.includes('\\'))) {
      label = `File: ${feature}`;
      description = `Feature file for ${testName}`;
    }

    const update = {
      operations: [{
        type: 'addNode' as const,
        data: {
          id: featureId,
          type: { category: 'file', type: 'feature' },
          label: label,
          description: description,
          status: status,
          priority: priority,
          icon: 'feature',
          metadata: {
            configKey,
            testName,
            feature,
            frontmatter: frontmatter,
            content: content,
            timestamp
          }
        },
        timestamp
      }],
      timestamp
    };

    try {
      applyUpdate(update);

      const entrypointId = `entrypoint:${testName}`;
      const edgeUpdate = {
        operations: [{
          type: 'addEdge' as const,
          data: {
            source: entrypointId,
            target: featureId,
            attributes: {
              type: { category: 'ownership', type: 'has', directed: true },
              timestamp
            }
          },
          timestamp
        }],
        timestamp
      };

      applyUpdate(edgeUpdate);
    } catch (error) {
      consoleError(`[Server_Docker_Test] Error creating feature node ${featureId}:`, error);
    }
  }
}
