import type { ITesterantoConfig } from "../../../../../Types";
import { writeAgentSliceFile } from "./writeAgentSliceFile";

export function updateAllAgentSliceFilesPure(
  graphData: any,
  projectRoot: string,
  configs: ITesterantoConfig
): void {
  if (!configs.agents) return;

  for (const [agentName, agentConfig] of Object.entries(configs.agents)) {
    if (typeof agentConfig.sliceFunction !== 'function') continue;

    const mockGraphManager = {
      getGraphData: () => graphData
    };
    writeAgentSliceFile(projectRoot, agentName, agentConfig.sliceFunction(mockGraphManager));
  }
}
