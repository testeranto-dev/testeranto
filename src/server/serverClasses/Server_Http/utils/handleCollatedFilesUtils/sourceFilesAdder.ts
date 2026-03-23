import type { TreeNode } from "./types";

export const addSourceFilesToTestNode = (
  testNode: TreeNode,
  allSourceFiles: string[],
  runtime: string,
  runtimeKey: string,
  testName: string
): void => {
  if (!testNode.children) {
    testNode.children = {};
  }

  const sourceSectionKey = "source";
  if (!testNode.children[sourceSectionKey]) {
    testNode.children[sourceSectionKey] = {
      type: "directory",
      name: "Source Files",
      children: {},
    };
  }

  const sourceSection = testNode.children[sourceSectionKey];
  if (!sourceSection.children) {
    sourceSection.children = {};
  }

  for (const file of allSourceFiles) {
    const normalizedPath = file.startsWith("/") ? file.substring(1) : file;
    const parts = normalizedPath.split("/").filter((part) => part.length > 0);

    if (parts.length === 0) continue;

    let currentNode = sourceSection.children;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (!currentNode[part]) {
        if (isLast) {
          currentNode[part] = {
            type: "file",
            path: normalizedPath,
            runtime,
            runtimeKey,
            testName,
            fileType: "source",
          };
        } else {
          currentNode[part] = {
            type: "directory",
            name: part,
            children: {},
          };
        }
      }

      if (!isLast && currentNode[part].type === "directory") {
        currentNode = currentNode[part].children!;
      }
    }
  }
};
