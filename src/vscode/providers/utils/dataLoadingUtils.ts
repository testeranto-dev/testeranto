import * as vscode from 'vscode';
import { processFilesystemTree } from './processFilesystemTree';

export async function loadDocumentationFiles(): Promise<string[]> {
    try {
        const response = await fetch('http://localhost:3000/~/collated-documentation');
        const data = await response.json();
        return data.files || [];
    } catch (error) {
        const response = await fetch('http://localhost:3000/~/documentation');
        const data = await response.json();
        return data.files || [];
    }
}

export async function loadTestInputFiles(): Promise<Map<string, any[]>> {
    const testInputFiles = new Map<string, any[]>();

    try {
        const response = await fetch('http://localhost:3000/~/collated-inputfiles');
        const data = await response.json();

        if (data.fsTree) {
            processFilesystemTree(data.fsTree, testInputFiles);
        } else if (data.collatedInputFiles) {
            for (const [runtimeKey, runtimeData] of Object.entries(data.collatedInputFiles as any)) {
                const runtimeInfo = runtimeData as any;
                const tests = runtimeInfo.tests || {};

                const testEntries = [];
                for (const [testName, testInfo] of Object.entries(tests)) {
                    const info = testInfo as any;
                    testEntries.push({
                        testName: testName,
                        files: info.inputFiles || [],
                        count: info.count || 0
                    });
                }

                if (testEntries.length > 0) {
                    testInputFiles.set(runtimeKey, testEntries);
                }
            }
        } else {
            const configsResponse = await fetch('http://localhost:3000/~/configs');
            const configsData = await configsResponse.json();
            const configs = configsData.configs;

            if (configs?.runtimes) {
                for (const [runtimeKey, runtimeConfig] of Object.entries(configs.runtimes as any)) {
                    const config = runtimeConfig as any;
                    const tests = config.tests || [];

                    for (const testName of tests) {
                        try {
                            const inputResponse = await fetch(
                                `http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtimeKey)}&testName=${encodeURIComponent(testName)}`
                            );
                            const inputData = await inputResponse.json();
                            const files = inputData.inputFiles || [];

                            if (!testInputFiles.has(runtimeKey)) {
                                testInputFiles.set(runtimeKey, []);
                            }

                            testInputFiles.get(runtimeKey)!.push({
                                testName: testName,
                                files: files
                            });
                        } catch (error) {
                            // Silently continue
                        }
                    }
                }
            }
        }
    } catch (error) {
        // Silently continue
    }

    return testInputFiles;
}

export async function loadTestResults(): Promise<Map<string, any[]>> {
    const testResults = new Map<string, any[]>();

    try {
        const response = await fetch('http://localhost:3000/~/collated-testresults');
        if (response.ok) {
            const data = await response.json();

            if (data.collatedTestResults) {
                for (const [configKey, configData] of Object.entries(data.collatedTestResults as any)) {
                    const configInfo = configData as any;
                    const tests = configInfo.tests || {};

                    for (const [testName, testInfo] of Object.entries(tests)) {
                        const info = testInfo as any;
                        const results = info.results || [];

                        if (!testResults.has(testName)) {
                            testResults.set(testName, []);
                        }

                        const resultsWithConfig = results.map((result: any) => ({
                            ...result,
                            configKey: configKey,
                            runtime: configInfo.runtime,
                            runtimeType: configInfo.runtime
                        }));

                        testResults.get(testName)!.push(...resultsWithConfig);
                    }
                }
                return testResults;
            }
        }

        const fallbackResponse = await fetch('http://localhost:3000/~/testresults');
        if (!fallbackResponse.ok) {
            return testResults;
        }

        const fallbackData = await fallbackResponse.json();

        if (fallbackData.testResults && Array.isArray(fallbackData.testResults)) {
            for (const testResult of fallbackData.testResults) {
                let testName = testResult.testName ||
                    testResult.result?.name ||
                    testResult.file?.replace('.json', '') ||
                    'Unknown';

                if (testResult.runtime && testName.startsWith(`${testResult.runtime}.`)) {
                    testName = testName.substring(testResult.runtime.length + 1);
                }

                if (testName === 'Unknown' && testResult.file) {
                    const fileName = testResult.file;
                    const patterns = [
                        /^[^\.]+\.(.+)\.json$/,
                        /^(.+)\.json$/
                    ];

                    for (const pattern of patterns) {
                        const match = fileName.match(pattern);
                        if (match && match[1]) {
                            testName = match[1];
                            break;
                        }
                    }
                }

                if (!testResults.has(testName)) {
                    testResults.set(testName, []);
                }
                testResults.get(testName)!.push(testResult);
            }
        }
    } catch (error) {
        // Silently continue
    }

    return testResults;
}

export async function loadProcesses(): Promise<any[]> {
    try {
        const response = await fetch('http://localhost:3000/~/processes');
        const data = await response.json();
        return data.processes || [];
    } catch (error) {
        return [];
    }
}
