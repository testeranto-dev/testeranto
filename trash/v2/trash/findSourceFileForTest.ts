
/**
 * Find source file for a test key in the configuration
 */
export function findSourceFileForTest(testKey: string, configs: any): string | null {
  console.log(`[findSourceFileForTest] "${testKey}"`);

  const parts = testKey.split('/');
  if (parts.length < 2) {
    console.log(`[findSourceFileForTest] Not enough parts in testKey`);
    return null;
  }

  const configKey = parts[0];
  const testPath = parts.slice(1).join('/');

  console.log(`[findSourceFileForTest] configKey: "${configKey}", testPath: "${testPath}"`);

  if (!configs?.runtimes?.[configKey]) {
    console.log(`[findSourceFileForTest] Config key "${configKey}" not found in runtimes`);
    return null;
  }

  const runtimeConfig = configs.runtimes[configKey] as any;
  const tests = runtimeConfig.tests || [];

  console.log(`[findSourceFileForTest] Looking through ${tests.length} tests in config "${configKey}"`);

  // Remove /tests.json from the end if present
  const cleanTestPath = testPath.replace(/\/tests\.json$/, '');
  console.log(`[findSourceFileForTest] Clean testPath: "${cleanTestPath}"`);

  // Try exact match first
  for (const testEntry of tests) {
    console.log(`[findSourceFileForTest] Comparing with testEntry: "${testEntry}"`);
    if (testEntry === cleanTestPath) {
      console.log(`[findSourceFileForTest] Found exact match!`);
      return testEntry;
    }
  }

  // If no exact match, try to match by the last part (filename)
  const cleanTestPathBase = cleanTestPath.split('/').pop();
  console.log(`[findSourceFileForTest] Base filename: "${cleanTestPathBase}"`);

  for (const testEntry of tests) {
    const testEntryBase = testEntry.split('/').pop();
    console.log(`[findSourceFileForTest] Comparing base: "${testEntryBase}" with "${cleanTestPathBase}"`);
    if (testEntryBase === cleanTestPathBase) {
      console.log(`[findSourceFileForTest] Found match by base filename!`);
      return testEntry;
    }
  }

  console.log(`[findSourceFileForTest] No match found for "${testKey}"`);
  return null;
}
