import esbuild from "esbuild";
import type { ITestconfigV2 } from "../../../Types";
import {
  processMetafile
} from "../common";
import nodeConfiger from "./esbuild";
import * as fs from 'fs';
import * as path from 'path';

const projectConfigPath = process.argv[2];
const nodeConfigPath = process.argv[3];
const testName = process.argv[4];
const entryPoints = process.argv.slice(5);

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

// Log startup information
console.log(`[NODE BUILDER] projectConfigPath:  ${projectConfigPath}`);
console.log(`[NODE BUILDER] nodeConfig:  ${nodeConfigPath}`);
console.log(`[NODE BUILDER] testName:  ${testName}`);
console.log(`[NODE BUILDER] Log file: ${logFilePath}`);

// Handle process exit to close log stream
process.on('exit', () => {
  console.log('[NODE BUILDER] Process exiting');
  logStream.end();
});
process.on('SIGINT', () => {
  console.log('[NODE BUILDER] Received SIGINT');
  logStream.end();
  process.exit(0);
});
process.on('uncaughtException', (error) => {
  console.error('[NODE BUILDER] Uncaught exception:', error);
  logStream.end();
});

// run esbuild in watch mode using esbuildConfigs. Write to fs the bundle and metafile
async function startBundling(
  nodeConfigs: any,
  projectConfig: ITestconfigV2,
  entryPoints: string[]
) {
  console.log(`[NODE BUILDER] is now bundling:  ${testName}`);
  console.log(`[NODE BUILDER] Entry points: ${entryPoints.join(', ')}`);
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
      await processMetafile(projectConfig, buildResult.metafile, 'node', testName);
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
  try {
    const nodeConfigs = (await import(nodeConfigPath)).default;
    const projectConfigs = (await import(projectConfigPath)).default;
    await startBundling(nodeConfigs, projectConfigs, entryPoints);
    
    // In dev mode, keep the process running even if there's an error
    const isDevMode = process.env.MODE === 'dev' || process.argv.includes('dev');
    if (isDevMode) {
      // Don't exit on unhandled rejections
      process.on('unhandledRejection', (reason, promise) => {
        console.error('[NODE BUILDER] Unhandled Rejection at:', promise, 'reason:', reason);
      });
      
      process.on('uncaughtException', (error) => {
        console.error('[NODE BUILDER] Uncaught Exception:', error);
      });
      
      // Keep alive
      setInterval(() => {
        console.log('[NODE BUILDER] Still watching for changes...');
      }, 30000);
    }
  } catch (error) {
    console.error("NODE BUILDER: Error:", error);
    
    // In dev mode, don't exit immediately
    const isDevMode = process.env.MODE === 'dev' || process.argv.includes('dev');
    if (isDevMode) {
      console.error('[NODE BUILDER] Error occurred but keeping process alive in dev mode');
      // Keep the process alive to restart watching
      setInterval(() => {}, 1000);
    } else {
      process.exit(1);
    }
  }
}

main();
