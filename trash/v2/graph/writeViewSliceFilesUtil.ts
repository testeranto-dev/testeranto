import fs from 'fs';
import path from 'path';
import type { ITesterantoConfig } from "../../../src/Types";

export function writeViewSliceFilesUtil(
  configs: ITesterantoConfig,
  projectRoot: string,
  getViewSlice: (viewKey: string) => any,
  resourceChanged: (path: string) => void
): void {
  const views = configs.views;
  if (!views) return;

  for (const [viewKey, viewConfig] of Object.entries(views)) {
    const sliceData = getViewSlice(viewKey);
    const slicePath = getSliceFilePathUtil(viewKey, projectRoot);
    const dir = path.dirname(slicePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(slicePath, JSON.stringify(sliceData, null, 2), 'utf-8');

    // Notify that this view slice has been updated
    resourceChanged(`/~/views/${viewKey}/slice`);
  }

  // Also notify that all views have been updated
  resourceChanged('/~/views');
}

export function getSliceFilePathUtil(viewKey: string, projectRoot: string): string {
  return `${projectRoot}/testeranto/slices/views/${viewKey}.json`;
}
