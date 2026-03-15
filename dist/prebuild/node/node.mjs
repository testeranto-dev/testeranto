// src/server/runtimes/node/node.ts
import esbuild from "esbuild";

// src/server/runtimes/common.ts
import path from "path";
import fs from "fs";
import crypto from "crypto";
async function computeFilesHash(files) {
  const hash = crypto.createHash("md5");
  for (const file of files) {
    try {
      const stats = fs.statSync(file);
      hash.update(file);
      hash.update(stats.mtimeMs.toString());
      hash.update(stats.size.toString());
    } catch (error) {
      hash.update(file);
      hash.update("missing");
    }
  }
  return hash.digest("hex");
}
async function processMetafile(config, metafile, runtime, configKey) {
  if (!metafile || !metafile.outputs) {
    return;
  }
  const allTestsInfo = {};
  for (const [outputFile, outputInfo] of Object.entries(metafile.outputs)) {
    let collectFileDependencies2 = function(filePath) {
      if (collectedFiles.has(filePath)) {
        return;
      }
      collectedFiles.add(filePath);
      const fileInfo = metafile.inputs?.[filePath];
      if (fileInfo?.imports) {
        for (const importInfo of fileInfo.imports) {
          const importPath = importInfo.path;
          if (metafile.inputs?.[importPath]) {
            collectFileDependencies2(importPath);
          }
        }
      }
    };
    var collectFileDependencies = collectFileDependencies2;
    const outputInfoTyped = outputInfo;
    if (!outputInfoTyped.entryPoint) {
      console.log(`[${runtime} Builder] Skipping output without entryPoint: ${outputFile}`);
      continue;
    }
    const entryPoint = outputInfoTyped.entryPoint;
    const isTestFile = /\.(test|spec)\.(ts|js)$/.test(entryPoint);
    if (!isTestFile) {
      console.log(`[${runtime} Builder] Skipping non-test entryPoint: ${entryPoint}`);
      continue;
    }
    const outputInputs = outputInfoTyped.inputs || {};
    const collectedFiles = /* @__PURE__ */ new Set();
    for (const inputFile of Object.keys(outputInputs)) {
      collectFileDependencies2(inputFile);
    }
    const allInputFiles = Array.from(collectedFiles).map(
      (filePath) => path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath)
    );
    const workspaceRoot = "/workspace";
    const relativeFiles = allInputFiles.map((file) => {
      const absolutePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
      if (absolutePath.startsWith(workspaceRoot)) {
        return absolutePath.slice(workspaceRoot.length);
      }
      return path.relative(process.cwd(), absolutePath);
    }).filter(Boolean);
    const hash = await computeFilesHash(allInputFiles);
    allTestsInfo[entryPoint] = {
      hash,
      files: relativeFiles
    };
    console.log(`[${runtime} Builder] Processed ${entryPoint}: ${relativeFiles.length} files, hash: ${hash}`);
  }
  const bundlesDir = `testeranto/bundles/${configKey}`;
  if (!fs.existsSync(bundlesDir)) {
    fs.mkdirSync(bundlesDir, { recursive: true });
    console.log(`[${runtime} Builder] Created directory: ${bundlesDir}`);
  }
  const inputFilesPath = path.join(bundlesDir, "inputFiles.json");
  fs.writeFileSync(inputFilesPath, JSON.stringify(allTestsInfo, null, 2));
  console.log(`[${runtime} Builder] Wrote inputFiles.json for ${Object.keys(allTestsInfo).length} tests to ${inputFilesPath}`);
}

// src/esbuildConfigs/featuresPlugin.ts
import path2 from "path";
var featuresPlugin_default = {
  name: "feature-markdown",
  setup(build) {
    build.onResolve({ filter: /\.md$/ }, (args) => {
      if (args.resolveDir === "") return;
      return {
        path: path2.isAbsolute(args.path) ? args.path : path2.join(args.resolveDir, args.path),
        namespace: "feature-markdown"
      };
    });
    build.onLoad(
      { filter: /.*/, namespace: "feature-markdown" },
      async (args) => {
        return {
          contents: `file://${args.path}`,
          loader: "text"
          // contents: JSON.stringify({ path: args.path }),
          // loader: "json",
          // contents: JSON.stringify({
          //   // html: markdownHTML,
          //   raw: markdownContent,
          //   filename: args.path, //path.basename(args.path),
          // }),
          // loader: "json",
        };
      }
    );
  }
};

