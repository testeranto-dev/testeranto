import { fetchCollatedDocumentation } from './fetchUtils';
import { fetchCollatedInputFiles, fetchCollatedTestResults } from './fetchCollatedUtils';
import { loadDocumentationFiles, loadTestInputFiles, loadTestResults } from './dataLoadingUtils';
import { processFilesystemTree } from './processFilesystemTree';

export async function loadDocumentationData(): Promise<{
    documentationFiles: string[];
    documentationTree: Record<string, any>;
}> {
    const documentationFiles: string[] = [];
    let documentationTree: Record<string, any> = {};

    try {
        const data = await fetchCollatedDocumentation();

        if (data.tree) {
            documentationTree = data.tree;
            documentationFiles.push(...(data.files || []));
        } else {
            const files = await loadDocumentationFiles();
            documentationFiles.push(...files);
        }
    } catch (error) {
        const files = await loadDocumentationFiles();
        documentationFiles.push(...files);
    }

    return { documentationFiles, documentationTree };
}

export async function loadTestInputData(): Promise<{
    testInputFiles: Map<string, any[]>;
    inputFilesTree: Record<string, any>;
}> {
    const testInputFiles = new Map<string, any[]>();
    let inputFilesTree: Record<string, any> = {};

    try {
        const data = await fetchCollatedInputFiles();

        if (data.fsTree) {
            inputFilesTree = data.fsTree;
            processFilesystemTree(data.fsTree, testInputFiles);
        } else if (data.collatedInputFiles) {
            for (const [runtimeKey, runtimeData] of Object.entries(
                data.collatedInputFiles as any,
            )) {
                const runtimeInfo = runtimeData as any;
                const tests = runtimeInfo.tests || {};

                const testEntries = [];
                for (const [testName, testInfo] of Object.entries(tests)) {
                    const info = testInfo as any;
                    testEntries.push({
                        testName: testName,
                        files: info.inputFiles || [],
                        count: info.count || 0,
                    });
                }

                if (testEntries.length > 0) {
                    testInputFiles.set(runtimeKey, testEntries);
                }
            }
        } else {
            const files = await loadTestInputFiles();
            for (const [key, value] of files.entries()) {
                testInputFiles.set(key, value);
            }
        }
    } catch (error) {
        const files = await loadTestInputFiles();
        for (const [key, value] of files.entries()) {
            testInputFiles.set(key, value);
        }
    }

    return { testInputFiles, inputFilesTree };
}

export async function loadTestResultsData(): Promise<{
    testResults: Map<string, any[]>;
    collatedTestResults: Record<string, any>;
}> {
    const testResults = new Map<string, any[]>();
    let collatedTestResults: Record<string, any> = {};

    try {
        const data = await fetchCollatedTestResults();

        if (data.collatedTestResults) {
            collatedTestResults = data.collatedTestResults;

            for (const [configKey, configData] of Object.entries(
                data.collatedTestResults as any,
            )) {
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
                        runtimeType: configInfo.runtime,
                    }));

                    testResults.get(testName)!.push(...resultsWithConfig);
                }
            }
        } else {
            const results = await loadTestResults();
            for (const [key, value] of results.entries()) {
                testResults.set(key, value);
            }
        }
    } catch (error) {
        const results = await loadTestResults();
        for (const [key, value] of results.entries()) {
            testResults.set(key, value);
        }
    }

    return { testResults, collatedTestResults };
}
