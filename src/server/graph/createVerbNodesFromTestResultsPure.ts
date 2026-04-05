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
  
  // For now, we'll check for BDD pattern (Given, When, Then)
  // This matches the Rectangle test results
  if (testJob.key !== undefined) {
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
  // TODO: Add support for AAA and TDT patterns in the future
  // else if (testJob.describes) { ... }
  // else if (testJob.confirms) { ... }

  return operations;
}
