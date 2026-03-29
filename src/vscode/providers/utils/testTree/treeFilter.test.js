import * as assert from 'node:assert';
import { filterTreeForRuntimeAndTest } from './treeFilter.js';

// Test 1: Basic functionality
function testBasicFunctionality() {
  console.log('Running testBasicFunctionality...');
  
  const tree = {
    nodetests: {
      type: 'directory',
      children: {
        'src/lib/tiposkripto/tests/abstractBase.test/index.ts': {
          type: 'directory',
          children: {
            source: {
              type: 'directory',
              name: 'Source Files',
              children: {}
            },
            logs: {
              type: 'directory',
              name: 'Logs',
              children: {
                'calculator_test_node_ts_check_3_log': {
                  type: 'file',
                  path: 'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_check-3.log',
                  runtime: 'node',
                  runtimeKey: 'nodetests',
                  testName: 'src/lib/tiposkripto/tests/abstractBase.test/index.ts',
                  fileType: 'log',
                  exitCode: '0',
                  exitCodeColor: 'green',
                  description: 'Log'
                }
              }
            }
          }
        }
      }
    }
  };

  const result = filterTreeForRuntimeAndTest(
    tree,
    'nodetests',
    'src/lib/tiposkripto/tests/abstractBase.test/index.ts'
  );

  assert.ok(result, 'Result should not be null');
  assert.ok(typeof result === 'object', 'Result should be an object');
  assert.ok(result.source, 'Result should have source directory');
  assert.ok(result.logs, 'Result should have logs directory');
  
  console.log('✓ testBasicFunctionality passed');
}

// Test 2: Runtime not found
function testRuntimeNotFound() {
  console.log('Running testRuntimeNotFound...');
  
  const tree = {
    nodetests: {
      type: 'directory',
      children: {}
    }
  };

  const result = filterTreeForRuntimeAndTest(
    tree,
    'nonexistent',
    'some/test'
  );

  assert.deepStrictEqual(result, {}, 'Result should be empty object when runtime not found');
  
  console.log('✓ testRuntimeNotFound passed');
}

// Test 3: Test not found
function testTestNotFound() {
  console.log('Running testTestNotFound...');
  
  const tree = {
    nodetests: {
      type: 'directory',
      children: {
        'some/test': {
          type: 'directory',
          children: {}
        }
      }
    }
  };

  const result = filterTreeForRuntimeAndTest(
    tree,
    'nodetests',
    'different/test'
  );

  assert.deepStrictEqual(result, {}, 'Result should be empty object when test not found');
  
  console.log('✓ testTestNotFound passed');
}

// Test 4: Invalid inputs
function testInvalidInputs() {
  console.log('Running testInvalidInputs...');
  
  try {
    filterTreeForRuntimeAndTest(null, 'runtime', 'test');
    assert.fail('Should have thrown for null tree');
  } catch (error) {
    assert.ok(error.message.includes('Tree must be provided'));
  }

  try {
    filterTreeForRuntimeAndTest({}, '', 'test');
    assert.fail('Should have thrown for empty runtime');
  } catch (error) {
    assert.ok(error.message.includes('Runtime must be provided'));
  }

  try {
    filterTreeForRuntimeAndTest({}, 'runtime', '');
    assert.fail('Should have thrown for empty test name');
  } catch (error) {
    assert.ok(error.message.includes('Test name must be provided'));
  }

  console.log('✓ testInvalidInputs passed');
}

// Run all tests
try {
  testBasicFunctionality();
  testRuntimeNotFound();
  testTestNotFound();
  testInvalidInputs();
  console.log('\n✅ All tests passed!');
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
}
