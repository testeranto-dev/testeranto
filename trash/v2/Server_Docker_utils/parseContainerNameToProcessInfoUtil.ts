export function parseContainerNameToProcessInfoUtil(containerName: string): {
  processType: 'bdd' | 'check' | 'aider' | 'builder';
  configKey: string;
  testName: string;
} | null {
  // Parse container names based on our naming convention
  // Format: {configKey}-{sanitizedTestPath}-{processType} or {configKey}-builder
  
  // Handle builder containers
  if (containerName.endsWith('-builder')) {
    const configKey = containerName.replace('-builder', '');
    return {
      processType: 'builder',
      configKey,
      testName: 'builder'
    };
  }
  
  // Handle agent containers (these are separate from test processes)
  if (containerName.startsWith('agent-')) {
    // Agents are handled separately, not as test processes
    return null;
  }
  
  // Match test process containers
  // Pattern: {configKey}-{sanitizedTestPath}-{processType}
  // Where sanitizedTestPath has underscores instead of slashes, and dots replaced with hyphens
  
  // Try to match each process type
  const processTypes = ['bdd', 'aider'] as const;
  for (const processType of processTypes) {
    if (containerName.endsWith(`-${processType}`)) {
      const prefix = containerName.slice(0, -(processType.length + 1)); // Remove -{processType}
      const firstDashIndex = prefix.indexOf('-');
      if (firstDashIndex === -1) {
        return null;
      }
      
      const configKey = prefix.substring(0, firstDashIndex);
      const testPart = prefix.substring(firstDashIndex + 1);
      
      // Convert sanitized test path back to original
      // Replace underscores with slashes, and hyphens with dots where appropriate
      let testName = testPart.replace(/_/g, '/');
      // Handle common patterns
      testName = testName.replace(/-test-ts$/g, '.test.ts');
      testName = testName.replace(/-spec-ts$/g, '.spec.ts');
      testName = testName.replace(/-test-js$/g, '.test.js');
      testName = testName.replace(/-spec-js$/g, '.spec.js');
      
      return {
        processType,
        configKey,
        testName
      };
    }
  }
  
  // Handle check containers (they have index numbers)
  const checkMatch = containerName.match(/^(.*)-check-(\d+)$/);
  if (checkMatch) {
    const prefix = checkMatch[1];
    const firstDashIndex = prefix.indexOf('-');
    if (firstDashIndex === -1) {
      return null;
    }
    
    const configKey = prefix.substring(0, firstDashIndex);
    const testPart = prefix.substring(firstDashIndex + 1);
    
    // Convert sanitized test path back to original
    let testName = testPart.replace(/_/g, '/');
    testName = testName.replace(/-test-ts$/g, '.test.ts');
    testName = testName.replace(/-spec-ts$/g, '.spec.ts');
    testName = testName.replace(/-test-js$/g, '.test.js');
    testName = testName.replace(/-spec-js$/g, '.spec.js');
    
    return {
      processType: 'check',
      configKey,
      testName
    };
  }
  
  return null;
}
