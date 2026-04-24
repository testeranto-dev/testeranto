import fs from 'fs';
import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from '../../../../graph';
import { generateMarkdownContent } from '../markdownUtils';

export function serializeToMarkdownUtil(
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>
): void {
  const featureNodes = graph.nodes().filter(nodeId => {
    const attrs = graph.getNodeAttributes(nodeId);
    return attrs.type === 'feature';
  });
  let writtenCount = 0;
  let errorCount = 0;

  for (const nodeId of featureNodes) {
    try {
      const attrs = graph.getNodeAttributes(nodeId);
      const metadata = attrs.metadata || {};
      const localPath = metadata.localPath as string | undefined;
      const content = generateMarkdownContent(attrs);
      if (content && localPath) {
        fs.writeFileSync(localPath, content, 'utf-8');
        graph.mergeNodeAttributes(nodeId, {
          metadata: {
            ...metadata,
            content: content
          }
        });
        writtenCount++;
      }
    } catch (error) {
      errorCount++;
    }
  }
}
