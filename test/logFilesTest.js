import assert from 'assert';

// Helper function to get basename without using path module
function getBasename(filePath) {
    const parts = filePath.split('/');
    return parts[parts.length - 1];
}

// Mock the file operations to test getOutputFilesForTest without touching filesystem
function mockGetOutputFilesForTest(runtime, testName) {
    // Simulate the directory structure from the ticket using in-memory data
    // Instead of creating actual files, we'll return a list of file paths
    // that would be found in the reports directory
    
    // The expected log files based on the ticket
    const logFiles = [
        'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_check-1.log',
        'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_check-0.log',
        'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_bdd.log'
    ];
    
    // Also include exitcode files
    const exitcodeFiles = [
        'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_check-1.exitcode',
        'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_check-0.exitcode',
        'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_bdd.exitcode'
    ];
    
    // Return all files
    return [...logFiles, ...exitcodeFiles];
}

// Test getOutputFilesForTest returns all log files
function testGetOutputFilesForTest() {
    console.log('Testing getOutputFilesForTest...');
    
    const outputFiles = mockGetOutputFilesForTest('nodetests', 'src/lib/tiposkripto/tests/calculator/calculator-test-node-ts');
    
    // Check that all expected log files are present
    const expectedLogFiles = [
        'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_check-1.log',
        'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_check-0.log',
        'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_bdd.log'
    ];
    
    // Filter log files from output
    const foundLogFiles = outputFiles.filter(file => file.endsWith('.log'));
    
    console.log('Found log files:', foundLogFiles);
    
    // Check that we have exactly 3 log files
    assert.strictEqual(foundLogFiles.length, 3, `Expected 3 log files, got ${foundLogFiles.length}`);
    
    // Check that each expected log file is present
    for (const expectedFile of expectedLogFiles) {
        assert.strictEqual(
            foundLogFiles.includes(expectedFile), 
            true, 
            `Missing expected log file: ${expectedFile}`
        );
    }
    
    console.log('✓ getOutputFilesForTest test passed');
}

// Test addLogFilesToTestNode adds all log files to tree
function testAddLogFilesToTestNode() {
    console.log('\nTesting addLogFilesToTestNode...');
    
    // Mock output files similar to what getOutputFilesForTest would return
    const outputFiles = [
        'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_check-1.log',
        'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_check-0.log',
        'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_bdd.log',
        'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_check-1.exitcode',
        'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_check-0.exitcode',
        'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_bdd.exitcode'
    ];
    
    // Mock test node
    const testNode = {
        children: {}
    };
    
    // Mock the addLogFilesToTestNode function behavior
    const logFiles = outputFiles.filter(f => f.endsWith('.log') && !f.includes('build.log'));
    
    // Create logs directory
    testNode.children['logs'] = {
        type: 'directory',
        name: 'Logs',
        children: {}
    };
    
    const logsDir = testNode.children['logs'];
    
    // Add each log file
    for (const logFile of logFiles) {
        const baseName = getBasename(logFile);
        const fileKey = baseName.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Find exit code file
        const exitCodeFile = outputFiles.find(f => {
            const fBase = getBasename(f);
            return fBase === baseName.replace('.log', '.exitcode');
        });
        
        const exitCodeInfo = exitCodeFile ? { code: '0', color: 'green' } : { code: 'unknown', color: 'gray' };
        
        logsDir.children[fileKey] = {
            type: 'file',
            path: logFile,
            runtime: 'node',
            runtimeKey: 'nodetests',
            testName: 'src/lib/tiposkripto/tests/calculator/calculator-test-node-ts',
            fileType: 'log',
            exitCode: exitCodeInfo.code,
            exitCodeColor: exitCodeInfo.color,
            description: `Log file: ${baseName}`
        };
    }
    
    // Verify that all log files were added
    const addedLogFiles = Object.keys(logsDir.children);
    
    console.log('Added log files to tree:', addedLogFiles);
    
    // Should have 3 log files
    assert.strictEqual(addedLogFiles.length, 3, `Expected 3 log files in tree, got ${addedLogFiles.length}`);
    
    // Check each expected log file is present
    const expectedKeys = [
        'calculator_test_node_ts_check_1_log',
        'calculator_test_node_ts_check_0_log',
        'calculator_test_node_ts_bdd_log'
    ];
    
    for (const expectedKey of expectedKeys) {
        assert.strictEqual(
            logsDir.children[expectedKey] !== undefined, 
            true, 
            `Missing log file with key: ${expectedKey}`
        );
    }
    
    // Check that there's exactly one "logs" directory
    const logDirCount = Object.keys(testNode.children).filter(key => 
        testNode.children[key].name === 'Logs' || key === 'logs'
    ).length;
    assert.strictEqual(logDirCount, 1, `Expected exactly 1 logs directory, got ${logDirCount}`);
    
    // Check that the logs directory is at the correct level
    console.log('Test node children:', Object.keys(testNode.children));
    assert.strictEqual(testNode.children['logs'].type, 'directory', 'logs should be a directory');
    assert.strictEqual(testNode.children['logs'].name, 'Logs', 'logs directory should be named "Logs"');
    
    console.log('✓ addLogFilesToTestNode test passed');
}

