import { type GraphOperation } from '../../graph/index';
import type { TestResult, IndividualTestResult } from "../types/testResults";

// Pure function to create verb nodes from test results
export function createVerbNodesFromTestResultsPure(
  testResult: TestResult,
  testId: string,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];

  // Check if we have individual results
  if (!testResult.individualResults || !Array.isArray(testResult.individualResults)) {
    return operations;
  }

  // Process each individual result (each step)
  for (let i = 0; i < testResult.individualResults.length; i++) {
    const individualResult = testResult.individualResults[i];
    
    // Create verb nodes for this individual result
    const verbOps = createVerbNodesForIndividualResultPure(
      individualResult,
      testId,
      i,
      timestamp
    );
    operations.push(...verbOps);
  }

  return operations;
}

// Pure function to create verb nodes for an individual test result
function createVerbNodesForIndividualResultPure(
  individualResult: IndividualTestResult,
  testId: string,
  stepIndex: number,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  
  // Check if we have testJob data
  if (!individualResult.testJob) {
    return operations;
  }

  const testJob = individualResult.testJob as any;
  
  // Determine the test pattern based on the structure
  // BDD pattern has givens, whens, thens
  // AAA pattern has describes, its
  // TDT pattern has confirms, values, shoulds, expecteds
  
  // Check for BDD pattern (Given, When, Then)
  if (testJob.key !== undefined && (testJob.whens !== undefined || testJob.thens !== undefined)) {
    // This looks like BDD pattern
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
          weight: 1
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
                weight: 1
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
                weight: 1
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
                weight: 1
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
                weight: 1
              }
            },
            timestamp
          });
        }
      }
    }
  }
  // Check for AAA pattern (Describe, It)
  else if (testJob.describes !== undefined || testJob.its !== undefined) {
    // This looks like AAA pattern
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
          weight: 1
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
              weight: 1
            }
          },
          timestamp
        });
      }
    }
  }
  // Check for TDT pattern (Confirm, Value, Should, Expected)
  else if (testJob.confirms !== undefined || testJob.values !== undefined || testJob.shoulds !== undefined || testJob.expecteds !== undefined) {
    // This looks like TDT pattern
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
          weight: 1
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
              weight: 1
            }
          },
          timestamp
        });

        // Process Shoulds for this Value
        // Check if shoulds are directly in value or in testJob
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
                  weight: 1
                }
              },
              timestamp
            });

            // Process Expecteds for this Should
            // Check if expecteds are in should or in testJob
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
                      weight: 1
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
              weight: 1
            }
          },
          timestamp
        });
      }
    }
  }
  // If no specific pattern is detected but we have a key, create a generic verb node
  else if (testJob.key !== undefined) {
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
          weight: 1
        }
      },
      timestamp
    });
  }

  return operations;
}
