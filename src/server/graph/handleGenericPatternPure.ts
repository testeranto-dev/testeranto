import { type GraphOperation } from '../../graph/index';

export function handleGenericPatternPure(
  testJob: any,
  testId: string,
  stepIndex: number,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  const verbKey = testJob.key || `step_${stepIndex}`;
  const verbId = `verb:${testId}:${stepIndex}`;

  operations.push({
    type: 'addNode',
    data: {
      id: verbId,
      type: 'test_result',
      label: `Step: ${verbKey}`,
      description: `Test step ${stepIndex}`,
      status: testJob.failed === false ? 'done' : 'blocked',
      priority: testJob.failed === false ? 'low' : 'high',
      icon: 'circle',
      metadata: {
        testId,
        stepIndex,
        verbKey,
        failed: testJob.failed,
        features: testJob.features || [],
        status: testJob.status,
        fails: testJob.fails,
        pattern: 'generic'
      }
    },
    timestamp
  });

  // Connect verb to Test
  operations.push({
    type: 'addEdge',
    data: {
      source: testId,
      target: verbId,
      attributes: {
        type: 'hasResult',

      }
    },
    timestamp
  });

  return operations;
}