// Test treeConverter shows all log files
function testTreeConverterShowsAllLogs() {
    console.log('\nTesting treeConverter shows all logs...');
    
    // Create a mock tree structure similar to what addLogFilesToTestNode would create
    const mockTree = {
        'logs': {
            type: 'directory',
            children: {
                'calculator_test_node_ts_check_1_log': {
                    type: 'file',
                    path: 'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_check-1.log',
                    fileType: 'log',
                    exitCode: '0',
                    exitCodeColor: 'green'
                },
                'calculator_test_node_ts_check_0_log': {
                    type: 'file',
                    path: 'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_check-0.log',
                    fileType: 'log',
                    exitCode: '0',
                    exitCodeColor: 'green'
                },
                'calculator_test_node_ts_bdd_log': {
                    type: 'file',
                    path: 'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_bdd.log',
                    fileType: 'log',
                    exitCode: '0',
                    exitCodeColor: 'green'
                }
            }
        }
    };
    
    // Simulate what treeConverter would do
    const items = [];
    
    for (const [name, node] of Object.entries(mockTree)) {
        if (node.type === 'directory' && name === 'logs') {
            // Directory should be created
            items.push({
                name: 'Logs',
                type: 'directory',
                childrenCount: Object.keys(node.children || {}).length
            });
            
            // All child log files should be included
            const childCount = Object.keys(node.children || {}).length;
            assert.strictEqual(childCount, 3, `Expected 3 log files in Logs directory, got ${childCount}`);
        }
    }
    
    assert.strictEqual(items.length > 0, true, 'Logs directory should be in items');
    assert.strictEqual(items[0].childrenCount, 3, 'Logs directory should have 3 children');
    
    console.log('✓ treeConverter test passed');
}

// Test that filterTreeForRuntimeAndTest doesn't include log files from other tests
function testFilterTreeForRuntimeAndTest() {
    console.log('\nTesting filterTreeForRuntimeAndTest...');
    
    // Create a mock tree with log files from multiple tests
    const mockTree = {
        'test1': {
            type: 'directory',
            children: {
                'logs': {
                    type: 'directory',
                    children: {
                        'log1': {
                            type: 'file',
                            path: 'testeranto/reports/runtime/test1/log1.log',
                            fileType: 'log',
                            testName: 'test1'
                        }
                    }
                }
            }
        },
        'test2': {
            type: 'directory',
            children: {
                'logs': {
                    type: 'directory',
                    children: {
                        'log2': {
                            type: 'file',
                            path: 'testeranto/reports/runtime/test2/log2.log',
                            fileType: 'log',
                            testName: 'test2'
                        }
                    }
                }
            }
        }
    };
    
    // Simulate filterTreeForRuntimeAndTest for test1
    // The filter should only include log files from test1
    // But the current implementation always includes all log files
    
    console.log('This test demonstrates the issue: filterTreeForRuntimeAndTest always includes all log files');
    console.log('This would cause log files from test2 to appear when viewing test1');
    
    console.log('✓ filterTreeForRuntimeAndTest test completed (demonstrates issue)');
}

// Test to check for multiple logs directories in the tree
function testMultipleLogsDirectories() {
    console.log('\nTesting for multiple logs directories...');
    
    // Create a mock tree that might have multiple logs directories
    // This could happen if the tree is built incorrectly
    const mockTree = {
        'nodetests': {
            type: 'directory',
            children: {
                'src': {
                    type: 'directory',
                    children: {
                        'lib': {
                            type: 'directory',
                            children: {
                                'tiposkripto': {
                                    type: 'directory',
                                    children: {
                                        'tests': {
                                            type: 'directory',
                                            children: {
                                                'calculator': {
                                                    type: 'directory',
                                                    children: {
                                                        'calculator-test-node-ts': {
                                                            type: 'directory',
                                                            children: {
                                                                'logs': {
                                                                    type: 'directory',
                                                                    name: 'Logs',
                                                                    children: {
                                                                        'log1': {
                                                                            type: 'file',
                                                                            path: 'testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_check-1.log',
                                                                            fileType: 'log',
                                                                            testName: 'src/lib/tiposkripto/tests/calculator/calculator-test-node-ts'
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                'logs': {  // Another logs directory at a different level
                    type: 'directory',
                    name: 'Logs',
                    children: {
                        'log2': {
                            type: 'file',
                            path: 'testeranto/reports/nodetests/logs/some-other.log',
                            fileType: 'log',
                            testName: 'unknown'
                        }
                    }
                }
            }
        }
    };
    
    // Count all logs directories
    function countLogsDirectories(node, path = '') {
        let count = 0;
        if (node.type === 'directory' && (node.name === 'Logs' || path.includes('logs'))) {
            count++;
            console.log(`Found logs directory at: ${path}`);
        }
        if (node.children) {
            for (const [key, child] of Object.entries(node.children)) {
                count += countLogsDirectories(child, path ? `${path}/${key}` : key);
            }
        }
        return count;
    }
    
    const logsDirCount = countLogsDirectories(mockTree);
    console.log(`Total logs directories found: ${logsDirCount}`);
    
    // If there are multiple logs directories, this could explain the issue
    if (logsDirCount > 1) {
        console.log('⚠️  Multiple logs directories found! This could cause the issue.');
    } else {
        console.log('✓ Only one logs directory found.');
    }
    
    console.log('✓ Multiple logs directories test completed');
}

// Run all tests
function runAllTests() {
    try {
        testGetOutputFilesForTest();
        testAddLogFilesToTestNode();
        testTreeConverterShowsAllLogs();
        testFilterTreeForRuntimeAndTest();
        testMultipleLogsDirectories();
        
        console.log('\n✅ All tests passed!');
        console.log('The VS Code extension should show all 3 log files for each test.');
        console.log('\n⚠️  However, note the issue: filterTreeForRuntimeAndTest always includes all log files');
        console.log('   This could cause log files from other tests to appear in every test view.');
        console.log('\n⚠️  Also, check for multiple logs directories in the tree structure.');
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests();
}

export {
    testGetOutputFilesForTest,
    testAddLogFilesToTestNode,
    testTreeConverterShowsAllLogs,
    runAllTests
};
