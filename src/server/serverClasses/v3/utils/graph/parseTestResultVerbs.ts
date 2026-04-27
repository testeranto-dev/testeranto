import type { GraphOperation, GraphNodeAttributes, GraphEdgeAttributes } from "../../../../../graph";

/**
 * Parse test result JSON and generate GraphOperation objects for verb nodes.
 * Each step in individualResults becomes a verb node (given, when, then, etc.)
 * with edges from the test node and between consecutive steps.
 */
export function parseTestResultVerbs(
  testResult: any,
  configKey: string,
  testName: string,
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  const timestamp = new Date().toISOString();

  const testNodeId = `test:${configKey}:${testName}`;
  const individualResults = testResult.individualResults || [];

  let previousVerbNodeId: string | null = null;

  for (let i = 0; i < individualResults.length; i++) {
    const step = individualResults[i];
    const stepName = step.stepName || `Step_${i}`;
    const stepType = step.stepType || 'unknown';

    // Determine verb type based on step type
    let verbType: string;
    switch (stepType) {
      case 'Given':
      case 'given':
        verbType = 'given';
        break;
      case 'When':
      case 'when':
        verbType = 'when';
        break;
      case 'Then':
      case 'then':
        verbType = 'then';
        break;
      case 'Describe':
      case 'describe':
        verbType = 'describe';
        break;
      case 'It':
      case 'it':
        verbType = 'it';
        break;
      case 'Confirm':
      case 'confirm':
        verbType = 'confirm';
        break;
      case 'Value':
      case 'value':
        verbType = 'value';
        break;
      case 'Should':
      case 'should':
        verbType = 'should';
        break;
      case 'Expected':
      case 'expected':
        verbType = 'expected';
        break;
      default:
        verbType = 'given'; // fallback
    }

    const verbNodeId = `verb:${configKey}:${testName}:${stepName}`;

    // Create verb node
    const verbNode: GraphNodeAttributes = {
      id: verbNodeId,
      type: { category: 'verb', type: verbType as any },
      label: stepName,
      description: step.error?.message || step.error?.name || '',
      status: step.failed ? 'blocked' : 'done',
      timestamp,
      metadata: {
        stepName,
        stepType,
        failed: step.failed,
        error: step.error,
        features: step.features,
        testName,
        configKey,
      },
    };

    operations.push({
      type: 'addNode',
      data: verbNode,
      timestamp,
    });

    // Create edge from test node to verb node
    operations.push({
      type: 'addEdge',
      data: {
        source: testNodeId,
        target: verbNodeId,
        attributes: {
          type: { category: 'structural', type: 'contains', directed: true },
          timestamp,
          metadata: { stepIndex: i },
        },
      },
      timestamp,
    });

    // Create edge from previous verb node to this one (temporal precedence)
    if (previousVerbNodeId) {
      operations.push({
        type: 'addEdge',
        data: {
          source: previousVerbNodeId,
          target: verbNodeId,
          attributes: {
            type: { category: 'temporal', type: 'precedes', directed: true },
            timestamp,
            metadata: { stepIndex: i },
          },
        },
        timestamp,
      });
    }

    previousVerbNodeId = verbNodeId;
  }

  return operations;
}
