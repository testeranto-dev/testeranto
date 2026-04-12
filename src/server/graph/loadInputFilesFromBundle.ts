import fs from 'fs';
import path from 'path';

export function loadInputFilesFromBundle(
  configKey: string,
  testName: string,
  projectRoot: string
): string[] {
  try {
    const bundleDir = path.join(projectRoot, 'testeranto', 'bundles', configKey);
    const inputFilesPath = path.join(bundleDir, 'inputFiles.json');

    if (fs.existsSync(inputFilesPath)) {
      const content = fs.readFileSync(inputFilesPath, 'utf-8');
      const allTestsInfo = JSON.parse(content);

      if (allTestsInfo[testName] && allTestsInfo[testName].files) {
        return allTestsInfo[testName].files;
      }
    }
  } catch (error) {
    console.error(`[GraphManager] Error loading input files from bundle for ${configKey}/${testName}:`, error);
  }
  return [];
}
