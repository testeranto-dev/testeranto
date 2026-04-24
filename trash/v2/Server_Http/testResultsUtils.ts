import type { AllTestResults, ITesterantoConfig } from "../../../src/server/Types";

export function transformTestResultsUtil(
    rawResults: any,
    configs: ITesterantoConfig
): AllTestResults {
    // If rawResults is already in the expected format, return it
    if (rawResults && typeof rawResults === 'object' && !Array.isArray(rawResults)) {
        // Filter to only include configKeys that exist in config runtimes
        const filtered: AllTestResults = {};
        for (const [configKey, runtimeResults] of Object.entries(rawResults)) {
            // Only include if configKey exists in config runtimes
            if (configs?.runtimes?.[configKey]) {
                filtered[configKey] = runtimeResults as any;
            } else {
                console.warn(`[testResultsUtils] Skipping configKey '${configKey}' not present in config runtimes`);
            }
        }
        return filtered;
    }

    // If rawResults is an array, transform it to the expected format
    if (Array.isArray(rawResults)) {
        console.log('[testResultsUtils] Transforming array test results to expected format');
        console.log(`[testResultsUtils] Array length: ${rawResults.length}`);
        const transformed: AllTestResults = {};
        for (const item of rawResults) {
            if (item && typeof item === 'object') {
                // Try to extract testName from various possible fields
                let testName = item.testName || item.name || item.file || item.filePath;
                // If testName is still undefined, skip this item
                if (!testName) {
                    console.warn('[testResultsUtils] Item missing testName, skipping:', item);
                    continue;
                }
                // Extract configKey - DO NOT use runtime field (deprecated)
                let configKey = item.configKey;
                // If configKey is missing, skip this item (no guessing)
                if (!configKey) {
                    console.warn(`[testResultsUtils] Item missing configKey, skipping:`, item);
                    continue;
                }
                // Only include configKey that exists in config runtimes
                if (!configs?.runtimes?.[configKey]) {
                    console.warn(`[testResultsUtils] Skipping item with configKey '${configKey}' not present in config runtimes`);
                    continue;
                }
                if (!transformed[configKey]) {
                    transformed[configKey] = {};
                }
                // Use testName as key
                transformed[configKey][testName] = {
                    ...item,
                    configKey,
                    testName
                };
            }
        }
        // Check if we have any results after transformation
        if (Object.keys(transformed).length > 0) {
            console.log(`[testResultsUtils] Transformed array into ${Object.keys(transformed).length} configs`);
            return transformed;
        } else {
            console.warn('[testResultsUtils] Transformation resulted in empty object');
        }
    }

    // Otherwise, return empty object
    console.error('[testResultsUtils] raw results are not in expected format');
    console.error('[testResultsUtils] Expected: object with configKey keys matching config');
    console.error('[testResultsUtils] Got:', typeof rawResults, Array.isArray(rawResults) ? 'array' : 'object');
    return {};
}
