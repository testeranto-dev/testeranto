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

  // If runtimeNode has children, look for the test in them
  if (runtimeNode.children) {
    // First, try exact match
    if (runtimeNode.children[testName]) {
      console.log(`[treeFilter] Found test by exact key match: "${testName}"`);
      return filterNodeByTestName(runtimeNode.children[testName], testName);
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
        return filterNodeByTestName(childNode, testName);
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
            return filterNodeByTestName(node, testName);
          }
        }
      }
    }
  } else if (runtimeNode.type === 'directory' && runtimeNode.children) {
    // If runtimeNode itself is a directory node with children
    // Filter all children to find those belonging to the test
    const filteredChildren = {};
    for (const [childKey, childNode] of Object.entries(runtimeNode.children)) {
      const childrenForTest = filterNodeByTestName(childNode, testName);
      if (Object.keys(childrenForTest).length > 0) {
        filteredChildren[childKey] = {
          ...childNode,
          children: childrenForTest
        };
      }
    }
    return filteredChildren;
  }

  console.log(`[treeFilter] No test node found for "${testName}" in runtime "${runtime}"`);
  return {};
}

// Filter a node and its children to only include files that belong to the specified test
// Returns the filtered children object
function filterNodeByTestName(node, testName) {
  if (!node || typeof node !== 'object') {
    return {};
  }
  
  // Get the children to filter
  const children = node.children || {};
  const filteredChildren = {};
  
  for (const [childName, childNode] of Object.entries(children)) {
    // For file nodes, check if they belong to this test
    if (childNode.type === 'file') {
      // Check if the file has a testName property that matches
      if (childNode.testName === testName) {
        filteredChildren[childName] = childNode;
      }
      // Also check if the file path contains the test name
      else if (childNode.path && childNode.path.includes(testName)) {
        filteredChildren[childName] = childNode;
      }
    }
    // For directory nodes, recursively filter their children
    else if (childNode.type === 'directory' && childNode.children) {
      const filteredDirChildren = filterNodeByTestName(childNode, testName);
      if (Object.keys(filteredDirChildren).length > 0) {
        filteredChildren[childName] = {
          ...childNode,
          children: filteredDirChildren
        };
      }
    }
    // For other node types (like 'feature'), check if they belong to the test
    else if (childNode.testName === testName) {
      filteredChildren[childName] = childNode;
    }
  }
  
  return filteredChildren;
}