// src/esbuildConfigs/index.ts
import "esbuild";
var esbuildConfigs_default = (config) => {
  return {
    // packages: "external",
    target: "esnext",
    format: "esm",
    splitting: true,
    outExtension: { ".js": ".mjs" },
    outbase: ".",
    jsx: "transform",
    bundle: true,
    // minify: config.minify === true,
    write: true,
    loader: {
      ".js": "jsx",
      ".png": "binary",
      ".jpg": "binary"
    }
  };
};

// src/esbuildConfigs/inputFilesPlugin.ts
import fs2 from "fs";
var otherInputs = {};
var register = (entrypoint, sources) => {
  if (!otherInputs[entrypoint]) {
    otherInputs[entrypoint] = /* @__PURE__ */ new Set();
  }
  sources.forEach((s) => otherInputs[entrypoint].add(s));
};
var inputFilesPlugin_default = (platform, testName2) => {
  const f = `${testName2}`;
  return {
    register,
    inputFilesPluginFactory: {
      name: "metafileWriter",
      setup(build) {
        build.onEnd((result) => {
          fs2.writeFileSync(f, JSON.stringify(result, null, 2));
        });
      }
    }
  };
};

// src/esbuildConfigs/rebuildPlugin.ts
import fs3 from "fs";
var rebuildPlugin_default = (r) => {
  return {
    name: "rebuild-notify",
    setup: (build) => {
      build.onEnd((result) => {
        console.log(`${r} > build ended with ${result.errors.length} errors`);
        if (result.errors.length > 0) {
          fs3.writeFileSync(
            `./testeranto/reports${r}_build_errors`,
            JSON.stringify(result, null, 2)
          );
        }
      });
    }
  };
};

// src/server/runtimes/node/esbuildLoggingPlugin.ts
import * as fs4 from "fs";
import * as path3 from "path";
function testLoggingPlugin(options) {
  return {
    name: "testeranto-test-logging",
    setup(build) {
      const { configKey, runtime } = options;
      const testLogsDir = path3.join(
        process.cwd(),
        "testeranto",
        "reports",
        configKey,
        "test-logs"
      );
      if (!fs4.existsSync(testLogsDir)) {
        fs4.mkdirSync(testLogsDir, { recursive: true });
        console.log(`[${runtime} Builder] Created test logs directory: ${testLogsDir}`);
      }
      const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug
      };
      const allLogs = [];
      const overrideConsole = (type) => {
        return (...args) => {
          const timestamp = (/* @__PURE__ */ new Date()).toISOString();
          const message = args.map(
            (arg) => typeof arg === "string" ? arg : JSON.stringify(arg, null, 2)
          ).join(" ");
          allLogs.push({ type, message, timestamp });
          switch (type) {
            case "log":
              originalConsole.log(...args);
              break;
            case "error":
              originalConsole.error(...args);
              break;
            case "warn":
              originalConsole.warn(...args);
              break;
            case "info":
              originalConsole.info?.(...args);
              break;
            case "debug":
              originalConsole.debug?.(...args);
              break;
          }
        };
      };
      console.log = overrideConsole("log");
      console.error = overrideConsole("error");
      console.warn = overrideConsole("warn");
      if (console.info) console.info = overrideConsole("info");
      if (console.debug) console.debug = overrideConsole("debug");
      build.onEnd(async (result) => {
        console.log = originalConsole.log;
        console.error = originalConsole.error;
        console.warn = originalConsole.warn;
        if (originalConsole.info) console.info = originalConsole.info;
        if (originalConsole.debug) console.debug = originalConsole.debug;
        const reportsDir = path3.join(
          process.cwd(),
          "testeranto",
          "reports",
          configKey
        );
        if (!fs4.existsSync(reportsDir)) {
          fs4.mkdirSync(reportsDir, { recursive: true });
        }
        const generalLogPath = path3.join(reportsDir, "build.log");
        const generalLogStream = fs4.createWriteStream(generalLogPath, { flags: "a" });
        allLogs.forEach((log) => {
          generalLogStream.write(`[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}
`);
        });
        generalLogStream.end();
        if (result.metafile && result.metafile.outputs) {
          for (const [outputPath, outputInfo] of Object.entries(result.metafile.outputs)) {
            const entryPoint = outputInfo.entryPoint;
            if (entryPoint) {
              const testName2 = path3.basename(entryPoint, path3.extname(entryPoint));
              const testLogPath = path3.join(testLogsDir, `${testName2}.build.log`);
              const timestamp = (/* @__PURE__ */ new Date()).toISOString();
              const header = `[${timestamp}] Build log for test: ${entryPoint}
`;
              const buildInfo = `Output: ${outputPath}
Entry point: ${entryPoint}
`;
              const testLogStream = fs4.createWriteStream(testLogPath, { flags: "w" });
              testLogStream.write(header + buildInfo + "\n");
              allLogs.forEach((log) => {
                testLogStream.write(`[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}
`);
              });
              const footer = `
[${timestamp}] Build completed for: ${entryPoint}
`;
              testLogStream.write(footer);
              testLogStream.end();
              originalConsole.log(
                `[${runtime} Builder] Created build log for ${entryPoint} at ${testLogPath}`
              );
            }
          }
        } else {
          const genericLogPath = path3.join(testLogsDir, `generic.build.log`);
          const genericStream = fs4.createWriteStream(genericLogPath, { flags: "w" });
          allLogs.forEach((log) => {
            genericStream.write(`[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}
`);
          });
          genericStream.end();
        }
      });
      build.onStart(() => {
        allLogs.length = 0;
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        allLogs.push({ type: "info", message: `Build started for ${configKey}`, timestamp });
      });
    }
  };
}

