import type { GraphUpdate, TesterantoGraph } from "../../../../graph";
import type { ITesterantoConfig } from "../../../../Types";

export async function processFeaturesDirectlyUtil(
  testResults: any,
  graph: TesterantoGraph<any, any>,
  projectRoot: string,
  applyUpdate: (update: GraphUpdate) => void,
  featureIngestor?: (url: string) => Promise<{ data: string; filepath: string }>,
  configs?: ITesterantoConfig
): Promise<void> {
  try {
    // Handle both single test result and array of test results
    const results = Array.isArray(testResults) ? testResults : [testResults];
    
    for (const result of results) {
      if (!result || typeof result !== 'object') continue;
      
      const configKey = result.configKey;
      const testName = result.testName;
      
      if (!configKey || !testName) continue;
      
      // Extract features from test results
      const features: string[] = [];
      
      // Check for top-level features
      if (result.features && Array.isArray(result.features)) {
        features.push(...result.features);
      }
      
      // Check for features in individual results
      if (result.individualResults && Array.isArray(result.individualResults)) {
        for (const individualResult of result.individualResults) {
          if (individualResult.features && Array.isArray(individualResult.features)) {
            features.push(...individualResult.features);
          }
        }
      }
      
      // Remove duplicates
      const uniqueFeatures = [...new Set(features)];
      
      if (uniqueFeatures.length === 0) continue;
      
      console.log(`[Server_Graph] Processing ${uniqueFeatures.length} features for ${configKey}/${testName}`);
      
      // Create feature nodes for each unique feature
      for (const feature of uniqueFeatures) {
        if (!feature || typeof feature !== 'string') continue;
        
        // Create a feature ID
        const featureId = `feature:${configKey}:${testName}:${feature}`;
        
        // Check if feature node already exists
        if (graph.hasNode(featureId)) continue;
        
        // Parse markdown file if it's a local markdown file
        let frontmatter: Record<string, any> = {};
        let label = `Feature: ${feature}`;
        let description = `Test feature for ${testName}`;
        let status = 'done';
        let priority: string | undefined;
        
        // Check if it's a local markdown file
        if (feature.endsWith('.md') || feature.endsWith('.markdown')) {
          try {
            // Try to read the markdown file
            const fs = await import('fs');
            const path = await import('path');
            const yaml = await import('js-yaml');
            
            let filePath = feature;
            // If it's a relative path, make it absolute relative to project root
            if (!path.isAbsolute(filePath)) {
              filePath = path.join(projectRoot, filePath);
            }
            
            if (fs.existsSync(filePath)) {
              const content = fs.readFileSync(filePath, 'utf-8');
              
              // Parse frontmatter
              const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
              if (frontmatterMatch) {
                const frontmatterStr = frontmatterMatch[1];
                try {
                  frontmatter = yaml.load(frontmatterStr) as Record<string, any> || {};
                  
                  // Extract useful fields from frontmatter
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
                  console.warn(`[Server_Graph] Error parsing YAML frontmatter for ${filePath}:`, yamlError);
                }
              }
            }
          } catch (error) {
            console.warn(`[Server_Graph] Error reading markdown file ${feature}:`, error);
          }
        }
        
        // Create feature node with frontmatter data
        const timestamp = new Date().toISOString();
        const update: GraphUpdate = {
          operations: [{
            type: 'addNode',
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
                timestamp
              }
            },
            timestamp
          }],
          timestamp
        };
        
        applyUpdate(update);
        
        // Connect feature to entrypoint
        const entrypointId = `entrypoint:${testName}`;
        if (graph.hasNode(entrypointId)) {
          const edgeUpdate: GraphUpdate = {
            operations: [{
              type: 'addEdge',
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
        }
      }
    }
  } catch (error) {
    console.error('[Server_Graph] Error processing features directly:', error);
  }
}
