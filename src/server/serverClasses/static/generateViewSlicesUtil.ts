import fs from 'fs';
import path from 'path';
import type { ITesterantoConfig } from "../../../Types";

export const generateViewSlicesUtil = async (
  configs: ITesterantoConfig,
  getGraphDataForSlices: () => Promise<any>
): Promise<void> => {
  const views = configs.views;
  if (!views || Object.keys(views).length === 0) {
    return;
  }

  // Create the slices directory if it doesn't exist
  const slicesDir = path.join(process.cwd(), "testeranto", "slices", "views");
  if (!fs.existsSync(slicesDir)) {
    fs.mkdirSync(slicesDir, { recursive: true });
  }

  const graphData = await getGraphDataForSlices();

  for (const [viewKey, v] of Object.entries(views)) {
    const slicePath = path.join(slicesDir, `${viewKey}.json`);
    const sliceData = v.slicer(graphData);
    fs.writeFileSync(slicePath, JSON.stringify(sliceData, null, 2), 'utf-8');
  }
};
