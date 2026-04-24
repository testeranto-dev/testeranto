import type { ITesterantoConfig } from "../../../src/server/Types";
import { addViewNodesPure } from "./addViewNodesPure";

export const addViewNodesFromConfigUtil = (
  configs: ITesterantoConfig,
  projectRoot: string,
  timestamp: string
): any[] => {
  return addViewNodesPure(configs, projectRoot, timestamp);
};
