import path from "path";
import fs from "fs";
import crypto from "crypto";
import type { ITestconfigV2 } from "../../Types";

export interface BuildOptions {
  config: ITestconfigV2;
  entryPoints: string[];
  configPath: string;
  bundlesDir: string;
  metafileSubdir: string;
}

// Helper to compute a simple hash from file paths and contents
export async function computeFilesHash(files: string[]): Promise<string> {
  const hash = crypto.createHash('md5');

  for (const file of files) {
    try {
      const stats = fs.statSync(file);
      hash.update(file);
      hash.update(stats.mtimeMs.toString());
      hash.update(stats.size.toString());
    } catch (error) {
      // File may not exist, include its name anyway
      hash.update(file);
      hash.update('missing');
    }
  }

  return hash.digest('hex');
}

// // WebSocket functionality removed - dead feature
// export async function sendSourceFilesUpdated(
//   config: ITestconfigV2,
//   hash: string,
//   files: string[],
//   testName: string,
//   runtime: 'node' | 'web'
// ): Promise<void> {
//   console.log(`[${runtime} Builder] WebSocket feature removed - not sending sourceFilesUpdated for ${testName}`);
//   return Promise.resolve();
// }

// Extract input files from metafile recursively
export function extractInputFilesFromMetafile(metafile: any): string[] {
  const files: Set<string> = new Set();

  if (!metafile || !metafile.inputs) {
    return Array.from(files);
  }

  // Function to recursively collect all dependencies
  function collectDependencies(filePath: string) {
    if (files.has(filePath)) {
      return;
    }

    // Add the current file
    files.add(filePath);

    // Get file info from metafile
    const fileInfo = metafile.inputs[filePath];
    if (!fileInfo) {
      return;
    }

    // Recursively process each import
    if (fileInfo.imports) {
      for (const importInfo of fileInfo.imports) {
        const importPath = importInfo.path;
        // Only process if it's in the inputs (should be)
        if (metafile.inputs[importPath]) {
          collectDependencies(importPath);
        }
      }
    }
  }

  // Start from ALL files in inputs, not just entry points
  // This ensures we get all transitive dependencies
  for (const filePath of Object.keys(metafile.inputs)) {
    collectDependencies(filePath);
  }

  // Convert to absolute paths
  return Array.from(files).map(filePath =>
    path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath)
  );
}

export async function processMetafile(
  config: ITestconfigV2,
  metafile: any,
  runtime: 'node' | 'web',
  configKey: string
): Promise<void> {
  if (!metafile || !metafile.outputs) {
    return;
  }

  // Create a map to store all tests' information
  const allTestsInfo: Record<string, { hash: string; files: string[] }> = {};

  for (const [outputFile, outputInfo] of Object.entries(metafile.outputs)) {
    const outputInfoTyped = outputInfo as any;

    // Only process outputs that have an associated entryPoint
    if (!outputInfoTyped.entryPoint) {
      console.log(`[${runtime} Builder] Skipping output without entryPoint: ${outputFile}`);
      continue;
    }

    // Get the entry point path
    const entryPoint = outputInfoTyped.entryPoint;

    // Only process test files (files ending with .test.ts, .test.js, .spec.ts, .spec.js)
    // Also, exclude library files like src/lib/tiposkripto/Web.ts and src/lib/tiposkripto/Node.ts
    const isTestFile = /\.(test|spec)\.(ts|js)$/.test(entryPoint);
    if (!isTestFile) {
      console.log(`[${runtime} Builder] Skipping non-test entryPoint: ${entryPoint}`);
      continue;
    }

    // Get input files for this specific output
    const outputInputs = outputInfoTyped.inputs || {};

    // Function to recursively collect dependencies for a file
    const collectedFiles = new Set<string>();
    function collectFileDependencies(filePath: string) {
      if (collectedFiles.has(filePath)) {
        return;
      }
      collectedFiles.add(filePath);

      const fileInfo = metafile.inputs?.[filePath];
      if (fileInfo?.imports) {
        for (const importInfo of fileInfo.imports) {
          const importPath = importInfo.path;
          if (metafile.inputs?.[importPath]) {
            collectFileDependencies(importPath);
          }
        }
      }
    }

    // Start from all files listed in this output's inputs
    for (const inputFile of Object.keys(outputInputs)) {
      collectFileDependencies(inputFile);
    }

    // Convert to absolute paths
    const allInputFiles = Array.from(collectedFiles).map(filePath =>
      path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath)
    );

    // Convert to relative paths from workspace root
    const workspaceRoot = '/workspace';
    const relativeFiles = allInputFiles.map(file => {
      const absolutePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
      // Make path relative to workspace root
      if (absolutePath.startsWith(workspaceRoot)) {
        return absolutePath.slice(workspaceRoot.length);
      }
      // If not under workspace, use relative path from current directory
      return path.relative(process.cwd(), absolutePath);
    }).filter(Boolean);

    // Compute hash
    const hash = await computeFilesHash(allInputFiles);

    // Store test information
    allTestsInfo[entryPoint] = {
      hash,
      files: relativeFiles
    };

    console.log(`[${runtime} Builder] Processed ${entryPoint}: ${relativeFiles.length} files, hash: ${hash}`);
  }

  // Ensure the bundles directory exists
  const bundlesDir = `testeranto/bundles/${configKey}`;
  if (!fs.existsSync(bundlesDir)) {
    fs.mkdirSync(bundlesDir, { recursive: true });
    console.log(`[${runtime} Builder] Created directory: ${bundlesDir}`);
  }
  
  // Write single inputFiles.json for all tests
  const inputFilesPath = path.join(bundlesDir, 'inputFiles.json');
  fs.writeFileSync(inputFilesPath, JSON.stringify(allTestsInfo, null, 2));
  console.log(`[${runtime} Builder] Wrote inputFiles.json for ${Object.keys(allTestsInfo).length} tests to ${inputFilesPath}`);
}
