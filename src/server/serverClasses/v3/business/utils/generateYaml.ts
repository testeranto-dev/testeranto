import { yamlValueToString } from "./yamlValueToString";

export const generateYaml = (services: Record<string, any>): string => {
  const lines: string[] = ['services:'];

  // Add services
  for (const [serviceName, serviceConfig] of Object.entries(services)) {
    if (serviceName === 'networks') continue;

    lines.push(`  ${serviceName}:`);

    // Add service properties
    for (const [key, value] of Object.entries(serviceConfig)) {
      // Skip empty environment objects to avoid Docker Compose validation error
      if (key === 'environment' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const envEntries = Object.entries(value);
        if (envEntries.length === 0) {
          continue; // Skip empty environment
        }
      }

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Nested object
        lines.push(`    ${key}:`);
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          if (typeof nestedValue === 'object' && nestedValue !== null && !Array.isArray(nestedValue)) {
            // Double nested object
            lines.push(`      ${nestedKey}:`);
            for (const [doubleNestedKey, doubleNestedValue] of Object.entries(nestedValue)) {
              lines.push(`        ${doubleNestedKey}: ${yamlValueToString(doubleNestedValue)}`);
            }
          } else {
            lines.push(`      ${nestedKey}: ${yamlValueToString(nestedValue)}`);
          }
        }
      } else if (Array.isArray(value)) {
        // Array
        lines.push(`    ${key}:`);
        for (const item of value) {
          lines.push(`      - ${yamlValueToString(item)}`);
        }
      } else {
        // Simple value
        lines.push(`    ${key}: ${yamlValueToString(value)}`);
      }
    }
  }

  // Add networks
  if (services.networks) {
    lines.push('');
    lines.push('networks:');
    for (const [networkName, networkConfig] of Object.entries(services.networks)) {
      lines.push(`  ${networkName}:`);
      for (const [key, value] of Object.entries(networkConfig)) {
        lines.push(`    ${key}: ${yamlValueToString(value)}`);
      }
    }
  }

  return lines.join('\n');
};
