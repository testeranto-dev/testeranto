/**
 * Get test entrypoints from configuration
 */
export function getTestEntrypoints(configs: any): string[] {
  const entrypoints: string[] = [];

  if (!configs || !configs.runtimes) {
    return entrypoints;
  }

  // Collect all test paths from the configuration
  for (const [configKey, runtimeConfig] of Object.entries(configs.runtimes)) {
    const config = runtimeConfig as any;
    const tests = config.tests || [];

    for (const testPath of tests) {
      // The test path in config is typically the entrypoint
      if (testPath && typeof testPath === "string") {
        entrypoints.push(testPath);
      }
    }
  }

  return [...new Set(entrypoints)]; // Remove duplicates
}
