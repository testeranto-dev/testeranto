import type { ITesterantoConfig } from "../../Types";

/**
 * Stakeholder-specific utilities
 */

/**
 * Check if a feature string looks like a local file URL
 */
export function isLocalFileUrl(feature: string): boolean {
  // Check if feature looks like a local file path or URL
  return feature.startsWith('./') ||
    feature.startsWith('/') ||
    feature.includes('/') &&
    !feature.startsWith('http://') &&
    !feature.startsWith('https://');
}

/**
 * Extract local file path from a feature string
 */
export function extractLocalFilePath(feature: string): string | null {
  // Remove any URL scheme or leading ./
  let path = feature.replace(/^\.\//, '');

  // Remove any anchor or query parts
  path = path.split('#')[0].split('?')[0];

  // Check if it looks like a file path with an extension
  if (path.includes('.') && !path.includes(' ')) {
    return path;
  }

  return null;
}

/**
 * Get simplified configs data for stakeholder app
 */
export function getConfigsData(configs: ITesterantoConfig): any {
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

/**
 * Generate stakeholder-specific graph configuration
 */
export function getStakeholderGraphConfig(): any {
  return {
    projection: {
      xAttribute: 'status',
      yAttribute: 'priority',
      xType: 'categorical' as const,
      yType: 'continuous' as const,
      layout: 'grid' as const
    },
    style: {
      nodeSize: 10,
      nodeColor: '#FF6B35', // Rust color
      nodeShape: 'circle'
    }
  };
}

/**
 * Validate stakeholder API request
 */
export function validateStakeholderRequest(request: any, requiredFields: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const field of requiredFields) {
    if (!request[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
