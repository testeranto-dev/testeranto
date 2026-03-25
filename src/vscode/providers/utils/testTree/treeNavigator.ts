import { TestTreeItem } from "../../../TestTreeItem";
import { convertNodeToItem } from "./nodeConverter";
import { filterTreeForRuntimeAndTest } from "./treeFilter";
// import { convertNodeToItem } from "./../../u";
// import { filterTreeForRuntimeAndTest } from "./treeFilter";

export async function getDirectoryChildren(
  runtime: string,
  testName: string,
  dirPath: string,
): Promise<TestTreeItem[]> {
  try {
    const response = await fetch("http://localhost:3000/~/collated-files");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    const tree = data.tree || {};

    const filteredTree = filterTreeForRuntimeAndTest(
      tree,
      runtime,
      testName,
    );

    const normalizedDirPath = dirPath.startsWith("/")
      ? dirPath.substring(1)
      : dirPath;
    const dirParts = normalizedDirPath
      .split("/")
      .filter((part) => part.length > 0);

    let currentNode = filteredTree;
    for (const part of dirParts) {
      if (currentNode[part] && currentNode[part].type === "directory") {
        currentNode = currentNode[part].children || {};
      } else {
        return [];
      }
    }

    const items: TestTreeItem[] = [];
    for (const [name, node] of Object.entries(currentNode)) {
      const item = convertNodeToItem(
        name,
        node,
        runtime,
        testName,
        dirPath,
      );
      if (item) {
        items.push(item);
      }
    }

    items.sort((a, b) => {
      const aIsDir = a.data?.isFile === false;
      const bIsDir = b.data?.isFile === false;
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.label!.toString().localeCompare(b.label!.toString());
    });

    return items;
  } catch (error) {
    console.error("Error in getDirectoryChildren:", error);
    return [];
  }
}
