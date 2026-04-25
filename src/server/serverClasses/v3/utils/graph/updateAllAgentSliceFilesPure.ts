import { writeAgentSliceFile } from "../../../../../../trash/v2/graph/graphFileUtils";
import type { ITesterantoConfig } from "../../../../../Types";


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
