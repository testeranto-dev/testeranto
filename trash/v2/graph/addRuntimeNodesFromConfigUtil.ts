import type { ITesterantoConfig } from "../../../src/server/Types";
import { addRuntimeNodesPure } from "./addRuntimeNodesPure";

export const addRuntimeNodesFromConfigUtil = (
  configs: ITesterantoConfig,
  timestamp: string
): any[] => {
  return addRuntimeNodesPure(configs, timestamp);
};