// src/server/runtimes/node/esbuild.ts
var esbuild_default = (nodeConfig, testName2, projectConfig, entryPoints2) => {
  const { inputFilesPluginFactory, register: register2 } = inputFilesPlugin_default(
    "node",
    testName2
  );
  return {
    ...esbuildConfigs_default(nodeConfig),
    outdir: `testeranto/bundles/${testName2}`,
    outbase: ".",
    // Preserve directory structure relative to outdir
    metafile: true,
    supported: {
      "dynamic-import": true
    },
    define: {
      "process.env.FLUENTFFMPEG_COV": "0",
      ENV: `node`
    },
    bundle: true,
    format: "esm",
    absWorkingDir: process.cwd(),
    platform: "node",
    packages: "external",
    entryPoints: entryPoints2,
    plugins: [
      featuresPlugin_default,
      inputFilesPluginFactory,
      rebuildPlugin_default("node"),
      testLoggingPlugin({ configKey: testName2, runtime: "node" }),
      ...nodeConfig.plugins?.map((p) => p(register2, entryPoints2)) || []
    ]
  };
};

// src/server/runtimes/node/node.ts
import * as fs5 from "fs";
import * as path4 from "path";
var projectConfigPath = process.argv[2];
var nodeConfigPath = process.argv[3];
var testName = process.argv[4];
var entryPoints = process.argv.slice(5);
var reportDir = path4.join(process.cwd(), "testeranto", "reports", testName);
if (!fs5.existsSync(reportDir)) {
  fs5.mkdirSync(reportDir, { recursive: true });
  console.log(`[NODE BUILDER] Created report directory: ${reportDir}`);
}
var logFilePath = path4.join(reportDir, "build.log");
var logStream = fs5.createWriteStream(logFilePath, { flags: "a" });
var originalConsoleLog = console.log;
var originalConsoleError = console.error;
var originalConsoleWarn = console.warn;
function logToFile(message, ...optionalParams) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const formattedMessage = typeof message === "string" ? message : JSON.stringify(message, null, 2);
  const fullMessage = `[${timestamp}] ${formattedMessage}`;
  logStream.write(fullMessage + "\n");
  if (optionalParams.length > 0) {
    optionalParams.forEach((param) => {
      const paramStr = typeof param === "string" ? param : JSON.stringify(param, null, 2);
      logStream.write(`  ${paramStr}
`);
    });
  }
  originalConsoleLog.apply(console, [message, ...optionalParams]);
}
console.log = (...args) => {
  logToFile(...args);
};
console.error = (...args) => {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const message = args.map((arg) => typeof arg === "string" ? arg : JSON.stringify(arg, null, 2)).join(" ");
  logStream.write(`[${timestamp}] ERROR: ${message}
`);
  originalConsoleError.apply(console, args);
};
console.warn = (...args) => {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const message = args.map((arg) => typeof arg === "string" ? arg : JSON.stringify(arg, null, 2)).join(" ");
  logStream.write(`[${timestamp}] WARN: ${message}
`);
  originalConsoleWarn.apply(console, args);
};
console.log(`[NODE BUILDER] projectConfigPath:  ${projectConfigPath}`);
console.log(`[NODE BUILDER] nodeConfig:  ${nodeConfigPath}`);
console.log(`[NODE BUILDER] testName:  ${testName}`);
console.log(`[NODE BUILDER] Log file: ${logFilePath}`);
process.on("exit", () => {
  console.log("[NODE BUILDER] Process exiting");
  logStream.end();
});
process.on("SIGINT", () => {
  console.log("[NODE BUILDER] Received SIGINT");
  logStream.end();
  process.exit(0);
});
process.on("uncaughtException", (error) => {
  console.error("[NODE BUILDER] Uncaught exception:", error);
  logStream.end();
});
async function startBundling(nodeConfigs, projectConfig, entryPoints2) {
  console.log(`[NODE BUILDER] is now bundling:  ${testName}`);
  console.log(`[NODE BUILDER] Entry points: ${entryPoints2.join(", ")}`);
  const n = esbuild_default(nodeConfigs, testName, projectConfig, entryPoints2);
  const isDevMode = process.env.MODE === "dev" || process.argv.includes("dev");
  if (isDevMode) {
    console.log(`[NODE BUILDER] Running in dev mode - starting watch mode`);
    const ctx = await esbuild.context({
      ...n,
      plugins: [
        ...n.plugins || [],
        {
          name: "testeranto-rebuild-notifier",
          setup(build) {
            build.onEnd(async (result) => {
              if (result.metafile) {
                await processMetafile(projectConfig, result.metafile, "node", testName);
                console.log(`[NODE BUILDER] Metafile updated`);
                const inputFilesPath = `testeranto/bundles/${testName}/inputFiles.json`;
                try {
                  const fs6 = await import("fs");
                  if (fs6.existsSync(inputFilesPath)) {
                    const stats = fs6.statSync(inputFilesPath);
                    fs6.utimesSync(inputFilesPath, stats.atime, /* @__PURE__ */ new Date());
                    console.log(`[NODE BUILDER] Triggered inputFiles.json update`);
                  } else {
                    console.log(`[NODE BUILDER] inputFiles.json doesn't exist yet at ${inputFilesPath}`);
                  }
                } catch (error) {
                  console.error(`[NODE BUILDER] Failed to trigger inputFiles.json update:`, error);
                }
              }
            });
          }
        }
      ]
    });
    const buildResult = await ctx.rebuild();
    if (buildResult.metafile) {
      await processMetafile(projectConfig, buildResult.metafile, "node", testName);
    } else {
      console.warn("No metafile generated by esbuild");
    }
    await ctx.watch();
    console.log(`[NODE BUILDER] Watch mode active - waiting for file changes...`);
    process.on("SIGINT", async () => {
      console.log("[NODE BUILDER] Shutting down...");
      await ctx.dispose();
      process.exit(0);
    });
    console.log(`[NODE BUILDER] Using onEnd plugin for rebuild detection`);
    console.log(`[NODE BUILDER] Keeping process alive for continuous watching...`);
    const keepAliveInterval = setInterval(() => {
    }, 6e4);
    process.on("SIGINT", () => {
      clearInterval(keepAliveInterval);
    });
  } else {
    const buildResult = await esbuild.build(n);
    if (buildResult.metafile) {
      await processMetafile(projectConfig, buildResult.metafile, "node", testName);
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
    const isDevMode = process.env.MODE === "dev" || process.argv.includes("dev");
    if (isDevMode) {
      process.on("unhandledRejection", (reason, promise) => {
        console.error("[NODE BUILDER] Unhandled Rejection at:", promise, "reason:", reason);
      });
      process.on("uncaughtException", (error) => {
        console.error("[NODE BUILDER] Uncaught Exception:", error);
      });
      setInterval(() => {
        console.log("[NODE BUILDER] Still watching for changes...");
      }, 3e4);
    }
  } catch (error) {
    console.error("NODE BUILDER: Error:", error);
    const isDevMode = process.env.MODE === "dev" || process.argv.includes("dev");
    if (isDevMode) {
      console.error("[NODE BUILDER] Error occurred but keeping process alive in dev mode");
      setInterval(() => {
      }, 1e3);
    } else {
      process.exit(1);
    }
  }
}
main();
