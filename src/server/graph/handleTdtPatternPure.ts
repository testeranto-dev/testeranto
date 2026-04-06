import { type GraphOperation } from '../../graph/index';

export function handleTdtPatternPure(
  testJob: any,
  testId: string,
  stepIndex: number,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  const confirmKey = testJob.key || `confirm_${stepIndex}`;

  // Create Confirm node
  const confirmId = `confirm:${testId}:${stepIndex}`;
  operations.push({
    type: 'addNode',
    data: {
      id: confirmId,
      type: 'confirm',
      label: `Confirm: ${confirmKey}`,
      description: `Confirm table-driven test for step ${stepIndex}`,
      status: testJob.failed === false ? 'done' : 'blocked',
      priority: testJob.failed === false ? 'low' : 'high',
      icon: 'check',
      metadata: {
        testId,
        stepIndex,
        confirmKey,
        failed: testJob.failed,
        features: testJob.features || [],
        status: testJob.status,
        fails: testJob.fails,
        pattern: 'tdt'
      }
    },
    timestamp
  });

  // Connect Confirm to Test
  operations.push({
    type: 'addEdge',
    data: {
      source: testId,
      target: confirmId,
      attributes: {
        type: 'hasConfirm',

      }
    },
    timestamp
  });

  // Process Values
  if (testJob.values && Array.isArray(testJob.values)) {
    for (let valueIndex = 0; valueIndex < testJob.values.length; valueIndex++) {
      const value = testJob.values[valueIndex];
      const valueId = `value:${testId}:${stepIndex}:${valueIndex}`;

      operations.push({
        type: 'addNode',
        data: {
          id: valueId,
          type: 'value',
          label: `Value: ${value.name || `value_${valueIndex}`}`,
          description: `Value for table-driven test step ${stepIndex}, value ${valueIndex}`,
          status: value.status === true ? 'done' : 'blocked',
          priority: value.status === true ? 'low' : 'high',
          icon: 'circle',
          metadata: {
            testId,
            stepIndex,
            valueIndex,
            name: value.name,
            status: value.status,
            error: value.error,
            pattern: 'tdt'
          }
        },
        timestamp
      });

      // Connect Value to Confirm
      operations.push({
        type: 'addEdge',
        data: {
          source: confirmId,
          target: valueId,
          attributes: {
            type: 'hasValue',

          }
        },
        timestamp
      });

      // Process Shoulds for this Value
      const shoulds = value.shoulds || testJob.shoulds;
      if (shoulds && Array.isArray(shoulds)) {
        for (let shouldIndex = 0; shouldIndex < shoulds.length; shouldIndex++) {
          const should = shoulds[shouldIndex];
          const shouldId = `should:${testId}:${stepIndex}:${valueIndex}:${shouldIndex}`;

          operations.push({
            type: 'addNode',
            data: {
              id: shouldId,
              type: 'should',
              label: `Should: ${should.name || `should_${shouldIndex}`}`,
              description: `Should condition for value ${valueIndex}, should ${shouldIndex}`,
              status: should.status === true ? 'done' : 'blocked',
              priority: should.status === true ? 'low' : 'high',
              icon: 'play',
              metadata: {
                testId,
                stepIndex,
                valueIndex,
                shouldIndex,
                name: should.name,
                status: should.status,
                error: should.error,
                pattern: 'tdt'
              }
            },
            timestamp
          });

          // Connect Should to Value
          operations.push({
            type: 'addEdge',
            data: {
              source: valueId,
              target: shouldId,
              attributes: {
                type: 'hasShould',

              }
            },
            timestamp
          });

          // Process Expecteds for this Should
          const expecteds = should.expecteds || testJob.expecteds;
          if (expecteds && Array.isArray(expecteds)) {
            for (let expectedIndex = 0; expectedIndex < expecteds.length; expectedIndex++) {
              const expected = expecteds[expectedIndex];
              const expectedId = `expected:${testId}:${stepIndex}:${valueIndex}:${shouldIndex}:${expectedIndex}`;

              operations.push({
                type: 'addNode',
                data: {
                  id: expectedId,
                  type: 'expected',
                  label: `Expected: ${expected.name || `expected_${expectedIndex}`}`,
                  description: `Expected result for should ${shouldIndex}, expected ${expectedIndex}`,
                  status: expected.status === true ? 'done' : 'blocked',
                  priority: expected.status === true ? 'low' : 'high',
                  icon: 'check',
                  metadata: {
                    testId,
                    stepIndex,
                    valueIndex,
                    shouldIndex,
                    expectedIndex,
                    name: expected.name,
                    status: expected.status,
                    error: expected.error,
                    pattern: 'tdt'
                  }
                },
                timestamp
              });

              // Connect Expected to Should
              operations.push({
                type: 'addEdge',
                data: {
                  source: shouldId,
                  target: expectedId,
                  attributes: {
                    type: 'hasExpected',

                  }
                },
                timestamp
              });
            }
          }
        }
      }
    }
  }
  // Also handle case where values is not an array but an object
  else if (testJob.values && typeof testJob.values === 'object' && !Array.isArray(testJob.values)) {
    // Convert object values to array
    const valuesArray = Object.entries(testJob.values).map(([key, val]) => ({
      name: key,
      ...(typeof val === 'object' ? val : { value: val })
    }));

    for (let valueIndex = 0; valueIndex < valuesArray.length; valueIndex++) {
      const value = valuesArray[valueIndex];
      const valueId = `value:${testId}:${stepIndex}:${valueIndex}`;

      operations.push({
        type: 'addNode',
        data: {
          id: valueId,
          type: 'value',
          label: `Value: ${value.name || `value_${valueIndex}`}`,
          description: `Value for table-driven test step ${stepIndex}, value ${valueIndex}`,
          status: value.status === true ? 'done' : 'blocked',
          priority: value.status === true ? 'low' : 'high',
          icon: 'circle',
          metadata: {
            testId,
            stepIndex,
            valueIndex,
            name: value.name,
            status: value.status,
            error: value.error,
            pattern: 'tdt'
          }
        },
        timestamp
      });

      // Connect Value to Confirm
      operations.push({
        type: 'addEdge',
        data: {
          source: confirmId,
          target: valueId,
          attributes: {
            type: 'hasValue',

          }
        },
        timestamp
      });
    }
  }

  return operations;
}
