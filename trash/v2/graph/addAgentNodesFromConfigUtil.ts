import type { ITesterantoConfig } from "../../../src/server/Types";
import { addAgentNodesPure } from "./addAgentNodesPure";

export const addAgentNodesFromConfigUtil = (
  configs: ITesterantoConfig,
  timestamp: string
): any[] => {
  return addAgentNodesPure(configs, timestamp);
};
