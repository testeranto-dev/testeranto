export class Server_Utils {
  static testPathToSourcePath(testPath: string): string | null {
    if (!testPath) return null;
    
    const patterns = [
      /\.test\./,
      /\.spec\./,
      /-test\./,
      /-spec\./,
      /\.test\.[^/.]+\./,
      /\.spec\.[^/.]+\./,
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(testPath)) {
        return testPath.replace(pattern, '.');
      }
    }
    
    const lastDotIndex = testPath.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      const beforeDot = testPath.substring(0, lastDotIndex);
      const afterDot = testPath.substring(lastDotIndex);
      
      const cleaned = beforeDot
        .replace(/\.test$/, '')
        .replace(/\.spec$/, '')
        .replace(/-test$/, '')
        .replace(/-spec$/, '');
      
      if (cleaned !== beforeDot) {
        return cleaned + afterDot;
      }
    }
    
    return null;
  }

  static findSourceFileForTest(testKey: string, configs: any): string | null {
    console.log(`[Server_Utils] findSourceFileForTest: "${testKey}"`);
    
    const parts = testKey.split('/');
    if (parts.length < 2) {
      console.log(`[Server_Utils] Not enough parts in testKey`);
      return null;
    }
    
    const configKey = parts[0];
    const testPath = parts.slice(1).join('/');
    
    console.log(`[Server_Utils] configKey: "${configKey}", testPath: "${testPath}"`);
    
    if (!configs?.runtimes?.[configKey]) {
      console.log(`[Server_Utils] Config key "${configKey}" not found in runtimes`);
      return null;
    }
    
    const runtimeConfig = configs.runtimes[configKey] as any;
    const tests = runtimeConfig.tests || [];
    
    console.log(`[Server_Utils] Looking through ${tests.length} tests in config "${configKey}"`);
    
    // Remove /tests.json from the end if present
    const cleanTestPath = testPath.replace(/\/tests\.json$/, '');
    console.log(`[Server_Utils] Clean testPath: "${cleanTestPath}"`);
    
    // Try exact match first
    for (const testEntry of tests) {
      console.log(`[Server_Utils] Comparing with testEntry: "${testEntry}"`);
      if (testEntry === cleanTestPath) {
        console.log(`[Server_Utils] Found exact match!`);
        return testEntry;
      }
    }
    
    // If no exact match, try to match by the last part (filename)
    const cleanTestPathBase = cleanTestPath.split('/').pop();
    console.log(`[Server_Utils] Base filename: "${cleanTestPathBase}"`);
    
    for (const testEntry of tests) {
      const testEntryBase = testEntry.split('/').pop();
      console.log(`[Server_Utils] Comparing base: "${testEntryBase}" with "${cleanTestPathBase}"`);
      if (testEntryBase === cleanTestPathBase) {
        console.log(`[Server_Utils] Found match by base filename!`);
        return testEntry;
      }
    }
    
    console.log(`[Server_Utils] No match found for "${testKey}"`);
    return null;
  }

  static async addTestResultStructureToNode(node: any, testData: any): Promise<void> {
    if (!node.children) {
      node.children = {};
    }
    
    node.children['summary'] = {
      type: 'test-summary',
      name: 'summary',
      path: node.path + '/summary',
      failed: testData.failed,
      fails: testData.fails,
      runTimeTests: testData.runTimeTests,
      features: testData.features || []
    };
    
    if (testData.testJob) {
      node.children['testJob'] = {
        type: 'test-job',
        name: 'testJob',
        path: node.path + '/testJob',
        name: testData.testJob.name,
        fails: testData.testJob.fails,
        failed: testData.testJob.failed,
        features: testData.testJob.features || []
      };
      
      if (testData.testJob.givens && Array.isArray(testData.testJob.givens)) {
        node.children['givens'] = {
          type: 'directory',
          name: 'givens',
          path: node.path + '/givens',
          children: {}
        };
        
        for (let i = 0; i < testData.testJob.givens.length; i++) {
          const given = testData.testJob.givens[i];
          const givenKey = given.key || `given_${i}`;
          
          node.children['givens'].children[givenKey] = {
            type: 'test-given',
            name: givenKey,
            path: node.path + '/givens/' + givenKey,
            failed: given.failed,
            features: given.features || [],
            error: given.error,
            status: given.status,
            children: {}
          };
          
          if (given.whens && Array.isArray(given.whens)) {
            node.children['givens'].children[givenKey].children['whens'] = {
              type: 'directory',
              name: 'whens',
              path: node.path + '/givens/' + givenKey + '/whens',
              children: {}
            };
            
            for (let j = 0; j < given.whens.length; j++) {
              const when = given.whens[j];
              const whenKey = when.name || `when_${j}`;
              
              node.children['givens'].children[givenKey].children['whens'].children[whenKey] = {
                type: 'test-when',
                name: whenKey,
                path: node.path + '/givens/' + givenKey + '/whens/' + whenKey,
                status: when.status,
                error: when.error,
                artifacts: when.artifacts || []
              };
            }
          }
          
          if (given.thens && Array.isArray(given.thens)) {
            node.children['givens'].children[givenKey].children['thens'] = {
              type: 'directory',
              name: 'thens',
              path: node.path + '/givens/' + givenKey + '/thens',
              children: {}
            };
            
            for (let j = 0; j < given.thens.length; j++) {
              const then = given.thens[j];
              const thenKey = then.name || `then_${j}`;
              
              node.children['givens'].children[givenKey].children['thens'].children[thenKey] = {
                type: 'test-then',
                name: thenKey,
                path: node.path + '/givens/' + givenKey + '/thens/' + thenKey,
                status: then.status,
                error: then.error,
                artifacts: then.artifacts || []
              };
            }
          }
        }
      }
    }
    
    if (testData.features && Array.isArray(testData.features)) {
      node.children['features'] = {
        type: 'directory',
        name: 'features',
        path: node.path + '/features',
        children: {}
      };
      
      for (let i = 0; i < testData.features.length; i++) {
        const feature = testData.features[i];
        const featureKey = feature.replace(/[^a-zA-Z0-9]/g, '_') || `feature_${i}`;
        
        node.children['features'].children[featureKey] = {
          type: 'feature',
          name: feature,
          path: node.path + '/features/' + featureKey
        };
      }
    }
  }
}
