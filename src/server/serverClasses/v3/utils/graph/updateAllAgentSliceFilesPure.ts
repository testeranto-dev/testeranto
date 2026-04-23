import type { ITesterantoConfig } from "../../../../../Types";
import { writeAgentSliceFile } from "../../../graph/graphFileUtils";

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
    const sliceData = agentConfig.sliceFunction(mockGraphManager);
    writeAgentSliceFile(projectRoot, agentName, sliceData);
  }
}