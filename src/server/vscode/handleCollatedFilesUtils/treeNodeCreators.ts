import type { TreeNode } from "./types";

export const createRuntimeNode = (runtimeKey: string): TreeNode => {
  return {
    type: "directory",
    children: {},
  };
};

export const createTestNode = (testName: string): TreeNode => {
  return {
    type: "directory",
    children: {},
  };
};
