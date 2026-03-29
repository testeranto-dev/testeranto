// src/vscode/providers/utils/testTree/debugTest.js
import * as assert2 from "node:assert";

// src/vscode/providers/utils/testTree/treeFilter.ts
import * as assert from "node:assert";
function filterTreeForRuntimeAndTest(tree, runtime, testName) {
  assert.ok(tree, "Tree must be provided");
  assert.ok(typeof tree === "object", "Tree must be an object");
  assert.ok(runtime, "Runtime must be provided");
  assert.ok(typeof runtime === "string", "Runtime must be a string");
  assert.ok(testName, "Test name must be provided");
  assert.ok(typeof testName === "string", "Test name must be a string");
  console.log(`[treeFilter] ==========================================`);
  console.log(`[treeFilter] filterTreeForRuntimeAndTest called with runtime="${runtime}", testName="${testName}"`);
  console.log(`[treeFilter] Full tree structure:`, JSON.stringify(tree, null, 2));
  const normalizeTestName = (name) => {
    if (!name) return "";
    const nameStr = String(name);
    return nameStr.replace(/\.test\.ts$/, "").replace(/\.spec\.ts$/, "").replace(/\.test\.js$/, "").replace(/\.spec\.js$/, "").replace(/\.test\.go$/, "").replace(/\.spec\.go$/, "").replace(/\.test$/, "").replace(/\.spec$/, "").replace(/\.ts$/, "").replace(/\.js$/, "").replace(/\.go$/, "").replace(/\.node\.ts$/, "").replace(/\.node\.js$/, "").replace(/[\/\\]/g, "_").toLowerCase();
  };
  const getTestBaseName = (name) => {
    if (!name) return "";
    const nameStr = String(name);
    const baseName = nameStr.split("/").pop() || nameStr;
    return normalizeTestName(baseName);
  };
  const normalizedTestName = normalizeTestName(testName);
  const testBaseName = getTestBaseName(testName);
  console.log(`[treeFilter] normalizedTestName: "${normalizedTestName}", testBaseName: "${testBaseName}"`);
  let runtimeNode = null;
  if (tree[runtime]) {
    runtimeNode = tree[runtime];
  } else {
    for (const key of Object.keys(tree)) {
      if (key.toLowerCase().includes(runtime.toLowerCase()) || runtime.toLowerCase().includes(key.toLowerCase())) {
        runtimeNode = tree[key];
        console.log(`[treeFilter] Found runtime "${key}" as match for "${runtime}"`);
        break;
      }
    }
  }
  if (!runtimeNode) {
    console.log(`[treeFilter] No runtime node found for "${runtime}"`);
    const firstRuntimeKey = Object.keys(tree)[0];
    if (firstRuntimeKey) {
      runtimeNode = tree[firstRuntimeKey];
      console.log(`[treeFilter] Using first runtime found: "${firstRuntimeKey}"`);
    } else {
      return {};
    }
  }
  console.log(`[treeFilter] Runtime node structure:`, JSON.stringify(runtimeNode, null, 2));
  if (runtimeNode.children) {
    if (runtimeNode.children[testName]) {
      console.log(`[treeFilter] Found test by exact key match: "${testName}"`);
      console.log(`[treeFilter] Test node children:`, JSON.stringify(runtimeNode.children[testName].children, null, 2));
      return runtimeNode.children[testName].children || {};
    }
    for (const [childKey, childNode] of Object.entries(runtimeNode.children)) {
      const normalizedChildKey = normalizeTestName(childKey);
      const childBaseName = getTestBaseName(childKey);
      if (normalizedChildKey === normalizedTestName || childBaseName === testBaseName || childKey.includes(testName) || testName.includes(childKey) || normalizedChildKey.includes(normalizedTestName) || normalizedTestName.includes(normalizedChildKey)) {
        console.log(`[treeFilter] Found test by pattern match: "${childKey}" for "${testName}"`);
        console.log(`[treeFilter] Matched node children:`, JSON.stringify(childNode.children, null, 2));
        return childNode.children || {};
      }
    }
    for (const [childKey, childNode] of Object.entries(runtimeNode.children)) {
      const node = childNode;
      if (node.type === "directory" && node.children) {
        for (const [fileKey, fileNode] of Object.entries(node.children)) {
          const normalizedFileKey = normalizeTestName(fileKey);
          if (normalizedFileKey === normalizedTestName || normalizedFileKey.includes(normalizedTestName) || normalizedTestName.includes(normalizedFileKey)) {
            console.log(`[treeFilter] Found test in directory "${childKey}": "${fileKey}"`);
            console.log(`[treeFilter] Directory node children:`, JSON.stringify(node.children, null, 2));
            return node.children || {};
          }
        }
      }
    }
  } else if (runtimeNode.type === "directory" && runtimeNode.children) {
    return filterTreeForRuntimeAndTest(runtimeNode.children, "", testName);
  }
  console.log(`[treeFilter] No test node found for "${testName}" in runtime "${runtime}"`);
  return {};
}

