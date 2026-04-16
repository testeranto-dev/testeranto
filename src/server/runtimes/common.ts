import path from "path";
import fs from "fs";
import crypto from "crypto";
import type { ITesterantoConfig } from "../../Types";

export interface BuildOptions {
  config: ITesterantoConfig;
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

// Extract input files from metafile recursively, filtering out external dependencies
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

  // Convert to absolute paths and filter out external dependencies
  return Array.from(files)
    .map(filePath =>
      path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath)
    )
    .filter(filePath => {
      // Filter out node_modules and files outside workspace
      const normalizedPath = path.normalize(filePath);
      if (normalizedPath.includes('node_modules')) {
        return false;
      }
      // Check if within workspace (default /workspace)
      const workspaceRoot = '/workspace';
      return filePath.startsWith(workspaceRoot);
    });
}

// Helper to check if a file is local source code (not external dependency)
function isLocalSourceFile(filePath: string, workspaceRoot: string = '/workspace'): boolean {
  const normalizedPath = path.normalize(filePath);
  
  // Exclude node_modules
  if (normalizedPath.includes('node_modules')) {
    return false;
  }
  
  // Exclude files outside the workspace
  const absolutePath = path.isAbsolute(normalizedPath) ? normalizedPath : path.resolve(process.cwd(), normalizedPath);
  if (!absolutePath.startsWith(workspaceRoot)) {
    return false;
  }
  
  // Include only source files (could add more specific patterns if needed)
  // For now, include all files within workspace that aren't in node_modules
  return true;
}

export async function processMetafile(
  config: ITesterantoConfig,
  metafile: any,
  runtime: 'node' | 'web',
  configKey: string
): Promise<void> {
  if (!metafile || !metafile.outputs) {
    return;
  }

  const allTestsInfo: Record<string, { hash: string; files: string[] }> = {};
  const workspaceRoot = '/workspace';

  for (const [outputFile, outputInfo] of Object.entries(metafile.outputs)) {
    const outputInfoTyped = outputInfo as any;

    // Only process outputs that have an associated entryPoint
    if (!outputInfoTyped.entryPoint) {
      console.log(`[${runtime} Builder] Skipping output without entryPoint: ${outputFile}`);
      continue;
    }

    const entryPoint = outputInfoTyped.entryPoint;

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

    for (const inputFile of Object.keys(outputInputs)) {
      collectFileDependencies(inputFile);
    }

    // Convert to absolute paths and filter local source files
    const allInputFiles = Array.from(collectedFiles)
      .map(filePath =>
        path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath)
      )
      .filter(filePath => isLocalSourceFile(filePath, workspaceRoot));

    // Convert to relative paths from workspace root
    const relativeFiles = allInputFiles.map(file => {
      const absolutePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
      // Make path relative to workspace root
      if (absolutePath.startsWith(workspaceRoot)) {
        return absolutePath.slice(workspaceRoot.length);
      }
      // This shouldn't happen since we filtered above, but handle just in case
      return path.relative(process.cwd(), absolutePath);
    }).filter(Boolean);

    const hash = await computeFilesHash(allInputFiles);
    allTestsInfo[entryPoint] = {
      hash,
      files: relativeFiles
    };

    console.log(`[${runtime} Builder] Processed ${entryPoint}: ${relativeFiles.length} local files (filtered), hash: ${hash}`);
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
