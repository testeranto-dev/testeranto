
import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes, GraphOperation } from ".";
import type { TestResult } from "../types/testResults";
import { createSimpleTestNodeOperationsPure } from './createSimpleTestNodeOperationsPure';

export async function handleSimpleTestResultPure(
  singleTestResult: TestResult,
  sanitizedConfigKey: string,
  filePathForEntrypoint: string,
  entrypointId: string | undefined,
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  operations: GraphOperation[],
  timestamp: string
): Promise<void> {
  if (!entrypointId || singleTestResult.failed === undefined) {
    return;
  }

  const simpleTestOps = createSimpleTestNodeOperationsPure(
    sanitizedConfigKey,
    filePathForEntrypoint,
    singleTestResult,
    entrypointId,
    timestamp
  );

  const testId = `test:${sanitizedConfigKey}:${filePathForEntrypoint}:0`;
  const existingTestNode = graph.hasNode(testId);

  for (const op of simpleTestOps) {
    if (op.type === 'addNode' && existingTestNode) {
      operations.push({
        type: 'updateNode',
        data: op.data,
        timestamp: op.timestamp
      });
    } else {
      operations.push(op);
    }
  }

  if (entrypointId) {
    let edgeExists = false;
    if (graph.hasEdge(entrypointId, testId)) {
      edgeExists = true;
    }
    if (edgeExists) {
      const edgeOpIndex = operations.findIndex(op =>
        op.type === 'addEdge' &&
        op.data.source === entrypointId &&
        op.data.target === testId
      );
      if (edgeOpIndex !== -1) {
        operations.splice(edgeOpIndex, 1);
      }
    }
  }
}
