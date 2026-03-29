import * as assert from 'node:assert';

export function filterTreeForRuntimeAndTest(
  tree,
  runtime,
  testName,
) {
  // Input validation using assert
  assert.ok(tree, 'Tree must be provided');
  assert.ok(typeof tree === 'object', 'Tree must be an object');
  assert.ok(runtime, 'Runtime must be provided');
  assert.ok(typeof runtime === 'string', 'Runtime must be a string');
  assert.ok(testName, 'Test name must be provided');
  assert.ok(typeof testName === 'string', 'Test name must be a string');

  console.log(`[treeFilter] ==========================================`);
  console.log(`[treeFilter] filterTreeForRuntimeAndTest called with runtime="${runtime}", testName="${testName}"`);
  console.log(`[treeFilter] Full tree structure:`, JSON.stringify(tree, null, 2));
  
  // Helper to normalize test names for comparison
  const normalizeTestName = (name) => {
    if (!name) return '';
    // Ensure name is a string
    const nameStr = String(name);
    // Remove file extensions and common patterns for better matching
    return nameStr
      .replace(/\.test\.ts$/, '')
      .replace(/\.spec\.ts$/, '')
      .replace(/\.test\.js$/, '')
      .replace(/\.spec\.js$/, '')
      .replace(/\.test\.go$/, '')
      .replace(/\.spec\.go$/, '')
      .replace(/\.test$/, '')
      .replace(/\.spec$/, '')
      .replace(/\.ts$/, '')
      .replace(/\.js$/, '')
      .replace(/\.go$/, '')
      .replace(/\.node\.ts$/, '')
      .replace(/\.node\.js$/, '')
      .replace(/[\/\\]/g, '_')  // Replace path separators with underscores
      .toLowerCase();
  };

  // Also create a version that keeps the path for directory matching
  const getTestBaseName = (name) => {
    if (!name) return '';
    const nameStr = String(name);
    const baseName = nameStr.split('/').pop() || nameStr;
    return normalizeTestName(baseName);
  };

  const normalizedTestName = normalizeTestName(testName);
  const testBaseName = getTestBaseName(testName);
  console.log(`[treeFilter] normalizedTestName: "${normalizedTestName}", testBaseName: "${testBaseName}"`);

  // First, find the runtime node in the tree
  let runtimeNode = null;
  
  // The tree might have runtime as a direct key, or it might be nested
  if (tree[runtime]) {
    runtimeNode = tree[runtime];
  } else {
    // Try to find runtime by case-insensitive match or partial match
    for (const key of Object.keys(tree)) {
      if (key.toLowerCase().includes(runtime.toLowerCase()) || 
          runtime.toLowerCase().includes(key.toLowerCase())) {
        runtimeNode = tree[key];
        console.log(`[treeFilter] Found runtime "${key}" as match for "${runtime}"`);
        break;
      }
    }
  }
  
  if (!runtimeNode) {
    console.log(`[treeFilter] No runtime node found for "${runtime}"`);
    // Try to find any runtime node if we can't find the specific one
    const firstRuntimeKey = Object.keys(tree)[0];
    if (firstRuntimeKey) {
      runtimeNode = tree[firstRuntimeKey];
      console.log(`[treeFilter] Using first runtime found: "${firstRuntimeKey}"`);
    } else {
      return {};
    }
  }

  console.log(`[treeFilter] Runtime node structure:`, JSON.stringify(runtimeNode, null, 2));

  // If runtimeNode has children, look for the test in them
  if (runtimeNode.children) {
    // First, try exact match
    if (runtimeNode.children[testName]) {
      console.log(`[treeFilter] Found test by exact key match: "${testName}"`);
      console.log(`[treeFilter] Test node children:`, JSON.stringify(runtimeNode.children[testName].children, null, 2));
      return runtimeNode.children[testName].children || {};
    }
    
    // Try to find test by normalized name
    for (const [childKey, childNode] of Object.entries(runtimeNode.children)) {
      const normalizedChildKey = normalizeTestName(childKey);
      const childBaseName = getTestBaseName(childKey);
      
      if (normalizedChildKey === normalizedTestName || 
          childBaseName === testBaseName ||
          childKey.includes(testName) || 
          testName.includes(childKey) ||
          normalizedChildKey.includes(normalizedTestName) ||
          normalizedTestName.includes(normalizedChildKey)) {
        console.log(`[treeFilter] Found test by pattern match: "${childKey}" for "${testName}"`);
        console.log(`[treeFilter] Matched node children:`, JSON.stringify(childNode.children, null, 2));
        return childNode.children || {};
      }
    }
    
    // If we still haven't found it, look for directories that might contain the test
    for (const [childKey, childNode] of Object.entries(runtimeNode.children)) {
      const node = childNode;
      if (node.type === 'directory' && node.children) {
        // Check if any file in this directory matches our test
        for (const [fileKey, fileNode] of Object.entries(node.children)) {
          const normalizedFileKey = normalizeTestName(fileKey);
          if (normalizedFileKey === normalizedTestName || 
              normalizedFileKey.includes(normalizedTestName) ||
              normalizedTestName.includes(normalizedFileKey)) {
            console.log(`[treeFilter] Found test in directory "${childKey}": "${fileKey}"`);
            console.log(`[treeFilter] Directory node children:`, JSON.stringify(node.children, null, 2));
            return node.children || {};
          }
        }
      }
    }
  } else if (runtimeNode.type === 'directory' && runtimeNode.children) {
    // If runtimeNode itself is a directory node with children
    return filterTreeForRuntimeAndTest(runtimeNode.children, '', testName);
  }

  console.log(`[treeFilter] No test node found for "${testName}" in runtime "${runtime}"`);
  return {};
}
