/**
 * Get simplified configs data for stakeholder app
 */
export function getConfigsData(configs: any): any {
  // Return a simplified version of configs for the stakeholder app
  const simplifiedConfigs: any = {};

  if (configs && configs.runtimes) {
    for (const [key, config] of Object.entries(configs.runtimes)) {
      const runtimeConfig = config as any;
      simplifiedConfigs[key] = {
        runtime: runtimeConfig.runtime,
        tests: runtimeConfig.tests || [],
        dockerfile: runtimeConfig.dockerfile,
        // Don't include sensitive or unnecessary information
      };
    }
  }

  return {
    runtimes: simplifiedConfigs,
    documentationGlob: configs.documentationGlob,
    stakeholderReactModule: configs.stakeholderReactModule,
  };
}
