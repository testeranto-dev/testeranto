import path from 'path';
import fs from 'fs';
import type { ITesterantoConfig } from '../../../../src/server/Types';

export function getAgentSliceUtil(
  agentName: string,
  configs: ITesterantoConfig,
  serverGraph: any,
  agentSliceFilePath: string
): any {
  if (!configs.agents) {
    throw new Error(`No agents configured`);
  }
  const agentConfig = configs.agents[agentName];
  if (!agentConfig) {
    throw new Error(`Agent ${agentName} not found in configuration`);
  }
  if (typeof agentConfig.sliceFunction !== 'function') {
    throw new Error(`Agent ${agentName} has invalid sliceFunction`);
  }
  const sliceData = agentConfig.sliceFunction(serverGraph);
  const dir = path.dirname(agentSliceFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(agentSliceFilePath, JSON.stringify(sliceData, null, 2), 'utf-8');
  return sliceData;
}
