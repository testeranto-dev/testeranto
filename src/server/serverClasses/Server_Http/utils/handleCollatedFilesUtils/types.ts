export interface TreeNode {
  type: "directory" | "file" | "feature";
  name?: string;
  path?: string;
  runtime?: string;
  runtimeKey?: string;
  testName?: string;
  fileType?: string;
  children?: Record<string, TreeNode>;
  clickable?: boolean;
  status?: string;
  exitCode?: string;
  exitCodeColor?: string;
  groupName?: string;
  description?: string;
  feature?: string;
}

export interface TestInfo {
  runtimeKey: string;
  runtime: string;
  testName: string;
  config: any;
}
