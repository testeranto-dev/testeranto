import esbuild from "esbuild";
import type { ITesterantoConfig } from "../../../Types";
import {
  processMetafile
} from "../common";
import nodeConfiger from "./esbuild";
import * as fs from 'fs';
import * as path from 'path';

// Import framework converters
import {
  JestConverter,
  MochaConverter,
  VitestConverter,
  GenericConverter,
  JasmineConverter
} from './framework-converters/index.js';

// Import native detection module
let NodeNativeTestDetection;
try {
  // Try to import the native detection module
  const detectionModulePath = path.join(__dirname, 'native_detection.js');
  if (fs.existsSync(detectionModulePath)) {
    NodeNativeTestDetection = require('./native_detection');
  } else {
    // Create a dummy class if module not found
    NodeNativeTestDetection = class {
      static detectNativeTest(filePath: string) {
        return { isNativeTest: false, frameworkType: null, testStructure: {} };
      }
      static translateToTesteranto(detectionResult: any) {
        return { specification: '', implementation: '', adapter: '' };
      }
    };
  }
} catch (error) {
  // Fallback to dummy class
  NodeNativeTestDetection = class {
    static detectNativeTest(filePath: string) {
      return { isNativeTest: false, frameworkType: null, testStructure: {} };
    }
    static translateToTesteranto(detectionResult: any) {
      return { specification: '', implementation: '', adapter: '' };
    }
  };
}

// Framework converter registry
const frameworkConverters = [
  JestConverter,
  MochaConverter,
  VitestConverter,
  JasmineConverter,
  GenericConverter
];

// Helper function to detect framework using converters
function detectFrameworkWithConverters(filePath: string) {
  for (const converter of frameworkConverters) {
    if (converter.detect(filePath)) {
      return converter;
    }
  }
  return GenericConverter;
}

const nodeConfigPath = process.argv[3];
const configJson = process.argv[4];
let entryPoints: string[] = [];
let outputs: string[] = [];
let testName = "";

try {
  const config = JSON.parse(configJson);
  entryPoints = config.tests || [];
  outputs = config.outputs || [];
  testName = config.name || "";
} catch (error) {
  console.error('[NODE BUILDER] Failed to parse config JSON:', error);
  process.exit(1);
}

if (!testName) {
  console.error('[NODE BUILDER] Config must include a name');
  process.exit(1);
}

// Setup logging to file
const reportDir = path.join(process.cwd(), 'testeranto', 'reports', testName);
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
  console.log(`[NODE BUILDER] Created report directory: ${reportDir}`);
}
const logFilePath = path.join(reportDir, 'build.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Override console.log to write to both console and log file
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

function logToFile(message: any, ...optionalParams: any[]) {
  const timestamp = new Date().toISOString();
  const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
  const fullMessage = `[${timestamp}] ${formattedMessage}`;

  // Write to file
  logStream.write(fullMessage + '\n');
  if (optionalParams.length > 0) {
    optionalParams.forEach(param => {
      const paramStr = typeof param === 'string' ? param : JSON.stringify(param, null, 2);
      logStream.write(`  ${paramStr}\n`);
    });
  }

  // Also write to original console
  originalConsoleLog.apply(console, [message, ...optionalParams]);
}

console.log = (...args) => {
  logToFile(...args);
};

console.error = (...args) => {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)).join(' ');
  logStream.write(`[${timestamp}] ERROR: ${message}\n`);
  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)).join(' ');
  logStream.write(`[${timestamp}] WARN: ${message}\n`);
  originalConsoleWarn.apply(console, args);
};

// Handle process exit to close log stream
process.on('exit', () => {
  console.log('[NODE BUILDER] Process exiting');
  logStream.end();
});
process.on('SIGINT', async () => {
  console.log('[NODE BUILDER] Received SIGINT - producing output artifacts');
  await produceOutputArtifacts(projectConfigs, testName);
  logStream.end();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  console.log('[NODE BUILDER] Received SIGTERM - producing output artifacts');
  // If we have a context in dev mode, dispose it first
  if (isDevMode && typeof ctx !== 'undefined') {
    console.log('[NODE BUILDER] Disposing esbuild context');
    await ctx.dispose();
  }
  await produceOutputArtifacts(projectConfigs, testName);
  logStream.end();
  process.exit(0);
});
process.on('uncaughtException', (error) => {
  console.error('[NODE BUILDER] Uncaught exception:', error);
  logStream.end();
});

