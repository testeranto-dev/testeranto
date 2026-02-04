export enum TreeItemType {
  Runtime,
  Test,
  File,
  Info
}

export interface TreeItemData {
  runtime?: string;
  testName?: string;
  fileName?: string;
  path?: string;
  test?: string;
  status?: string;
  isFile?: boolean;
  info?: string;
  action?: string;
  description?: string;
  connected?: boolean;
  disconnected?: boolean;
  refresh?: boolean;
  runtimeKey?: string;
  testsCount?: number;
  count?: number;
  startServer?: boolean;
  noProcesses?: boolean;
}
