import esbuild from "esbuild";
import puppeteer from "puppeteer-core";
import configer from "./esbuild";
import { processMetafile } from "../common";
import * as fs from "fs";
import * as path from "path";
import type { ITestconfigV2 } from "../../../Types";

// Setup logging to file
const projectConfigPath = process.argv[2];
const nodeConfigPath = process.argv[3];
const testName = process.argv[4];
const entryPoints = process.argv.slice(5);

const reportDir = path.join(process.cwd(), "testeranto", "reports", testName);
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}
const logFilePath = path.join(reportDir, "build.log");
const logStream = fs.createWriteStream(logFilePath, { flags: "a" });

// Override console.log to write to both console and log file
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

function logToFile(message: any, ...optionalParams: any[]) {
  const timestamp = new Date().toISOString();
  const formattedMessage =
    typeof message === "string" ? message : JSON.stringify(message, null, 2);
  const fullMessage = `[${timestamp}] ${formattedMessage}`;

  // Write to file
  logStream.write(fullMessage + "\n");
  if (optionalParams.length > 0) {
    optionalParams.forEach((param) => {
      const paramStr =
        typeof param === "string" ? param : JSON.stringify(param, null, 2);
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
  const message = args
    .map((arg) =>
      typeof arg === "string" ? arg : JSON.stringify(arg, null, 2),
    )
    .join(" ");
  logStream.write(`[${timestamp}] ERROR: ${message}\n`);
  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  const timestamp = new Date().toISOString();
  const message = args
    .map((arg) =>
      typeof arg === "string" ? arg : JSON.stringify(arg, null, 2),
    )
    .join(" ");
  logStream.write(`[${timestamp}] WARN: ${message}\n`);
  originalConsoleWarn.apply(console, args);
};

// Log startup information
console.log(`[WEB BUILDER] projectConfigPath:  ${projectConfigPath}`);
console.log(`[WEB BUILDER] nodeConfig:  ${nodeConfigPath}`);
console.log(`[WEB BUILDER] testName:  ${testName}`);
console.log(`[WEB BUILDER] Log file: ${logFilePath}`);
console.log(`[WEB BUILDER] CWD: ${process.cwd()}`);

const urlDomain = `http://webtests:8000/`;

// Handle process exit to close log stream
process.on("exit", () => {
  console.log("[WEB BUILDER] Process exiting");
  logStream.end();
});
process.on("SIGINT", () => {
  console.log("[WEB BUILDER] Received SIGINT");
  logStream.end();
  process.exit(0);
});
process.on("uncaughtException", (error) => {
  console.error("[WEB BUILDER] Uncaught exception:", error);
  logStream.end();
});

async function startBundling(
  webConfigs: any,
  projectConfig: ITestconfigV2,
  entryPoints: string[],
) {
  console.log(`[WEB BUILDER] is now bundling: ${testName}`);
  console.log(`[WEB BUILDER] Entry points: ${entryPoints.join(", ")}`);

  const w = configer(webConfigs, testName, projectConfig, entryPoints);

  // Check if we're in dev mode
  const isDevMode = process.env.MODE === "dev" || process.argv.includes("dev");

  if (isDevMode) {
    console.log(`[WEB BUILDER] Running in dev mode - starting watch mode`);

    // Create a build context for watch mode with onEnd plugin
    const ctx = await esbuild.context({
      ...w,
      plugins: [
        ...(w.plugins || []),
        {
          name: "testeranto-web-rebuild-notifier",
          setup(build) {
            build.onEnd(async (result) => {
              if (result.metafile) {
                await processMetafile(
                  projectConfig,
                  result.metafile,
                  "web",
                  testName,
                );
                console.log(`[WEB BUILDER] Metafile updated`);

                // Trigger test re-run by touching inputFiles.json
                // The inputFiles.json is at testeranto/bundles/{testName}/inputFiles.json
                const inputFilesPath = `testeranto/bundles/${testName}/inputFiles.json`;
                try {
                  if (fs.existsSync(inputFilesPath)) {
                    const stats = fs.statSync(inputFilesPath);
                    fs.utimesSync(inputFilesPath, stats.atime, new Date());
                    console.log(
                      `[WEB BUILDER] Triggered inputFiles.json update at ${inputFilesPath}`,
                    );
                  } else {
                    console.log(
                      `[WEB BUILDER] inputFiles.json doesn't exist yet at ${inputFilesPath}`,
                    );
                  }
                } catch (error) {
                  console.error(
                    `[WEB BUILDER] Failed to trigger inputFiles.json update:`,
                    error,
                  );
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
        "web",
        testName,
      );
    } else {
      console.warn("No metafile generated by esbuild");
    }

    // Start a dev server - bind to all interfaces
    let { hosts, port } = await ctx.serve({
      host: "0.0.0.0",
      servedir: "/workspace",
      onRequest: ({ method, path, remoteAddress, status, timeInMS }) => {
        console.log(
          `[esbuild] ${remoteAddress} - ${method} ${path} -> ${status} [${timeInMS}ms]`,
        );
      },
    });
    console.log(
      `[WEB BUILDER]: esbuild server listening on ${hosts}, port ${port}, ${process.cwd()}`,
    );

    // Start watching for changes
    await ctx.watch();

    console.log(
      `[WEB BUILDER] Watch mode active - waiting for file changes...`,
    );

    // Note: esbuild context doesn't have an 'on' method for rebuild events
    // We'll handle rebuilds through the onEnd plugin instead
    console.log(`[WEB BUILDER] Using onEnd plugin for rebuild detection`);

    // Keep the process alive
    process.on("SIGINT", async () => {
      console.log("WEB BUILDER: Shutting down...");
      await ctx.dispose();
      process.exit(0);
    });

    console.log("Chrome is a separate service, not launched in builder");
  } else {
    // Once mode - just build once
    const buildResult = await esbuild.build(w);
    if (buildResult.metafile) {
      await processMetafile(
        projectConfig,
        buildResult.metafile,
        "web",
        testName,
      );
    } else {
      console.warn("No metafile generated by esbuild");
    }
    console.log("WEB BUILDER: Metafiles have been generated");
  }
}

async function main() {
  try {
    const nodeConfigs = (await import(nodeConfigPath)).default;
    const projectConfigs = (await import(projectConfigPath)).default;
    await startBundling(nodeConfigs, projectConfigs, entryPoints);
  } catch (error) {
    console.error(
      "WEB BUILDER: Error importing config:",
      nodeConfigPath,
      error,
    );
    console.error(error);
    process.exit(1);
  }
}

main();