// Helper function to generate native test wrapper using appropriate converter
function generateNativeTestWrapper(
  entryPointPath: string,
  detectionResult: any,
  translationResult: any,
  filesHash: string
): string {
  const frameworkType = detectionResult.frameworkType || 'generic';

  // Find the appropriate converter
  let converter = GenericConverter;
  for (const conv of frameworkConverters) {
    if (conv.name === frameworkType.toLowerCase()) {
      converter = conv;
      break;
    }
  }

  // Use the converter to generate the wrapper
  return converter.generateWrapper(
    entryPointPath,
    detectionResult,
    translationResult,
    filesHash
  );
}

// Function to produce output artifacts when shutting down
async function produceOutputArtifacts(): Promise<void> {
  console.log(`[NODE BUILDER] Producing output artifacts for config ${testName}`);

  if (!outputs || outputs.length === 0) {
    console.log(`[NODE BUILDER] No outputs defined for ${testName}`);
    return;
  }

  console.log(`[NODE BUILDER] Processing ${outputs.length} output artifacts`);

  // Create output directory
  const outputDir = `testeranto/outputs/${testName}`;
  const fs = await import('fs');
  const path = await import('path');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const entrypoint of outputs) {
    try {
      const sourcePath = entrypoint;
      const fileName = path.basename(entrypoint);
      const destPath = path.join(outputDir, fileName);

      console.log(`[NODE BUILDER] Copying ${sourcePath} to ${destPath}`);

      // Copy file
      fs.copyFileSync(sourcePath, destPath);

      console.log(`[NODE BUILDER] ✅ Copied ${fileName}`);
    } catch (error: any) {
      console.error(`[NODE BUILDER] Failed to process output artifact ${entrypoint}:`, error.message);
    }
  }

  console.log(`[NODE BUILDER] Finished producing output artifacts`);
}

// run esbuild in watch mode using esbuildConfigs. Write to fs the bundle and metafile
async function startBundling(
  nodeConfigs: any,
  projectConfig: ITesterantoConfig,
  entryPoints: string[]
) {
  console.log(`[NODE BUILDER] is now bundling:  ${testName}`);
  console.log(`[NODE BUILDER] Entry points: ${entryPoints.join(', ')}`);

  // Process each entry point to detect native tests using both methods
  const entryPointInfo = new Map();
  for (const entryPoint of entryPoints) {
    const entryPointPath = path.resolve(entryPoint);
    if (fs.existsSync(entryPointPath)) {
      // Try both detection methods
      const detectionResult = NodeNativeTestDetection.detectNativeTest(entryPointPath);
      const converter = detectFrameworkWithConverters(entryPointPath);

      // Merge detection results
      const enhancedResult = {
        ...detectionResult,
        converterName: converter.name,
        // If native detection didn't find a framework but converter did, update it
        frameworkType: detectionResult.frameworkType ||
          (detectionResult.isNativeTest ? converter.name : null)
      };

      entryPointInfo.set(entryPoint, enhancedResult);

      if (detectionResult.isNativeTest || converter.name !== 'generic') {
        console.log(`[NODE BUILDER] Detected native ${enhancedResult.frameworkType || converter.name} test: ${entryPoint}`);
        console.log(`[NODE BUILDER] Using converter: ${converter.name}`);
      }
    }
  }

  const n = nodeConfiger(nodeConfigs, testName, projectConfig, entryPoints);

  // Check if we're in dev mode (the server passes mode through environment)
  const isDevMode = process.env.MODE === 'dev' || process.argv.includes('dev');

  if (isDevMode) {
    console.log(`[NODE BUILDER] Running in dev mode - starting watch mode`);

    // Create a build context for watch mode with onEnd plugin
    const ctx = await esbuild.context({
      ...n,
      plugins: [
        ...(n.plugins || []),
        {
          name: 'testeranto-rebuild-notifier',
          setup(build) {
            build.onEnd(async (result) => {
              if (result.metafile) {
                await processMetafile(projectConfig, result.metafile, 'node', testName);
                console.log(`[NODE BUILDER] Metafile updated`);

                // Trigger test re-run by touching inputFiles.json
                // The inputFiles.json is at testeranto/bundles/${testName}/inputFiles.json
                const inputFilesPath = `testeranto/bundles/${testName}/inputFiles.json`;
                try {
                  const fs = await import('fs');
                  if (fs.existsSync(inputFilesPath)) {
                    const stats = fs.statSync(inputFilesPath);
                    fs.utimesSync(inputFilesPath, stats.atime, new Date());
                    console.log(`[NODE BUILDER] Triggered inputFiles.json update`);
                  } else {
                    console.log(`[NODE BUILDER] inputFiles.json doesn't exist yet at ${inputFilesPath}`);
                  }
                } catch (error) {
                  console.error(`[NODE BUILDER] Failed to trigger inputFiles.json update:`, error);
                }
              }
            });
          },
        },
      ],
    });

    // Build once initially
    const buildResult = await ctx.rebuild();
    if (buildResult.metafile) {
      await processMetafile(
        projectConfig,
        buildResult.metafile,
        'node',
        testName);
    } else {
      console.warn("No metafile generated by esbuild");
    }

    // Start watching for changes
    await ctx.watch();

    console.log(`[NODE BUILDER] Watch mode active - waiting for file changes...`);

    // Keep the process alive
    process.on('SIGINT', async () => {
      console.log("[NODE BUILDER] Shutting down...");
      await ctx.dispose();
      process.exit(0);
    });

    // Note: esbuild context doesn't have an 'on' method for rebuild events
    // We'll handle rebuilds through the onEnd plugin instead
    console.log(`[NODE BUILDER] Using onEnd plugin for rebuild detection`);


    // Keep the process alive indefinitely in dev mode
    // This is important for the container to stay running
    console.log(`[NODE BUILDER] Keeping process alive for continuous watching...`);
    // Use setInterval to keep event loop active
    const keepAliveInterval = setInterval(() => {
      // Just keep the process alive
    }, 60000); // Every minute

    process.on('SIGINT', () => {
      clearInterval(keepAliveInterval);
    });

  } else {
    // Once mode - just build once
    const buildResult = await esbuild.build(n);
    if (buildResult.metafile) {
      await processMetafile(projectConfig, buildResult.metafile, 'node', testName);
    } else {
      console.warn("No metafile generated by esbuild");
    }
  }
}

