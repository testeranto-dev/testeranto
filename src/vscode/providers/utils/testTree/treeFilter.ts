export function filterTreeForRuntimeAndTest(
  tree: Record<string, any>,
  runtime: string,
  testName: string,
): Record<string, any> {
  console.log(
    `[treeFilter] filterTreeForRuntimeAndTest called with runtime="${runtime}", testName="${testName}"`,
  );

  const filterNode = (node: any): any => {
    if (!node) {
      console.log(`[DEBUG] filterNode: node is null`);
      return null;
    }

    console.log(
      `[DEBUG] filterNode: type=${node.type}, testName=${node.testName}, feature=${node.feature}`,
    );

    if (node.type === "file") {
      if (node.testName === testName) {
        console.log(`[DEBUG] filterNode: file matches testName`);
        return node;
      }
      if (node.tests && node.tests.includes(testName)) {
        console.log(`[DEBUG] filterNode: file matches testName in array`);
        return node;
      }
      console.log(`[DEBUG] filterNode: file doesn't match testName`);
      return null;
    } else if (node.type === "feature") {
      if (node.testName === testName) {
        console.log(
          `[DEBUG] filterNode: feature matches testName: ${node.feature}`,
        );
        return node;
      }
      console.log(`[DEBUG] filterNode: feature doesn't match testName`);
      return null;
    } else if (node.type === "directory") {
      console.log(
        `[DEBUG] filterNode: processing directory with ${Object.keys(node.children || {}).length} children`,
      );
      const filteredChildren: Record<string, any> = {};
      for (const [childName, child] of Object.entries(node.children || {})) {
        const filteredChild = filterNode(child);
        if (filteredChild !== null) {
          filteredChildren[childName] = filteredChild;
        }
      }
      if (Object.keys(filteredChildren).length > 0) {
        console.log(
          `[DEBUG] filterNode: directory has ${Object.keys(filteredChildren).length} filtered children`,
        );
        return {
          type: "directory",
          children: filteredChildren,
        };
      }
      console.log(`[DEBUG] filterNode: directory has no matching children`);
      return null;
    }
    console.log(`[DEBUG] filterNode: unknown node type: ${node.type}`);
    return null;
  };

  if (tree.type === "directory" && tree.children) {
    const filteredRoot = filterNode(tree);
    if (filteredRoot && filteredRoot.children) {
      return filteredRoot.children;
    }
    return {};
  }

  const result: Record<string, any> = {};
  for (const [name, node] of Object.entries(tree)) {
    const filteredNode = filterNode(node);
    if (filteredNode !== null) {
      result[name] = filteredNode;
    }
  }

  console.log(
    `[treeFilter] Filtered tree has ${Object.keys(result).length} top-level items`,
  );
  return result;
}
