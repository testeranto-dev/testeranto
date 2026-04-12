import type { GraphOperation } from ".";

export function handleBddPatternPure(
  testJob: any,
  testId: string,
  stepIndex: number,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  const givenKey = testJob.key || `step_${stepIndex}`;

  // Create Given node
  const givenId = `given:${testId}:${stepIndex}`;
  operations.push({
    type: 'addNode',
    data: {
      id: givenId,
      type: 'given',
      label: `Given: ${givenKey}`,
      description: `Given condition for test step ${stepIndex}`,
      status: testJob.failed === false ? 'done' : 'blocked',
      priority: testJob.failed === false ? 'low' : 'high',
      icon: 'circle',
      metadata: {
        testId,
        stepIndex,
        givenKey,
        failed: testJob.failed,
        features: testJob.features || [],
        status: testJob.status,
        fails: testJob.fails,
        pattern: 'bdd'
      }
    },
    timestamp
  });

  // Connect Given to Test
  operations.push({
    type: 'addEdge',
    data: {
      source: testId,
      target: givenId,
      attributes: {
        type: 'hasGiven',

      }
    },
    timestamp
  });

  // Process Whens
  let previousWhenId: string | null = null;
  if (testJob.whens && Array.isArray(testJob.whens)) {
    for (let whenIndex = 0; whenIndex < testJob.whens.length; whenIndex++) {
      const when = testJob.whens[whenIndex];
      const whenId = `when:${testId}:${stepIndex}:${whenIndex}`;

      operations.push({
        type: 'addNode',
        data: {
          id: whenId,
          type: 'when',
          label: `When: ${when.name || `action_${whenIndex}`}`,
          description: `When action for test step ${stepIndex}, action ${whenIndex}`,
          status: when.status === true ? 'done' : 'blocked',
          priority: when.status === true ? 'low' : 'high',
          icon: 'play',
          metadata: {
            testId,
            stepIndex,
            whenIndex,
            name: when.name,
            status: when.status,
            error: when.error,
            pattern: 'bdd'
          }
        },
        timestamp
      });

      // Connect When to Given or previous When
      if (whenIndex === 0) {
        // First When connects to Given
        operations.push({
          type: 'addEdge',
          data: {
            source: givenId,
            target: whenId,
            attributes: {
              type: 'hasWhen',

            }
          },
          timestamp
        });
      } else if (previousWhenId) {
        // Subsequent Whens connect to previous When
        operations.push({
          type: 'addEdge',
          data: {
            source: previousWhenId,
            target: whenId,
            attributes: {
              type: 'nextWhen',

            }
          },
          timestamp
        });
      }
      previousWhenId = whenId;
    }
  }

  // Process Thens
  if (testJob.thens && Array.isArray(testJob.thens)) {
    for (let thenIndex = 0; thenIndex < testJob.thens.length; thenIndex++) {
      const then = testJob.thens[thenIndex];
      const thenId = `then:${testId}:${stepIndex}:${thenIndex}`;

      operations.push({
        type: 'addNode',
        data: {
          id: thenId,
          type: 'then',
          label: `Then: ${then.name || `assertion_${thenIndex}`}`,
          description: `Then assertion for test step ${stepIndex}, assertion ${thenIndex}`,
          status: then.status === true ? 'done' : 'blocked',
          priority: then.status === true ? 'low' : 'high',
          icon: 'check',
          metadata: {
            testId,
            stepIndex,
            thenIndex,
            name: then.name,
            status: then.status,
            error: then.error,
            pattern: 'bdd'
          }
        },
        timestamp
      });

      // Connect Then to the last When or to Given if no Whens
      if (previousWhenId) {
        // Connect to the last When
        operations.push({
          type: 'addEdge',
          data: {
            source: previousWhenId,
            target: thenId,
            attributes: {
              type: 'hasThen',

            }
          },
          timestamp
        });
      } else {
        // No Whens, connect directly to Given
        operations.push({
          type: 'addEdge',
          data: {
            source: givenId,
            target: thenId,
            attributes: {
              type: 'hasThen',

            }
          },
          timestamp
        });
      }
    }
  }

  return operations;
}