async function main() {
  // Load the node config (native language config file)
  // The path is fixed relative to the runtime
  // const nodeConfigPath = "testeranto/runtimes/node/node.mjs";
  // let nodeConfigs: any;

  try {
    const nodeConfigs = (await import(nodeConfigPath)).default;

    // Set up signal handlers
    const setupSignalHandlers = () => {
      process.on("SIGINT", async () => {
        console.log("[NODE BUILDER] Received SIGINT - producing output artifacts");
        await produceOutputArtifacts();
        logStream.end();
        process.exit(0);
      });

      process.on("SIGTERM", async () => {
        console.log("[NODE BUILDER] Received SIGTERM - producing output artifacts");
        // If we have a context in dev mode, dispose it first
        if (isDevMode && typeof ctx !== 'undefined') {
          console.log('[NODE BUILDER] Disposing esbuild context');
          await ctx.dispose();
        }
        await produceOutputArtifacts();
        logStream.end();
        process.exit(0);
      });

      process.on("uncaughtException", (error) => {
        console.error("[NODE BUILDER] Uncaught exception:", error);
        logStream.end();
        // Try to produce output artifacts even on uncaught exception
        produceOutputArtifacts().finally(() => {
          process.exit(1);
        });
      });
    };

    setupSignalHandlers();

    // Create a dummy project config since it's not used
    const dummyProjectConfig = {} as ITesterantoConfig;
    await startBundling(nodeConfigs, dummyProjectConfig, entryPoints);

    // In dev mode, keep the process running even if there's an error
    const isDevMode = process.env.MODE === 'dev' || process.argv.includes('dev');
    if (isDevMode) {
      // Don't exit on unhandled rejections
      process.on('unhandledRejection', (reason, promise) => {
        console.error('[NODE BUILDER] Unhandled Rejection at:', promise, 'reason:', reason);
      });

      // Keep alive
      setInterval(() => {
        // console.log('[NODE BUILDER] Still watching for changes...');
      }, 30000);
    }
  } catch (error) {
    console.error("NODE BUILDER: Error:", error);

    // In dev mode, don't exit immediately
    const isDevMode = process.env.MODE === 'dev' || process.argv.includes('dev');
    if (isDevMode) {
      console.error('[NODE BUILDER] Error occurred but keeping process alive in dev mode');
      // Keep the process alive to restart watching
      setInterval(() => { }, 1000);
    } else {
      // Try to produce output artifacts before exiting on error
      await produceOutputArtifacts()
      logStream.end();
      process.exit(1);
    }
  }
}

main();
