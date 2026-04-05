import { findNodeInTree } from "../../stakeholder/StakeholderUtils";
import { addFileToTree } from "./addFileToTree";
import { getTestEntrypoints } from "./getTestEntrypoints";

/**
 * Add source files to tree based on test entrypoints in configs
 */
export async function addSourceFilesToTree(
  tree: any,
  configs: any,
): Promise<void> {
  // Get all test entrypoints from configs
  const testEntrypoints = getTestEntrypoints(configs);

  // Add each test entrypoint to the tree
  for (const entrypoint of testEntrypoints) {
    addFileToTree(tree, entrypoint, "test-source");

    // Don't load source file content for stakeholder app
    // Just mark it as a test source file
    const node = findNodeInTree(tree, entrypoint);
    if (node && node.type === "file") {
      // Clear any content that might have been loaded
      node.content = null;
    }
  }
}
