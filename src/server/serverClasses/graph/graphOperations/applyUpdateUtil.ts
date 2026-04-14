import yaml from 'js-yaml';
import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes, GraphData, GraphUpdate } from '../../../../graph';
import { graphToData } from '../../graph/graphToData';
import { hasFeatureUpdatesPure } from '../../graph/hasFeatureUpdatesPure';
import { generateMarkdownContent } from '../../graph/markdownUtils';

export function applyUpdateUtil(
  update: GraphUpdate,
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  serializeToMarkdown: () => void
): GraphData {
  update.operations.forEach(op => {
    try {
      switch (op.type) {
        case 'addNode':
          graph.addNode(op.data.id, op.data);
          break;
        case 'updateNode':
          const existingAttrs = graph.getNodeAttributes(op.data.id);
          if (existingAttrs.type === 'feature') {
            const currentMetadata = existingAttrs.metadata || {};
            const updatedMetadata = op.data.metadata || {};
            const mergedMetadata = {
              ...currentMetadata,
              ...updatedMetadata
            };
            const mergedAttrs = {
              ...op.data,
              metadata: mergedMetadata
            };
            graph.mergeNodeAttributes(op.data.id, mergedAttrs);
            const updatedAttrs = graph.getNodeAttributes(op.data.id);
            const content = generateMarkdownContent(updatedAttrs);
            if (content) {
              const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
              const match = content.match(frontmatterRegex);
              let newFrontmatter: Record<string, any> = {};
              if (match) {
                try {
                  const yamlContent = match[1];
                  newFrontmatter = yaml.load(yamlContent) || {};
                } catch (error) {
                  console.error(`[applyUpdateUtil] Error parsing YAML frontmatter:`, error);
                }
              }
              graph.mergeNodeAttributes(op.data.id, {
                metadata: {
                  ...updatedAttrs.metadata,
                  content: content,
                  frontmatter: newFrontmatter
                }
              });
            }
          } else {
            graph.mergeNodeAttributes(op.data.id, op.data);
          }
          break;
        case 'removeNode':
          graph.dropNode(op.data.id);
          break;
        case 'addEdge':
          graph.addEdge(op.data.source, op.data.target, op.data.attributes);
          break;
        case 'updateEdge':
          const edge = graph.edge(op.data.source, op.data.target);
          if (edge) {
            graph.mergeEdgeAttributes(edge, op.data.attributes);
          }
          break;
        case 'removeEdge':
          const edgeToRemove = graph.edge(op.data.source, op.data.target);
          if (edgeToRemove) {
            graph.dropEdge(edgeToRemove);
          }
          break;
      }
    } catch (error) {
      console.warn(`[applyUpdateUtil] Error applying operation ${op.type}:`, error);
    }
  });

  const hasFeatureUpdates = hasFeatureUpdatesPure(update.operations, graph);
  if (hasFeatureUpdates) {
    serializeToMarkdown();
  }

  return graphToData(graph);
}
