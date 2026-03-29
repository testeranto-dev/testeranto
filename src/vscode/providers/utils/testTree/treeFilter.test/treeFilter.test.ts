
import * as assert from 'node:assert';
import { filterTreeForRuntimeAndTest } from '../treeFilter';

// Test to debug why source files are missing from the extension tree
function testFilterTreeForRuntimeAndTest() {
    console.log('Testing filterTreeForRuntimeAndTest...');
    
    // Create a mock tree structure that matches what we expect from the server
    const mockTree = {
        'nodetests': {
            type: 'directory',
            children: {
                'src/lib/tiposkripto/tests/abstractBase.test/index.ts': {
                    type: 'directory',
                    children: {
                        'source': {
                            type: 'directory',
                            name: 'Source Files',
                            children: {
                                'index.ts': {
                                    type: 'file',
                                    path: 'src/lib/tiposkripto/tests/abstractBase.test/index.ts',
                                    fileType: 'source'
                                }
                            }
                        },
                        'logs': {
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

    // Test 1: Basic filtering
    const result1 = filterTreeForRuntimeAndTest(
        mockTree,
        'nodetests',
        'src/lib/tiposkripto/tests/abstractBase.test/index.ts'
    );
    
    console.log('Result 1 keys:', Object.keys(result1));
    console.log('Result 1 structure:', JSON.stringify(result1, null, 2));
    
    assert.ok(result1, 'Result should not be null');
    assert.ok(typeof result1 === 'object', 'Result should be an object');
    assert.ok('source' in result1, 'Result should have source directory');
    assert.ok('logs' in result1, 'Result should have logs directory');
    
    // Test 2: Check source files are present
    const sourceDir = result1.source;
    assert.ok(sourceDir, 'Source directory should exist');
    assert.strictEqual(sourceDir.type, 'directory', 'Source should be a directory');
    assert.ok(sourceDir.children, 'Source directory should have children');
    
    const sourceFiles = Object.keys(sourceDir.children);
    console.log('Source files:', sourceFiles);
    assert.ok(sourceFiles.length > 0, 'Source directory should contain files');
    
    // Test 3: Check the actual file
    const indexFile = sourceDir.children['index.ts'];
    assert.ok(indexFile, 'index.ts should exist in source directory');
    assert.strictEqual(indexFile.type, 'file', 'index.ts should be a file');
    assert.strictEqual(indexFile.fileType, 'source', 'index.ts should have fileType "source"');
    
    console.log('All tests passed!');
}

// Run the test
try {
    testFilterTreeForRuntimeAndTest();
    console.log('\n✅ Test completed successfully!');
} catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
}