// src/vscode/providers/utils/testTree/debugTest.js
function testFilterTreeForRuntimeAndTest() {
  console.log("Testing filterTreeForRuntimeAndTest...");
  const mockTree = {
    "nodetests": {
      type: "directory",
      children: {
        "src/lib/tiposkripto/tests/abstractBase.test/index.ts": {
          type: "directory",
          children: {
            "source": {
              type: "directory",
              name: "Source Files",
              children: {
                "index.ts": {
                  type: "file",
                  path: "src/lib/tiposkripto/tests/abstractBase.test/index.ts",
                  fileType: "source"
                }
              }
            },
            "logs": {
              type: "directory",
              name: "Logs",
              children: {
                "calculator_test_node_ts_check_3_log": {
                  type: "file",
                  path: "testeranto/reports/nodetests/src/lib/tiposkripto/tests/calculator/calculator-test-node-ts_check-3.log",
                  runtime: "node",
                  runtimeKey: "nodetests",
                  testName: "src/lib/tiposkripto/tests/abstractBase.test/index.ts",
                  fileType: "log",
                  exitCode: "0",
                  exitCodeColor: "green",
                  description: "Log"
                }
              }
            }
          }
        }
      }
    }
  };
  const result1 = filterTreeForRuntimeAndTest(
    mockTree,
    "nodetests",
    "src/lib/tiposkripto/tests/abstractBase.test/index.ts"
  );
  console.log("Result 1 keys:", Object.keys(result1));
  console.log("Result 1 structure:", JSON.stringify(result1, null, 2));
  assert2.ok(result1, "Result should not be null");
  assert2.ok(typeof result1 === "object", "Result should be an object");
  assert2.ok("source" in result1, "Result should have source directory");
  assert2.ok("logs" in result1, "Result should have logs directory");
  const sourceDir = result1.source;
  assert2.ok(sourceDir, "Source directory should exist");
  assert2.strictEqual(sourceDir.type, "directory", "Source should be a directory");
  assert2.ok(sourceDir.children, "Source directory should have children");
  const sourceFiles = Object.keys(sourceDir.children);
  console.log("Source files:", sourceFiles);
  assert2.ok(sourceFiles.length > 0, "Source directory should contain files");
  const indexFile = sourceDir.children["index.ts"];
  assert2.ok(indexFile, "index.ts should exist in source directory");
  assert2.strictEqual(indexFile.type, "file", "index.ts should be a file");
  assert2.strictEqual(indexFile.fileType, "source", 'index.ts should have fileType "source"');
  console.log("All tests passed!");
}
try {
  testFilterTreeForRuntimeAndTest();
  console.log("\n\u2705 Test completed successfully!");
} catch (error) {
  console.error("\n\u274C Test failed:", error);
  process.exit(1);
}
