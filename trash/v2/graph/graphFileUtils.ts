import fs from 'fs';
import path from 'path';

export function writeSliceFile(
  projectRoot: string,
  viewKey: string,
  sliceData: any
): void {
  const viewsSlicesDir = path.join(projectRoot, 'testeranto', 'slices', 'views');
  if (!fs.existsSync(viewsSlicesDir)) {
    fs.mkdirSync(viewsSlicesDir, { recursive: true });
  }

  const sliceFilePath = path.join(viewsSlicesDir, `${viewKey}.json`);
  const content = JSON.stringify(sliceData, null, 2);

  fs.writeFileSync(sliceFilePath, content, 'utf8');
}

export function writeAgentSliceFile(
  projectRoot: string,
  agentName: string,
  sliceData: any
): void {
  try {
    const agentsSlicesDir = path.join(projectRoot, 'testeranto', 'slices', 'agents');
    if (!fs.existsSync(agentsSlicesDir)) {
      fs.mkdirSync(agentsSlicesDir, { recursive: true });
    }

    const sliceFilePath = path.join(agentsSlicesDir, `${agentName}.json`);
    const content = JSON.stringify(sliceData, null, 2);

    fs.writeFileSync(sliceFilePath, content, 'utf8');
  } catch (error: any) {
    console.error(`Error writing agent slice file for ${agentName}:`, error);
  }
}

export function getSliceFilePath(projectRoot: string, viewKey: string): string {
  return path.join(projectRoot, 'testeranto', 'slices', 'views', `${viewKey}.json`);
}

export function getAgentSliceFilePath(projectRoot: string, agentName: string): string {
  return path.join(projectRoot, 'testeranto', 'slices', 'agents', `${agentName}.json`);
}
