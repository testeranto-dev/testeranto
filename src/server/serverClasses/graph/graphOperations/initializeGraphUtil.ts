import path from 'path';
import fs from 'fs';
import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from '../../../../graph';
import type { ITesterantoConfig } from '../../../../Types';

export function initializeGraphUtil(
  projectRoot: string,
  configs: ITesterantoConfig,
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  resourceChanged: (path: string) => void
): string {
  const graphDataPath = path.join(projectRoot, 'testeranto', 'reports', 'graph-data.json');
  return graphDataPath;
}
