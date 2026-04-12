import type { GraphOperation } from ".";

export function handleAaaPatternPure(
  testJob: any,
  testId: string,
  stepIndex: number,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  const describeKey = testJob.key || `describe_${stepIndex}`;

  // Create Describe node
  const describeId = `describe:${testId}:${stepIndex}`;
  operations.push({
    type: 'addNode',
    data: {
      id: describeId,
      type: 'describe',
      label: `Describe: ${describeKey}`,
      description: `Describe context for test step ${stepIndex}`,
      status: testJob.failed === false ? 'done' : 'blocked',
      priority: testJob.failed === false ? 'low' : 'high',
      icon: 'document',
      metadata: {
        testId,
        stepIndex,
        describeKey,
        failed: testJob.failed,
        features: testJob.features || [],
        status: testJob.status,
        fails: testJob.fails,
        pattern: 'aaa'
      }
    },
    timestamp
  });

  // Connect Describe to Test
  operations.push({
    type: 'addEdge',
    data: {
      source: testId,
      target: describeId,
      attributes: {
        type: 'hasDescribe',
        // 
      }
    },
    timestamp
  });

  // Process Its
  if (testJob.its && Array.isArray(testJob.its)) {
    for (let itIndex = 0; itIndex < testJob.its.length; itIndex++) {
      const it = testJob.its[itIndex];
      const itId = `it:${testId}:${stepIndex}:${itIndex}`;

      operations.push({
        type: 'addNode',
        data: {
          id: itId,
          type: 'it',
          label: `It: ${it.name || `test_${itIndex}`}`,
          description: `It test for step ${stepIndex}, test ${itIndex}`,
          status: it.status === true ? 'done' : 'blocked',
          priority: it.status === true ? 'low' : 'high',
          icon: 'test',
          metadata: {
            testId,
            stepIndex,
            itIndex,
            name: it.name,
            status: it.status,
            error: it.error,
            pattern: 'aaa'
          }
        },
        timestamp
      });

      // Connect It to Describe
      operations.push({
        type: 'addEdge',
        data: {
          source: describeId,
          target: itId,
          attributes: {
            type: 'hasIt',
            // 
          }
        },
        timestamp
      });
    }
  }

  return operations;
}
