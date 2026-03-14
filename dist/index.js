// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// node_modules/ansi-colors/symbols.js
var require_symbols = __commonJS((exports, module) => {
  var isHyper = typeof process !== "undefined" && false;
  var isWindows = typeof process !== "undefined" && process.platform === "win32";
  var isLinux = typeof process !== "undefined" && process.platform === "linux";
  var common = {
    ballotDisabled: "\u2612",
    ballotOff: "\u2610",
    ballotOn: "\u2611",
    bullet: "\u2022",
    bulletWhite: "\u25E6",
    fullBlock: "\u2588",
    heart: "\u2764",
    identicalTo: "\u2261",
    line: "\u2500",
    mark: "\u203B",
    middot: "\xB7",
    minus: "\uFF0D",
    multiplication: "\xD7",
    obelus: "\xF7",
    pencilDownRight: "\u270E",
    pencilRight: "\u270F",
    pencilUpRight: "\u2710",
    percent: "%",
    pilcrow2: "\u2761",
    pilcrow: "\xB6",
    plusMinus: "\xB1",
    question: "?",
    section: "\xA7",
    starsOff: "\u2606",
    starsOn: "\u2605",
    upDownArrow: "\u2195"
  };
  var windows = Object.assign({}, common, {
    check: "\u221A",
    cross: "\xD7",
    ellipsisLarge: "...",
    ellipsis: "...",
    info: "i",
    questionSmall: "?",
    pointer: ">",
    pointerSmall: "\xBB",
    radioOff: "( )",
    radioOn: "(*)",
    warning: "\u203C"
  });
  var other = Object.assign({}, common, {
    ballotCross: "\u2718",
    check: "\u2714",
    cross: "\u2716",
    ellipsisLarge: "\u22EF",
    ellipsis: "\u2026",
    info: "\u2139",
    questionFull: "\uFF1F",
    questionSmall: "\uFE56",
    pointer: isLinux ? "\u25B8" : "\u276F",
    pointerSmall: isLinux ? "\u2023" : "\u203A",
    radioOff: "\u25EF",
    radioOn: "\u25C9",
    warning: "\u26A0"
  });
  module.exports = isWindows && !isHyper ? windows : other;
  Reflect.defineProperty(module.exports, "common", { enumerable: false, value: common });
  Reflect.defineProperty(module.exports, "windows", { enumerable: false, value: windows });
  Reflect.defineProperty(module.exports, "other", { enumerable: false, value: other });
});

// node_modules/ansi-colors/index.js
var require_ansi_colors = __commonJS((exports, module) => {
  var isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
  var ANSI_REGEX = /[\u001b\u009b][[\]#;?()]*(?:(?:(?:[^\W_]*;?[^\W_]*)\u0007)|(?:(?:[0-9]{1,4}(;[0-9]{0,4})*)?[~0-9=<>cf-nqrtyA-PRZ]))/g;
  var hasColor = () => {
    if (typeof process !== "undefined") {
      return process.env.FORCE_COLOR !== "0";
    }
    return false;
  };
  var create = () => {
    const colors = {
      enabled: hasColor(),
      visible: true,
      styles: {},
      keys: {}
    };
    const ansi = (style2) => {
      let open = style2.open = `\x1B[${style2.codes[0]}m`;
      let close = style2.close = `\x1B[${style2.codes[1]}m`;
      let regex = style2.regex = new RegExp(`\\u001b\\[${style2.codes[1]}m`, "g");
      style2.wrap = (input, newline) => {
        if (input.includes(close))
          input = input.replace(regex, close + open);
        let output = open + input + close;
        return newline ? output.replace(/\r*\n/g, `${close}\$&${open}`) : output;
      };
      return style2;
    };
    const wrap = (style2, input, newline) => {
      return typeof style2 === "function" ? style2(input) : style2.wrap(input, newline);
    };
    const style = (input, stack) => {
      if (input === "" || input == null)
        return "";
      if (colors.enabled === false)
        return input;
      if (colors.visible === false)
        return "";
      let str = "" + input;
      let nl = str.includes("\n");
      let n = stack.length;
      if (n > 0 && stack.includes("unstyle")) {
        stack = [...new Set(["unstyle", ...stack])].reverse();
      }
      while (n-- > 0)
        str = wrap(colors.styles[stack[n]], str, nl);
      return str;
    };
    const define = (name, codes, type) => {
      colors.styles[name] = ansi({ name, codes });
      let keys = colors.keys[type] || (colors.keys[type] = []);
      keys.push(name);
      Reflect.defineProperty(colors, name, {
        configurable: true,
        enumerable: true,
        set(value) {
          colors.alias(name, value);
        },
        get() {
          let color = (input) => style(input, color.stack);
          Reflect.setPrototypeOf(color, colors);
          color.stack = this.stack ? this.stack.concat(name) : [name];
          return color;
        }
      });
    };
    define("reset", [0, 0], "modifier");
    define("bold", [1, 22], "modifier");
    define("dim", [2, 22], "modifier");
    define("italic", [3, 23], "modifier");
    define("underline", [4, 24], "modifier");
    define("inverse", [7, 27], "modifier");
    define("hidden", [8, 28], "modifier");
    define("strikethrough", [9, 29], "modifier");
    define("black", [30, 39], "color");
    define("red", [31, 39], "color");
    define("green", [32, 39], "color");
    define("yellow", [33, 39], "color");
    define("blue", [34, 39], "color");
    define("magenta", [35, 39], "color");
    define("cyan", [36, 39], "color");
    define("white", [37, 39], "color");
    define("gray", [90, 39], "color");
    define("grey", [90, 39], "color");
    define("bgBlack", [40, 49], "bg");
    define("bgRed", [41, 49], "bg");
    define("bgGreen", [42, 49], "bg");
    define("bgYellow", [43, 49], "bg");
    define("bgBlue", [44, 49], "bg");
    define("bgMagenta", [45, 49], "bg");
    define("bgCyan", [46, 49], "bg");
    define("bgWhite", [47, 49], "bg");
    define("blackBright", [90, 39], "bright");
    define("redBright", [91, 39], "bright");
    define("greenBright", [92, 39], "bright");
    define("yellowBright", [93, 39], "bright");
    define("blueBright", [94, 39], "bright");
    define("magentaBright", [95, 39], "bright");
    define("cyanBright", [96, 39], "bright");
    define("whiteBright", [97, 39], "bright");
    define("bgBlackBright", [100, 49], "bgBright");
    define("bgRedBright", [101, 49], "bgBright");
    define("bgGreenBright", [102, 49], "bgBright");
    define("bgYellowBright", [103, 49], "bgBright");
    define("bgBlueBright", [104, 49], "bgBright");
    define("bgMagentaBright", [105, 49], "bgBright");
    define("bgCyanBright", [106, 49], "bgBright");
    define("bgWhiteBright", [107, 49], "bgBright");
    colors.ansiRegex = ANSI_REGEX;
    colors.hasColor = colors.hasAnsi = (str) => {
      colors.ansiRegex.lastIndex = 0;
      return typeof str === "string" && str !== "" && colors.ansiRegex.test(str);
    };
    colors.alias = (name, color) => {
      let fn = typeof color === "string" ? colors[color] : color;
      if (typeof fn !== "function") {
        throw new TypeError("Expected alias to be the name of an existing color (string) or a function");
      }
      if (!fn.stack) {
        Reflect.defineProperty(fn, "name", { value: name });
        colors.styles[name] = fn;
        fn.stack = [name];
      }
      Reflect.defineProperty(colors, name, {
        configurable: true,
        enumerable: true,
        set(value) {
          colors.alias(name, value);
        },
        get() {
          let color2 = (input) => style(input, color2.stack);
          Reflect.setPrototypeOf(color2, colors);
          color2.stack = this.stack ? this.stack.concat(fn.stack) : fn.stack;
          return color2;
        }
      });
    };
    colors.theme = (custom) => {
      if (!isObject(custom))
        throw new TypeError("Expected theme to be an object");
      for (let name of Object.keys(custom)) {
        colors.alias(name, custom[name]);
      }
      return colors;
    };
    colors.alias("unstyle", (str) => {
      if (typeof str === "string" && str !== "") {
        colors.ansiRegex.lastIndex = 0;
        return str.replace(colors.ansiRegex, "");
      }
      return "";
    });
    colors.alias("noop", (str) => str);
    colors.none = colors.clear = colors.noop;
    colors.stripColor = colors.unstyle;
    colors.symbols = require_symbols();
    colors.define = define;
    return colors;
  };
  module.exports = create();
  module.exports.create = create;
});

// src/server/serverClasses/Server.ts
import fs4 from "fs";
import readline from "readline";

// src/server/serverClasses/Server_Docker.ts
var import_ansi_colors = __toESM(require_ansi_colors(), 1);
import { execSync, spawn } from "child_process";
import fs3 from "fs";
import path3 from "path";

// src/runtimes.ts
var RUN_TIMES = ["node", "web", "python", "golang", "java", "rust", "ruby"];

// src/server/buildkit/BuildKit_Utils.ts
import { exec } from "child_process";
import { promisify } from "util";
var execAsync = promisify(exec);

class BuildKitBuilder {
  static async buildImage(options) {
    const startTime = Date.now();
    const buildArgs = options.buildArgs ? Object.entries(options.buildArgs).map(([key, value]) => `--build-arg ${key}=${value}`).join(" ") : "";
    const targetStage = options.targetStage ? `--target ${options.targetStage}` : "";
    let imageName;
    if (options.runtime === "aider") {
      imageName = "testeranto-aider:latest";
    } else {
      imageName = `testeranto-${options.runtime}-${options.configKey}:latest`;
    }
    const buildCommand = `DOCKER_BUILDKIT=1 docker build       ${buildArgs}       ${targetStage}       -f ${options.dockerfilePath}       -t ${imageName}       ${options.buildContext}`;
    try {
      console.log(`[BuildKit] Building ${options.runtime} image for ${options.configKey}`);
      console.log(`[BuildKit] Command: ${buildCommand}`);
      const { stdout, stderr } = await execAsync(buildCommand, {
        maxBuffer: 10 * 1024 * 1024
      });
      const duration = Date.now() - startTime;
      const imageIdMatch = stdout.match(/Successfully built ([a-f0-9]+)/) || stderr.match(/Successfully built ([a-f0-9]+)/);
      const imageId = imageIdMatch ? imageIdMatch[1] : undefined;
      return {
        success: true,
        imageId,
        logs: stdout + stderr,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error.message,
        logs: error.stderr || error.stdout || error.message,
        duration
      };
    }
  }
  static createBuildKitService(runtime, configKey, testName, command) {
    const serviceName = `${configKey}-${testName}-buildkit`;
    const baseService = {
      image: `testeranto-${runtime}-${configKey}:latest`,
      container_name: serviceName,
      environment: {
        NODE_ENV: "production",
        ENV: runtime
      },
      working_dir: "/workspace",
      volumes: [
        `${process.cwd()}/src:/workspace/src`,
        `${process.cwd()}/dist:/workspace/dist`,
        `${process.cwd()}/testeranto:/workspace/testeranto`
      ],
      command,
      networks: ["allTests_network"]
    };
    if (runtime === "web") {
      baseService.expose = ["9223", "8000"];
      baseService.environment = {
        ...baseService.environment,
        PUPPETEER_EXECUTABLE_PATH: "/usr/bin/chromium-browser",
        PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: "true"
      };
    }
    return {
      [serviceName]: baseService
    };
  }
  static async checkBuildKitAvailable() {
    try {
      const { stdout } = await execAsync("docker buildx version");
      return stdout.includes("buildx") || stdout.includes("BuildKit");
    } catch (error) {
      console.error("[BuildKit] BuildKit not available");
      return false;
    }
  }
}

// src/server/runtimes/node/docker.ts
import { join } from "path";

// dist/prebuild/node/node.mjs
var node_default = "// src/server/runtimes/node/node.ts\nimport esbuild from \"esbuild\";\n\n// src/server/runtimes/common.ts\nimport path from \"path\";\nimport fs from \"fs\";\nasync function processMetafile(config, metafile, runtime, configKey) {\n  for (const [outputFile, outputInfo] of Object.entries(metafile.outputs)) {\n    let collectFileDependencies2 = function(filePath) {\n      if (collectedFiles.has(filePath)) {\n        return;\n      }\n      collectedFiles.add(filePath);\n      const fileInfo = metafile.inputs?.[filePath];\n      if (fileInfo?.imports) {\n        for (const importInfo of fileInfo.imports) {\n          const importPath = importInfo.path;\n          if (metafile.inputs?.[importPath]) {\n            collectFileDependencies2(importPath);\n          }\n        }\n      }\n    };\n    var collectFileDependencies = collectFileDependencies2;\n    const outputInfoTyped = outputInfo;\n    if (!outputInfoTyped.entryPoint) {\n      console.log(`[${runtime} Builder] Skipping output without entryPoint: ${outputFile}`);\n      continue;\n    }\n    const entryPoint = outputInfoTyped.entryPoint;\n    const isTestFile = /\\.(test|spec)\\.(ts|js)$/.test(entryPoint);\n    if (!isTestFile) {\n      console.log(`[${runtime} Builder] Skipping non-test entryPoint: ${entryPoint}`);\n      continue;\n    }\n    const outputInputs = outputInfoTyped.inputs || {};\n    const collectedFiles = /* @__PURE__ */ new Set();\n    for (const inputFile of Object.keys(outputInputs)) {\n      collectFileDependencies2(inputFile);\n    }\n    const allInputFiles = Array.from(collectedFiles).map(\n      (filePath) => path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath)\n    );\n    const workspaceRoot = \"/workspace\";\n    const relativeFiles = allInputFiles.map((file) => {\n      const absolutePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);\n      if (absolutePath.startsWith(workspaceRoot)) {\n        return absolutePath.slice(workspaceRoot.length);\n      }\n      return path.relative(process.cwd(), absolutePath);\n    }).filter(Boolean);\n    const outputBaseName = entryPoint.split(\".\").slice(0, -1).join(\".\");\n    const inputFilesPath = `testeranto/bundles/${configKey}/${outputBaseName}.mjs-inputFiles.json`;\n    fs.writeFileSync(inputFilesPath, JSON.stringify(relativeFiles, null, 2));\n    console.log(`[${runtime} Builder] Wrote ${relativeFiles.length} input files to ${inputFilesPath}`);\n  }\n}\n\n// src/esbuildConfigs/featuresPlugin.ts\nimport path2 from \"path\";\nvar featuresPlugin_default = {\n  name: \"feature-markdown\",\n  setup(build) {\n    build.onResolve({ filter: /\\.md$/ }, (args) => {\n      if (args.resolveDir === \"\") return;\n      return {\n        path: path2.isAbsolute(args.path) ? args.path : path2.join(args.resolveDir, args.path),\n        namespace: \"feature-markdown\"\n      };\n    });\n    build.onLoad(\n      { filter: /.*/, namespace: \"feature-markdown\" },\n      async (args) => {\n        return {\n          contents: `file://${args.path}`,\n          loader: \"text\"\n          // contents: JSON.stringify({ path: args.path }),\n          // loader: \"json\",\n          // contents: JSON.stringify({\n          //   // html: markdownHTML,\n          //   raw: markdownContent,\n          //   filename: args.path, //path.basename(args.path),\n          // }),\n          // loader: \"json\",\n        };\n      }\n    );\n  }\n};\n\n// src/esbuildConfigs/index.ts\nimport \"esbuild\";\nvar esbuildConfigs_default = (config) => {\n  return {\n    // packages: \"external\",\n    target: \"esnext\",\n    format: \"esm\",\n    splitting: true,\n    outExtension: { \".js\": \".mjs\" },\n    outbase: \".\",\n    jsx: \"transform\",\n    bundle: true,\n    // minify: config.minify === true,\n    write: true,\n    loader: {\n      \".js\": \"jsx\",\n      \".png\": \"binary\",\n      \".jpg\": \"binary\"\n    }\n  };\n};\n\n// src/esbuildConfigs/inputFilesPlugin.ts\nimport fs2 from \"fs\";\nvar otherInputs = {};\nvar register = (entrypoint, sources) => {\n  if (!otherInputs[entrypoint]) {\n    otherInputs[entrypoint] = /* @__PURE__ */ new Set();\n  }\n  sources.forEach((s) => otherInputs[entrypoint].add(s));\n};\nvar inputFilesPlugin_default = (platform, testName2) => {\n  const f = `${testName2}`;\n  return {\n    register,\n    inputFilesPluginFactory: {\n      name: \"metafileWriter\",\n      setup(build) {\n        build.onEnd((result) => {\n          fs2.writeFileSync(f, JSON.stringify(result, null, 2));\n        });\n      }\n    }\n  };\n};\n\n// src/esbuildConfigs/rebuildPlugin.ts\nimport fs3 from \"fs\";\nvar rebuildPlugin_default = (r) => {\n  return {\n    name: \"rebuild-notify\",\n    setup: (build) => {\n      build.onEnd((result) => {\n        console.log(`${r} > build ended with ${result.errors.length} errors`);\n        if (result.errors.length > 0) {\n          fs3.writeFileSync(\n            `./testeranto/reports${r}_build_errors`,\n            JSON.stringify(result, null, 2)\n          );\n        }\n      });\n    }\n  };\n};\n\n// src/server/runtimes/node/esbuild.ts\nvar esbuild_default = (nodeConfig, testName2, projectConfig) => {\n  const entryPoints = projectConfig.runtimes[testName2].tests;\n  const { inputFilesPluginFactory, register: register2 } = inputFilesPlugin_default(\n    \"node\",\n    testName2\n  );\n  return {\n    ...esbuildConfigs_default(nodeConfig),\n    outdir: `testeranto/bundles/${testName2}`,\n    outbase: \".\",\n    // Preserve directory structure relative to outdir\n    metafile: true,\n    supported: {\n      \"dynamic-import\": true\n    },\n    define: {\n      \"process.env.FLUENTFFMPEG_COV\": \"0\",\n      ENV: `node`\n    },\n    bundle: true,\n    format: \"esm\",\n    absWorkingDir: process.cwd(),\n    platform: \"node\",\n    packages: \"external\",\n    entryPoints,\n    plugins: [\n      featuresPlugin_default,\n      inputFilesPluginFactory,\n      rebuildPlugin_default(\"node\"),\n      ...nodeConfig.plugins?.map((p) => p(register2, entryPoints)) || []\n    ]\n  };\n};\n\n// src/server/runtimes/node/node.ts\nvar projectConfigPath = process.argv[2];\nvar nodeConfigPath = process.argv[3];\nvar testName = process.argv[4];\nconsole.log(`[NODE BUILDER] projectConfigPath:  ${projectConfigPath}`);\nconsole.log(`[NODE BUILDER] nodeConfig:  ${nodeConfigPath}`);\nconsole.log(`[NODE BUILDER] testName:  ${testName}`);\nasync function startBundling(nodeConfigs, projectConfig) {\n  console.log(`[NODE BUILDER] is now bundling:  ${testName}`);\n  const n = esbuild_default(nodeConfigs, testName, projectConfig);\n  const isDevMode = process.env.MODE === \"dev\" || process.argv.includes(\"dev\");\n  if (isDevMode) {\n    console.log(`[NODE BUILDER] Running in dev mode - starting watch mode`);\n    const ctx = await esbuild.context(n);\n    const buildResult = await ctx.rebuild();\n    if (buildResult.metafile) {\n      await processMetafile(projectConfig, buildResult.metafile, \"node\", testName);\n    } else {\n      console.warn(\"No metafile generated by esbuild\");\n    }\n    await ctx.watch();\n    console.log(`[NODE BUILDER] Watch mode active - waiting for file changes...`);\n    process.on(\"SIGINT\", async () => {\n      console.log(\"[NODE BUILDER] Shutting down...\");\n      await ctx.dispose();\n      process.exit(0);\n    });\n    ctx.on(\"rebuild\", async (result) => {\n      console.log(`[NODE BUILDER] Rebuilding due to file changes...`);\n      if (result.metafile) {\n        await processMetafile(projectConfig, result.metafile, \"node\", testName);\n        console.log(`[NODE BUILDER] Metafile updated`);\n        const outputBaseName = n.entryPoints?.[0]?.split(\".\").slice(0, -1).join(\".\") || testName;\n        const inputFilesPath = `testeranto/bundles/${testName}/${outputBaseName}.mjs-inputFiles.json`;\n        try {\n          const fs5 = await import(\"fs\");\n          const stats = fs5.statSync(inputFilesPath);\n          fs5.utimesSync(inputFilesPath, stats.atime, /* @__PURE__ */ new Date());\n          console.log(`[NODE BUILDER] Triggered inputFiles.json update`);\n        } catch (error) {\n          console.error(`[NODE BUILDER] Failed to trigger inputFiles.json update:`, error);\n        }\n      }\n    });\n    const fs4 = await import(\"fs\");\n    const path3 = await import(\"path\");\n    const srcDir = path3.join(process.cwd(), \"src\");\n    if (fs4.existsSync(srcDir)) {\n      console.log(`[NODE BUILDER] Setting up additional file watcher for ${srcDir}`);\n      const watcher = fs4.watch(srcDir, { recursive: true }, (eventType, filename) => {\n        if (filename && (filename.endsWith(\".ts\") || filename.endsWith(\".js\") || filename.endsWith(\".tsx\") || filename.endsWith(\".jsx\"))) {\n          console.log(`[NODE BUILDER] File change detected: ${eventType} ${filename}`);\n          ctx.rebuild().then((result) => {\n            if (result.metafile) {\n              processMetafile(projectConfig, result.metafile, \"node\", testName).then(() => {\n                console.log(`[NODE BUILDER] Manual rebuild completed`);\n                const outputBaseName = n.entryPoints?.[0]?.split(\".\").slice(0, -1).join(\".\") || testName;\n                const inputFilesPath = `testeranto/bundles/${testName}/${outputBaseName}.mjs-inputFiles.json`;\n                try {\n                  const stats = fs4.statSync(inputFilesPath);\n                  fs4.utimesSync(inputFilesPath, stats.atime, /* @__PURE__ */ new Date());\n                  console.log(`[NODE BUILDER] Triggered inputFiles.json update from manual rebuild`);\n                } catch (error) {\n                  console.error(`[NODE BUILDER] Failed to trigger inputFiles.json update:`, error);\n                }\n              });\n            }\n          }).catch((error) => {\n            console.error(`[NODE BUILDER] Manual rebuild failed:`, error);\n          });\n        }\n      });\n      process.on(\"SIGINT\", () => {\n        watcher.close();\n      });\n    }\n    console.log(`[NODE BUILDER] Keeping process alive for continuous watching...`);\n    const keepAliveInterval = setInterval(() => {\n    }, 6e4);\n    process.on(\"SIGINT\", () => {\n      clearInterval(keepAliveInterval);\n    });\n  } else {\n    const buildResult = await esbuild.build(n);\n    if (buildResult.metafile) {\n      await processMetafile(projectConfig, buildResult.metafile, \"node\", testName);\n    } else {\n      console.warn(\"No metafile generated by esbuild\");\n    }\n  }\n}\nasync function main() {\n  try {\n    const nodeConfigs = (await import(nodeConfigPath)).default;\n    const projectConfigs = (await import(projectConfigPath)).default;\n    await startBundling(nodeConfigs, projectConfigs);\n    const isDevMode = process.env.MODE === \"dev\" || process.argv.includes(\"dev\");\n    if (isDevMode) {\n      process.on(\"unhandledRejection\", (reason, promise) => {\n        console.error(\"[NODE BUILDER] Unhandled Rejection at:\", promise, \"reason:\", reason);\n      });\n      process.on(\"uncaughtException\", (error) => {\n        console.error(\"[NODE BUILDER] Uncaught Exception:\", error);\n      });\n      setInterval(() => {\n        console.log(\"[NODE BUILDER] Still watching for changes...\");\n      }, 3e4);\n    }\n  } catch (error) {\n    console.error(\"NODE BUILDER: Error:\", error);\n    const isDevMode = process.env.MODE === \"dev\" || process.argv.includes(\"dev\");\n    if (isDevMode) {\n      console.error(\"[NODE BUILDER] Error occurred but keeping process alive in dev mode\");\n      setInterval(() => {\n      }, 1e3);\n    } else {\n      process.exit(1);\n    }\n  }\n}\nmain();\n";

// src/server/runtimes/node/docker.ts
var nodeScriptPath = join(process.cwd(), "testeranto", "node_runtime.ts");
await Bun.write(nodeScriptPath, node_default);
var nodeDockerComposeFile = (config, container_name, projectConfigPath, nodeConfigPath, testName) => {
  const tests = config.runtimes[testName]?.tests || [];
  const service = {
    build: {
      context: process.cwd(),
      dockerfile: config.runtimes[container_name]?.dockerfile || "testeranto/runtimes/node/node.Dockerfile"
    },
    container_name,
    environment: {
      NODE_ENV: "production",
      ENV: "node"
    },
    working_dir: "/workspace",
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/testeranto:/workspace/testeranto`
    ],
    command: nodeBuildCommand(projectConfigPath, nodeConfigPath, testName, tests),
    networks: ["allTests_network"]
  };
  return service;
};
var nodeBuildCommand = (projectConfigPath, nodeConfigPath, testName, tests) => {
  return `yarn tsx /workspace/testeranto/node_runtime.ts /workspace/${projectConfigPath} /workspace/${nodeConfigPath} ${testName}`;
};
var nodeBddCommand = (fpath, nodeConfigPath, configKey) => {
  const jsonStr = JSON.stringify({ ports: [1111], fs: "testeranto/reports/node" });
  return `yarn tsx testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
};
var nodeBuildKitBuild = async (config, configKey) => {
  const runtimeConfig = config.runtimes[configKey];
  if (!runtimeConfig) {
    throw new Error(`Configuration not found for ${configKey}`);
  }
  const buildKitConfig = runtimeConfig.buildKitOptions || {};
  const buildKitOptions = {
    runtime: "node",
    configKey,
    dockerfilePath: runtimeConfig.dockerfile,
    buildContext: process.cwd(),
    cacheMounts: ["/root/.npm", "/usr/local/share/.cache/yarn"],
    targetStage: buildKitConfig.targetStage,
    buildArgs: {
      NODE_ENV: "production",
      ...buildKitConfig.buildArgs || {}
    }
  };
  console.log(`[Node BuildKit] Building image for ${configKey}...`);
  const result = await BuildKitBuilder.buildImage(buildKitOptions);
  if (result.success) {
    console.log(`[Node BuildKit] Successfully built image in ${result.duration}ms`);
  } else {
    console.error(`[Node BuildKit] Build failed: ${result.error}`);
    throw new Error(`BuildKit build failed: ${result.error}`);
  }
};

// src/server/runtimes/web/docker.ts
import { join as join2 } from "path";

// dist/prebuild/web/web.mjs
var web_default = "// src/server/runtimes/web/web.ts\nimport esbuild from \"esbuild\";\nimport \"puppeteer-core\";\n\n// src/esbuildConfigs/featuresPlugin.ts\nimport path from \"path\";\nvar featuresPlugin_default = {\n  name: \"feature-markdown\",\n  setup(build) {\n    build.onResolve({ filter: /\\.md$/ }, (args) => {\n      if (args.resolveDir === \"\") return;\n      return {\n        path: path.isAbsolute(args.path) ? args.path : path.join(args.resolveDir, args.path),\n        namespace: \"feature-markdown\"\n      };\n    });\n    build.onLoad(\n      { filter: /.*/, namespace: \"feature-markdown\" },\n      async (args) => {\n        return {\n          contents: `file://${args.path}`,\n          loader: \"text\"\n          // contents: JSON.stringify({ path: args.path }),\n          // loader: \"json\",\n          // contents: JSON.stringify({\n          //   // html: markdownHTML,\n          //   raw: markdownContent,\n          //   filename: args.path, //path.basename(args.path),\n          // }),\n          // loader: \"json\",\n        };\n      }\n    );\n  }\n};\n\n// src/esbuildConfigs/index.ts\nimport \"esbuild\";\nvar esbuildConfigs_default = (config) => {\n  return {\n    // packages: \"external\",\n    target: \"esnext\",\n    format: \"esm\",\n    splitting: true,\n    outExtension: { \".js\": \".mjs\" },\n    outbase: \".\",\n    jsx: \"transform\",\n    bundle: true,\n    // minify: config.minify === true,\n    write: true,\n    loader: {\n      \".js\": \"jsx\",\n      \".png\": \"binary\",\n      \".jpg\": \"binary\"\n    }\n  };\n};\n\n// src/esbuildConfigs/inputFilesPlugin.ts\nimport fs from \"fs\";\nvar otherInputs = {};\nvar register = (entrypoint, sources) => {\n  if (!otherInputs[entrypoint]) {\n    otherInputs[entrypoint] = /* @__PURE__ */ new Set();\n  }\n  sources.forEach((s) => otherInputs[entrypoint].add(s));\n};\nvar inputFilesPlugin_default = (platform, testName2) => {\n  const f = `${testName2}`;\n  return {\n    register,\n    inputFilesPluginFactory: {\n      name: \"metafileWriter\",\n      setup(build) {\n        build.onEnd((result) => {\n          fs.writeFileSync(f, JSON.stringify(result, null, 2));\n        });\n      }\n    }\n  };\n};\n\n// src/esbuildConfigs/rebuildPlugin.ts\nimport fs2 from \"fs\";\nvar rebuildPlugin_default = (r) => {\n  return {\n    name: \"rebuild-notify\",\n    setup: (build) => {\n      build.onEnd((result) => {\n        console.log(`${r} > build ended with ${result.errors.length} errors`);\n        if (result.errors.length > 0) {\n          fs2.writeFileSync(\n            `./testeranto/reports${r}_build_errors`,\n            JSON.stringify(result, null, 2)\n          );\n        }\n      });\n    }\n  };\n};\n\n// src/server/runtimes/web/esbuild.ts\nvar esbuild_default = (config, testName2, projectConfig) => {\n  const entryPoints = projectConfig.runtimes[testName2].tests;\n  const { inputFilesPluginFactory, register: register2 } = inputFilesPlugin_default(\n    \"web\",\n    testName2\n  );\n  return {\n    ...esbuildConfigs_default(config),\n    outdir: `testeranto/bundles/${testName2}`,\n    outbase: \".\",\n    metafile: true,\n    supported: {\n      \"dynamic-import\": true\n    },\n    define: {\n      \"process.env.FLUENTFFMPEG_COV\": \"0\",\n      ENV: `web`\n    },\n    bundle: true,\n    format: \"esm\",\n    absWorkingDir: process.cwd(),\n    platform: \"browser\",\n    // packages: \"external\",\n    entryPoints,\n    plugins: [\n      featuresPlugin_default,\n      inputFilesPluginFactory,\n      rebuildPlugin_default(\"web\"),\n      ...config.web?.plugins?.map((p) => p(register2, entryPoints)) || []\n    ]\n  };\n};\n\n// src/server/runtimes/common.ts\nimport path2 from \"path\";\nimport fs3 from \"fs\";\nasync function processMetafile(config, metafile, runtime, configKey) {\n  for (const [outputFile, outputInfo] of Object.entries(metafile.outputs)) {\n    let collectFileDependencies2 = function(filePath) {\n      if (collectedFiles.has(filePath)) {\n        return;\n      }\n      collectedFiles.add(filePath);\n      const fileInfo = metafile.inputs?.[filePath];\n      if (fileInfo?.imports) {\n        for (const importInfo of fileInfo.imports) {\n          const importPath = importInfo.path;\n          if (metafile.inputs?.[importPath]) {\n            collectFileDependencies2(importPath);\n          }\n        }\n      }\n    };\n    var collectFileDependencies = collectFileDependencies2;\n    const outputInfoTyped = outputInfo;\n    if (!outputInfoTyped.entryPoint) {\n      console.log(`[${runtime} Builder] Skipping output without entryPoint: ${outputFile}`);\n      continue;\n    }\n    const entryPoint = outputInfoTyped.entryPoint;\n    const isTestFile = /\\.(test|spec)\\.(ts|js)$/.test(entryPoint);\n    if (!isTestFile) {\n      console.log(`[${runtime} Builder] Skipping non-test entryPoint: ${entryPoint}`);\n      continue;\n    }\n    const outputInputs = outputInfoTyped.inputs || {};\n    const collectedFiles = /* @__PURE__ */ new Set();\n    for (const inputFile of Object.keys(outputInputs)) {\n      collectFileDependencies2(inputFile);\n    }\n    const allInputFiles = Array.from(collectedFiles).map(\n      (filePath) => path2.isAbsolute(filePath) ? filePath : path2.resolve(process.cwd(), filePath)\n    );\n    const workspaceRoot = \"/workspace\";\n    const relativeFiles = allInputFiles.map((file) => {\n      const absolutePath = path2.isAbsolute(file) ? file : path2.resolve(process.cwd(), file);\n      if (absolutePath.startsWith(workspaceRoot)) {\n        return absolutePath.slice(workspaceRoot.length);\n      }\n      return path2.relative(process.cwd(), absolutePath);\n    }).filter(Boolean);\n    const outputBaseName = entryPoint.split(\".\").slice(0, -1).join(\".\");\n    const inputFilesPath = `testeranto/bundles/${configKey}/${outputBaseName}.mjs-inputFiles.json`;\n    fs3.writeFileSync(inputFilesPath, JSON.stringify(relativeFiles, null, 2));\n    console.log(`[${runtime} Builder] Wrote ${relativeFiles.length} input files to ${inputFilesPath}`);\n  }\n}\n\n// src/server/runtimes/web/web.ts\nimport * as fs4 from \"fs\";\nimport * as path3 from \"path\";\nconsole.log(process.cwd());\nvar projectConfigPath = process.argv[2];\nvar nodeConfigPath = process.argv[3];\nvar testName = process.argv[4];\nasync function startBundling(webConfigs, projectConfig) {\n  console.log(`[WEB BUILDER] is now bundling: ${testName}`);\n  const w = esbuild_default(webConfigs, testName, projectConfig);\n  const isDevMode = process.env.MODE === \"dev\" || process.argv.includes(\"dev\");\n  if (isDevMode) {\n    console.log(`[WEB BUILDER] Running in dev mode - starting watch mode`);\n    const ctx = await esbuild.context(w);\n    const buildResult = await ctx.rebuild();\n    if (buildResult.metafile) {\n      await processMetafile(projectConfig, buildResult.metafile, \"web\", testName);\n      const outputFiles = Object.keys(buildResult.metafile.outputs);\n      for (const outputFile of outputFiles) {\n        const htmlPath = `testeranto/bundles/webtests/src/ts/Calculator.test.ts.html`;\n        await fs4.promises.mkdir(path3.dirname(htmlPath), { recursive: true });\n        const htmlContent = `<!DOCTYPE html>\n    <html>\n    <head>\n        <meta charset=\"UTF-8\">\n        <title>Test Runner</title>\n        <script type=\"module\" src=\"Calculator.test.mjs\"></script>\n    </head>\n    <body>\n        <div id=\"root\"></div>\n    </body>\n    </html>`;\n        await fs4.promises.writeFile(htmlPath, htmlContent);\n        console.log(`Created HTML file: ${htmlPath}`);\n      }\n    } else {\n      console.warn(\"No metafile generated by esbuild\");\n    }\n    let { hosts, port } = await ctx.serve({\n      host: \"webtests\",\n      servedir: \".\",\n      onRequest: ({ method, path: path4, remoteAddress, status, timeInMS }) => {\n        console.log(`[esbuild] ${remoteAddress} - ${method} ${path4} -> ${status} [${timeInMS}ms]`);\n      }\n    });\n    console.log(`[WEB BUILDER]: esbuild server ${hosts}, ${port}`);\n    await ctx.watch();\n    console.log(`[WEB BUILDER] Watch mode active - waiting for file changes...`);\n    ctx.on(\"rebuild\", async (result) => {\n      console.log(`[WEB BUILDER] Rebuilding due to file changes...`);\n      if (result.metafile) {\n        await processMetafile(projectConfig, result.metafile, \"web\", testName);\n        console.log(`[WEB BUILDER] Metafile updated`);\n        const outputBaseName = w.entryPoints?.[0]?.split(\".\").slice(0, -1).join(\".\") || testName;\n        const inputFilesPath = `testeranto/bundles/${testName}/${outputBaseName}.mjs-inputFiles.json`;\n        try {\n          const stats = fs4.statSync(inputFilesPath);\n          fs4.utimesSync(inputFilesPath, stats.atime, /* @__PURE__ */ new Date());\n          console.log(`[WEB BUILDER] Triggered inputFiles.json update`);\n        } catch (error) {\n          console.error(`[WEB BUILDER] Failed to trigger inputFiles.json update:`, error);\n        }\n      }\n    });\n    process.on(\"SIGINT\", async () => {\n      console.log(\"WEB BUILDER: Shutting down...\");\n      await ctx.dispose();\n      process.exit(0);\n    });\n    console.log(\"Chrome is a separate service, not launched in builder\");\n  } else {\n    const buildResult = await esbuild.build(w);\n    if (buildResult.metafile) {\n      await processMetafile(projectConfig, buildResult.metafile, \"web\", testName);\n      const outputFiles = Object.keys(buildResult.metafile.outputs);\n      for (const outputFile of outputFiles) {\n        const htmlPath = `testeranto/bundles/webtests/src/ts/Calculator.test.ts.html`;\n        await fs4.promises.mkdir(path3.dirname(htmlPath), { recursive: true });\n        const htmlContent = `<!DOCTYPE html>\n    <html>\n    <head>\n        <meta charset=\"UTF-8\">\n        <title>Test Runner</title>\n        <script type=\"module\" src=\"Calculator.test.mjs\"></script>\n    </head>\n    <body>\n        <div id=\"root\"></div>\n    </body>\n    </html>`;\n        await fs4.promises.writeFile(htmlPath, htmlContent);\n        console.log(`Created HTML file: ${htmlPath}`);\n      }\n    } else {\n      console.warn(\"No metafile generated by esbuild\");\n    }\n    console.log(\"WEB BUILDER: Metafiles have been generated\");\n  }\n}\nasync function main() {\n  try {\n    const nodeConfigs = (await import(nodeConfigPath)).default;\n    const projectConfigs = (await import(projectConfigPath)).default;\n    await startBundling(nodeConfigs, projectConfigs);\n  } catch (error) {\n    console.error(\"NODE BUILDER: Error importing config:\", nodeConfigPath, error);\n    console.error(error);\n    process.exit(1);\n  }\n}\nmain();\n";

// dist/prebuild/web/hoist.mjs
var hoist_default = "// src/server/runtimes/web/hoist.ts\nimport puppeteer from \"puppeteer-core\";\nimport http from \"http\";\nvar esbuildUrlDomain = `http://webtests:8000/`;\nasync function launchPuppeteer(browserWSEndpoint) {\n  const browser = await puppeteer.connect({\n    browserWSEndpoint\n  });\n  const page = await browser.newPage();\n  try {\n    page.on(\"console\", (log) => {\n      const msg = `${log.text()}\n`;\n      switch (log.type()) {\n        case \"info\":\n          break;\n        case \"warn\":\n          break;\n        case \"error\":\n          break;\n        case \"debug\":\n          break;\n        default:\n          break;\n      }\n    });\n    page.on(\"close\", () => {\n    });\n    const close = () => {\n    };\n    page.on(\"pageerror\", (err) => {\n      console.error(\"Page error in web test:\", err);\n      close();\n      throw err;\n    });\n    page.on(\"console\", (msg) => {\n      const text = msg.text();\n      console.log(`Browser console [${msg.type()}]: ${text} ${JSON.stringify(msg.stackTrace())}`);\n    });\n    const htmlUrl = `${esbuildUrlDomain}testeranto/bundles/webtests/src/ts/Calculator.test.ts.html`;\n    console.log(\"htmlUrl\", htmlUrl);\n    await page.goto(htmlUrl, { waitUntil: \"networkidle0\" });\n    await page.close();\n    close();\n  } catch (error) {\n    console.error(`Error in web test:`, error);\n    throw error;\n  }\n}\nasync function connect() {\n  const url = `http://chrome-service:9222/json/version`;\n  console.log(`[CLIENT] Attempting to reach Chrome service at ${url}...`);\n  const req = http.get(url, (res) => {\n    let data = \"\";\n    console.log(`[CLIENT] HTTP Status: ${res.statusCode}`);\n    res.on(\"data\", (chunk) => data += chunk);\n    res.on(\"end\", async () => {\n      try {\n        const json = JSON.parse(data);\n        console.log(`[CLIENT] Successfully fetched WS URL: ${json.webSocketDebuggerUrl}`);\n        await launchPuppeteer(json.webSocketDebuggerUrl);\n      } catch (e) {\n        console.error(\"[CLIENT] Failed to parse JSON or connect:\", e.message);\n        console.log(\"[CLIENT] Raw Data received:\", data);\n        throw e;\n      }\n    });\n  });\n  req.on(\"error\", (err) => {\n    console.error(\"[CLIENT] HTTP Request Failed:\", err.message);\n    throw err;\n  });\n  req.setTimeout(5e3, () => {\n    console.log(\"[CLIENT] Request timeout\");\n    req.destroy();\n    throw new Error(\"Timeout\");\n  });\n}\nconnect();\n";

// src/server/runtimes/web/docker.ts
var webScriptPath = join2(process.cwd(), "testeranto", "web_runtime.ts");
await Bun.write(webScriptPath, web_default);
var webHoistScriptPath = join2(process.cwd(), "testeranto", "web_hoist.ts");
await Bun.write(webHoistScriptPath, hoist_default);
var webDockerComposeFile = (config, container_name, projectConfigPath, webConfigPath, testName) => {
  const service = {
    build: {
      context: process.cwd(),
      dockerfile: config.runtimes[container_name]?.dockerfile || "testeranto/runtimes/web/web.Dockerfile"
    },
    container_name,
    environment: {
      NODE_ENV: "production",
      ENV: "web"
    },
    working_dir: "/workspace",
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/testeranto:/workspace/testeranto`
    ],
    command: webBuildCommand(projectConfigPath, webConfigPath, testName),
    networks: ["allTests_network"],
    expose: ["8000"],
    depends_on: ["chrome-service"]
  };
  return service;
};
var chromeServiceConfig = () => {
  return {
    image: "chromium/chromium:latest",
    container_name: "chrome-service",
    command: [
      "chromium-browser",
      "--headless",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--remote-debugging-address=0.0.0.0",
      "--remote-debugging-port=9222"
    ].join(" "),
    expose: ["9222"],
    ports: ["9222:9222"],
    networks: ["allTests_network"]
  };
};
var webBuildCommand = (projectConfigPath, webConfigPath, testName) => {
  return `MODE=${process.env.MODE || "once"} yarn tsx /workspace/testeranto/web_runtime.ts /workspace/${projectConfigPath} /workspace/${webConfigPath} ${testName}`;
};
var webBddCommand = (fpath, webConfigPath, configKey) => {
  const jsonStr = JSON.stringify({ ports: [1111], fs: "testeranto/reports/web" });
  return `yarn tsx /workspace/testeranto/web_hoist.ts testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
};
var webBuildKitBuild = async (config, configKey) => {
  const runtimeConfig = config.runtimes[configKey];
  if (!runtimeConfig) {
    throw new Error(`Configuration not found for ${configKey}`);
  }
  const buildKitConfig = runtimeConfig.buildKitOptions || {};
  const buildKitOptions = {
    runtime: "web",
    configKey,
    dockerfilePath: runtimeConfig.dockerfile,
    buildContext: process.cwd(),
    cacheMounts: ["/root/.npm", "/usr/local/share/.cache/yarn"],
    targetStage: buildKitConfig.targetStage,
    buildArgs: {
      NODE_ENV: "production",
      ...buildKitConfig.buildArgs || {}
    }
  };
  console.log(`[Web BuildKit] Building image for ${configKey}...`);
  const result = await BuildKitBuilder.buildImage(buildKitOptions);
  if (result.success) {
    console.log(`[Web BuildKit] Successfully built image in ${result.duration}ms`);
  } else {
    console.error(`[Web BuildKit] Build failed: ${result.error}`);
    throw new Error(`BuildKit build failed: ${result.error}`);
  }
};

// src/server/runtimes/golang/docker.ts
import { join as join3 } from "path";

// src/server/runtimes/golang/main.go
var main_default = "package main\n\nimport (\n\t\"crypto/md5\"\n\t\"encoding/hex\"\n\t\"encoding/json\"\n\t\"fmt\"\n\n\t// \"log\"\n\t\"os\"\n\t\"os/exec\"\n\t\"path/filepath\"\n\t\"strings\"\n)\n\n// Package struct maps the fields we need from 'go list'\ntype Package struct {\n\tImportPath   string   `json:\"ImportPath\"`\n\tDir          string   `json:\"Dir\"`\n\tGoFiles      []string `json:\"GoFiles\"`\n\tCgoFiles     []string `json:\"CgoFiles\"`\n\tCFiles       []string `json:\"CFiles\"`\n\tCXXFiles     []string `json:\"CXXFiles\"`\n\tHFiles       []string `json:\"HFiles\"`\n\tSFiles       []string `json:\"SFiles\"`\n\tSwigFiles    []string `json:\"SwigFiles\"`\n\tSwigCXXFiles []string `json:\"SwigCXXFiles\"`\n\tSysoFiles    []string `json:\"SysoFiles\"`\n\tEmbedFiles   []string `json:\"EmbedFiles\"`\n\tTestGoFiles  []string `json:\"TestGoFiles\"`\n\tModule       *struct {\n\t\tMain bool `json:\"Main\"`\n\t} `json:\"Module\"`\n}\n\n// TestEntry represents a test entry in the metafile\ntype TestEntry struct {\n\tName   string   `json:\"name\"`\n\tPath   string   `json:\"path\"`\n\tInputs []string `json:\"inputs\"`\n\tOutput string   `json:\"output\"`\n}\n\n// Metafile structure matching esbuild format\ntype Metafile struct {\n\tInputs  map[string]InputEntry  `json:\"inputs\"`\n\tOutputs map[string]OutputEntry `json:\"outputs\"`\n}\n\n// InputEntry represents an input file\ntype InputEntry struct {\n\tBytes   int      `json:\"bytes\"`\n\tImports []string `json:\"imports\"`\n}\n\n// OutputEntry represents an output entry\ntype OutputEntry struct {\n\tImports    []string               `json:\"imports\"`\n\tExports    []string               `json:\"exports\"`\n\tEntryPoint string                 `json:\"entryPoint\"`\n\tInputs     map[string]InputDetail `json:\"inputs\"`\n\tBytes      int                    `json:\"bytes\"`\n}\n\n// InputDetail represents input file details in output\ntype InputDetail struct {\n\tBytesInOutput int `json:\"bytesInOutput\"`\n}\n\nfunc computeFilesHash(files []string) (string, error) {\n\thash := md5.New()\n\tfor _, file := range files {\n\t\tabsPath := filepath.Join(\"/workspace\", file)\n\t\t// Add file path to hash\n\t\thash.Write([]byte(file))\n\n\t\t// Add file stats to hash\n\t\tinfo, err := os.Stat(absPath)\n\t\tif err == nil {\n\t\t\thash.Write([]byte(info.ModTime().String()))\n\t\t\thash.Write([]byte(fmt.Sprintf(\"%d\", info.Size())))\n\t\t} else {\n\t\t\thash.Write([]byte(\"missing\"))\n\t\t}\n\t}\n\treturn hex.EncodeToString(hash.Sum(nil)), nil\n}\n\nfunc main() {\n\t// Force output to be visible\n\tfmt.Fprintln(os.Stdout, \"\uD83D\uDE80 Go builder starting...\")\n\tfmt.Fprintln(os.Stderr, \"\uD83D\uDE80 Go builder starting (stderr)...\")\n\tos.Stdout.Sync()\n\tos.Stderr.Sync()\n\n\t// Parse command line arguments similar to Rust builder\n\t// Expected: main.go <project_config> <golang_config> <test_name> <entry_points...>\n\targs := os.Args\n\tif len(args) < 4 {\n\t\tfmt.Fprintln(os.Stderr, \"\u274C Insufficient arguments\")\n\t\tfmt.Fprintln(os.Stderr, \"Usage: main.go <project_config> <golang_config> <test_name> <entry_points...>\")\n\t\tos.Exit(1)\n\t}\n\n\t// projectConfigPath := args[1]\n\t// golangConfigPath := args[2]\n\ttestName := args[3]\n\tentryPoints := args[4:]\n\n\tfmt.Printf(\"Test name: %s\\n\", testName)\n\tfmt.Printf(\"Entry points: %v\\n\", entryPoints)\n\n\tif len(entryPoints) == 0 {\n\t\tfmt.Fprintln(os.Stderr, \"\u274C No entry points provided\")\n\t\tos.Exit(1)\n\t}\n\n\t// Change to workspace directory\n\tworkspace := \"/workspace\"\n\tif err := os.Chdir(workspace); err != nil {\n\t\tfmt.Fprintf(os.Stderr, \"\u274C Failed to change to workspace directory: %v\\n\", err)\n\t\tos.Exit(1)\n\t}\n\n\t// Create bundles directory\n\tbundlesDir := filepath.Join(workspace, \"testeranto/bundles\", testName)\n\tif err := os.MkdirAll(bundlesDir, 0755); err != nil {\n\t\tfmt.Fprintf(os.Stderr, \"\u274C Failed to create bundles directory: %v\\n\", err)\n\t\tos.Exit(1)\n\t}\n\n\t// Process each entry point\n\tfor _, entryPoint := range entryPoints {\n\t\tfmt.Printf(\"\\n\uD83D\uDCE6 Processing Go test: %s\\n\", entryPoint)\n\n\t\t// Get entry point path\n\t\tentryPointPath := filepath.Join(workspace, entryPoint)\n\t\tif _, err := os.Stat(entryPointPath); err != nil {\n\t\t\tfmt.Fprintf(os.Stderr, \"  \u274C Entry point does not exist: %s\\n\", entryPointPath)\n\t\t\tos.Exit(1)\n\t\t}\n\n\t\t// Get base name (without .go extension)\n\t\tfileName := filepath.Base(entryPoint)\n\t\tif !strings.HasSuffix(fileName, \".go\") {\n\t\t\tfmt.Fprintf(os.Stderr, \"  \u274C Entry point is not a Go file: %s\\n\", entryPoint)\n\t\t\tos.Exit(1)\n\t\t}\n\t\tbaseName := strings.TrimSuffix(fileName, \".go\")\n\t\t// Replace dots with underscores to make a valid binary name\n\t\tbinaryName := strings.ReplaceAll(baseName, \".\", \"_\")\n\n\t\t// Find module root\n\t\tmoduleRoot := findModuleRoot(entryPointPath)\n\t\tif moduleRoot == \"\" {\n\t\t\tfmt.Fprintf(os.Stderr, \"  \u274C Cannot find go.mod in or above %s\\n\", entryPointPath)\n\t\t\tos.Exit(1)\n\t\t}\n\n\t\t// Change to module root directory\n\t\tif err := os.Chdir(moduleRoot); err != nil {\n\t\t\tfmt.Fprintf(os.Stderr, \"  \u274C Cannot change to module root %s: %v\\n\", moduleRoot, err)\n\t\t\tos.Exit(1)\n\t\t}\n\n\t\t// Get relative path from module root to entry point\n\t\trelEntryPath, err := filepath.Rel(moduleRoot, entryPointPath)\n\t\tif err != nil {\n\t\t\tfmt.Fprintf(os.Stderr, \"  \u274C Failed to get relative path: %v\\n\", err)\n\t\t\tos.Exit(1)\n\t\t}\n\n\t\t// Go modules handle dependencies automatically\n\t\t// The build will succeed or fail based on go.mod correctness\n\t\tfmt.Printf(\"  Building with Go modules...\\n\")\n\t\t\n\t\t// Ensure dependencies are up to date, especially for local modules\n\t\t// First, remove go.sum to force fresh resolution\n\t\tgoSumPath := filepath.Join(moduleRoot, \"go.sum\")\n\t\tif _, err := os.Stat(goSumPath); err == nil {\n\t\t\tfmt.Printf(\"  Removing go.sum to force fresh dependency resolution...\\n\")\n\t\t\tos.Remove(goSumPath)\n\t\t}\n\t\t\n\t\tfmt.Printf(\"  Running go mod tidy...\\n\")\n\t\ttidyCmd := exec.Command(\"go\", \"mod\", \"tidy\")\n\t\ttidyCmd.Stdout = os.Stdout\n\t\ttidyCmd.Stderr = os.Stderr\n\t\ttidyCmd.Dir = moduleRoot\n\t\tif err := tidyCmd.Run(); err != nil {\n\t\t\tfmt.Printf(\"  \u26A0\uFE0F  go mod tidy failed: %v\\n\", err)\n\t\t\t// Continue anyway, as the build might still work\n\t\t}\n\n\t\t// Collect input files in a simple way, similar to rust builder\n\t\tvar inputs []string\n\t\t\n\t\t// Add the entry point file itself\n\t\trelEntryToWorkspace, err := filepath.Rel(workspace, entryPointPath)\n\t\tif err == nil && !strings.HasPrefix(relEntryToWorkspace, \"..\") {\n\t\t\tinputs = append(inputs, relEntryToWorkspace)\n\t\t} else {\n\t\t\t// Fallback\n\t\t\tinputs = append(inputs, entryPoint)\n\t\t}\n\t\t\n\t\t// Add go.mod and go.sum if they exist\n\t\tgoModPath := filepath.Join(moduleRoot, \"go.mod\")\n\t\tgoSumPath := filepath.Join(moduleRoot, \"go.sum\")\n\t\tfmt.Printf(\"  Module root: %s\\n\", moduleRoot)\n\t\tfmt.Printf(\"  go.mod path: %s\\n\", goModPath)\n\t\tfor _, filePath := range []string{goModPath, goSumPath} {\n\t\t\tif _, err := os.Stat(filePath); err == nil {\n\t\t\t\trelToWorkspace, err := filepath.Rel(workspace, filePath)\n\t\t\t\tif err == nil && !strings.HasPrefix(relToWorkspace, \"..\") {\n\t\t\t\t\tinputs = append(inputs, relToWorkspace)\n\t\t\t\t}\n\t\t\t} else {\n\t\t\t\tfmt.Printf(\"  \u26A0\uFE0F  File not found: %s\\n\", filePath)\n\t\t\t}\n\t\t}\n\t\t\n\t\t// Add all .go files in the module root and subdirectories\n\t\t// This is similar to rust builder which adds all .rs files in src/\n\t\terr = filepath.Walk(moduleRoot, func(path string, info os.FileInfo, err error) error {\n\t\t\tif err != nil {\n\t\t\t\treturn nil // skip errors\n\t\t\t}\n\t\t\tif !info.IsDir() && strings.HasSuffix(path, \".go\") {\n\t\t\t\trelToWorkspace, err := filepath.Rel(workspace, path)\n\t\t\t\tif err == nil && !strings.HasPrefix(relToWorkspace, \"..\") {\n\t\t\t\t\tinputs = append(inputs, relToWorkspace)\n\t\t\t\t}\n\t\t\t}\n\t\t\treturn nil\n\t\t})\n\t\tif err != nil {\n\t\t\tfmt.Printf(\"  \u26A0\uFE0F  Warning while walking directory: %v\\n\", err)\n\t\t}\n\t\t\n\t\tfmt.Printf(\"  Found %d input files (simplified collection)\\n\", len(inputs))\n\n\t\t// Compute hash\n\t\ttestHash, err := computeFilesHash(inputs)\n\t\tif err != nil {\n\t\t\tfmt.Printf(\"  \u26A0\uFE0F  Failed to compute hash: %v\\n\", err)\n\t\t\ttestHash = \"error\"\n\t\t}\n\n\t\t// Create inputFiles.json\n\t\tinputFilesBasename := strings.ReplaceAll(entryPoint, \"/\", \"_\") + \"-inputFiles.json\"\n\t\tinputFilesPath := filepath.Join(bundlesDir, inputFilesBasename)\n\t\tinputFilesJSON, err := json.MarshalIndent(inputs, \"\", \"  \")\n\t\tif err != nil {\n\t\t\tfmt.Fprintf(os.Stderr, \"  \u274C Failed to marshal inputFiles.json: %v\\n\", err)\n\t\t\tos.Exit(1)\n\t\t}\n\t\tif err := os.WriteFile(inputFilesPath, inputFilesJSON, 0644); err != nil {\n\t\t\tfmt.Fprintf(os.Stderr, \"  \u274C Failed to write inputFiles.json: %v\\n\", err)\n\t\t\tos.Exit(1)\n\t\t}\n\t\tfmt.Printf(\"  \u2705 Created inputFiles.json at %s\\n\", inputFilesPath)\n\n\t\t// Compile the binary\n\t\toutputExePath := filepath.Join(bundlesDir, binaryName)\n\t\tfmt.Printf(\"  \uD83D\uDD28 Compiling %s to %s...\\n\", relEntryPath, outputExePath)\n\n\t\t// Build the entire package directory, not just the single file\n\t\t// Get the directory containing the entry point\n\t\tentryDir := filepath.Dir(relEntryPath)\n\t\tif entryDir == \".\" {\n\t\t\tentryDir = \"./\"\n\t\t}\n\t\t\n\t\t// List all .go files in the entry directory for debugging\n\t\tfmt.Printf(\"  \uD83D\uDCC1 Building package in directory: %s\\n\", entryDir)\n\t\tgoFiles, _ := filepath.Glob(filepath.Join(entryDir, \"*.go\"))\n\t\tfmt.Printf(\"  \uD83D\uDCC4 Found %d .go files in package:\\n\", len(goFiles))\n\t\tfor _, f := range goFiles {\n\t\t\tfmt.Printf(\"    - %s\\n\", filepath.Base(f))\n\t\t}\n\t\t\n\t\t// Build the package in that directory\n\t\t// Use ./... pattern to build all packages in the directory\n\t\t// First, ensure all dependencies are built\n\t\tbuildDepsCmd := exec.Command(\"go\", \"build\", \"./...\")\n\t\tbuildDepsCmd.Stdout = os.Stdout\n\t\tbuildDepsCmd.Stderr = os.Stderr\n\t\tbuildDepsCmd.Dir = moduleRoot\n\t\tif err := buildDepsCmd.Run(); err != nil {\n\t\t\tfmt.Printf(\"  \u26A0\uFE0F  Failed to build dependencies: %v\\n\", err)\n\t\t\t// Continue anyway, as the main build might still work\n\t\t}\n\t\t\n\t\tbuildCmd := exec.Command(\"go\", \"build\", \"-o\", outputExePath, \"./\"+entryDir)\n\t\tbuildCmd.Stdout = os.Stdout\n\t\tbuildCmd.Stderr = os.Stderr\n\t\tbuildCmd.Dir = moduleRoot\n\n\t\tif err := buildCmd.Run(); err != nil {\n\t\t\tfmt.Fprintf(os.Stderr, \"  \u274C Failed to compile: %v\\n\", err)\n\t\t\tfmt.Fprintf(os.Stderr, \"  \uD83D\uDCA1 Go module dependency error.\\n\")\n\t\t\tfmt.Fprintf(os.Stderr, \"  \uD83D\uDCA1 This could be due to:\\n\")\n\t\t\tfmt.Fprintf(os.Stderr, \"  \uD83D\uDCA1 1. Missing or incorrect module structure\\n\")\n\t\t\tfmt.Fprintf(os.Stderr, \"  \uD83D\uDCA1 2. Network issues downloading modules\\n\")\n\t\t\tfmt.Fprintf(os.Stderr, \"  \uD83D\uDCA1 3. Version conflicts in go.mod\\n\")\n\t\t\tfmt.Fprintf(os.Stderr, \"  \uD83D\uDCA1 4. Missing files in the package (trying to build single file instead of package)\\n\")\n\t\t\tfmt.Fprintf(os.Stderr, \"  \uD83D\uDCA1 5. Inconsistent imports between files\\n\")\n\t\t\tfmt.Fprintf(os.Stderr, \"  \uD83D\uDCA1 6. Local module replace directives not working\\n\")\n\t\t\tfmt.Fprintf(os.Stderr, \"  \uD83D\uDCA1 7. Try running 'go mod tidy' manually\\n\")\n\t\t\tfmt.Fprintf(os.Stderr, \"  \uD83D\uDCA1 8. Dependencies not built\\n\")\n\t\t\tfmt.Fprintf(os.Stderr, \"  \uD83D\uDCA1 Check that all imported packages exist and are correctly published.\\n\")\n\t\t\tos.Exit(1)\n\t\t}\n\t\t\n\t\tfmt.Printf(\"  \u2705 Successfully compiled to %s\\n\", outputExePath)\n\n\t\t// Make executable\n\t\tif err := os.Chmod(outputExePath, 0755); err != nil {\n\t\t\tfmt.Printf(\"  \u26A0\uFE0F  Failed to make binary executable: %v\\n\", err)\n\t\t}\n\n\t\t// Create dummy bundle file (for consistency with other runtimes)\n\t\tdummyPath := filepath.Join(bundlesDir, entryPoint)\n\t\tif err := os.MkdirAll(filepath.Dir(dummyPath), 0755); err != nil {\n\t\t\tfmt.Fprintf(os.Stderr, \"  \u274C Failed to create dummy bundle directory: %v\\n\", err)\n\t\t\tos.Exit(1)\n\t\t}\n\n\t\tdummyContent := fmt.Sprintf(`#!/usr/bin/env bash\n# Dummy bundle file generated by testeranto\n# Hash: %s\n# This file execs the compiled Go binary\n\nexec \"%s\" \"$@\"\n`, testHash, outputExePath)\n\n\t\tif err := os.WriteFile(dummyPath, []byte(dummyContent), 0755); err != nil {\n\t\t\tfmt.Fprintf(os.Stderr, \"  \u274C Failed to write dummy bundle file: %v\\n\", err)\n\t\t\tos.Exit(1)\n\t\t}\n\n\t\tfmt.Printf(\"  \u2705 Created dummy bundle file at %s\\n\", dummyPath)\n\n\t\t// Change back to workspace root for next iteration\n\t\tif err := os.Chdir(workspace); err != nil {\n\t\t\tfmt.Fprintf(os.Stderr, \"  \u26A0\uFE0F  Failed to change back to workspace: %v\\n\", err)\n\t\t}\n\t}\n\n\tfmt.Println(\"\\n\uD83C\uDF89 Go builder completed successfully\")\n}\n\nfunc getCurrentDir() string {\n\tdir, err := os.Getwd()\n\tif err != nil {\n\t\treturn fmt.Sprintf(\"Error: %v\", err)\n\t}\n\treturn dir\n}\n\nfunc findConfig() string {\n\treturn \"/workspace/testeranto/runtimes/golang/golang.go\"\n}\n\n// loadConfig is defined in config.go\n// findModuleRoot walks up from dir to find a directory containing go.mod\nfunc findModuleRoot(dir string) string {\n\tcurrent := dir\n\tfor {\n\t\tgoModPath := filepath.Join(current, \"go.mod\")\n\t\tif _, err := os.Stat(goModPath); err == nil {\n\t\t\treturn current\n\t\t}\n\t\tparent := filepath.Dir(current)\n\t\tif parent == current {\n\t\t\tbreak\n\t\t}\n\t\tcurrent = parent\n\t}\n\treturn \"\"\n}\n\n// TestConfig represents configuration for a single test\ntype TestConfig struct {\n\tPath string `json:\"path\"`\n}\n\n// GolangConfig represents the Go-specific configuration\ntype GolangConfig struct {\n\tTests map[string]TestConfig `json:\"tests\"`\n}\n\n// Config represents the overall configuration\ntype Config struct {\n\tGolang GolangConfig `json:\"golang\"`\n}\n\nfunc copyFile(src, dst string) error {\n\tinput, err := os.ReadFile(src)\n\tif err != nil {\n\t\treturn err\n\t}\n\t// Ensure the destination directory exists\n\tif err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {\n\t\treturn err\n\t}\n\treturn os.WriteFile(dst, input, 0644)\n}\n\nfunc copyDir(src, dst string) error {\n\t// Get properties of source dir\n\tinfo, err := os.Stat(src)\n\tif err != nil {\n\t\treturn err\n\t}\n\n\t// Create the destination directory\n\tif err := os.MkdirAll(dst, info.Mode()); err != nil {\n\t\treturn err\n\t}\n\n\t// Read the source directory\n\tentries, err := os.ReadDir(src)\n\tif err != nil {\n\t\treturn err\n\t}\n\n\tfor _, entry := range entries {\n\t\tsrcPath := filepath.Join(src, entry.Name())\n\t\tdstPath := filepath.Join(dst, entry.Name())\n\n\t\tif entry.IsDir() {\n\t\t\tif err := copyDir(srcPath, dstPath); err != nil {\n\t\t\t\treturn err\n\t\t\t}\n\t\t} else {\n\t\t\tif err := copyFile(srcPath, dstPath); err != nil {\n\t\t\t\treturn err\n\t\t\t}\n\t\t}\n\t}\n\treturn nil\n}\n\nfunc loadConfig(path string) (*Config, error) {\n\tfmt.Printf(\"[INFO] Loading config from: %s\\n\", path)\n\n\t// Run the Go file to get JSON output\n\tcmd := exec.Command(\"go\", \"run\", path)\n\toutput, err := cmd.Output()\n\tif err != nil {\n\t\treturn nil, fmt.Errorf(\"failed to run config program: %w\", err)\n\t}\n\n\tvar config Config\n\tif err := json.Unmarshal(output, &config); err != nil {\n\t\treturn nil, fmt.Errorf(\"failed to decode config JSON: %w\", err)\n\t}\n\n\tfmt.Printf(\"[INFO] Loaded config with %d Go test(s)\\n\", len(config.Golang.Tests))\n\tfor testName, testConfig := range config.Golang.Tests {\n\t\tfmt.Printf(\"[INFO]   - %s (path: %s)\\n\", testName, testConfig.Path)\n\t}\n\n\treturn &config, nil\n}\n";

// src/server/runtimes/golang/docker.ts
var golangScriptPath = join3(process.cwd(), "testeranto", "golang_runtime.go");
await Bun.write(golangScriptPath, main_default);
var golangDockerComposeFile = (config, container_name, projectConfigPath, golangConfigPath, testName) => {
  const tests = config.runtimes[testName]?.tests || [];
  const service = {
    build: {
      context: process.cwd(),
      dockerfile: config.runtimes[container_name]?.dockerfile || "testeranto/runtimes/golang/golang.Dockerfile"
    },
    container_name,
    environment: {
      ENV: "golang"
    },
    working_dir: "/workspace",
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/testeranto:/workspace/testeranto`
    ],
    command: golangBuildCommand(projectConfigPath, golangConfigPath, testName, tests),
    networks: ["allTests_network"]
  };
  return service;
};
var golangBuildCommand = (projectConfigPath, golangConfigPath, testName, tests) => {
  return `MODE=${process.env.MODE || "once"} go run /workspace/testeranto/golang_runtime.go /workspace/${projectConfigPath} /workspace/${golangConfigPath} ${testName} ${tests.join(" ")}`;
};
var golangBddCommand = (fpath, golangConfigPath, configKey) => {
  const jsonStr = JSON.stringify({
    name: "go-test",
    ports: [1111],
    fs: "testeranto/reports/go",
    timeout: 30000,
    retries: 0,
    environment: {}
  });
  const pathParts = fpath.split("/");
  const fileName = pathParts[pathParts.length - 1];
  const binaryName = fileName.replace(".go", "").replace(/\./g, "_");
  return `testeranto/bundles/${configKey}/${binaryName} '${jsonStr}'`;
};
var golangBuildKitBuild = async (config, configKey) => {
  const runtimeConfig = config.runtimes[configKey];
  if (!runtimeConfig) {
    throw new Error(`Configuration not found for ${configKey}`);
  }
  const buildKitConfig = runtimeConfig.buildKitOptions || {};
  const buildKitOptions = {
    runtime: "golang",
    configKey,
    dockerfilePath: runtimeConfig.dockerfile,
    buildContext: process.cwd(),
    cacheMounts: buildKitConfig.cacheMounts || ["/go/pkg/mod", "/root/.cache/go-build"],
    targetStage: buildKitConfig.targetStage,
    buildArgs: buildKitConfig.buildArgs || {}
  };
  console.log(`[Golang BuildKit] Building image for ${configKey}...`);
  const result = await BuildKitBuilder.buildImage(buildKitOptions);
  if (result.success) {
    console.log(`[Golang BuildKit] Successfully built image in ${result.duration}ms`);
  } else {
    console.error(`[Golang BuildKit] Build failed: ${result.error}`);
    throw new Error(`BuildKit build failed: ${result.error}`);
  }
};

// src/server/runtimes/ruby/docker.ts
import { join as join4 } from "path";

// src/server/runtimes/ruby/ruby.rb
var ruby_default = "require 'json'\nrequire 'fileutils'\nrequire 'pathname'\nrequire 'set'\nrequire 'digest'\n\nputs \"hello ruby builder!\", ARGV.inspect\n\n\nproject_config_file_path = ARGV[0]\nruby_config_file_path = ARGV[1]\ntest_name = ARGV[2]\n\nentryPoints = ARGV[3..-1]\n\n# puts \"ruby_config_file_path\", ruby_config_file_path\n# puts \"test_name\", test_name\n# puts \"project_config_file_path\", project_config_file_path\n# puts \"entryPoints\", entryPoints\n\n# Ensure the config file path is valid before requiring\n# if File.exist?(project_config_file_path)\n#   require project_config_file_path\n# else\n#   puts \"Config file not found: #{project_config_file_path}\"\n#   exit(1)\n# end\n\n# Load the ruby config to get test entry points\n# ruby_config = nil\n# if File.exist?(ruby_config_file_path)\n#   require ruby_config_file_path\n#   # Try to get the config constant; assuming it's named after the file\n#   config_name = File.basename(ruby_config_file_path, '.rb').split('_').map(&:capitalize).join\n#   if Object.const_defined?(config_name)\n#     ruby_config = Object.const_get(config_name)\n#   else\n#     puts \"Warning: Could not find constant #{config_name} in #{ruby_config_file_path}\"\n#     # Fallback: assume the config is assigned to a global variable or just loaded\n#     # We'll rely on the config being set via some other means\n#   end\n# else\n#   puts \"Ruby config file not found: #{ruby_config_file_path}\"\n#   exit(1)\n# end\n\n# Function to extract dependencies from a Ruby file\ndef extract_dependencies(file_path, base_dir = Dir.pwd)\n  dependencies = Set.new\n  visited = Set.new\n  \n  def follow_dependencies(current_file, deps, visited, base_dir)\n    return if visited.include?(current_file)\n    visited.add(current_file)\n    \n    # Add the current file to dependencies if it's a local file\n    if File.exist?(current_file) && current_file.start_with?(base_dir)\n      deps.add(current_file)\n    end\n    \n    # Read the file and look for require statements\n    begin\n      content = File.read(current_file)\n      \n      # Match require, require_relative, and load statements\n      # This regex captures the path inside quotes\n      content.scan(/(?:require|require_relative|load)\\s+(?:\\(\\s*)?['\"]([^'\"]+)['\"]/) do |match|\n        dep_path = match[0]\n        \n        # Determine the absolute path based on the type of require\n        absolute_path = nil\n        \n        if content.match?(/require_relative\\s+(?:\\(\\s*)?['\"]#{Regexp.escape(dep_path)}['\"]/)\n          # require_relative is relative to the current file\n          absolute_path = File.expand_path(dep_path, File.dirname(current_file))\n        elsif content.match?(/load\\s+(?:\\(\\s*)?['\"]#{Regexp.escape(dep_path)}['\"]/)\n          # load can be relative or absolute\n          if Pathname.new(dep_path).absolute?\n            absolute_path = dep_path\n          else\n            # Try to find in load paths\n            $LOAD_PATH.each do |load_path|\n              potential_path = File.expand_path(dep_path, load_path)\n              if File.exist?(potential_path)\n                absolute_path = potential_path\n                break\n              end\n            end\n            # If not found in load paths, try relative to current file\n            absolute_path ||= File.expand_path(dep_path, File.dirname(current_file))\n          end\n        else\n          # regular require - search in load paths\n          $LOAD_PATH.each do |load_path|\n            potential_path = File.expand_path(dep_path, load_path)\n            # Check for .rb extension\n            if File.exist?(potential_path) || File.exist?(potential_path + '.rb')\n              absolute_path = File.exist?(potential_path) ? potential_path : potential_path + '.rb'\n              break\n            end\n          end\n        end\n        \n        # If we found a path and it's a local file, follow it\n        if absolute_path && File.exist?(absolute_path) && absolute_path.start_with?(base_dir)\n          # Add .rb extension if missing\n          if !absolute_path.end_with?('.rb') && File.exist?(absolute_path + '.rb')\n            absolute_path += '.rb'\n          end\n          \n          follow_dependencies(absolute_path, deps, visited, base_dir)\n        end\n      end\n    rescue => e\n      puts \"Warning: Could not read or parse #{current_file}: #{e.message}\"\n    end\n  end\n  \n  follow_dependencies(file_path, dependencies, visited, base_dir)\n  dependencies.to_a\nend\n\n# Function to convert absolute paths to workspace-relative paths\ndef to_workspace_relative_paths(files, workspace_root = '/workspace')\n  files.map do |file|\n    absolute_path = File.expand_path(file)\n    if absolute_path.start_with?(workspace_root)\n      absolute_path.slice(workspace_root.length..-1)\n    else\n      # If not under workspace, use relative path from current directory\n      Pathname.new(absolute_path).relative_path_from(Pathname.new(Dir.pwd)).to_s\n    end\n  end\nend\n\n# Helper to compute a simple hash from file paths and contents\ndef compute_files_hash(files)\n  require 'digest'\n  \n  hash = Digest::MD5.new\n  \n  files.each do |file|\n    begin\n      if File.exist?(file)\n        stats = File.stat(file)\n        hash.update(file)\n        hash.update(stats.mtime.to_f.to_s)\n        hash.update(stats.size.to_s)\n      else\n        # File may not exist, include its name anyway\n        hash.update(file)\n        hash.update('missing')\n      end\n    rescue => error\n      # If we can't stat the file, still include its name\n      hash.update(file)\n      hash.update('error')\n    end\n  end\n  \n  hash.hexdigest\nend\n\nentryPoints.each do |entry_point|\n    # Only process test files (files ending with .test.rb, .spec.rb, etc.)\n    # next unless entry_point =~ /\\.(test|spec)\\.rb$/\n    \n    puts \"Processing Ruby test: #{entry_point}\"\n    \n    # Get absolute path to entry point\n    entry_point_path = File.expand_path(entry_point)\n    \n    # Extract all dependencies\n    all_dependencies = extract_dependencies(entry_point_path)\n    \n    # Convert to workspace-relative paths\n    workspace_root = '/workspace'\n    relative_files = to_workspace_relative_paths(all_dependencies, workspace_root)\n    \n    # Create output directory structure similar to Node builder\n    output_base_name = File.basename(entry_point_path, '.rb')\n    input_files_path = \"testeranto/bundles/#{test_name}/#{entry_point}-inputFiles.json\"\n    \n    # Ensure directory exists\n    FileUtils.mkdir_p(File.dirname(input_files_path))\n    \n    # Write the input files JSON\n    File.write(input_files_path, JSON.pretty_generate(relative_files))\n    puts \"Wrote #{relative_files.length} input files to #{input_files_path}\"\n    \n    # Compute hash of input files\n    files_hash = compute_files_hash(all_dependencies)\n    \n    # Create the dummy bundle file that requires the original test file\n    bundle_path = \"testeranto/bundles/#{test_name}/#{entry_point}\"\n    \n    # Write a dummy file that loads and executes the original test file\n    # Using load ensures the file is executed every time\n    dummy_content = <<~RUBY\n      # Dummy bundle file generated by testeranto\n      # Hash: #{files_hash}\n      # This file loads and executes the original test file: #{entry_point}\n      \n      # Add the original file's directory to load path if needed\n      original_dir = File.dirname('#{entry_point_path}')\n      $LOAD_PATH.unshift(original_dir) unless $LOAD_PATH.include?(original_dir)\n      \n      # Load and execute the original test file\n      # Using load instead of require ensures execution every time\n      load '#{entry_point_path}'\n      \n      # If the test framework requires explicit test execution, add it here\n      # For example:\n      #   TestFramework.run if defined?(TestFramework)\n      # This depends on the specific test framework being used\n    RUBY\n    \n    File.write(bundle_path, dummy_content)\n    puts \"Created dummy bundle file at #{bundle_path}\"\n  end\n  \n\n\n\nputs \"Ruby builder completed\"\n";

// src/server/runtimes/ruby/docker.ts
var rubyScriptPath = join4(process.cwd(), "testeranto", "ruby_runtime.rb");
await Bun.write(rubyScriptPath, ruby_default);
var rubyDockerComposeFile = (config, container_name, projectConfigPath, rubyConfigPath, testName) => {
  const tests = config.runtimes[testName]?.tests || [];
  const service = {
    build: {
      context: process.cwd(),
      dockerfile: config.runtimes[container_name]?.dockerfile || "testeranto/runtimes/ruby/ruby.Dockerfile"
    },
    container_name,
    environment: {
      ENV: "ruby"
    },
    working_dir: "/workspace",
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/testeranto:/workspace/testeranto`
    ],
    command: rubyBuildCommand(projectConfigPath, rubyConfigPath, testName, tests),
    networks: ["allTests_network"]
  };
  return service;
};
var rubyBuildCommand = (projectConfigPath, rubyConfigPath, testName, tests) => {
  return `MODE=${process.env.MODE || "once"} ruby /workspace/testeranto/ruby_runtime.rb /workspace/${projectConfigPath} /workspace/${rubyConfigPath} ${testName} ${tests.join(" ")}`;
};
var rubyBddCommand = (fpath, rubyConfigPath, configKey) => {
  const jsonStr = JSON.stringify({
    name: "ruby-test",
    ports: [1111],
    fs: "testeranto/reports/ruby",
    timeout: 30000,
    retries: 0,
    environment: {}
  });
  return `ruby testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
};
var rubyBuildKitBuild = async (config, configKey) => {
  const runtimeConfig = config.runtimes[configKey];
  if (!runtimeConfig) {
    throw new Error(`Configuration not found for ${configKey}`);
  }
  const buildKitConfig = runtimeConfig.buildKitOptions || {};
  const buildKitOptions = {
    runtime: "ruby",
    configKey,
    dockerfilePath: runtimeConfig.dockerfile,
    buildContext: process.cwd(),
    cacheMounts: buildKitConfig.cacheMounts || ["/usr/local/bundle"],
    targetStage: buildKitConfig.targetStage,
    buildArgs: buildKitConfig.buildArgs || {}
  };
  console.log(`[Ruby BuildKit] Building image for ${configKey}...`);
  const result = await BuildKitBuilder.buildImage(buildKitOptions);
  if (result.success) {
    console.log(`[Ruby BuildKit] Successfully built image in ${result.duration}ms`);
  } else {
    console.error(`[Ruby BuildKit] Build failed: ${result.error}`);
    throw new Error(`BuildKit build failed: ${result.error}`);
  }
};

// src/server/runtimes/rust/docker.ts
import { join as join5 } from "path";

// src/server/runtimes/rust/main.rs
var main_default2 = "// The rust builder\n// runs in a docker image and produces built rust tests\n\nuse std::env;\nuse std::fs;\nuse std::path::Path;\nuse std::process::Command;\nuse serde_json;\n\nfn main() -> Result<(), Box<dyn std::error::Error>> {\n    println!(\"\uD83D\uDE80 Rust builder starting...\");\n    \n    // Parse command line arguments\n    let args: Vec<String> = env::args().collect();\n    \n    if args.len() < 4 {\n        eprintln!(\"\u274C Insufficient arguments\");\n        eprintln!(\"Usage: {} <project_config> <rust_config> <test_name> <entry_points...>\", args[0]);\n        std::process::exit(1);\n    }\n    \n    let project_config_file_path = &args[1];\n    let rust_config_file_path = &args[2];\n    let test_name = &args[3];\n    let entry_points = &args[4..];\n    \n    println!(\"Test name: {}\", test_name);\n    println!(\"Entry points: {:?}\", entry_points);\n    \n    if entry_points.is_empty() {\n        eprintln!(\"\u274C No entry points provided\");\n        std::process::exit(1);\n    }\n    \n    // Change to workspace directory\n    let workspace = Path::new(\"/workspace\");\n    env::set_current_dir(workspace)?;\n    \n    // Check if we're in a Cargo project\n    let cargo_toml_path = workspace.join(\"Cargo.toml\");\n    if !cargo_toml_path.exists() {\n        eprintln!(\"\u274C Not a Cargo project: Cargo.toml not found\");\n        std::process::exit(1);\n    }\n    \n    // Create bundles directory\n    let bundles_dir = workspace.join(\"testeranto/bundles\").join(test_name);\n    fs::create_dir_all(&bundles_dir)?;\n    \n    // Process each entry point\n    for entry_point in entry_points {\n        println!(\"\\n\uD83D\uDCE6 Processing Rust test: {}\", entry_point);\n        \n        // Get entry point path\n        let entry_point_path = Path::new(entry_point);\n        if !entry_point_path.exists() {\n            eprintln!(\"  \u274C Entry point does not exist: {}\", entry_point);\n            std::process::exit(1);\n        }\n        \n        // Get base name (without .rs extension)\n        let file_name = entry_point_path.file_name()\n            .unwrap_or_default()\n            .to_str()\n            .unwrap_or(\"\");\n        if !file_name.ends_with(\".rs\") {\n            eprintln!(\"  \u274C Entry point is not a Rust file: {}\", entry_point);\n            std::process::exit(1);\n        }\n        let base_name_with_dots = &file_name[..file_name.len() - 3];\n        // Replace dots with underscores to make a valid Rust crate name\n        let base_name: String = base_name_with_dots.replace('.', \"_\");\n        \n        // Create inputFiles.json\n        let input_files = collect_input_files(entry_point_path);\n        let input_files_basename = entry_point.replace(\"/\", \"_\").replace(\"\\\\\", \"_\") + \"-inputFiles.json\";\n        let input_files_path = bundles_dir.join(input_files_basename);\n        fs::write(&input_files_path, serde_json::to_string_pretty(&input_files)?)?;\n        println!(\"  \u2705 Created inputFiles.json\");\n        \n        // Create a temporary directory for this test\n        let temp_dir = workspace.join(\"target\").join(\"testeranto_temp\").join(&base_name);\n        fs::create_dir_all(&temp_dir)?;\n        \n        // Create Cargo.toml with necessary dependencies\n        let cargo_toml_content = format!(r#\"[package]\nname = \"{}\"\nversion = \"0.1.0\"\nedition = \"2021\"\n\n[dependencies]\ntesteranto_rusto = \"0.1\"\nserde = {{ version = \"1.0\", features = [\"derive\"] }}\ntokio = {{ version = \"1.0\", features = [\"full\"] }}\nserde_json = \"1.0\"\n\"#, base_name);\n        \n        fs::write(temp_dir.join(\"Cargo.toml\"), cargo_toml_content)?;\n        \n        // Create src directory and copy the test file as main.rs\n        let src_dir = temp_dir.join(\"src\");\n        fs::create_dir_all(&src_dir)?;\n        fs::copy(entry_point_path, src_dir.join(\"main.rs\"))?;\n        \n        println!(\"  \uD83D\uDCDD Created temporary Cargo project\");\n        \n        // Compile the binary\n        println!(\"  \uD83D\uDD28 Compiling with cargo...\");\n        let status = Command::new(\"cargo\")\n            .current_dir(&temp_dir)\n            .args(&[\"build\", \"--release\"])\n            .status()?;\n        \n        if !status.success() {\n            eprintln!(\"  \u274C Cargo build failed for {}\", base_name);\n            std::process::exit(1);\n        }\n        \n        // Source binary path (cargo output)\n        let source_bin = temp_dir.join(\"target/release\").join(&base_name);\n        if !source_bin.exists() {\n            eprintln!(\"  \u274C Compiled binary not found at {:?}\", source_bin);\n            std::process::exit(1);\n        }\n        \n        // Destination binary path in bundle directory\n        let dest_bin = bundles_dir.join(&base_name);\n        fs::copy(&source_bin, &dest_bin)?;\n        \n        // Make executable\n        #[cfg(unix)]\n        {\n            use std::os::unix::fs::PermissionsExt;\n            let mut perms = fs::metadata(&dest_bin)?.permissions();\n            perms.set_mode(0o755);\n            fs::set_permissions(&dest_bin, perms)?;\n        }\n        \n        println!(\"  \u2705 Compiled binary at: {:?}\", dest_bin);\n        \n        // Create dummy bundle file (for consistency with other runtimes)\n        let dummy_path = bundles_dir.join(entry_point);\n        if let Some(parent) = dummy_path.parent() {\n            fs::create_dir_all(parent)?;\n        }\n        \n        let dummy_content = format!(r#\"#!/usr/bin/env bash\n# Dummy bundle file generated by testeranto\n# This file execs the compiled Rust binary\n\nexec \"{}/{}\" \"$@\"\n\"#, bundles_dir.display(), &base_name);\n        \n        fs::write(&dummy_path, dummy_content)?;\n        \n        #[cfg(unix)]\n        {\n            use std::os::unix::fs::PermissionsExt;\n            let mut perms = fs::metadata(&dummy_path)?.permissions();\n            perms.set_mode(0o755);\n            fs::set_permissions(&dummy_path, perms)?;\n        }\n        \n        println!(\"  \u2705 Created dummy bundle file\");\n        \n        // Clean up: remove temporary directory\n        let _ = fs::remove_dir_all(temp_dir);\n    }\n    \n    println!(\"\\n\uD83C\uDF89 Rust builder completed successfully\");\n    Ok(())\n}\n\nfn collect_input_files(test_path: &Path) -> Vec<String> {\n    let mut files = Vec::new();\n    let workspace = Path::new(\"/workspace\");\n    \n    // Add the test file itself\n    if let Ok(relative) = test_path.strip_prefix(workspace) {\n        files.push(relative.to_string_lossy().to_string());\n    } else {\n        files.push(test_path.to_string_lossy().to_string());\n    }\n    \n    // Add Cargo.toml\n    let cargo_toml = workspace.join(\"Cargo.toml\");\n    if cargo_toml.exists() {\n        files.push(\"Cargo.toml\".to_string());\n    }\n    \n    // Add Cargo.lock if present\n    let cargo_lock = workspace.join(\"Cargo.lock\");\n    if cargo_lock.exists() {\n        files.push(\"Cargo.lock\".to_string());\n    }\n    \n    // Add all .rs files in src/ directory\n    let src_dir = workspace.join(\"src\");\n    if src_dir.exists() {\n        if let Ok(entries) = fs::read_dir(src_dir) {\n            for entry in entries.flatten() {\n                let path = entry.path();\n                if path.extension().map(|e| e == \"rs\").unwrap_or(false) {\n                    if let Ok(relative) = path.strip_prefix(workspace) {\n                        files.push(relative.to_string_lossy().to_string());\n                    }\n                }\n            }\n        }\n    }\n    \n    files\n}\n";

// src/server/runtimes/rust/docker.ts
var rustDir = join5(process.cwd(), "testeranto", "rust_builder");
var rustScriptPath = join5(rustDir, "src", "main.rs");
var cargoTomlPath = join5(rustDir, "Cargo.toml");
await Bun.$`mkdir -p ${join5(rustDir, "src")}`;
await Bun.write(rustScriptPath, main_default2);
var cargoTomlContent = `[package]
name = "rust_builder"
version = "0.1.0"
edition = "2021"

[dependencies]
serde_json = "1.0"
serde = { version = "1.0", features = ["derive"] }`;
await Bun.write(cargoTomlPath, cargoTomlContent);
var rustDockerComposeFile = (config, container_name, projectConfigPath, rustConfigPath, testName) => {
  const tests = config.runtimes[testName]?.tests || [];
  const service = {
    build: {
      context: process.cwd(),
      dockerfile: config.runtimes[container_name]?.dockerfile || "testeranto/runtimes/rust/rust.Dockerfile"
    },
    container_name,
    environment: {
      ENV: "rust"
    },
    working_dir: "/workspace",
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/testeranto:/workspace/testeranto`
    ],
    command: rustBuildCommand(projectConfigPath, rustConfigPath, testName, tests),
    networks: ["allTests_network"]
  };
  return service;
};
var rustBuildCommand = (projectConfigPath, rustConfigPath, testName, tests) => {
  return `MODE=${process.env.MODE || "once"} cargo run --manifest-path /workspace/testeranto/rust_builder/Cargo.toml -- /workspace/${projectConfigPath} /workspace/${rustConfigPath} ${testName} ${tests.join(" ")}`;
};
var rustBddCommand = (fpath, rustConfigPath, configKey) => {
  const jsonStr = JSON.stringify({
    name: "rust-test",
    ports: [1111],
    fs: "testeranto/reports/rust",
    timeout: 30000,
    retries: 0,
    environment: {}
  });
  const pathParts = fpath.split("/");
  const fileName = pathParts[pathParts.length - 1];
  const binaryName = fileName.replace(".rs", "").replace(/\./g, "_");
  return `testeranto/bundles/${configKey}/${binaryName} '${jsonStr}'`;
};
var rustBuildKitBuild = async (config, configKey) => {
  const runtimeConfig = config.runtimes[configKey];
  if (!runtimeConfig) {
    throw new Error(`Configuration not found for ${configKey}`);
  }
  const buildKitConfig = runtimeConfig.buildKitOptions || {};
  const buildKitOptions = {
    runtime: "rust",
    configKey,
    dockerfilePath: runtimeConfig.dockerfile,
    buildContext: process.cwd(),
    cacheMounts: buildKitConfig.cacheMounts || ["/usr/local/cargo/registry", "/usr/local/cargo/git"],
    targetStage: buildKitConfig.targetStage,
    buildArgs: buildKitConfig.buildArgs || {}
  };
  console.log(`[Rust BuildKit] Building image for ${configKey}...`);
  const result = await BuildKitBuilder.buildImage(buildKitOptions);
  if (result.success) {
    console.log(`[Rust BuildKit] Successfully built image in ${result.duration}ms`);
  } else {
    console.error(`[Rust BuildKit] Build failed: ${result.error}`);
    throw new Error(`BuildKit build failed: ${result.error}`);
  }
};

// src/server/runtimes/java/docker.ts
var javaDockerComposeFile = (config, container_name, projectConfigPath, javaConfigPath, testName) => {
  const service = {
    build: {
      context: process.cwd(),
      dockerfile: config.runtimes[container_name]?.dockerfile || "testeranto/runtimes/java/java.Dockerfile"
    },
    container_name,
    environment: {
      ENV: "java"
    },
    working_dir: "/workspace",
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/testeranto:/workspace/testeranto`
    ],
    command: javaBuildCommand(projectConfigPath, javaConfigPath, testName),
    networks: ["allTests_network"]
  };
  return service;
};
var javaBuildCommand = (projectConfigPath, javaConfigPath, testName) => {
  return `MODE=${process.env.MODE || "once"} java src/server/runtimes/java/main.java /workspace/${projectConfigPath} /workspace/${javaConfigPath} ${testName}`;
};
var javaBddCommand = (fpath, javaConfigPath, configKey) => {
  const jsonStr = JSON.stringify({
    name: "java-test",
    ports: [1111],
    fs: "testeranto/reports/java",
    timeout: 30000,
    retries: 0,
    environment: {}
  });
  return `java -jar testeranto/bundles/${configKey}/${fpath.replace(".java", ".jar")} '${jsonStr}'`;
};
var javaBuildKitBuild = async (config, configKey) => {
  const runtimeConfig = config.runtimes[configKey];
  if (!runtimeConfig) {
    throw new Error(`Configuration not found for ${configKey}`);
  }
  const buildKitConfig = runtimeConfig.buildKitOptions || {};
  const buildKitOptions = {
    runtime: "java",
    configKey,
    dockerfilePath: runtimeConfig.dockerfile,
    buildContext: process.cwd(),
    cacheMounts: buildKitConfig.cacheMounts || ["/root/.m2", "/root/.gradle"],
    targetStage: buildKitConfig.targetStage,
    buildArgs: buildKitConfig.buildArgs || {}
  };
  console.log(`[Java BuildKit] Building image for ${configKey}...`);
  const result = await BuildKitBuilder.buildImage(buildKitOptions);
  if (result.success) {
    console.log(`[Java BuildKit] Successfully built image in ${result.duration}ms`);
  } else {
    console.error(`[Java BuildKit] Build failed: ${result.error}`);
    throw new Error(`BuildKit build failed: ${result.error}`);
  }
};

// src/server/runtimes/python/docker.ts
import { join as join6 } from "path";

// src/server/runtimes/python/python.py
var python_default = "#!/usr/bin/env python3\n\nimport sys\nimport json\nimport os\nimport ast\nfrom typing import Dict, List, Set, Any\nimport hashlib\n\nimport time\n\ndef resolve_python_import(import_path: str, current_file: str) -> str | None:\n    \"\"\"Resolve a Python import to a file path.\"\"\"\n    # Handle relative imports\n    if import_path.startswith('.'):\n        current_dir = os.path.dirname(current_file)\n        # Count dots\n        dot_count = 0\n        remaining = import_path\n        while remaining.startswith('.'):\n            dot_count += 1\n            remaining = remaining[1:]\n        \n        # Remove leading slash\n        if remaining.startswith('/'):\n            remaining = remaining[1:]\n        \n        # Go up appropriate number of directories\n        base_dir = current_dir\n        for _ in range(1, dot_count):\n            base_dir = os.path.dirname(base_dir)\n        \n        # Handle case with no remaining path\n        if not remaining:\n            init_path = os.path.join(base_dir, '__init__.py')\n            if os.path.exists(init_path):\n                return init_path\n            return None\n        \n        # Resolve full path\n        resolved = os.path.join(base_dir, remaining)\n        \n        # Try different extensions\n        for ext in ['.py', '/__init__.py']:\n            potential = resolved + ext\n            if os.path.exists(potential):\n                return potential\n        \n        # Check if it's a directory with __init__.py\n        if os.path.exists(resolved) and os.path.isdir(resolved):\n            init_path = os.path.join(resolved, '__init__.py')\n            if os.path.exists(init_path):\n                return init_path\n        return None\n    \n    # Handle absolute imports\n    # Look in various directories\n    dirs = [\n        os.path.dirname(current_file),\n        os.getcwd(),\n    ] + os.environ.get('PYTHONPATH', '').split(os.pathsep)\n    \n    for dir_path in dirs:\n        if not dir_path:\n            continue\n        potential_paths = [\n            os.path.join(dir_path, import_path + '.py'),\n            os.path.join(dir_path, import_path, '__init__.py'),\n            os.path.join(dir_path, import_path.replace('.', '/') + '.py'),\n            os.path.join(dir_path, import_path.replace('.', '/'), '__init__.py'),\n        ]\n        for potential in potential_paths:\n            if os.path.exists(potential):\n                return potential\n    return None\n\ndef parse_python_imports(file_path: str) -> List[Dict[str, Any]]:\n    \"\"\"Parse import statements from a Python file.\"\"\"\n    try:\n        with open(file_path, 'r', encoding='utf-8') as f:\n            content = f.read()\n    except Exception as e:\n        print(f\"Warning: Could not read {file_path}: {e}\")\n        return []\n    \n    try:\n        tree = ast.parse(content)\n    except SyntaxError as e:\n        print(f\"Warning: Syntax error in {file_path}: {e}\")\n        return []\n    \n    imports = []\n    \n    for node in ast.walk(tree):\n        if isinstance(node, ast.Import):\n            for alias in node.names:\n                import_path = alias.name\n                resolved = resolve_python_import(import_path, file_path)\n                imports.append({\n                    'path': import_path,\n                    'kind': 'import-statement',\n                    'external': resolved is None,\n                })\n        elif isinstance(node, ast.ImportFrom):\n            if node.module:\n                import_path = node.module\n                resolved = resolve_python_import(import_path, file_path)\n                imports.append({\n                    'path': import_path,\n                    'kind': 'import-statement',\n                    'external': resolved is None,\n                })\n    return imports\n\ndef collect_dependencies(file_path: str, visited: Set[str] = None) -> List[str]:\n    \"\"\"Collect all dependencies of a Python file recursively.\"\"\"\n    if visited is None:\n        visited = set()\n    \n    if file_path in visited:\n        return []\n    visited.add(file_path)\n    \n    dependencies = [file_path]\n    imports = parse_python_imports(file_path)\n    \n    for imp in imports:\n        if not imp.get('external') and imp['path']:\n            resolved = resolve_python_import(imp['path'], file_path)\n            if resolved and os.path.exists(resolved):\n                dependencies.extend(collect_dependencies(resolved, visited))\n    \n    # Remove duplicates\n    seen = set()\n    unique = []\n    for dep in dependencies:\n        if dep not in seen:\n            seen.add(dep)\n            unique.append(dep)\n    return unique\n\ndef topological_sort(files: List[str]) -> List[str]:\n    \"\"\"Sort files based on import dependencies.\"\"\"\n    # Build dependency graph\n    graph = {file: set() for file in files}\n    for file in files:\n        imports = parse_python_imports(file)\n        for imp in imports:\n            if not imp.get('external') and imp['path']:\n                resolved = resolve_python_import(imp['path'], file)\n                if resolved and resolved in files:\n                    graph[file].add(resolved)\n    \n    # Kahn's algorithm\n    in_degree = {node: 0 for node in graph}\n    for node in graph:\n        for neighbor in graph[node]:\n            in_degree[neighbor] += 1\n    \n    # Queue of nodes with no incoming edges\n    queue = [node for node in graph if in_degree[node] == 0]\n    sorted_list = []\n    \n    while queue:\n        node = queue.pop(0)\n        sorted_list.append(node)\n        for neighbor in graph[node]:\n            in_degree[neighbor] -= 1\n            if in_degree[neighbor] == 0:\n                queue.append(neighbor)\n    \n    # Check for cycles\n    if len(sorted_list) != len(files):\n        print(\"Warning: Circular dependencies detected, using original order\")\n        return files\n    \n    return sorted_list\n\ndef strip_imports(content: str) -> str:\n    \"\"\"Remove import statements from Python code.\"\"\"\n    lines = content.split('\\n')\n    result_lines = []\n    in_multiline_string = False\n    multiline_delimiter = None\n    \n    for line in lines:\n        # Handle multiline strings\n        stripped_line = line.strip()\n        if not in_multiline_string:\n            # Check for start of multiline string\n            if stripped_line.startswith('\"\"\"') or stripped_line.startswith(\"'''\"):\n                # Check if it's a single line or multiline\n                if stripped_line.count('\"\"\"') == 1 or stripped_line.count(\"'''\") == 1:\n                    in_multiline_string = True\n                    multiline_delimiter = stripped_line[:3]\n                result_lines.append(line)\n                continue\n            # Check for import statements\n            elif stripped_line.startswith('import ') or stripped_line.startswith('from '):\n                # Skip this line\n                continue\n            else:\n                result_lines.append(line)\n        else:\n            # Inside a multiline string\n            result_lines.append(line)\n            # Check for end of multiline string\n            if multiline_delimiter in stripped_line:\n                # Count occurrences to handle cases where delimiter appears in the string\n                if stripped_line.count(multiline_delimiter) % 2 == 1:\n                    in_multiline_string = False\n                    multiline_delimiter = None\n    \n    return '\\n'.join(result_lines)\n\ndef bundle_python_files(entry_point: str, test_name: str, output_base_dir: str) -> str:\n    \"\"\"Generate bundle files similar to Ruby runtime.\"\"\"\n    print(f\"[Python Builder] Processing: {entry_point}\")\n    \n    # Use the original entry point path to preserve directory structure\n    # This matches Ruby's pattern: testeranto/bundles/#{test_name}/#{entry_point}\n    # entry_point might be something like \"src/python/Calculator.pitono.test.py\"\n    \n    # Create the bundle path: testeranto/bundles/{test_name}/{entry_point}\n    # We need to handle both absolute and relative paths\n    if os.path.isabs(entry_point):\n        # If it's an absolute path, make it relative to current directory\n        # But first check if it's under workspace\n        workspace_root = '/workspace'\n        if entry_point.startswith(workspace_root):\n            # Make it relative to workspace root\n            rel_entry_path = entry_point[len(workspace_root):]\n            if rel_entry_path.startswith('/'):\n                rel_entry_path = rel_entry_path[1:]\n        else:\n            # Make it relative to current directory\n            rel_entry_path = os.path.relpath(entry_point, os.getcwd())\n    else:\n        # It's already a relative path\n        rel_entry_path = entry_point\n    \n    print(f\"[Python Builder] Using entry path: {rel_entry_path}\")\n    \n    # Create output directory structure: testeranto/bundles/{test_name}/{dir_of_rel_entry_path}\n    output_dir = os.path.join(output_base_dir, test_name, os.path.dirname(rel_entry_path))\n    # Remove any empty directory component\n    if output_dir.endswith('.'):\n        output_dir = os.path.dirname(output_dir)\n    os.makedirs(output_dir, exist_ok=True)\n    \n    # Get entry point filename\n    entry_filename = os.path.basename(entry_point)\n    \n    # 1. Collect all dependencies\n    all_deps = collect_dependencies(entry_point)\n    # Ensure entry point is included\n    if entry_point not in all_deps:\n        all_deps.append(entry_point)\n    # Sort for consistency\n    all_deps = sorted(set(all_deps))\n    \n    print(f\"[Python Builder] Found {len(all_deps)} dependencies\")\n    \n    # 2. Compute hash of input files (similar to Ruby's compute_files_hash)\n    files_hash = compute_files_hash(all_deps)\n    print(f\"[Python Builder] Computed hash: {files_hash}\")\n    \n    # 3. Write input files JSON\n    # Convert to workspace-relative paths\n    relative_files = []\n    for dep in all_deps:\n        abs_path = os.path.abspath(dep)\n        if abs_path.startswith(workspace_root):\n            rel_path = abs_path[len(workspace_root):]\n            # Ensure it starts with /\n            if not rel_path.startswith('/'):\n                rel_path = '/' + rel_path\n            relative_files.append(rel_path)\n        else:\n            # If not under workspace, use relative path from current directory\n            rel_path = os.path.relpath(abs_path, os.getcwd())\n            relative_files.append(rel_path)\n    \n    # Create input files path similar to Ruby: testeranto/bundles/{test_name}/{entry_point}-inputFiles.json\n    # The Ruby builder uses: \"testeranto/bundles/#{test_name}/#{entry_point}-inputFiles.json\"\n    # We need to handle the path correctly\n    # First, normalize the entry point path for use in filename\n    input_files_basename = rel_entry_path.replace('/', '_').replace('\\\\', '_') + '-inputFiles.json'\n    input_files_path = os.path.join(output_base_dir, test_name, input_files_basename)\n    \n    # Ensure directory exists\n    os.makedirs(os.path.dirname(input_files_path), exist_ok=True)\n    \n    with open(input_files_path, 'w', encoding='utf-8') as f:\n        json.dump(relative_files, f, indent=2)\n    print(f\"[Python Builder] Wrote input files to: {input_files_path}\")\n    \n    # 4. Create dummy bundle file that loads the original test file\n    # Similar to Ruby: testeranto/bundles/#{test_name}/#{entry_point}\n    bundle_path = os.path.join(output_base_dir, test_name, rel_entry_path)\n    \n    # Ensure the directory for the bundle exists\n    os.makedirs(os.path.dirname(bundle_path), exist_ok=True)\n    \n    # Create a simple bundle that loads and executes the original test file\n    # Use absolute path for the original test file\n    original_test_abs = os.path.abspath(entry_point)\n    bundle_content = f'''#!/usr/bin/env python3\n# Dummy bundle file generated by testeranto\n# Hash: {files_hash}\n# This file loads and executes the original test file: {original_test_abs}\n\nimport sys\nimport os\n\n# Add the original file's directory to sys.path if needed\noriginal_dir = os.path.dirname(r'{original_test_abs}')\nif original_dir not in sys.path:\n    sys.path.insert(0, original_dir)\n\n# Load and execute the original test file\n# Using exec to ensure execution every time\nwith open(r'{original_test_abs}', 'r', encoding='utf-8') as f:\n    code = f.read()\n\n# Execute the code in the global namespace\nexec(code, {{'__name__': '__main__', '__file__': r'{original_test_abs}'}})\n\n# If the test framework requires explicit test execution, add it here\n# For example:\n#   if 'TestFramework' in locals():\n#       TestFramework.run()\n'''\n    \n    with open(bundle_path, 'w', encoding='utf-8') as f:\n        f.write(bundle_content)\n    \n    # Make executable\n    try:\n        os.chmod(bundle_path, 0o755)\n    except:\n        pass\n    \n    print(f\"[Python Builder] Created dummy bundle file at: {bundle_path}\")\n    \n    return input_files_path\n\n# Remove generate_metafile function as we're following Ruby pattern\n\ndef compute_files_hash(files: List[str]) -> str:\n    \"\"\"Compute a simple hash from file paths and contents, similar to Ruby's compute_files_hash.\"\"\"\n    import hashlib\n    \n    hash_obj = hashlib.md5()\n    \n    for file_path in files:\n        try:\n            if os.path.exists(file_path):\n                # Add file path\n                hash_obj.update(file_path.encode('utf-8'))\n                # Add file stats\n                stats = os.stat(file_path)\n                hash_obj.update(str(stats.st_mtime).encode('utf-8'))\n                hash_obj.update(str(stats.st_size).encode('utf-8'))\n            else:\n                # File may not exist, include its name anyway\n                hash_obj.update(file_path.encode('utf-8'))\n                hash_obj.update(b'missing')\n        except Exception as error:\n            # If we can't stat the file, still include its name\n            hash_obj.update(file_path.encode('utf-8'))\n            hash_obj.update(b'error')\n    \n    return hash_obj.hexdigest()\n\ndef main():\n    print(f\"[Python Builder] ARGV: {sys.argv}\")\n    \n    # Parse command line arguments similar to Ruby runtime\n    # Expected: python.py project_config_file_path python_config_file_path test_name entryPoints...\n    if len(sys.argv) < 4:\n        print(\"[Python Builder] Error: Insufficient arguments\")\n        print(\"Usage: python.py <project_config> <python_config> <test_name> <entry_points...>\")\n        sys.exit(1)\n    \n    project_config_file_path = sys.argv[1]\n    python_config_file_path = sys.argv[2]\n    test_name = sys.argv[3]\n    entry_points = sys.argv[4:]\n    \n    print(f\"[Python Builder] Project config: {project_config_file_path}\")\n    print(f\"[Python Builder] Python config: {python_config_file_path}\")\n    print(f\"[Python Builder] Test name: {test_name}\")\n    print(f\"[Python Builder] Entry points: {entry_points}\")\n    \n    # Process each entry point\n    for entry_point in entry_points:\n        print(f\"[Python Builder] Processing Python test: {entry_point}\")\n        \n        # Get absolute path to entry point\n        entry_point_path = os.path.abspath(entry_point)\n        \n        # Check if entry point exists\n        if not os.path.exists(entry_point_path):\n            print(f\"[Python Builder] Error: Entry point does not exist: {entry_point_path}\")\n            sys.exit(1)\n        \n        # Create bundle files\n        # Base directory for bundles: testeranto/bundles/\n        output_base_dir = \"testeranto/bundles\"\n        os.makedirs(output_base_dir, exist_ok=True)\n        \n        # Generate bundle files\n        input_files_path = bundle_python_files(entry_point_path, test_name, output_base_dir)\n        \n        print(f\"[Python Builder] Completed processing: {entry_point}\")\n    \n    print(\"[Python Builder] Python builder completed\")\n\nif __name__ == \"__main__\":\n    main()\n";

// src/server/runtimes/python/docker.ts
var pythonScriptPath = join6(process.cwd(), "testeranto", "python_runtime.py");
await Bun.write(pythonScriptPath, python_default);
var pythonDockerComposeFile = (config, container_name, projectConfigPath, pythonConfigPath, testName) => {
  const tests = config.runtimes[testName]?.tests || [];
  const service = {
    build: {
      context: process.cwd(),
      dockerfile: config.runtimes[container_name]?.dockerfile || "testeranto/runtimes/python/python.Dockerfile"
    },
    container_name,
    environment: {
      ENV: "python"
    },
    working_dir: "/workspace",
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/testeranto:/workspace/testeranto`
    ],
    command: pythonBuildCommand(projectConfigPath, pythonConfigPath, testName, tests),
    networks: ["allTests_network"]
  };
  return service;
};
var pythonBuildCommand = (projectConfigPath, pythonConfigPath, testName, tests) => {
  return `MODE=${process.env.MODE || "once"} python /workspace/testeranto/python_runtime.py /workspace/${projectConfigPath} /workspace/${pythonConfigPath} ${testName}  ${tests.join(" ")} `;
};
var pythonBddCommand = (fpath, pythonConfigPath, configKey) => {
  const jsonStr = JSON.stringify({ ports: [1111], fs: "testeranto/reports/pythontests" });
  return `python testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
};
var pythonBuildKitBuild = async (config, configKey) => {
  const runtimeConfig = config.runtimes[configKey];
  if (!runtimeConfig) {
    throw new Error(`Configuration not found for ${configKey}`);
  }
  const buildKitConfig = runtimeConfig.buildKitOptions || {};
  const buildKitOptions = {
    runtime: "python",
    configKey,
    dockerfilePath: runtimeConfig.dockerfile,
    buildContext: process.cwd(),
    cacheMounts: buildKitConfig.cacheMounts || ["/root/.cache/pip"],
    targetStage: buildKitConfig.targetStage,
    buildArgs: buildKitConfig.buildArgs || {}
  };
  console.log(`[Python BuildKit] Building image for ${configKey}...`);
  const result = await BuildKitBuilder.buildImage(buildKitOptions);
  if (result.success) {
    console.log(`[Python BuildKit] Successfully built image in ${result.duration}ms`);
  } else {
    console.error(`[Python BuildKit] Build failed: ${result.error}`);
    throw new Error(`BuildKit build failed: ${result.error}`);
  }
};

// src/server/serverClasses/Server_Docker_Utils.ts
import { exec as exec2 } from "child_process";
import { promisify as promisify2 } from "util";
import fs from "fs";

// node_modules/js-yaml/dist/js-yaml.mjs
/*! js-yaml 4.1.1 https://github.com/nodeca/js-yaml @license MIT */
function isNothing(subject) {
  return typeof subject === "undefined" || subject === null;
}
function isObject(subject) {
  return typeof subject === "object" && subject !== null;
}
function toArray(sequence) {
  if (Array.isArray(sequence))
    return sequence;
  else if (isNothing(sequence))
    return [];
  return [sequence];
}
function extend(target, source) {
  var index, length, key, sourceKeys;
  if (source) {
    sourceKeys = Object.keys(source);
    for (index = 0, length = sourceKeys.length;index < length; index += 1) {
      key = sourceKeys[index];
      target[key] = source[key];
    }
  }
  return target;
}
function repeat(string, count) {
  var result = "", cycle;
  for (cycle = 0;cycle < count; cycle += 1) {
    result += string;
  }
  return result;
}
function isNegativeZero(number) {
  return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
}
var isNothing_1 = isNothing;
var isObject_1 = isObject;
var toArray_1 = toArray;
var repeat_1 = repeat;
var isNegativeZero_1 = isNegativeZero;
var extend_1 = extend;
var common = {
  isNothing: isNothing_1,
  isObject: isObject_1,
  toArray: toArray_1,
  repeat: repeat_1,
  isNegativeZero: isNegativeZero_1,
  extend: extend_1
};
function formatError(exception, compact) {
  var where = "", message = exception.reason || "(unknown reason)";
  if (!exception.mark)
    return message;
  if (exception.mark.name) {
    where += 'in "' + exception.mark.name + '" ';
  }
  where += "(" + (exception.mark.line + 1) + ":" + (exception.mark.column + 1) + ")";
  if (!compact && exception.mark.snippet) {
    where += "\n\n" + exception.mark.snippet;
  }
  return message + " " + where;
}
function YAMLException$1(reason, mark) {
  Error.call(this);
  this.name = "YAMLException";
  this.reason = reason;
  this.mark = mark;
  this.message = formatError(this, false);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = new Error().stack || "";
  }
}
YAMLException$1.prototype = Object.create(Error.prototype);
YAMLException$1.prototype.constructor = YAMLException$1;
YAMLException$1.prototype.toString = function toString(compact) {
  return this.name + ": " + formatError(this, compact);
};
var exception = YAMLException$1;
function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
  var head = "";
  var tail = "";
  var maxHalfLength = Math.floor(maxLineLength / 2) - 1;
  if (position - lineStart > maxHalfLength) {
    head = " ... ";
    lineStart = position - maxHalfLength + head.length;
  }
  if (lineEnd - position > maxHalfLength) {
    tail = " ...";
    lineEnd = position + maxHalfLength - tail.length;
  }
  return {
    str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "\u2192") + tail,
    pos: position - lineStart + head.length
  };
}
function padStart(string, max) {
  return common.repeat(" ", max - string.length) + string;
}
function makeSnippet(mark, options) {
  options = Object.create(options || null);
  if (!mark.buffer)
    return null;
  if (!options.maxLength)
    options.maxLength = 79;
  if (typeof options.indent !== "number")
    options.indent = 1;
  if (typeof options.linesBefore !== "number")
    options.linesBefore = 3;
  if (typeof options.linesAfter !== "number")
    options.linesAfter = 2;
  var re = /\r?\n|\r|\0/g;
  var lineStarts = [0];
  var lineEnds = [];
  var match;
  var foundLineNo = -1;
  while (match = re.exec(mark.buffer)) {
    lineEnds.push(match.index);
    lineStarts.push(match.index + match[0].length);
    if (mark.position <= match.index && foundLineNo < 0) {
      foundLineNo = lineStarts.length - 2;
    }
  }
  if (foundLineNo < 0)
    foundLineNo = lineStarts.length - 1;
  var result = "", i, line;
  var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
  var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
  for (i = 1;i <= options.linesBefore; i++) {
    if (foundLineNo - i < 0)
      break;
    line = getLine(mark.buffer, lineStarts[foundLineNo - i], lineEnds[foundLineNo - i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]), maxLineLength);
    result = common.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line.str + "\n" + result;
  }
  line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
  result += common.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
  result += common.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^" + "\n";
  for (i = 1;i <= options.linesAfter; i++) {
    if (foundLineNo + i >= lineEnds.length)
      break;
    line = getLine(mark.buffer, lineStarts[foundLineNo + i], lineEnds[foundLineNo + i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]), maxLineLength);
    result += common.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line.str + "\n";
  }
  return result.replace(/\n$/, "");
}
var snippet = makeSnippet;
var TYPE_CONSTRUCTOR_OPTIONS = [
  "kind",
  "multi",
  "resolve",
  "construct",
  "instanceOf",
  "predicate",
  "represent",
  "representName",
  "defaultStyle",
  "styleAliases"
];
var YAML_NODE_KINDS = [
  "scalar",
  "sequence",
  "mapping"
];
function compileStyleAliases(map) {
  var result = {};
  if (map !== null) {
    Object.keys(map).forEach(function(style) {
      map[style].forEach(function(alias) {
        result[String(alias)] = style;
      });
    });
  }
  return result;
}
function Type$1(tag, options) {
  options = options || {};
  Object.keys(options).forEach(function(name) {
    if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
      throw new exception('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
    }
  });
  this.options = options;
  this.tag = tag;
  this.kind = options["kind"] || null;
  this.resolve = options["resolve"] || function() {
    return true;
  };
  this.construct = options["construct"] || function(data) {
    return data;
  };
  this.instanceOf = options["instanceOf"] || null;
  this.predicate = options["predicate"] || null;
  this.represent = options["represent"] || null;
  this.representName = options["representName"] || null;
  this.defaultStyle = options["defaultStyle"] || null;
  this.multi = options["multi"] || false;
  this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
  if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
    throw new exception('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
  }
}
var type = Type$1;
function compileList(schema, name) {
  var result = [];
  schema[name].forEach(function(currentType) {
    var newIndex = result.length;
    result.forEach(function(previousType, previousIndex) {
      if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
        newIndex = previousIndex;
      }
    });
    result[newIndex] = currentType;
  });
  return result;
}
function compileMap() {
  var result = {
    scalar: {},
    sequence: {},
    mapping: {},
    fallback: {},
    multi: {
      scalar: [],
      sequence: [],
      mapping: [],
      fallback: []
    }
  }, index, length;
  function collectType(type2) {
    if (type2.multi) {
      result.multi[type2.kind].push(type2);
      result.multi["fallback"].push(type2);
    } else {
      result[type2.kind][type2.tag] = result["fallback"][type2.tag] = type2;
    }
  }
  for (index = 0, length = arguments.length;index < length; index += 1) {
    arguments[index].forEach(collectType);
  }
  return result;
}
function Schema$1(definition) {
  return this.extend(definition);
}
Schema$1.prototype.extend = function extend2(definition) {
  var implicit = [];
  var explicit = [];
  if (definition instanceof type) {
    explicit.push(definition);
  } else if (Array.isArray(definition)) {
    explicit = explicit.concat(definition);
  } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
    if (definition.implicit)
      implicit = implicit.concat(definition.implicit);
    if (definition.explicit)
      explicit = explicit.concat(definition.explicit);
  } else {
    throw new exception("Schema.extend argument should be a Type, [ Type ], " + "or a schema definition ({ implicit: [...], explicit: [...] })");
  }
  implicit.forEach(function(type$1) {
    if (!(type$1 instanceof type)) {
      throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    }
    if (type$1.loadKind && type$1.loadKind !== "scalar") {
      throw new exception("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
    }
    if (type$1.multi) {
      throw new exception("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
    }
  });
  explicit.forEach(function(type$1) {
    if (!(type$1 instanceof type)) {
      throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    }
  });
  var result = Object.create(Schema$1.prototype);
  result.implicit = (this.implicit || []).concat(implicit);
  result.explicit = (this.explicit || []).concat(explicit);
  result.compiledImplicit = compileList(result, "implicit");
  result.compiledExplicit = compileList(result, "explicit");
  result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
  return result;
};
var schema = Schema$1;
var str = new type("tag:yaml.org,2002:str", {
  kind: "scalar",
  construct: function(data) {
    return data !== null ? data : "";
  }
});
var seq = new type("tag:yaml.org,2002:seq", {
  kind: "sequence",
  construct: function(data) {
    return data !== null ? data : [];
  }
});
var map = new type("tag:yaml.org,2002:map", {
  kind: "mapping",
  construct: function(data) {
    return data !== null ? data : {};
  }
});
var failsafe = new schema({
  explicit: [
    str,
    seq,
    map
  ]
});
function resolveYamlNull(data) {
  if (data === null)
    return true;
  var max = data.length;
  return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
}
function constructYamlNull() {
  return null;
}
function isNull(object) {
  return object === null;
}
var _null = new type("tag:yaml.org,2002:null", {
  kind: "scalar",
  resolve: resolveYamlNull,
  construct: constructYamlNull,
  predicate: isNull,
  represent: {
    canonical: function() {
      return "~";
    },
    lowercase: function() {
      return "null";
    },
    uppercase: function() {
      return "NULL";
    },
    camelcase: function() {
      return "Null";
    },
    empty: function() {
      return "";
    }
  },
  defaultStyle: "lowercase"
});
function resolveYamlBoolean(data) {
  if (data === null)
    return false;
  var max = data.length;
  return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
}
function constructYamlBoolean(data) {
  return data === "true" || data === "True" || data === "TRUE";
}
function isBoolean(object) {
  return Object.prototype.toString.call(object) === "[object Boolean]";
}
var bool = new type("tag:yaml.org,2002:bool", {
  kind: "scalar",
  resolve: resolveYamlBoolean,
  construct: constructYamlBoolean,
  predicate: isBoolean,
  represent: {
    lowercase: function(object) {
      return object ? "true" : "false";
    },
    uppercase: function(object) {
      return object ? "TRUE" : "FALSE";
    },
    camelcase: function(object) {
      return object ? "True" : "False";
    }
  },
  defaultStyle: "lowercase"
});
function isHexCode(c) {
  return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
}
function isOctCode(c) {
  return 48 <= c && c <= 55;
}
function isDecCode(c) {
  return 48 <= c && c <= 57;
}
function resolveYamlInteger(data) {
  if (data === null)
    return false;
  var max = data.length, index = 0, hasDigits = false, ch;
  if (!max)
    return false;
  ch = data[index];
  if (ch === "-" || ch === "+") {
    ch = data[++index];
  }
  if (ch === "0") {
    if (index + 1 === max)
      return true;
    ch = data[++index];
    if (ch === "b") {
      index++;
      for (;index < max; index++) {
        ch = data[index];
        if (ch === "_")
          continue;
        if (ch !== "0" && ch !== "1")
          return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
    if (ch === "x") {
      index++;
      for (;index < max; index++) {
        ch = data[index];
        if (ch === "_")
          continue;
        if (!isHexCode(data.charCodeAt(index)))
          return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
    if (ch === "o") {
      index++;
      for (;index < max; index++) {
        ch = data[index];
        if (ch === "_")
          continue;
        if (!isOctCode(data.charCodeAt(index)))
          return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
  }
  if (ch === "_")
    return false;
  for (;index < max; index++) {
    ch = data[index];
    if (ch === "_")
      continue;
    if (!isDecCode(data.charCodeAt(index))) {
      return false;
    }
    hasDigits = true;
  }
  if (!hasDigits || ch === "_")
    return false;
  return true;
}
function constructYamlInteger(data) {
  var value = data, sign = 1, ch;
  if (value.indexOf("_") !== -1) {
    value = value.replace(/_/g, "");
  }
  ch = value[0];
  if (ch === "-" || ch === "+") {
    if (ch === "-")
      sign = -1;
    value = value.slice(1);
    ch = value[0];
  }
  if (value === "0")
    return 0;
  if (ch === "0") {
    if (value[1] === "b")
      return sign * parseInt(value.slice(2), 2);
    if (value[1] === "x")
      return sign * parseInt(value.slice(2), 16);
    if (value[1] === "o")
      return sign * parseInt(value.slice(2), 8);
  }
  return sign * parseInt(value, 10);
}
function isInteger(object) {
  return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common.isNegativeZero(object));
}
var int = new type("tag:yaml.org,2002:int", {
  kind: "scalar",
  resolve: resolveYamlInteger,
  construct: constructYamlInteger,
  predicate: isInteger,
  represent: {
    binary: function(obj) {
      return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
    },
    octal: function(obj) {
      return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
    },
    decimal: function(obj) {
      return obj.toString(10);
    },
    hexadecimal: function(obj) {
      return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
    }
  },
  defaultStyle: "decimal",
  styleAliases: {
    binary: [2, "bin"],
    octal: [8, "oct"],
    decimal: [10, "dec"],
    hexadecimal: [16, "hex"]
  }
});
var YAML_FLOAT_PATTERN = new RegExp("^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?" + "|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?" + "|[-+]?\\.(?:inf|Inf|INF)" + "|\\.(?:nan|NaN|NAN))$");
function resolveYamlFloat(data) {
  if (data === null)
    return false;
  if (!YAML_FLOAT_PATTERN.test(data) || data[data.length - 1] === "_") {
    return false;
  }
  return true;
}
function constructYamlFloat(data) {
  var value, sign;
  value = data.replace(/_/g, "").toLowerCase();
  sign = value[0] === "-" ? -1 : 1;
  if ("+-".indexOf(value[0]) >= 0) {
    value = value.slice(1);
  }
  if (value === ".inf") {
    return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  } else if (value === ".nan") {
    return NaN;
  }
  return sign * parseFloat(value, 10);
}
var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
function representYamlFloat(object, style) {
  var res;
  if (isNaN(object)) {
    switch (style) {
      case "lowercase":
        return ".nan";
      case "uppercase":
        return ".NAN";
      case "camelcase":
        return ".NaN";
    }
  } else if (Number.POSITIVE_INFINITY === object) {
    switch (style) {
      case "lowercase":
        return ".inf";
      case "uppercase":
        return ".INF";
      case "camelcase":
        return ".Inf";
    }
  } else if (Number.NEGATIVE_INFINITY === object) {
    switch (style) {
      case "lowercase":
        return "-.inf";
      case "uppercase":
        return "-.INF";
      case "camelcase":
        return "-.Inf";
    }
  } else if (common.isNegativeZero(object)) {
    return "-0.0";
  }
  res = object.toString(10);
  return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
}
function isFloat(object) {
  return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common.isNegativeZero(object));
}
var float = new type("tag:yaml.org,2002:float", {
  kind: "scalar",
  resolve: resolveYamlFloat,
  construct: constructYamlFloat,
  predicate: isFloat,
  represent: representYamlFloat,
  defaultStyle: "lowercase"
});
var json = failsafe.extend({
  implicit: [
    _null,
    bool,
    int,
    float
  ]
});
var core = json;
var YAML_DATE_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])" + "-([0-9][0-9])" + "-([0-9][0-9])$");
var YAML_TIMESTAMP_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])" + "-([0-9][0-9]?)" + "-([0-9][0-9]?)" + "(?:[Tt]|[ \\t]+)" + "([0-9][0-9]?)" + ":([0-9][0-9])" + ":([0-9][0-9])" + "(?:\\.([0-9]*))?" + "(?:[ \\t]*(Z|([-+])([0-9][0-9]?)" + "(?::([0-9][0-9]))?))?$");
function resolveYamlTimestamp(data) {
  if (data === null)
    return false;
  if (YAML_DATE_REGEXP.exec(data) !== null)
    return true;
  if (YAML_TIMESTAMP_REGEXP.exec(data) !== null)
    return true;
  return false;
}
function constructYamlTimestamp(data) {
  var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
  match = YAML_DATE_REGEXP.exec(data);
  if (match === null)
    match = YAML_TIMESTAMP_REGEXP.exec(data);
  if (match === null)
    throw new Error("Date resolve error");
  year = +match[1];
  month = +match[2] - 1;
  day = +match[3];
  if (!match[4]) {
    return new Date(Date.UTC(year, month, day));
  }
  hour = +match[4];
  minute = +match[5];
  second = +match[6];
  if (match[7]) {
    fraction = match[7].slice(0, 3);
    while (fraction.length < 3) {
      fraction += "0";
    }
    fraction = +fraction;
  }
  if (match[9]) {
    tz_hour = +match[10];
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 60000;
    if (match[9] === "-")
      delta = -delta;
  }
  date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
  if (delta)
    date.setTime(date.getTime() - delta);
  return date;
}
function representYamlTimestamp(object) {
  return object.toISOString();
}
var timestamp = new type("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve: resolveYamlTimestamp,
  construct: constructYamlTimestamp,
  instanceOf: Date,
  represent: representYamlTimestamp
});
function resolveYamlMerge(data) {
  return data === "<<" || data === null;
}
var merge = new type("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: resolveYamlMerge
});
var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
function resolveYamlBinary(data) {
  if (data === null)
    return false;
  var code, idx, bitlen = 0, max = data.length, map2 = BASE64_MAP;
  for (idx = 0;idx < max; idx++) {
    code = map2.indexOf(data.charAt(idx));
    if (code > 64)
      continue;
    if (code < 0)
      return false;
    bitlen += 6;
  }
  return bitlen % 8 === 0;
}
function constructYamlBinary(data) {
  var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map2 = BASE64_MAP, bits = 0, result = [];
  for (idx = 0;idx < max; idx++) {
    if (idx % 4 === 0 && idx) {
      result.push(bits >> 16 & 255);
      result.push(bits >> 8 & 255);
      result.push(bits & 255);
    }
    bits = bits << 6 | map2.indexOf(input.charAt(idx));
  }
  tailbits = max % 4 * 6;
  if (tailbits === 0) {
    result.push(bits >> 16 & 255);
    result.push(bits >> 8 & 255);
    result.push(bits & 255);
  } else if (tailbits === 18) {
    result.push(bits >> 10 & 255);
    result.push(bits >> 2 & 255);
  } else if (tailbits === 12) {
    result.push(bits >> 4 & 255);
  }
  return new Uint8Array(result);
}
function representYamlBinary(object) {
  var result = "", bits = 0, idx, tail, max = object.length, map2 = BASE64_MAP;
  for (idx = 0;idx < max; idx++) {
    if (idx % 3 === 0 && idx) {
      result += map2[bits >> 18 & 63];
      result += map2[bits >> 12 & 63];
      result += map2[bits >> 6 & 63];
      result += map2[bits & 63];
    }
    bits = (bits << 8) + object[idx];
  }
  tail = max % 3;
  if (tail === 0) {
    result += map2[bits >> 18 & 63];
    result += map2[bits >> 12 & 63];
    result += map2[bits >> 6 & 63];
    result += map2[bits & 63];
  } else if (tail === 2) {
    result += map2[bits >> 10 & 63];
    result += map2[bits >> 4 & 63];
    result += map2[bits << 2 & 63];
    result += map2[64];
  } else if (tail === 1) {
    result += map2[bits >> 2 & 63];
    result += map2[bits << 4 & 63];
    result += map2[64];
    result += map2[64];
  }
  return result;
}
function isBinary(obj) {
  return Object.prototype.toString.call(obj) === "[object Uint8Array]";
}
var binary = new type("tag:yaml.org,2002:binary", {
  kind: "scalar",
  resolve: resolveYamlBinary,
  construct: constructYamlBinary,
  predicate: isBinary,
  represent: representYamlBinary
});
var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;
var _toString$2 = Object.prototype.toString;
function resolveYamlOmap(data) {
  if (data === null)
    return true;
  var objectKeys = [], index, length, pair, pairKey, pairHasKey, object = data;
  for (index = 0, length = object.length;index < length; index += 1) {
    pair = object[index];
    pairHasKey = false;
    if (_toString$2.call(pair) !== "[object Object]")
      return false;
    for (pairKey in pair) {
      if (_hasOwnProperty$3.call(pair, pairKey)) {
        if (!pairHasKey)
          pairHasKey = true;
        else
          return false;
      }
    }
    if (!pairHasKey)
      return false;
    if (objectKeys.indexOf(pairKey) === -1)
      objectKeys.push(pairKey);
    else
      return false;
  }
  return true;
}
function constructYamlOmap(data) {
  return data !== null ? data : [];
}
var omap = new type("tag:yaml.org,2002:omap", {
  kind: "sequence",
  resolve: resolveYamlOmap,
  construct: constructYamlOmap
});
var _toString$1 = Object.prototype.toString;
function resolveYamlPairs(data) {
  if (data === null)
    return true;
  var index, length, pair, keys, result, object = data;
  result = new Array(object.length);
  for (index = 0, length = object.length;index < length; index += 1) {
    pair = object[index];
    if (_toString$1.call(pair) !== "[object Object]")
      return false;
    keys = Object.keys(pair);
    if (keys.length !== 1)
      return false;
    result[index] = [keys[0], pair[keys[0]]];
  }
  return true;
}
function constructYamlPairs(data) {
  if (data === null)
    return [];
  var index, length, pair, keys, result, object = data;
  result = new Array(object.length);
  for (index = 0, length = object.length;index < length; index += 1) {
    pair = object[index];
    keys = Object.keys(pair);
    result[index] = [keys[0], pair[keys[0]]];
  }
  return result;
}
var pairs = new type("tag:yaml.org,2002:pairs", {
  kind: "sequence",
  resolve: resolveYamlPairs,
  construct: constructYamlPairs
});
var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;
function resolveYamlSet(data) {
  if (data === null)
    return true;
  var key, object = data;
  for (key in object) {
    if (_hasOwnProperty$2.call(object, key)) {
      if (object[key] !== null)
        return false;
    }
  }
  return true;
}
function constructYamlSet(data) {
  return data !== null ? data : {};
}
var set = new type("tag:yaml.org,2002:set", {
  kind: "mapping",
  resolve: resolveYamlSet,
  construct: constructYamlSet
});
var _default = core.extend({
  implicit: [
    timestamp,
    merge
  ],
  explicit: [
    binary,
    omap,
    pairs,
    set
  ]
});
var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;
var CONTEXT_FLOW_IN = 1;
var CONTEXT_FLOW_OUT = 2;
var CONTEXT_BLOCK_IN = 3;
var CONTEXT_BLOCK_OUT = 4;
var CHOMPING_CLIP = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP = 3;
var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function _class(obj) {
  return Object.prototype.toString.call(obj);
}
function is_EOL(c) {
  return c === 10 || c === 13;
}
function is_WHITE_SPACE(c) {
  return c === 9 || c === 32;
}
function is_WS_OR_EOL(c) {
  return c === 9 || c === 32 || c === 10 || c === 13;
}
function is_FLOW_INDICATOR(c) {
  return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
}
function fromHexCode(c) {
  var lc;
  if (48 <= c && c <= 57) {
    return c - 48;
  }
  lc = c | 32;
  if (97 <= lc && lc <= 102) {
    return lc - 97 + 10;
  }
  return -1;
}
function escapedHexLen(c) {
  if (c === 120) {
    return 2;
  }
  if (c === 117) {
    return 4;
  }
  if (c === 85) {
    return 8;
  }
  return 0;
}
function fromDecimalCode(c) {
  if (48 <= c && c <= 57) {
    return c - 48;
  }
  return -1;
}
function simpleEscapeSequence(c) {
  return c === 48 ? "\0" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "\t" : c === 9 ? "\t" : c === 110 ? `
` : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? `\r` : c === 101 ? "\x1B" : c === 32 ? " " : c === 34 ? '"' : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "\x85" : c === 95 ? "\xA0" : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
}
function charFromCodepoint(c) {
  if (c <= 65535) {
    return String.fromCharCode(c);
  }
  return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
}
function setProperty(object, key, value) {
  if (key === "__proto__") {
    Object.defineProperty(object, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value
    });
  } else {
    object[key] = value;
  }
}
var simpleEscapeCheck = new Array(256);
var simpleEscapeMap = new Array(256);
for (i = 0;i < 256; i++) {
  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
  simpleEscapeMap[i] = simpleEscapeSequence(i);
}
var i;
function State$1(input, options) {
  this.input = input;
  this.filename = options["filename"] || null;
  this.schema = options["schema"] || _default;
  this.onWarning = options["onWarning"] || null;
  this.legacy = options["legacy"] || false;
  this.json = options["json"] || false;
  this.listener = options["listener"] || null;
  this.implicitTypes = this.schema.compiledImplicit;
  this.typeMap = this.schema.compiledTypeMap;
  this.length = input.length;
  this.position = 0;
  this.line = 0;
  this.lineStart = 0;
  this.lineIndent = 0;
  this.firstTabInLine = -1;
  this.documents = [];
}
function generateError(state, message) {
  var mark = {
    name: state.filename,
    buffer: state.input.slice(0, -1),
    position: state.position,
    line: state.line,
    column: state.position - state.lineStart
  };
  mark.snippet = snippet(mark);
  return new exception(message, mark);
}
function throwError(state, message) {
  throw generateError(state, message);
}
function throwWarning(state, message) {
  if (state.onWarning) {
    state.onWarning.call(null, generateError(state, message));
  }
}
var directiveHandlers = {
  YAML: function handleYamlDirective(state, name, args) {
    var match, major, minor;
    if (state.version !== null) {
      throwError(state, "duplication of %YAML directive");
    }
    if (args.length !== 1) {
      throwError(state, "YAML directive accepts exactly one argument");
    }
    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
    if (match === null) {
      throwError(state, "ill-formed argument of the YAML directive");
    }
    major = parseInt(match[1], 10);
    minor = parseInt(match[2], 10);
    if (major !== 1) {
      throwError(state, "unacceptable YAML version of the document");
    }
    state.version = args[0];
    state.checkLineBreaks = minor < 2;
    if (minor !== 1 && minor !== 2) {
      throwWarning(state, "unsupported YAML version of the document");
    }
  },
  TAG: function handleTagDirective(state, name, args) {
    var handle, prefix;
    if (args.length !== 2) {
      throwError(state, "TAG directive accepts exactly two arguments");
    }
    handle = args[0];
    prefix = args[1];
    if (!PATTERN_TAG_HANDLE.test(handle)) {
      throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
    }
    if (_hasOwnProperty$1.call(state.tagMap, handle)) {
      throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
    }
    if (!PATTERN_TAG_URI.test(prefix)) {
      throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
    }
    try {
      prefix = decodeURIComponent(prefix);
    } catch (err) {
      throwError(state, "tag prefix is malformed: " + prefix);
    }
    state.tagMap[handle] = prefix;
  }
};
function captureSegment(state, start, end, checkJson) {
  var _position, _length, _character, _result;
  if (start < end) {
    _result = state.input.slice(start, end);
    if (checkJson) {
      for (_position = 0, _length = _result.length;_position < _length; _position += 1) {
        _character = _result.charCodeAt(_position);
        if (!(_character === 9 || 32 <= _character && _character <= 1114111)) {
          throwError(state, "expected valid JSON character");
        }
      }
    } else if (PATTERN_NON_PRINTABLE.test(_result)) {
      throwError(state, "the stream contains non-printable characters");
    }
    state.result += _result;
  }
}
function mergeMappings(state, destination, source, overridableKeys) {
  var sourceKeys, key, index, quantity;
  if (!common.isObject(source)) {
    throwError(state, "cannot merge mappings; the provided source object is unacceptable");
  }
  sourceKeys = Object.keys(source);
  for (index = 0, quantity = sourceKeys.length;index < quantity; index += 1) {
    key = sourceKeys[index];
    if (!_hasOwnProperty$1.call(destination, key)) {
      setProperty(destination, key, source[key]);
      overridableKeys[key] = true;
    }
  }
}
function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
  var index, quantity;
  if (Array.isArray(keyNode)) {
    keyNode = Array.prototype.slice.call(keyNode);
    for (index = 0, quantity = keyNode.length;index < quantity; index += 1) {
      if (Array.isArray(keyNode[index])) {
        throwError(state, "nested arrays are not supported inside keys");
      }
      if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
        keyNode[index] = "[object Object]";
      }
    }
  }
  if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
    keyNode = "[object Object]";
  }
  keyNode = String(keyNode);
  if (_result === null) {
    _result = {};
  }
  if (keyTag === "tag:yaml.org,2002:merge") {
    if (Array.isArray(valueNode)) {
      for (index = 0, quantity = valueNode.length;index < quantity; index += 1) {
        mergeMappings(state, _result, valueNode[index], overridableKeys);
      }
    } else {
      mergeMappings(state, _result, valueNode, overridableKeys);
    }
  } else {
    if (!state.json && !_hasOwnProperty$1.call(overridableKeys, keyNode) && _hasOwnProperty$1.call(_result, keyNode)) {
      state.line = startLine || state.line;
      state.lineStart = startLineStart || state.lineStart;
      state.position = startPos || state.position;
      throwError(state, "duplicated mapping key");
    }
    setProperty(_result, keyNode, valueNode);
    delete overridableKeys[keyNode];
  }
  return _result;
}
function readLineBreak(state) {
  var ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 10) {
    state.position++;
  } else if (ch === 13) {
    state.position++;
    if (state.input.charCodeAt(state.position) === 10) {
      state.position++;
    }
  } else {
    throwError(state, "a line break is expected");
  }
  state.line += 1;
  state.lineStart = state.position;
  state.firstTabInLine = -1;
}
function skipSeparationSpace(state, allowComments, checkIndent) {
  var lineBreaks = 0, ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    while (is_WHITE_SPACE(ch)) {
      if (ch === 9 && state.firstTabInLine === -1) {
        state.firstTabInLine = state.position;
      }
      ch = state.input.charCodeAt(++state.position);
    }
    if (allowComments && ch === 35) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 10 && ch !== 13 && ch !== 0);
    }
    if (is_EOL(ch)) {
      readLineBreak(state);
      ch = state.input.charCodeAt(state.position);
      lineBreaks++;
      state.lineIndent = 0;
      while (ch === 32) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
    } else {
      break;
    }
  }
  if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
    throwWarning(state, "deficient indentation");
  }
  return lineBreaks;
}
function testDocumentSeparator(state) {
  var _position = state.position, ch;
  ch = state.input.charCodeAt(_position);
  if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
    _position += 3;
    ch = state.input.charCodeAt(_position);
    if (ch === 0 || is_WS_OR_EOL(ch)) {
      return true;
    }
  }
  return false;
}
function writeFoldedLines(state, count) {
  if (count === 1) {
    state.result += " ";
  } else if (count > 1) {
    state.result += common.repeat("\n", count - 1);
  }
}
function readPlainScalar(state, nodeIndent, withinFlowCollection) {
  var preceding, following, captureStart, captureEnd, hasPendingContent, _line, _lineStart, _lineIndent, _kind = state.kind, _result = state.result, ch;
  ch = state.input.charCodeAt(state.position);
  if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
    return false;
  }
  if (ch === 63 || ch === 45) {
    following = state.input.charCodeAt(state.position + 1);
    if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
      return false;
    }
  }
  state.kind = "scalar";
  state.result = "";
  captureStart = captureEnd = state.position;
  hasPendingContent = false;
  while (ch !== 0) {
    if (ch === 58) {
      following = state.input.charCodeAt(state.position + 1);
      if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
        break;
      }
    } else if (ch === 35) {
      preceding = state.input.charCodeAt(state.position - 1);
      if (is_WS_OR_EOL(preceding)) {
        break;
      }
    } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) {
      break;
    } else if (is_EOL(ch)) {
      _line = state.line;
      _lineStart = state.lineStart;
      _lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);
      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      } else {
        state.position = captureEnd;
        state.line = _line;
        state.lineStart = _lineStart;
        state.lineIndent = _lineIndent;
        break;
      }
    }
    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - _line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }
    if (!is_WHITE_SPACE(ch)) {
      captureEnd = state.position + 1;
    }
    ch = state.input.charCodeAt(++state.position);
  }
  captureSegment(state, captureStart, captureEnd, false);
  if (state.result) {
    return true;
  }
  state.kind = _kind;
  state.result = _result;
  return false;
}
function readSingleQuotedScalar(state, nodeIndent) {
  var ch, captureStart, captureEnd;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 39) {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  state.position++;
  captureStart = captureEnd = state.position;
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 39) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);
      if (ch === 39) {
        captureStart = state.position;
        state.position++;
        captureEnd = state.position;
      } else {
        return true;
      }
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, "unexpected end of the document within a single quoted scalar");
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }
  throwError(state, "unexpected end of the stream within a single quoted scalar");
}
function readDoubleQuotedScalar(state, nodeIndent) {
  var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 34) {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  state.position++;
  captureStart = captureEnd = state.position;
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 34) {
      captureSegment(state, captureStart, state.position, true);
      state.position++;
      return true;
    } else if (ch === 92) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);
      if (is_EOL(ch)) {
        skipSeparationSpace(state, false, nodeIndent);
      } else if (ch < 256 && simpleEscapeCheck[ch]) {
        state.result += simpleEscapeMap[ch];
        state.position++;
      } else if ((tmp = escapedHexLen(ch)) > 0) {
        hexLength = tmp;
        hexResult = 0;
        for (;hexLength > 0; hexLength--) {
          ch = state.input.charCodeAt(++state.position);
          if ((tmp = fromHexCode(ch)) >= 0) {
            hexResult = (hexResult << 4) + tmp;
          } else {
            throwError(state, "expected hexadecimal character");
          }
        }
        state.result += charFromCodepoint(hexResult);
        state.position++;
      } else {
        throwError(state, "unknown escape sequence");
      }
      captureStart = captureEnd = state.position;
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, "unexpected end of the document within a double quoted scalar");
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }
  throwError(state, "unexpected end of the stream within a double quoted scalar");
}
function readFlowCollection(state, nodeIndent) {
  var readNext = true, _line, _lineStart, _pos, _tag = state.tag, _result, _anchor = state.anchor, following, terminator, isPair, isExplicitPair, isMapping, overridableKeys = Object.create(null), keyNode, keyTag, valueNode, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 91) {
    terminator = 93;
    isMapping = false;
    _result = [];
  } else if (ch === 123) {
    terminator = 125;
    isMapping = true;
    _result = {};
  } else {
    return false;
  }
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(++state.position);
  while (ch !== 0) {
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if (ch === terminator) {
      state.position++;
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = isMapping ? "mapping" : "sequence";
      state.result = _result;
      return true;
    } else if (!readNext) {
      throwError(state, "missed comma between flow collection entries");
    } else if (ch === 44) {
      throwError(state, "expected the node content, but found ','");
    }
    keyTag = keyNode = valueNode = null;
    isPair = isExplicitPair = false;
    if (ch === 63) {
      following = state.input.charCodeAt(state.position + 1);
      if (is_WS_OR_EOL(following)) {
        isPair = isExplicitPair = true;
        state.position++;
        skipSeparationSpace(state, true, nodeIndent);
      }
    }
    _line = state.line;
    _lineStart = state.lineStart;
    _pos = state.position;
    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if ((isExplicitPair || state.line === _line) && ch === 58) {
      isPair = true;
      ch = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      valueNode = state.result;
    }
    if (isMapping) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
    } else if (isPair) {
      _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
    } else {
      _result.push(keyNode);
    }
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if (ch === 44) {
      readNext = true;
      ch = state.input.charCodeAt(++state.position);
    } else {
      readNext = false;
    }
  }
  throwError(state, "unexpected end of the stream within a flow collection");
}
function readBlockScalar(state, nodeIndent) {
  var captureStart, folding, chomping = CHOMPING_CLIP, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false, tmp, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 124) {
    folding = false;
  } else if (ch === 62) {
    folding = true;
  } else {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  while (ch !== 0) {
    ch = state.input.charCodeAt(++state.position);
    if (ch === 43 || ch === 45) {
      if (CHOMPING_CLIP === chomping) {
        chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
      } else {
        throwError(state, "repeat of a chomping mode identifier");
      }
    } else if ((tmp = fromDecimalCode(ch)) >= 0) {
      if (tmp === 0) {
        throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
      } else if (!detectedIndent) {
        textIndent = nodeIndent + tmp - 1;
        detectedIndent = true;
      } else {
        throwError(state, "repeat of an indentation width identifier");
      }
    } else {
      break;
    }
  }
  if (is_WHITE_SPACE(ch)) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (is_WHITE_SPACE(ch));
    if (ch === 35) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (!is_EOL(ch) && ch !== 0);
    }
  }
  while (ch !== 0) {
    readLineBreak(state);
    state.lineIndent = 0;
    ch = state.input.charCodeAt(state.position);
    while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }
    if (!detectedIndent && state.lineIndent > textIndent) {
      textIndent = state.lineIndent;
    }
    if (is_EOL(ch)) {
      emptyLines++;
      continue;
    }
    if (state.lineIndent < textIndent) {
      if (chomping === CHOMPING_KEEP) {
        state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      } else if (chomping === CHOMPING_CLIP) {
        if (didReadContent) {
          state.result += "\n";
        }
      }
      break;
    }
    if (folding) {
      if (is_WHITE_SPACE(ch)) {
        atMoreIndented = true;
        state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common.repeat("\n", emptyLines + 1);
      } else if (emptyLines === 0) {
        if (didReadContent) {
          state.result += " ";
        }
      } else {
        state.result += common.repeat("\n", emptyLines);
      }
    } else {
      state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
    }
    didReadContent = true;
    detectedIndent = true;
    emptyLines = 0;
    captureStart = state.position;
    while (!is_EOL(ch) && ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
    }
    captureSegment(state, captureStart, state.position, false);
  }
  return true;
}
function readBlockSequence(state, nodeIndent) {
  var _line, _tag = state.tag, _anchor = state.anchor, _result = [], following, detected = false, ch;
  if (state.firstTabInLine !== -1)
    return false;
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    if (ch !== 45) {
      break;
    }
    following = state.input.charCodeAt(state.position + 1);
    if (!is_WS_OR_EOL(following)) {
      break;
    }
    detected = true;
    state.position++;
    if (skipSeparationSpace(state, true, -1)) {
      if (state.lineIndent <= nodeIndent) {
        _result.push(null);
        ch = state.input.charCodeAt(state.position);
        continue;
      }
    }
    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    _result.push(state.result);
    skipSeparationSpace(state, true, -1);
    ch = state.input.charCodeAt(state.position);
    if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, "bad indentation of a sequence entry");
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = "sequence";
    state.result = _result;
    return true;
  }
  return false;
}
function readBlockMapping(state, nodeIndent, flowIndent) {
  var following, allowCompact, _line, _keyLine, _keyLineStart, _keyPos, _tag = state.tag, _anchor = state.anchor, _result = {}, overridableKeys = Object.create(null), keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
  if (state.firstTabInLine !== -1)
    return false;
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (!atExplicitKey && state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    following = state.input.charCodeAt(state.position + 1);
    _line = state.line;
    if ((ch === 63 || ch === 58) && is_WS_OR_EOL(following)) {
      if (ch === 63) {
        if (atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }
        detected = true;
        atExplicitKey = true;
        allowCompact = true;
      } else if (atExplicitKey) {
        atExplicitKey = false;
        allowCompact = true;
      } else {
        throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
      }
      state.position += 1;
      ch = following;
    } else {
      _keyLine = state.line;
      _keyLineStart = state.lineStart;
      _keyPos = state.position;
      if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
        break;
      }
      if (state.line === _line) {
        ch = state.input.charCodeAt(state.position);
        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (ch === 58) {
          ch = state.input.charCodeAt(++state.position);
          if (!is_WS_OR_EOL(ch)) {
            throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
          }
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          detected = true;
          atExplicitKey = false;
          allowCompact = false;
          keyTag = state.tag;
          keyNode = state.result;
        } else if (detected) {
          throwError(state, "can not read an implicit mapping pair; a colon is missed");
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true;
        }
      } else if (detected) {
        throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
      } else {
        state.tag = _tag;
        state.anchor = _anchor;
        return true;
      }
    }
    if (state.line === _line || state.lineIndent > nodeIndent) {
      if (atExplicitKey) {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
      }
      if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
        if (atExplicitKey) {
          keyNode = state.result;
        } else {
          valueNode = state.result;
        }
      }
      if (!atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
        keyTag = keyNode = valueNode = null;
      }
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
    }
    if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, "bad indentation of a mapping entry");
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }
  if (atExplicitKey) {
    storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
  }
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = "mapping";
    state.result = _result;
  }
  return detected;
}
function readTagProperty(state) {
  var _position, isVerbatim = false, isNamed = false, tagHandle, tagName, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 33)
    return false;
  if (state.tag !== null) {
    throwError(state, "duplication of a tag property");
  }
  ch = state.input.charCodeAt(++state.position);
  if (ch === 60) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);
  } else if (ch === 33) {
    isNamed = true;
    tagHandle = "!!";
    ch = state.input.charCodeAt(++state.position);
  } else {
    tagHandle = "!";
  }
  _position = state.position;
  if (isVerbatim) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (ch !== 0 && ch !== 62);
    if (state.position < state.length) {
      tagName = state.input.slice(_position, state.position);
      ch = state.input.charCodeAt(++state.position);
    } else {
      throwError(state, "unexpected end of the stream within a verbatim tag");
    }
  } else {
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      if (ch === 33) {
        if (!isNamed) {
          tagHandle = state.input.slice(_position - 1, state.position + 1);
          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
            throwError(state, "named tag handle cannot contain such characters");
          }
          isNamed = true;
          _position = state.position + 1;
        } else {
          throwError(state, "tag suffix cannot contain exclamation marks");
        }
      }
      ch = state.input.charCodeAt(++state.position);
    }
    tagName = state.input.slice(_position, state.position);
    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
      throwError(state, "tag suffix cannot contain flow indicator characters");
    }
  }
  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
    throwError(state, "tag name cannot contain such characters: " + tagName);
  }
  try {
    tagName = decodeURIComponent(tagName);
  } catch (err) {
    throwError(state, "tag name is malformed: " + tagName);
  }
  if (isVerbatim) {
    state.tag = tagName;
  } else if (_hasOwnProperty$1.call(state.tagMap, tagHandle)) {
    state.tag = state.tagMap[tagHandle] + tagName;
  } else if (tagHandle === "!") {
    state.tag = "!" + tagName;
  } else if (tagHandle === "!!") {
    state.tag = "tag:yaml.org,2002:" + tagName;
  } else {
    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
  }
  return true;
}
function readAnchorProperty(state) {
  var _position, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 38)
    return false;
  if (state.anchor !== null) {
    throwError(state, "duplication of an anchor property");
  }
  ch = state.input.charCodeAt(++state.position);
  _position = state.position;
  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }
  if (state.position === _position) {
    throwError(state, "name of an anchor node must contain at least one character");
  }
  state.anchor = state.input.slice(_position, state.position);
  return true;
}
function readAlias(state) {
  var _position, alias, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 42)
    return false;
  ch = state.input.charCodeAt(++state.position);
  _position = state.position;
  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }
  if (state.position === _position) {
    throwError(state, "name of an alias node must contain at least one character");
  }
  alias = state.input.slice(_position, state.position);
  if (!_hasOwnProperty$1.call(state.anchorMap, alias)) {
    throwError(state, 'unidentified alias "' + alias + '"');
  }
  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}
function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
  var allowBlockStyles, allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, typeIndex, typeQuantity, typeList, type2, flowIndent, blockIndent;
  if (state.listener !== null) {
    state.listener("open", state);
  }
  state.tag = null;
  state.anchor = null;
  state.kind = null;
  state.result = null;
  allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
  if (allowToSeek) {
    if (skipSeparationSpace(state, true, -1)) {
      atNewLine = true;
      if (state.lineIndent > parentIndent) {
        indentStatus = 1;
      } else if (state.lineIndent === parentIndent) {
        indentStatus = 0;
      } else if (state.lineIndent < parentIndent) {
        indentStatus = -1;
      }
    }
  }
  if (indentStatus === 1) {
    while (readTagProperty(state) || readAnchorProperty(state)) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        allowBlockCollections = allowBlockStyles;
        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      } else {
        allowBlockCollections = false;
      }
    }
  }
  if (allowBlockCollections) {
    allowBlockCollections = atNewLine || allowCompact;
  }
  if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
    if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
      flowIndent = parentIndent;
    } else {
      flowIndent = parentIndent + 1;
    }
    blockIndent = state.position - state.lineStart;
    if (indentStatus === 1) {
      if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
        hasContent = true;
      } else {
        if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
          hasContent = true;
        } else if (readAlias(state)) {
          hasContent = true;
          if (state.tag !== null || state.anchor !== null) {
            throwError(state, "alias node should not have any properties");
          }
        } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
          hasContent = true;
          if (state.tag === null) {
            state.tag = "?";
          }
        }
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else if (indentStatus === 0) {
      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
    }
  }
  if (state.tag === null) {
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = state.result;
    }
  } else if (state.tag === "?") {
    if (state.result !== null && state.kind !== "scalar") {
      throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
    }
    for (typeIndex = 0, typeQuantity = state.implicitTypes.length;typeIndex < typeQuantity; typeIndex += 1) {
      type2 = state.implicitTypes[typeIndex];
      if (type2.resolve(state.result)) {
        state.result = type2.construct(state.result);
        state.tag = type2.tag;
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
        break;
      }
    }
  } else if (state.tag !== "!") {
    if (_hasOwnProperty$1.call(state.typeMap[state.kind || "fallback"], state.tag)) {
      type2 = state.typeMap[state.kind || "fallback"][state.tag];
    } else {
      type2 = null;
      typeList = state.typeMap.multi[state.kind || "fallback"];
      for (typeIndex = 0, typeQuantity = typeList.length;typeIndex < typeQuantity; typeIndex += 1) {
        if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
          type2 = typeList[typeIndex];
          break;
        }
      }
    }
    if (!type2) {
      throwError(state, "unknown tag !<" + state.tag + ">");
    }
    if (state.result !== null && type2.kind !== state.kind) {
      throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type2.kind + '", not "' + state.kind + '"');
    }
    if (!type2.resolve(state.result, state.tag)) {
      throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
    } else {
      state.result = type2.construct(state.result, state.tag);
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = state.result;
      }
    }
  }
  if (state.listener !== null) {
    state.listener("close", state);
  }
  return state.tag !== null || state.anchor !== null || hasContent;
}
function readDocument(state) {
  var documentStart = state.position, _position, directiveName, directiveArgs, hasDirectives = false, ch;
  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = Object.create(null);
  state.anchorMap = Object.create(null);
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    skipSeparationSpace(state, true, -1);
    ch = state.input.charCodeAt(state.position);
    if (state.lineIndent > 0 || ch !== 37) {
      break;
    }
    hasDirectives = true;
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    directiveName = state.input.slice(_position, state.position);
    directiveArgs = [];
    if (directiveName.length < 1) {
      throwError(state, "directive name must not be less than one character in length");
    }
    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0 && !is_EOL(ch));
        break;
      }
      if (is_EOL(ch))
        break;
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      directiveArgs.push(state.input.slice(_position, state.position));
    }
    if (ch !== 0)
      readLineBreak(state);
    if (_hasOwnProperty$1.call(directiveHandlers, directiveName)) {
      directiveHandlers[directiveName](state, directiveName, directiveArgs);
    } else {
      throwWarning(state, 'unknown document directive "' + directiveName + '"');
    }
  }
  skipSeparationSpace(state, true, -1);
  if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
    state.position += 3;
    skipSeparationSpace(state, true, -1);
  } else if (hasDirectives) {
    throwError(state, "directives end mark is expected");
  }
  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
  skipSeparationSpace(state, true, -1);
  if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
    throwWarning(state, "non-ASCII line breaks are interpreted as content");
  }
  state.documents.push(state.result);
  if (state.position === state.lineStart && testDocumentSeparator(state)) {
    if (state.input.charCodeAt(state.position) === 46) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    }
    return;
  }
  if (state.position < state.length - 1) {
    throwError(state, "end of the stream or a document separator is expected");
  } else {
    return;
  }
}
function loadDocuments(input, options) {
  input = String(input);
  options = options || {};
  if (input.length !== 0) {
    if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
      input += "\n";
    }
    if (input.charCodeAt(0) === 65279) {
      input = input.slice(1);
    }
  }
  var state = new State$1(input, options);
  var nullpos = input.indexOf("\0");
  if (nullpos !== -1) {
    state.position = nullpos;
    throwError(state, "null byte is not allowed in input");
  }
  state.input += "\0";
  while (state.input.charCodeAt(state.position) === 32) {
    state.lineIndent += 1;
    state.position += 1;
  }
  while (state.position < state.length - 1) {
    readDocument(state);
  }
  return state.documents;
}
function loadAll$1(input, iterator, options) {
  if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
    options = iterator;
    iterator = null;
  }
  var documents = loadDocuments(input, options);
  if (typeof iterator !== "function") {
    return documents;
  }
  for (var index = 0, length = documents.length;index < length; index += 1) {
    iterator(documents[index]);
  }
}
function load$1(input, options) {
  var documents = loadDocuments(input, options);
  if (documents.length === 0) {
    return;
  } else if (documents.length === 1) {
    return documents[0];
  }
  throw new exception("expected a single document in the stream, but found more");
}
var loadAll_1 = loadAll$1;
var load_1 = load$1;
var loader = {
  loadAll: loadAll_1,
  load: load_1
};
var _toString = Object.prototype.toString;
var _hasOwnProperty = Object.prototype.hasOwnProperty;
var CHAR_BOM = 65279;
var CHAR_TAB = 9;
var CHAR_LINE_FEED = 10;
var CHAR_CARRIAGE_RETURN = 13;
var CHAR_SPACE = 32;
var CHAR_EXCLAMATION = 33;
var CHAR_DOUBLE_QUOTE = 34;
var CHAR_SHARP = 35;
var CHAR_PERCENT = 37;
var CHAR_AMPERSAND = 38;
var CHAR_SINGLE_QUOTE = 39;
var CHAR_ASTERISK = 42;
var CHAR_COMMA = 44;
var CHAR_MINUS = 45;
var CHAR_COLON = 58;
var CHAR_EQUALS = 61;
var CHAR_GREATER_THAN = 62;
var CHAR_QUESTION = 63;
var CHAR_COMMERCIAL_AT = 64;
var CHAR_LEFT_SQUARE_BRACKET = 91;
var CHAR_RIGHT_SQUARE_BRACKET = 93;
var CHAR_GRAVE_ACCENT = 96;
var CHAR_LEFT_CURLY_BRACKET = 123;
var CHAR_VERTICAL_LINE = 124;
var CHAR_RIGHT_CURLY_BRACKET = 125;
var ESCAPE_SEQUENCES = {};
ESCAPE_SEQUENCES[0] = "\\0";
ESCAPE_SEQUENCES[7] = "\\a";
ESCAPE_SEQUENCES[8] = "\\b";
ESCAPE_SEQUENCES[9] = "\\t";
ESCAPE_SEQUENCES[10] = "\\n";
ESCAPE_SEQUENCES[11] = "\\v";
ESCAPE_SEQUENCES[12] = "\\f";
ESCAPE_SEQUENCES[13] = "\\r";
ESCAPE_SEQUENCES[27] = "\\e";
ESCAPE_SEQUENCES[34] = '\\"';
ESCAPE_SEQUENCES[92] = "\\\\";
ESCAPE_SEQUENCES[133] = "\\N";
ESCAPE_SEQUENCES[160] = "\\_";
ESCAPE_SEQUENCES[8232] = "\\L";
ESCAPE_SEQUENCES[8233] = "\\P";
var DEPRECATED_BOOLEANS_SYNTAX = [
  "y",
  "Y",
  "yes",
  "Yes",
  "YES",
  "on",
  "On",
  "ON",
  "n",
  "N",
  "no",
  "No",
  "NO",
  "off",
  "Off",
  "OFF"
];
var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
function compileStyleMap(schema2, map2) {
  var result, keys, index, length, tag, style, type2;
  if (map2 === null)
    return {};
  result = {};
  keys = Object.keys(map2);
  for (index = 0, length = keys.length;index < length; index += 1) {
    tag = keys[index];
    style = String(map2[tag]);
    if (tag.slice(0, 2) === "!!") {
      tag = "tag:yaml.org,2002:" + tag.slice(2);
    }
    type2 = schema2.compiledTypeMap["fallback"][tag];
    if (type2 && _hasOwnProperty.call(type2.styleAliases, style)) {
      style = type2.styleAliases[style];
    }
    result[tag] = style;
  }
  return result;
}
function encodeHex(character) {
  var string, handle, length;
  string = character.toString(16).toUpperCase();
  if (character <= 255) {
    handle = "x";
    length = 2;
  } else if (character <= 65535) {
    handle = "u";
    length = 4;
  } else if (character <= 4294967295) {
    handle = "U";
    length = 8;
  } else {
    throw new exception("code point within a string may not be greater than 0xFFFFFFFF");
  }
  return "\\" + handle + common.repeat("0", length - string.length) + string;
}
var QUOTING_TYPE_SINGLE = 1;
var QUOTING_TYPE_DOUBLE = 2;
function State(options) {
  this.schema = options["schema"] || _default;
  this.indent = Math.max(1, options["indent"] || 2);
  this.noArrayIndent = options["noArrayIndent"] || false;
  this.skipInvalid = options["skipInvalid"] || false;
  this.flowLevel = common.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
  this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
  this.sortKeys = options["sortKeys"] || false;
  this.lineWidth = options["lineWidth"] || 80;
  this.noRefs = options["noRefs"] || false;
  this.noCompatMode = options["noCompatMode"] || false;
  this.condenseFlow = options["condenseFlow"] || false;
  this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
  this.forceQuotes = options["forceQuotes"] || false;
  this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
  this.implicitTypes = this.schema.compiledImplicit;
  this.explicitTypes = this.schema.compiledExplicit;
  this.tag = null;
  this.result = "";
  this.duplicates = [];
  this.usedDuplicates = null;
}
function indentString(string, spaces) {
  var ind = common.repeat(" ", spaces), position = 0, next = -1, result = "", line, length = string.length;
  while (position < length) {
    next = string.indexOf("\n", position);
    if (next === -1) {
      line = string.slice(position);
      position = length;
    } else {
      line = string.slice(position, next + 1);
      position = next + 1;
    }
    if (line.length && line !== "\n")
      result += ind;
    result += line;
  }
  return result;
}
function generateNextLine(state, level) {
  return "\n" + common.repeat(" ", state.indent * level);
}
function testImplicitResolving(state, str2) {
  var index, length, type2;
  for (index = 0, length = state.implicitTypes.length;index < length; index += 1) {
    type2 = state.implicitTypes[index];
    if (type2.resolve(str2)) {
      return true;
    }
  }
  return false;
}
function isWhitespace(c) {
  return c === CHAR_SPACE || c === CHAR_TAB;
}
function isPrintable(c) {
  return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== CHAR_BOM || 65536 <= c && c <= 1114111;
}
function isNsCharOrWhitespace(c) {
  return isPrintable(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
}
function isPlainSafe(c, prev, inblock) {
  var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
  var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
  return (inblock ? cIsNsCharOrWhitespace : cIsNsCharOrWhitespace && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && c !== CHAR_SHARP && !(prev === CHAR_COLON && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || prev === CHAR_COLON && cIsNsChar;
}
function isPlainSafeFirst(c) {
  return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
}
function isPlainSafeLast(c) {
  return !isWhitespace(c) && c !== CHAR_COLON;
}
function codePointAt(string, pos) {
  var first = string.charCodeAt(pos), second;
  if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
    second = string.charCodeAt(pos + 1);
    if (second >= 56320 && second <= 57343) {
      return (first - 55296) * 1024 + second - 56320 + 65536;
    }
  }
  return first;
}
function needIndentIndicator(string) {
  var leadingSpaceRe = /^\n* /;
  return leadingSpaceRe.test(string);
}
var STYLE_PLAIN = 1;
var STYLE_SINGLE = 2;
var STYLE_LITERAL = 3;
var STYLE_FOLDED = 4;
var STYLE_DOUBLE = 5;
function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
  var i;
  var char = 0;
  var prevChar = null;
  var hasLineBreak = false;
  var hasFoldableLine = false;
  var shouldTrackWidth = lineWidth !== -1;
  var previousLineBreak = -1;
  var plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
  if (singleLineOnly || forceQuotes) {
    for (i = 0;i < string.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string, i);
      if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
  } else {
    for (i = 0;i < string.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string, i);
      if (char === CHAR_LINE_FEED) {
        hasLineBreak = true;
        if (shouldTrackWidth) {
          hasFoldableLine = hasFoldableLine || i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
          previousLineBreak = i;
        }
      } else if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
    hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
  }
  if (!hasLineBreak && !hasFoldableLine) {
    if (plain && !forceQuotes && !testAmbiguousType(string)) {
      return STYLE_PLAIN;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  if (indentPerLevel > 9 && needIndentIndicator(string)) {
    return STYLE_DOUBLE;
  }
  if (!forceQuotes) {
    return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
  }
  return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
}
function writeScalar(state, string, level, iskey, inblock) {
  state.dump = function() {
    if (string.length === 0) {
      return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
    }
    if (!state.noCompatMode) {
      if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
      }
    }
    var indent = state.indent * Math.max(1, level);
    var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
    var singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
    function testAmbiguity(string2) {
      return testImplicitResolving(state, string2);
    }
    switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity, state.quotingType, state.forceQuotes && !iskey, inblock)) {
      case STYLE_PLAIN:
        return string;
      case STYLE_SINGLE:
        return "'" + string.replace(/'/g, "''") + "'";
      case STYLE_LITERAL:
        return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
      case STYLE_FOLDED:
        return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
      case STYLE_DOUBLE:
        return '"' + escapeString(string) + '"';
      default:
        throw new exception("impossible error: invalid scalar style");
    }
  }();
}
function blockHeader(string, indentPerLevel) {
  var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
  var clip = string[string.length - 1] === "\n";
  var keep = clip && (string[string.length - 2] === "\n" || string === "\n");
  var chomp = keep ? "+" : clip ? "" : "-";
  return indentIndicator + chomp + "\n";
}
function dropEndingNewline(string) {
  return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
}
function foldString(string, width) {
  var lineRe = /(\n+)([^\n]*)/g;
  var result = function() {
    var nextLF = string.indexOf("\n");
    nextLF = nextLF !== -1 ? nextLF : string.length;
    lineRe.lastIndex = nextLF;
    return foldLine(string.slice(0, nextLF), width);
  }();
  var prevMoreIndented = string[0] === "\n" || string[0] === " ";
  var moreIndented;
  var match;
  while (match = lineRe.exec(string)) {
    var prefix = match[1], line = match[2];
    moreIndented = line[0] === " ";
    result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
    prevMoreIndented = moreIndented;
  }
  return result;
}
function foldLine(line, width) {
  if (line === "" || line[0] === " ")
    return line;
  var breakRe = / [^ ]/g;
  var match;
  var start = 0, end, curr = 0, next = 0;
  var result = "";
  while (match = breakRe.exec(line)) {
    next = match.index;
    if (next - start > width) {
      end = curr > start ? curr : next;
      result += "\n" + line.slice(start, end);
      start = end + 1;
    }
    curr = next;
  }
  result += "\n";
  if (line.length - start > width && curr > start) {
    result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
  } else {
    result += line.slice(start);
  }
  return result.slice(1);
}
function escapeString(string) {
  var result = "";
  var char = 0;
  var escapeSeq;
  for (var i = 0;i < string.length; char >= 65536 ? i += 2 : i++) {
    char = codePointAt(string, i);
    escapeSeq = ESCAPE_SEQUENCES[char];
    if (!escapeSeq && isPrintable(char)) {
      result += string[i];
      if (char >= 65536)
        result += string[i + 1];
    } else {
      result += escapeSeq || encodeHex(char);
    }
  }
  return result;
}
function writeFlowSequence(state, level, object) {
  var _result = "", _tag = state.tag, index, length, value;
  for (index = 0, length = object.length;index < length; index += 1) {
    value = object[index];
    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }
    if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
      if (_result !== "")
        _result += "," + (!state.condenseFlow ? " " : "");
      _result += state.dump;
    }
  }
  state.tag = _tag;
  state.dump = "[" + _result + "]";
}
function writeBlockSequence(state, level, object, compact) {
  var _result = "", _tag = state.tag, index, length, value;
  for (index = 0, length = object.length;index < length; index += 1) {
    value = object[index];
    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }
    if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
      if (!compact || _result !== "") {
        _result += generateNextLine(state, level);
      }
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        _result += "-";
      } else {
        _result += "- ";
      }
      _result += state.dump;
    }
  }
  state.tag = _tag;
  state.dump = _result || "[]";
}
function writeFlowMapping(state, level, object) {
  var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, pairBuffer;
  for (index = 0, length = objectKeyList.length;index < length; index += 1) {
    pairBuffer = "";
    if (_result !== "")
      pairBuffer += ", ";
    if (state.condenseFlow)
      pairBuffer += '"';
    objectKey = objectKeyList[index];
    objectValue = object[objectKey];
    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }
    if (!writeNode(state, level, objectKey, false, false)) {
      continue;
    }
    if (state.dump.length > 1024)
      pairBuffer += "? ";
    pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
    if (!writeNode(state, level, objectValue, false, false)) {
      continue;
    }
    pairBuffer += state.dump;
    _result += pairBuffer;
  }
  state.tag = _tag;
  state.dump = "{" + _result + "}";
}
function writeBlockMapping(state, level, object, compact) {
  var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, explicitPair, pairBuffer;
  if (state.sortKeys === true) {
    objectKeyList.sort();
  } else if (typeof state.sortKeys === "function") {
    objectKeyList.sort(state.sortKeys);
  } else if (state.sortKeys) {
    throw new exception("sortKeys must be a boolean or a function");
  }
  for (index = 0, length = objectKeyList.length;index < length; index += 1) {
    pairBuffer = "";
    if (!compact || _result !== "") {
      pairBuffer += generateNextLine(state, level);
    }
    objectKey = objectKeyList[index];
    objectValue = object[objectKey];
    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }
    if (!writeNode(state, level + 1, objectKey, true, true, true)) {
      continue;
    }
    explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
    if (explicitPair) {
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += "?";
      } else {
        pairBuffer += "? ";
      }
    }
    pairBuffer += state.dump;
    if (explicitPair) {
      pairBuffer += generateNextLine(state, level);
    }
    if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
      continue;
    }
    if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
      pairBuffer += ":";
    } else {
      pairBuffer += ": ";
    }
    pairBuffer += state.dump;
    _result += pairBuffer;
  }
  state.tag = _tag;
  state.dump = _result || "{}";
}
function detectType(state, object, explicit) {
  var _result, typeList, index, length, type2, style;
  typeList = explicit ? state.explicitTypes : state.implicitTypes;
  for (index = 0, length = typeList.length;index < length; index += 1) {
    type2 = typeList[index];
    if ((type2.instanceOf || type2.predicate) && (!type2.instanceOf || typeof object === "object" && object instanceof type2.instanceOf) && (!type2.predicate || type2.predicate(object))) {
      if (explicit) {
        if (type2.multi && type2.representName) {
          state.tag = type2.representName(object);
        } else {
          state.tag = type2.tag;
        }
      } else {
        state.tag = "?";
      }
      if (type2.represent) {
        style = state.styleMap[type2.tag] || type2.defaultStyle;
        if (_toString.call(type2.represent) === "[object Function]") {
          _result = type2.represent(object, style);
        } else if (_hasOwnProperty.call(type2.represent, style)) {
          _result = type2.represent[style](object, style);
        } else {
          throw new exception("!<" + type2.tag + '> tag resolver accepts not "' + style + '" style');
        }
        state.dump = _result;
      }
      return true;
    }
  }
  return false;
}
function writeNode(state, level, object, block, compact, iskey, isblockseq) {
  state.tag = null;
  state.dump = object;
  if (!detectType(state, object, false)) {
    detectType(state, object, true);
  }
  var type2 = _toString.call(state.dump);
  var inblock = block;
  var tagStr;
  if (block) {
    block = state.flowLevel < 0 || state.flowLevel > level;
  }
  var objectOrArray = type2 === "[object Object]" || type2 === "[object Array]", duplicateIndex, duplicate;
  if (objectOrArray) {
    duplicateIndex = state.duplicates.indexOf(object);
    duplicate = duplicateIndex !== -1;
  }
  if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
    compact = false;
  }
  if (duplicate && state.usedDuplicates[duplicateIndex]) {
    state.dump = "*ref_" + duplicateIndex;
  } else {
    if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
      state.usedDuplicates[duplicateIndex] = true;
    }
    if (type2 === "[object Object]") {
      if (block && Object.keys(state.dump).length !== 0) {
        writeBlockMapping(state, level, state.dump, compact);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + state.dump;
        }
      } else {
        writeFlowMapping(state, level, state.dump);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + " " + state.dump;
        }
      }
    } else if (type2 === "[object Array]") {
      if (block && state.dump.length !== 0) {
        if (state.noArrayIndent && !isblockseq && level > 0) {
          writeBlockSequence(state, level - 1, state.dump, compact);
        } else {
          writeBlockSequence(state, level, state.dump, compact);
        }
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + state.dump;
        }
      } else {
        writeFlowSequence(state, level, state.dump);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + " " + state.dump;
        }
      }
    } else if (type2 === "[object String]") {
      if (state.tag !== "?") {
        writeScalar(state, state.dump, level, iskey, inblock);
      }
    } else if (type2 === "[object Undefined]") {
      return false;
    } else {
      if (state.skipInvalid)
        return false;
      throw new exception("unacceptable kind of an object to dump " + type2);
    }
    if (state.tag !== null && state.tag !== "?") {
      tagStr = encodeURI(state.tag[0] === "!" ? state.tag.slice(1) : state.tag).replace(/!/g, "%21");
      if (state.tag[0] === "!") {
        tagStr = "!" + tagStr;
      } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
        tagStr = "!!" + tagStr.slice(18);
      } else {
        tagStr = "!<" + tagStr + ">";
      }
      state.dump = tagStr + " " + state.dump;
    }
  }
  return true;
}
function getDuplicateReferences(object, state) {
  var objects = [], duplicatesIndexes = [], index, length;
  inspectNode(object, objects, duplicatesIndexes);
  for (index = 0, length = duplicatesIndexes.length;index < length; index += 1) {
    state.duplicates.push(objects[duplicatesIndexes[index]]);
  }
  state.usedDuplicates = new Array(length);
}
function inspectNode(object, objects, duplicatesIndexes) {
  var objectKeyList, index, length;
  if (object !== null && typeof object === "object") {
    index = objects.indexOf(object);
    if (index !== -1) {
      if (duplicatesIndexes.indexOf(index) === -1) {
        duplicatesIndexes.push(index);
      }
    } else {
      objects.push(object);
      if (Array.isArray(object)) {
        for (index = 0, length = object.length;index < length; index += 1) {
          inspectNode(object[index], objects, duplicatesIndexes);
        }
      } else {
        objectKeyList = Object.keys(object);
        for (index = 0, length = objectKeyList.length;index < length; index += 1) {
          inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
        }
      }
    }
  }
}
function dump$1(input, options) {
  options = options || {};
  var state = new State(options);
  if (!state.noRefs)
    getDuplicateReferences(input, state);
  var value = input;
  if (state.replacer) {
    value = state.replacer.call({ "": value }, "", value);
  }
  if (writeNode(state, 0, value, true, true))
    return state.dump + "\n";
  return "";
}
var dump_1 = dump$1;
var dumper = {
  dump: dump_1
};
function renamed(from, to) {
  return function() {
    throw new Error("Function yaml." + from + " is removed in js-yaml 4. " + "Use yaml." + to + " instead, which is now safe by default.");
  };
}
var Type = type;
var Schema = schema;
var FAILSAFE_SCHEMA = failsafe;
var JSON_SCHEMA = json;
var CORE_SCHEMA = core;
var DEFAULT_SCHEMA = _default;
var load = loader.load;
var loadAll = loader.loadAll;
var dump = dumper.dump;
var YAMLException = exception;
var types = {
  binary,
  float,
  map,
  null: _null,
  pairs,
  set,
  timestamp,
  bool,
  int,
  merge,
  omap,
  seq,
  str
};
var safeLoad = renamed("safeLoad", "load");
var safeLoadAll = renamed("safeLoadAll", "loadAll");
var safeDump = renamed("safeDump", "dump");
var jsYaml = {
  Type,
  Schema,
  FAILSAFE_SCHEMA,
  JSON_SCHEMA,
  CORE_SCHEMA,
  DEFAULT_SCHEMA,
  load,
  loadAll,
  dump,
  YAMLException,
  types,
  safeLoad,
  safeLoadAll,
  safeDump
};

// src/server/serverClasses/Server_Docker_Utils.ts
import path from "path";
var runTimeToCompose = {
  node: [nodeDockerComposeFile, nodeBuildCommand, nodeBddCommand],
  web: [webDockerComposeFile, webBuildCommand, webBddCommand],
  python: [pythonDockerComposeFile, pythonBuildCommand, pythonBddCommand],
  golang: [golangDockerComposeFile, golangBuildCommand, golangBddCommand],
  ruby: [rubyDockerComposeFile, rubyBuildCommand, rubyBddCommand],
  rust: [rustDockerComposeFile, rustBuildCommand, rustBddCommand],
  java: [javaDockerComposeFile, javaBuildCommand, javaBddCommand]
};
var generateUid = (configKey, testName) => {
  const cleanTestName = testName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-").replace(/[^a-z0-9_-]/g, "");
  return `${configKey}-${cleanTestName}`;
};
var getFullReportDir = (cwd, runtime) => {
  return `${cwd}/testeranto/reports/${runtime}`;
};
var getLogFilePath = (cwd, runtime, serviceName) => {
  return `${cwd}/testeranto/reports/${runtime}/${serviceName}.log`;
};
var getExitCodeFilePath = (cwd, runtime, serviceName) => {
  return `${cwd}/testeranto/reports/${runtime}/${serviceName}.exitcode`;
};
var getContainerExitCodeFilePath = (cwd, runtime, serviceName) => {
  return `${cwd}/testeranto/reports/${runtime}/${serviceName}.container.exitcode`;
};
var getStatusFilePath = (cwd, runtime, serviceName) => {
  return `${cwd}/testeranto/reports/${runtime}/${serviceName}.container.status`;
};
var DOCKER_COMPOSE_BASE = 'docker compose -f "testeranto/docker-compose.yml"';
var DOCKER_COMPOSE_UP = `${DOCKER_COMPOSE_BASE} up -d`;
var DOCKER_COMPOSE_DOWN = `${DOCKER_COMPOSE_BASE} down -v --remove-orphans`;
var DOCKER_COMPOSE_PS = `${DOCKER_COMPOSE_BASE} ps`;
var DOCKER_COMPOSE_LOGS = `${DOCKER_COMPOSE_BASE} logs --no-color`;
var DOCKER_COMPOSE_BUILD = `${DOCKER_COMPOSE_BASE} build`;
var DOCKER_COMPOSE_START = `${DOCKER_COMPOSE_BASE} start`;
var DOCKER_COMPOSE_CONFIG = `${DOCKER_COMPOSE_BASE} config --services`;
var RUNTIME_LABELS = {
  node: "Node",
  web: "Web",
  python: "Python",
  golang: "Golang",
  ruby: "Ruby",
  rust: "Rust",
  java: "Java"
};
var getRuntimeLabel = (runtime) => {
  return RUNTIME_LABELS[runtime] || runtime.charAt(0).toUpperCase() + runtime.slice(1);
};
var SERVICE_SUFFIXES = {
  BUILDER: "builder",
  BDD: "bdd",
  AIDER: "aider",
  CHECK: "check"
};
var getBuilderServiceName = (runtime) => {
  return `${runtime}-${SERVICE_SUFFIXES.BUILDER}`;
};
var getBddServiceName = (uid) => {
  return `${uid}-${SERVICE_SUFFIXES.BDD}`;
};
var getAiderServiceName = (uid) => {
  return `${uid}-${SERVICE_SUFFIXES.AIDER}`;
};
var getCheckServiceName = (uid, index) => {
  return `${uid}-${SERVICE_SUFFIXES.CHECK}-${index}`;
};
var INPUT_FILE_PATTERNS = {
  node: (testName) => `testeranto/bundles/node/${testName.split(".").slice(0, -1).concat("mjs").join(".")}-inputFiles.json`,
  ruby: () => `testeranto/bundles/ruby/Calculator.test.rb-inputFiles.json`,
  web: (testName) => `testeranto/bundles/web/${testName.split(".").slice(0, -1).concat("mjs").join(".")}-inputFiles.json`,
  python: (testName) => `testeranto/bundles/python/${testName}-inputFiles.json`,
  rust: (testName) => `testeranto/bundles/rust/${testName}-inputFiles.json`,
  java: (testName) => `testeranto/bundles/java/${testName}-inputFiles.json`,
  golang: (testName) => `testeranto/bundles/golang/${testName}-inputFiles.json`
};
var getInputFilePath = (runtime, testName) => {
  const pattern = INPUT_FILE_PATTERNS[runtime];
  if (!pattern) {
    throw new Error(`Input file pattern not defined for runtime: ${runtime}`);
  }
  return pattern(testName);
};
var COMMON_VOLUMES = [
  `${process.cwd()}/src:/workspace/src`,
  `${process.cwd()}/dist:/workspace/dist`,
  `${process.cwd()}/testeranto:/workspace/testeranto`
];
var isContainerActive = (state) => {
  return state === "running";
};
var getContainerInspectFormat = () => {
  return "{{.State.ExitCode}}|{{.State.StartedAt}}|{{.State.FinishedAt}}|{{.State.Status}}";
};
var cleanTestName = (testName) => {
  return testName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-").replace(/[^a-z0-9_-]/g, "");
};
var writeConfigForExtensionOnStop = () => {
  try {
    const configDir = path.join(process.cwd(), "testeranto");
    const configPath = path.join(configDir, "extension-config.json");
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      console.log(`[Server_Docker] Created directory: ${configDir}`);
    }
    const configData = {
      runtimes: [],
      timestamp: new Date().toISOString(),
      source: "testeranto.ts",
      serverStarted: false
    };
    const configJson = JSON.stringify(configData, null, 2);
    fs.writeFileSync(configPath, configJson);
    console.log(`[Server_Docker] Updated extension config to indicate server stopped`);
  } catch (error) {
    console.error(`[Server_Docker] Failed to write extension config on stop:`, error);
  }
};
var writeComposeFile = (services) => {
  const dockerComposeFileContents = BaseCompose(services);
  fs.writeFileSync("testeranto/docker-compose.yml", jsYaml.dump(dockerComposeFileContents, {
    lineWidth: -1,
    noRefs: true
  }));
};
var BaseCompose = (services) => {
  return {
    services,
    volumes: {
      node_modules: {
        driver: "local"
      }
    },
    networks: {
      allTests_network: {
        driver: "bridge"
      }
    }
  };
};
var staticTestDockerComposeFile = (runtime, container_name, command, config, runtimeTestsName) => {
  return {
    build: {
      context: process.cwd(),
      dockerfile: config.runtimes[runtimeTestsName].dockerfile
    },
    container_name,
    environment: {},
    working_dir: "/workspace",
    command,
    networks: ["allTests_network"]
  };
};
var bddTestDockerComposeFile = (configs, runtime, container_name, command) => {
  let dockerfilePath = "";
  for (const [key, value] of Object.entries(configs.runtimes)) {
    if (value.runtime === runtime) {
      dockerfilePath = value.dockerfile;
      break;
    }
  }
  if (!dockerfilePath) {
    throw `[Docker] [bddTestDockerComposeFile] no dockerfile found for ${dockerfilePath}, ${Object.entries(configs)}`;
  }
  const service = {
    build: {
      context: process.cwd(),
      dockerfile: dockerfilePath
    },
    container_name,
    environment: {},
    working_dir: "/workspace",
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/testeranto:/workspace/testeranto`
    ],
    command,
    networks: ["allTests_network"]
  };
  return service;
};
var aiderDockerComposeFile = (container_name) => {
  return {
    image: "testeranto-aider:latest",
    container_name,
    environment: {
      NODE_ENV: "production"
    },
    volumes: [
      `${process.cwd()}/.aider.conf.yml:/workspace/.aider.conf.yml`,
      `${process.cwd()}:/workspace`
    ],
    working_dir: "/workspace",
    command: "tail -f /dev/null",
    networks: ["allTests_network"],
    tty: true,
    stdin_open: true
  };
};
var executeDockerComposeCommand = async (command, options) => {
  const useExec = options?.useExec ?? false;
  const execOptions = options?.execOptions ?? { cwd: process.cwd() };
  const errorMessage = options?.errorMessage ?? "Error executing docker compose command";
  try {
    if (useExec) {
      const execAsync2 = promisify2(exec2);
      const { stdout, stderr } = await execAsync2(command, execOptions);
      return {
        exitCode: 0,
        out: stdout,
        err: stderr,
        data: null
      };
    } else {
      return {
        exitCode: 0,
        out: "",
        err: "",
        data: { command, spawn: true }
      };
    }
  } catch (error) {
    console.error(`[Docker] ${errorMessage}: ${error.message}`);
    return {
      exitCode: 1,
      out: "",
      err: `${errorMessage}: ${error.message}`,
      data: null
    };
  }
};
var DC_COMMANDS = {
  up: DOCKER_COMPOSE_UP,
  down: DOCKER_COMPOSE_DOWN,
  ps: DOCKER_COMPOSE_PS,
  logs: (serviceName, tail = 100) => {
    const base = `${DOCKER_COMPOSE_LOGS} --tail=${tail}`;
    return serviceName ? `${base} ${serviceName}` : base;
  },
  config: DOCKER_COMPOSE_CONFIG,
  build: DOCKER_COMPOSE_BUILD,
  start: DOCKER_COMPOSE_START
};

// src/server/WsManager.ts
class WsManager {
  constructor() {
  }
  escapeXml(unsafe) {
    if (!unsafe)
      return "";
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case "\'":
          return "&apos;";
        case '"':
          return "&quot;";
        default:
          return c;
      }
    });
  }
  processMessage(type2, data, getProcessSummary, getProcessLogs) {
    console.log("[WsManager] Processing message:", type2);
    switch (type2) {
      case "ping":
        return {
          type: "pong",
          timestamp: new Date().toISOString()
        };
      case "getProcesses":
        if (getProcessSummary) {
          const summary = getProcessSummary();
          return {
            type: "processes",
            data: summary,
            timestamp: new Date().toISOString()
          };
        } else {
          return {
            type: "processes",
            data: { processes: [], totalProcesses: 0, running: 0 },
            timestamp: new Date().toISOString()
          };
        }
      case "getLogs":
        const { processId } = data || {};
        if (!processId) {
          return {
            type: "logs",
            status: "error",
            message: "Missing processId",
            timestamp: new Date().toISOString()
          };
        }
        if (getProcessLogs) {
          const logs = getProcessLogs(processId);
          return {
            type: "logs",
            processId,
            logs: logs.map((log) => {
              let level = "info";
              let source = "process";
              let message = log;
              const match = log.match(/\[(.*?)\] \[(.*?)\] (.*)/);
              if (match) {
                const timestamp2 = match[1];
                source = match[2];
                message = match[3];
                if (source === "stderr" || source === "error") {
                  level = "error";
                } else if (source === "warn") {
                  level = "warn";
                } else if (source === "debug") {
                  level = "debug";
                } else {
                  level = "info";
                }
              }
              return {
                timestamp: new Date().toISOString(),
                level,
                message,
                source
              };
            }),
            timestamp: new Date().toISOString()
          };
        } else {
          return {
            type: "logs",
            processId,
            logs: [],
            timestamp: new Date().toISOString()
          };
        }
      case "subscribeToLogs":
        const { processId: subProcessId } = data || {};
        if (!subProcessId) {
          return {
            type: "logSubscription",
            status: "error",
            message: "Missing processId",
            timestamp: new Date().toISOString()
          };
        }
        return {
          type: "logSubscription",
          status: "subscribed",
          processId: subProcessId,
          timestamp: new Date().toISOString()
        };
      case "sourceFilesUpdated":
        const { testName, hash, files, runtime } = data || {};
        if (!testName || !hash || !files || !runtime) {
          return {
            type: "sourceFilesUpdated",
            status: "error",
            message: "Missing required fields: testName, hash, files, or runtime",
            timestamp: new Date().toISOString()
          };
        }
        return {
          type: "sourceFilesUpdated",
          status: "success",
          testName,
          runtime,
          message: "Build update processed successfully",
          timestamp: new Date().toISOString()
        };
      case "getBuildListenerState":
        return {
          type: "buildListenerState",
          status: "error",
          message: "Build listener state not available",
          timestamp: new Date().toISOString()
        };
      case "getBuildEvents":
        return {
          type: "buildEvents",
          status: "error",
          message: "Build events not available",
          timestamp: new Date().toISOString()
        };
      default:
        return {
          type: "error",
          message: `Unknown message type: ${type2}`,
          timestamp: new Date().toISOString()
        };
    }
  }
  getProcessesResponse(processSummary) {
    return {
      type: "processes",
      data: processSummary,
      timestamp: new Date().toISOString()
    };
  }
  getLogsResponse(processId, logs) {
    return {
      type: "logs",
      processId,
      logs: logs.map((log) => {
        let level = "info";
        let source = "process";
        let message = log;
        const match = log.match(/\[(.*?)\] \[(.*?)\] (.*)/);
        if (match) {
          const timestamp2 = match[1];
          source = match[2];
          message = match[3];
          if (source === "stderr" || source === "error") {
            level = "error";
          } else if (source === "warn") {
            level = "warn";
          } else if (source === "debug") {
            level = "debug";
          } else {
            level = "info";
          }
        }
        return {
          timestamp: new Date().toISOString(),
          level,
          message,
          source
        };
      }),
      timestamp: new Date().toISOString()
    };
  }
  getSourceFilesUpdatedResponse(testName, runtime, status, message) {
    return {
      type: "sourceFilesUpdated",
      status,
      testName,
      runtime,
      message: message || "Build update processed successfully",
      timestamp: new Date().toISOString()
    };
  }
  getErrorResponse(type2, errorMessage) {
    return {
      type: type2,
      status: "error",
      message: errorMessage,
      timestamp: new Date().toISOString()
    };
  }
  getSuccessResponse(type2, data) {
    return {
      type: type2,
      status: "success",
      data,
      timestamp: new Date().toISOString()
    };
  }
}

// src/server/serverClasses/Server_HTTP.ts
import fs2 from "fs";
import path2 from "path";

// src/server/tcp.ts
var CONTENT_TYPES = {
  PLAIN: "text/plain",
  HTML: "text/html",
  JAVASCRIPT: "application/javascript",
  CSS: "text/css",
  JSON: "application/json",
  PNG: "image/png",
  JPEG: "image/jpeg",
  GIF: "image/gif",
  SVG: "image/svg+xml",
  ICO: "image/x-icon",
  WOFF: "font/woff",
  WOFF2: "font/woff2",
  TTF: "font/ttf",
  EOT: "application/vnd.ms-fontobject",
  XML: "application/xml",
  PDF: "application/pdf",
  ZIP: "application/zip",
  OCTET_STREAM: "application/octet-stream"
};
function getContentType(filePath) {
  if (filePath.endsWith(".html"))
    return CONTENT_TYPES.HTML;
  else if (filePath.endsWith(".js") || filePath.endsWith(".mjs"))
    return CONTENT_TYPES.JAVASCRIPT;
  else if (filePath.endsWith(".css"))
    return CONTENT_TYPES.CSS;
  else if (filePath.endsWith(".json"))
    return CONTENT_TYPES.JSON;
  else if (filePath.endsWith(".png"))
    return CONTENT_TYPES.PNG;
  else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg"))
    return CONTENT_TYPES.JPEG;
  else if (filePath.endsWith(".gif"))
    return CONTENT_TYPES.GIF;
  else if (filePath.endsWith(".svg"))
    return CONTENT_TYPES.SVG;
  else
    return CONTENT_TYPES.PLAIN;
}

// src/server/HttpManager.ts
class HttpManager {
  routeName(req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const urlPath = url.pathname;
    return urlPath.slice(3);
  }
  decodedPath(req) {
    const urlPath = new URL(req.url, `http://${req.headers.host}`).pathname;
    const decodedPath = decodeURIComponent(urlPath);
    return decodedPath.startsWith("/") ? decodedPath.slice(1) : decodedPath;
  }
  matchRoute(routeName, routes) {
    if (routes && routes[routeName]) {
      return { handler: routes[routeName], params: {} };
    }
    for (const [pattern, handler] of Object.entries(routes)) {
      if (pattern.includes(":")) {
        const patternParts = pattern.split("/");
        const routeParts = routeName.split("/");
        const lastPatternPart = patternParts[patternParts.length - 1];
        const isLastParamWithExtension = lastPatternPart.includes(":") && lastPatternPart.includes(".xml");
        if (isLastParamWithExtension) {
          let matches = true;
          const params = {};
          for (let i = 0;i < patternParts.length - 1; i++) {
            const patternPart = patternParts[i];
            const routePart = routeParts[i];
            if (patternPart.startsWith(":")) {
              const paramName = patternPart.slice(1);
              params[paramName] = routePart;
            } else if (patternPart !== routePart) {
              matches = false;
              break;
            }
          }
          if (matches) {
            const lastParamName = lastPatternPart.slice(1, lastPatternPart.indexOf(".xml"));
            const remainingParts = routeParts.slice(patternParts.length - 1);
            let paramValue = remainingParts.join("/");
            if (paramValue.endsWith(".xml")) {
              paramValue = paramValue.slice(0, -4);
            }
            params[lastParamName] = paramValue;
            return { handler, params };
          }
        } else {
          if (patternParts.length !== routeParts.length) {
            continue;
          }
          let matches = true;
          const params = {};
          for (let i = 0;i < patternParts.length; i++) {
            const patternPart = patternParts[i];
            const routePart = routeParts[i];
            if (patternPart.startsWith(":")) {
              const paramName = patternPart.slice(1);
              params[paramName] = routePart;
            } else if (patternPart !== routePart) {
              matches = false;
              break;
            }
          }
          if (matches) {
            return { handler, params };
          }
        }
      }
    }
    return null;
  }
  extractParams(pattern, routeName) {
    const patternParts = pattern.split("/");
    const routeParts = routeName.split("/");
    if (patternParts.length !== routeParts.length) {
      return null;
    }
    const params = {};
    for (let i = 0;i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const routePart = routeParts[i];
      if (patternPart.startsWith(":")) {
        const paramName = patternPart.slice(1);
        params[paramName] = routePart;
      } else if (patternPart !== routePart) {
        return null;
      }
    }
    return params;
  }
}

// src/server/serverClasses/Server_Base.ts
class Server_Base {
  mode;
  configs;
  constructor(configs, mode) {
    this.configs = configs;
    this.mode = mode;
    console.log(`[Base] ${this.configs}`);
  }
  async start() {
  }
  async stop() {
    console.log(`goodbye testeranto`);
    process.exit();
  }
}

// src/server/serverClasses/Server_HTTP.ts
class Server_HTTP extends Server_Base {
  http;
  bunServer = null;
  routes;
  constructor(configs, mode) {
    super(configs, mode);
    this.http = new HttpManager;
    this.routes = {
      processes: {
        method: "GET",
        handler: () => this.handleHttpGetProcesses()
      }
    };
  }
  handleHttpGetProcesses() {
    console.log(`[HTTP] Checking if getProcessSummary exists...`);
    if (typeof this.getProcessSummary === "function") {
      console.log(`[HTTP] getProcessSummary exists, calling it...`);
      const processSummary = this.getProcessSummary();
      console.log(`[HTTP] getProcessSummary returned:`, processSummary ? "has data" : "null/undefined");
      if (processSummary && processSummary.error) {
        console.log(`[HTTP] Process summary has error:`, processSummary.error);
        return new Response(JSON.stringify({
          error: processSummary.error,
          processes: [],
          total: 0,
          timestamp: new Date().toISOString(),
          message: processSummary.message || "Error retrieving docker processes"
        }), {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      const formattedProcesses = (processSummary?.processes || []).map((process2) => ({
        name: process2.processId || process2.containerId,
        status: process2.status || process2.state,
        state: process2.state,
        image: process2.image,
        ports: process2.ports,
        exitCode: process2.exitCode,
        isActive: process2.isActive,
        runtime: process2.runtime,
        startedAt: process2.startedAt,
        finishedAt: process2.finishedAt
      }));
      const responseData = {
        processes: formattedProcesses,
        total: processSummary?.total || formattedProcesses.length,
        timestamp: processSummary?.timestamp || new Date().toISOString(),
        message: processSummary?.message || "Success"
      };
      console.log(`[HTTP] Returning response with ${formattedProcesses.length} processes`);
      return new Response(JSON.stringify(responseData, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } else {
      console.log(`[HTTP] getProcessSummary does not exist on this instance`);
      console.log(`[HTTP] this.constructor.name:`, this.constructor.name);
      console.log(`[HTTP] this keys:`, Object.keys(this));
      return new Response(JSON.stringify({
        error: "getProcessSummary method not available",
        processes: [],
        total: 0,
        timestamp: new Date().toISOString(),
        message: "Server does not support process listing"
      }), {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
  handleHttpGetOutputFiles(request, url) {
    const runtime = url.searchParams.get("runtime");
    const testName = url.searchParams.get("testName");
    if (!runtime || !testName) {
      return new Response(JSON.stringify({
        error: "Missing runtime or testName query parameters",
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    console.log(`[HTTP] Getting output files for runtime: ${runtime}, testName: ${testName}`);
    if (typeof this.getOutputFiles === "function") {
      console.log(`[HTTP] getOutputFiles exists, calling it...`);
      const outputFiles = this.getOutputFiles(runtime, testName);
      console.log(`[HTTP] getOutputFiles returned:`, outputFiles ? `${outputFiles.length} files` : "null/undefined");
      const responseData = {
        runtime,
        testName,
        outputFiles: outputFiles || [],
        timestamp: new Date().toISOString(),
        message: "Success"
      };
      return new Response(JSON.stringify(responseData, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } else {
      console.log(`[HTTP] getOutputFiles does not exist on this instance`);
      const fs3 = import.meta.require("fs");
      const path3 = import.meta.require("path");
      const outputDir = path3.join(process.cwd(), "testeranto", "reports", runtime);
      if (fs3.existsSync(outputDir)) {
        const files = fs3.readdirSync(outputDir);
        const testFiles = files.filter((file) => file.includes(testName.replace("/", "_").replace(".", "-")));
        const projectRoot = process.cwd();
        const relativePaths = testFiles.map((file) => {
          const absolutePath = path3.join(outputDir, file);
          let relativePath = path3.relative(projectRoot, absolutePath);
          relativePath = relativePath.split(path3.sep).join("/");
          return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
        });
        const responseData = {
          runtime,
          testName,
          outputFiles: relativePaths || [],
          timestamp: new Date().toISOString(),
          message: "Success (from directory)"
        };
        return new Response(JSON.stringify(responseData, null, 2), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } else {
        return new Response(JSON.stringify({
          error: "getOutputFiles method not available and directory not found",
          runtime,
          testName,
          outputFiles: [],
          timestamp: new Date().toISOString(),
          message: "No output files found"
        }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }
  }
  handleHttpGetInputFiles(request, url) {
    const runtime = url.searchParams.get("runtime");
    const testName = url.searchParams.get("testName");
    if (!runtime || !testName) {
      return new Response(JSON.stringify({
        error: "Missing runtime or testName query parameters",
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    console.log(`[HTTP] Getting input files for runtime: ${runtime}, testName: ${testName}`);
    if (typeof this.getInputFiles === "function") {
      console.log(`[HTTP] getInputFiles exists, calling it...`);
      const inputFiles = this.getInputFiles(runtime, testName);
      console.log(`[HTTP] getInputFiles returned:`, inputFiles ? `${inputFiles.length} files` : "null/undefined");
      const responseData = {
        runtime,
        testName,
        inputFiles: inputFiles || [],
        timestamp: new Date().toISOString(),
        message: "Success"
      };
      return new Response(JSON.stringify(responseData, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } else {
      throw `[HTTP] getInputFiles does not exist on this instance`;
    }
  }
  handleHttpGetAiderProcesses() {
    console.log(`[HTTP] handleHttpGetAiderProcesses() called`);
    try {
      if (typeof this.handleAiderProcesses === "function") {
        console.log(`[HTTP] handleAiderProcesses exists, calling it...`);
        const result = this.handleAiderProcesses();
        console.log(`[HTTP] handleAiderProcesses returned:`, result ? `has data` : "null/undefined");
        const responseData = {
          aiderProcesses: result.aiderProcesses || [],
          timestamp: result.timestamp || new Date().toISOString(),
          message: result.message || "Success"
        };
        console.log(`[HTTP] Returning aider processes response with ${responseData.aiderProcesses.length} processes`);
        return new Response(JSON.stringify(responseData, null, 2), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } else if (typeof this.getAiderProcesses === "function") {
        console.log(`[HTTP] getAiderProcesses exists (fallback), calling it...`);
        const aiderProcesses = this.getAiderProcesses();
        console.log(`[HTTP] getAiderProcesses returned:`, aiderProcesses ? `${aiderProcesses.length} processes` : "null/undefined");
        const responseData = {
          aiderProcesses: aiderProcesses || [],
          timestamp: new Date().toISOString(),
          message: "Success"
        };
        console.log(`[HTTP] Returning aider processes response with ${aiderProcesses?.length || 0} processes`);
        return new Response(JSON.stringify(responseData, null, 2), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } else {
        console.log(`[HTTP] Neither handleAiderProcesses nor getAiderProcesses exists on this instance`);
        const responseData = {
          aiderProcesses: [],
          timestamp: new Date().toISOString(),
          message: "Aider processes not available"
        };
        return new Response(JSON.stringify(responseData, null, 2), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    } catch (error) {
      console.error(`[HTTP] Error in GET /~/aider-processes:`, error);
      console.error(`[HTTP] Error stack:`, error.stack);
      return new Response(JSON.stringify({
        error: error.message,
        aiderProcesses: [],
        timestamp: new Date().toISOString(),
        message: "Internal server error"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
  handleHttpGetConfigs() {
    console.log(`[HTTP] handleHttpGetConfigs() called`);
    try {
      console.log(`[HTTP] Checking if configs exists...`);
      if (this.configs) {
        console.log(`[HTTP] configs exists, returning it...`);
        console.log(`[HTTP] configs type:`, typeof this.configs);
        console.log(`[HTTP] configs keys:`, Object.keys(this.configs));
        const responseData = {
          configs: this.configs,
          timestamp: new Date().toISOString(),
          message: "Success"
        };
        console.log(`[HTTP] Returning configs response`);
        return new Response(JSON.stringify(responseData, null, 2), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } else {
        console.log(`[HTTP] configs does not exist on this instance`);
        console.log(`[HTTP] this.constructor.name:`, this.constructor.name);
        console.log(`[HTTP] this keys:`, Object.keys(this));
        return new Response(JSON.stringify({
          error: "configs property not available",
          timestamp: new Date().toISOString(),
          message: "Server does not have configs"
        }), {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    } catch (error) {
      console.error(`[HTTP] Error in GET /~/configs:`, error);
      console.error(`[HTTP] Error stack:`, error.stack);
      return new Response(JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
        message: "Internal server error"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
  async start() {
    await super.start();
    const port = 3000;
    try {
      const serverOptions = {
        port,
        fetch: async (request, server) => {
          console.log(`[HTTP] Received request: ${request.method} ${request.url}`);
          try {
            console.log(`[HTTP] Calling handleRequest...`);
            const response = this.handleRequest(request, server);
            if (response instanceof Response) {
              console.log(`[HTTP] handleRequest returned Response with status:`, response.status);
              return response;
            } else if (response && typeof response.then === "function") {
              console.log(`[HTTP] handleRequest returned a Promise, awaiting...`);
              const awaitedResponse = await response;
              console.log(`[HTTP] Promise resolved to Response with status:`, awaitedResponse.status);
              return awaitedResponse;
            } else if (response === undefined || response === null) {
              console.log(`[HTTP] handleRequest returned undefined/null, assuming WebSocket upgrade was handled`);
              return;
            } else {
              console.error(`[HTTP] handleRequest returned non-Response:`, response);
              return new Response(`Server Error: handleRequest did not return a Response`, {
                status: 500,
                headers: { "Content-Type": "text/plain" }
              });
            }
          } catch (error) {
            console.error(`[HTTP] Error handling request ${request.url}:`, error);
            console.error(`[HTTP] Error stack:`, error.stack);
            return new Response(`Internal Server Error: ${error.message}`, {
              status: 500,
              headers: { "Content-Type": "text/plain" }
            });
          }
        },
        error: (error) => {
          console.error(`[HTTP] Server error:`, error);
          return new Response(`Server Error: ${error.message}`, {
            status: 500,
            headers: { "Content-Type": "text/plain" }
          });
        }
      };
      if (this instanceof Server_WS) {
        console.log(`[Server_HTTP] Adding WebSocket configuration`);
        serverOptions.websocket = {
          open: (ws) => {
            console.log(`[WebSocket] New connection`);
            this.wsClients.add(ws);
            ws.send(JSON.stringify({
              type: "connected",
              message: "Connected to Process Manager WebSocket",
              timestamp: new Date().toISOString()
            }));
            console.log("[WebSocket] Connection established, waiting for resource change notifications");
          },
          message: (ws, message) => {
            try {
              const data = typeof message === "string" ? JSON.parse(message) : JSON.parse(message.toString());
              if (ws && typeof ws.send === "function") {
                this.handleWebSocketMessage(ws, data);
              } else {
                console.error("[WebSocket] Invalid WebSocket instance in message handler");
              }
            } catch (error) {
              console.error("[WebSocket] Error parsing message:", error);
              if (ws && typeof ws.send === "function") {
                ws.send(JSON.stringify({
                  type: "error",
                  message: "Invalid JSON message",
                  timestamp: new Date().toISOString()
                }));
              }
            }
          },
          close: (ws) => {
            console.log("[WebSocket] Client disconnected");
            this.wsClients.delete(ws);
          },
          error: (ws, error) => {
            console.error("[WebSocket] Error:", error);
            this.wsClients.delete(ws);
          }
        };
      }
      this.bunServer = Bun.serve(serverOptions);
      console.log(`[HTTP] Bun HTTP server is now listening on http://localhost:${port}`);
      console.log(`[HTTP] Server URL: http://localhost:${port}/~/processes`);
    } catch (error) {
      console.error(`[HTTP] Failed to start server:`, error);
      throw error;
    }
  }
  async stop() {
    if (this.bunServer) {
      this.bunServer.stop();
    }
    await super.stop();
  }
  handleRequest(request, server) {
    const url = new URL(request.url);
    console.log(`[Server_HTTP] handleRequest(${url.pathname}) from ${request.url}`);
    console.log(`[Server_HTTP] Request method: ${request.method}`);
    if (request.headers.get("upgrade") === "websocket") {
      console.log(`[Server_HTTP] WebSocket upgrade request detected for path: ${url.pathname}`);
      if (this instanceof Server_WS && server) {
        console.log(`[Server_HTTP] Upgrading to WebSocket`);
        const success = server.upgrade(request);
        if (success) {
          console.log(`[Server_HTTP] WebSocket upgrade successful`);
          return;
        } else {
          console.error(`[Server_HTTP] WebSocket upgrade failed`);
          return new Response("WebSocket upgrade failed", { status: 500 });
        }
      } else {
        console.log(`[Server_HTTP] WebSocket not supported`);
        return new Response("WebSocket not supported", { status: 426 });
      }
    }
    if (url.pathname.startsWith("/~/")) {
      console.log(`[Server_HTTP] Matched route pattern: ${url.pathname}`);
      return this.handleRouteRequest(request, url);
    } else {
      console.log(`[Server_HTTP] Serving static file: ${url.pathname}`);
      return this.serveStaticFile(request, url);
    }
  }
  handleRouteRequest(request, url) {
    const routeName = url.pathname.slice(3);
    console.log(`[HTTP] Handling route: /~/${routeName}, method: ${request.method}, full pathname: ${url.pathname}`);
    if (routeName === "processes") {
      console.log(`[HTTP] Matched /processes route`);
      if (request.method === "GET") {
        console.log(`[HTTP] Handling GET /~/processes`);
        console.log(`[HTTP] Checking if handleHttpGetProcesses exists:`, typeof this.handleHttpGetProcesses);
        if (typeof this.handleHttpGetProcesses === "function") {
          console.log(`[HTTP] Calling handleHttpGetProcesses`);
          return this.handleHttpGetProcesses();
        } else {
          console.error(`[HTTP] handleHttpGetProcesses is not a function`);
          return new Response(`Server Error: handleHttpGetProcesses not found`, {
            status: 500,
            headers: { "Content-Type": "text/plain" }
          });
        }
      } else if (request.method === "OPTIONS") {
        console.log(`[HTTP] Handling OPTIONS /~/processes`);
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400"
          }
        });
      } else {
        console.log(`[HTTP] Method not allowed: ${request.method} for /~/processes`);
        return new Response(`Method ${request.method} not allowed`, {
          status: 405,
          headers: {
            Allow: "GET, OPTIONS",
            "Content-Type": "text/plain"
          }
        });
      }
    }
    if (routeName === "configs") {
      console.log(`[HTTP] Matched /configs route`);
      if (request.method === "GET") {
        console.log(`[HTTP] Handling GET /~/configs`);
        console.log(`[HTTP] Checking if handleHttpGetConfigs exists:`, typeof this.handleHttpGetConfigs);
        if (typeof this.handleHttpGetConfigs === "function") {
          console.log(`[HTTP] Calling handleHttpGetConfigs`);
          return this.handleHttpGetConfigs();
        } else {
          console.error(`[HTTP] handleHttpGetConfigs is not a function`);
          return new Response(`Server Error: handleHttpGetConfigs not found`, {
            status: 500,
            headers: { "Content-Type": "text/plain" }
          });
        }
      } else if (request.method === "OPTIONS") {
        console.log(`[HTTP] Handling OPTIONS /~/configs`);
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400"
          }
        });
      } else {
        console.log(`[HTTP] Method not allowed: ${request.method} for /~/configs`);
        return new Response(`Method ${request.method} not allowed`, {
          status: 405,
          headers: {
            Allow: "GET, OPTIONS",
            "Content-Type": "text/plain"
          }
        });
      }
    }
    if (routeName === "outputfiles") {
      console.log(`[HTTP] Matched /outputfiles route`);
      if (request.method === "GET") {
        console.log(`[HTTP] Handling GET /~/outputfiles`);
        return this.handleHttpGetOutputFiles(request, url);
      } else if (request.method === "OPTIONS") {
        console.log(`[HTTP] Handling OPTIONS /~/outputfiles`);
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400"
          }
        });
      } else {
        console.log(`[HTTP] Method not allowed: ${request.method} for /~/outputfiles`);
        return new Response(`Method ${request.method} not allowed`, {
          status: 405,
          headers: {
            Allow: "GET, OPTIONS",
            "Content-Type": "text/plain"
          }
        });
      }
    }
    if (routeName === "aider-processes") {
      console.log(`[HTTP] Matched /aider-processes route`);
      if (request.method === "GET") {
        console.log(`[HTTP] Handling GET /~/aider-processes`);
        return this.handleHttpGetAiderProcesses();
      } else if (request.method === "OPTIONS") {
        console.log(`[HTTP] Handling OPTIONS /~/aider-processes`);
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400"
          }
        });
      } else {
        console.log(`[HTTP] Method not allowed: ${request.method} for /~/aider-processes`);
        return new Response(`Method ${request.method} not allowed`, {
          status: 405,
          headers: {
            Allow: "GET, OPTIONS",
            "Content-Type": "text/plain"
          }
        });
      }
    }
    if (routeName === "inputfiles") {
      console.log(`[HTTP] Matched /inputfiles route`);
      if (request.method === "GET") {
        console.log(`[HTTP] Handling GET /~/inputfiles`);
        return this.handleHttpGetInputFiles(request, url);
      } else if (request.method === "OPTIONS") {
        console.log(`[HTTP] Handling OPTIONS /~/inputfiles`);
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400"
          }
        });
      } else {
        console.log(`[HTTP] Method not allowed: ${request.method} for /~/inputfiles`);
        return new Response(`Method ${request.method} not allowed`, {
          status: 405,
          headers: {
            Allow: "GET, OPTIONS",
            "Content-Type": "text/plain"
          }
        });
      }
    }
    const match = this.http.matchRoute(routeName, this.routes);
    if (match) {
      console.log(`[HTTP] Found route match for ${routeName}`);
      try {
        const nodeReq = {
          url: url.pathname,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body: request.body,
          params: match.params
        };
        const response = {
          writeHead: (status, headers) => {
            return new Response(null, { status, headers });
          },
          end: (body) => {
            return new Response(body, {
              status: 200,
              headers: { "Content-Type": "text/plain" }
            });
          }
        };
        const result = match.handler(nodeReq, response);
        if (result instanceof Response) {
          return result;
        }
        return result;
      } catch (error) {
        console.error(`[HTTP] Error in route handler for /~/${routeName}:`, error);
        return new Response(`Internal Server Error: ${error}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" }
        });
      }
    }
    console.log(`[HTTP] No route found for: /~/${routeName}`);
    return new Response(`Route not found: /~/${routeName}`, {
      status: 404,
      headers: { "Content-Type": "text/plain" }
    });
  }
  async serveStaticFile(request, url) {
    console.log(`[Server_HTTP] serveStaticFile(${url.pathname})`);
    const normalizedPath = decodeURIComponent(url.pathname);
    if (normalizedPath.includes("..")) {
      return new Response("Forbidden: Directory traversal not allowed", {
        status: 403,
        headers: { "Content-Type": "text/plain" }
      });
    }
    const projectRoot = process.cwd();
    const filePath = path2.join(projectRoot, normalizedPath);
    if (!filePath.startsWith(path2.resolve(projectRoot))) {
      return new Response("Forbidden", {
        status: 403,
        headers: { "Content-Type": "text/plain" }
      });
    }
    try {
      const stats = await fs2.promises.stat(filePath);
      if (stats.isDirectory()) {
        const files = await fs2.promises.readdir(filePath);
        const items = await Promise.all(files.map(async (file) => {
          try {
            const stat = await fs2.promises.stat(path2.join(filePath, file));
            const isDir = stat.isDirectory();
            const slash = isDir ? "/" : "";
            return `<li><a href="${path2.join(normalizedPath, file)}${slash}">${file}${slash}</a></li>`;
          } catch {
            return `<li><a href="${path2.join(normalizedPath, file)}">${file}</a></li>`;
          }
        }));
        const html = `
          <!DOCTYPE html>
          <html>
          <head><title>Directory listing for ${normalizedPath}</title></head>
          <body>
            <h1>Directory listing for ${normalizedPath}</h1>
            <ul>
              ${items.join("")}
            </ul>
          </body>
          </html>
        `;
        return new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html" }
        });
      } else {
        return this.serveFile(filePath);
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        return new Response(`File not found: ${normalizedPath}`, {
          status: 404,
          headers: { "Content-Type": "text/plain" }
        });
      } else {
        return new Response(`Server Error: ${error.message}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" }
        });
      }
    }
  }
  async serveFile(filePath) {
    console.log(`[Server_HTTP] serveFile(${filePath})`);
    const contentType = getContentType(filePath) || CONTENT_TYPES.OCTET_STREAM;
    try {
      const file = await Bun.file(filePath).arrayBuffer();
      return new Response(file, {
        status: 200,
        headers: { "Content-Type": contentType }
      });
    } catch (error) {
      if (error.code === "ENOENT") {
        return new Response(`File not found: ${filePath}`, {
          status: 404,
          headers: { "Content-Type": "text/plain" }
        });
      } else {
        return new Response(`Server Error: ${error.message}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" }
        });
      }
    }
  }
  router(a) {
    return a;
  }
}

// src/server/serverClasses/Server_WS.ts
class Server_WS extends Server_HTTP {
  wsClients = new Set;
  wsManager;
  constructor(configs, mode) {
    super(configs, mode);
    this.wsManager = new WsManager;
  }
  async start() {
    console.log(`[Server_WS] start()`);
    await super.start();
  }
  async stop() {
    console.log(`[Server_WS] stop()`);
    this.wsClients.forEach((client) => {
      client.close();
    });
    this.wsClients.clear();
    await super.stop();
  }
  escapeXml(unsafe) {
    return this.wsManager.escapeXml(unsafe);
  }
  resourceChanged(url) {
    console.log(`[WebSocket] Resource changed: ${url}, broadcasting to ${this.wsClients.size} clients`);
    const message = {
      type: "resourceChanged",
      url,
      timestamp: new Date().toISOString(),
      message: `Resource at ${url} has been updated`
    };
    console.log(`[WebSocket] Broadcasting message:`, message);
    this.broadcast(message);
  }
  broadcast(message) {
    const data = typeof message === "string" ? message : JSON.stringify(message);
    console.log(`[WebSocket] Broadcasting to ${this.wsClients.size} clients:`, message.type || message);
    let sentCount = 0;
    let errorCount = 0;
    this.wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(data);
          sentCount++;
        } catch (error) {
          console.error(`[WebSocket] Error sending to client:`, error);
          errorCount++;
        }
      } else {
        console.log(`[WebSocket] Client not open, state: ${client.readyState}`);
      }
    });
    console.log(`[WebSocket] Sent to ${sentCount} clients, ${errorCount} errors`);
  }
  handleWebSocketMessage(ws, message) {
    console.log("[WebSocket] Received message:", message.type);
    if (message.type === "getProcesses") {
      this.handleGetProcesses(ws);
      return;
    }
    const response = this.wsManager.processMessage(message.type, message.data, () => this.getProcessSummary(), (processId) => {
      const processManager = this;
      if (typeof processManager.getProcessLogs === "function") {
        return processManager.getProcessLogs(processId);
      }
      return [];
    });
    ws.send(JSON.stringify(response));
    switch (message.type) {
      case "sourceFilesUpdated":
        this.handleSourceFilesUpdatedSideEffects(ws, message.data, response);
        break;
      case "getBuildListenerState":
        this.handleGetBuildListenerStateSideEffects(ws);
        break;
      case "getBuildEvents":
        this.handleGetBuildEventsSideEffects(ws);
        break;
    }
  }
  handleSourceFilesUpdatedSideEffects(ws, data, response) {
    const { testName, hash, files, runtime } = data || {};
    if (!testName || !hash || !files || !runtime) {
      return;
    }
    console.log(`[WebSocket] Forwarding source files update to build listener for test: ${testName} (runtime: ${runtime})`);
    if (typeof this.sourceFilesUpdated === "function") {
      console.log(`[WebSocket] sourceFilesUpdated method found, calling it`);
      try {
        this.sourceFilesUpdated(testName, hash, files, runtime);
        console.log(`[WebSocket] sourceFilesUpdated called successfully`);
        this.broadcast({
          type: "sourceFilesUpdated",
          testName,
          hash,
          files,
          runtime,
          status: "processed",
          timestamp: new Date().toISOString(),
          message: "Source files update processed successfully"
        });
        if (response.status === "success") {
          ws.send(JSON.stringify({
            type: "sourceFilesUpdated",
            status: "processed",
            testName,
            runtime,
            message: "Build update processed and broadcasted successfully",
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.error("[WebSocket] Error processing source files update:", error);
        ws.send(JSON.stringify({
          type: "sourceFilesUpdated",
          status: "error",
          testName,
          runtime,
          message: `Error processing build update: ${error}`,
          timestamp: new Date().toISOString()
        }));
      }
    } else {
      console.warn("[WebSocket] sourceFilesUpdated method not available on this instance");
    }
  }
  handleGetBuildListenerStateSideEffects(ws) {
    console.log("[WebSocket] Handling getBuildListenerState request");
    if (typeof this.getBuildListenerState === "function") {
      try {
        const state = this.getBuildListenerState();
        ws.send(JSON.stringify({
          type: "buildListenerState",
          data: state,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error("[WebSocket] Error getting build listener state:", error);
        ws.send(JSON.stringify({
          type: "buildListenerState",
          status: "error",
          message: `Error getting build listener state: ${error}`,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }
  handleGetBuildEventsSideEffects(ws) {
    console.log("[WebSocket] Handling getBuildEvents request");
    if (typeof this.getBuildEvents === "function") {
      try {
        const events = this.getBuildEvents();
        ws.send(JSON.stringify({
          type: "buildEvents",
          events,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error("[WebSocket] Error getting build events:", error);
        ws.send(JSON.stringify({
          type: "buildEvents",
          status: "error",
          message: `Error getting build events: ${error}`,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }
  handleGetProcesses(ws) {
    if (!ws || typeof ws.send !== "function") {
      console.error("[WebSocket] Invalid WebSocket instance in handleGetProcesses");
      return;
    }
    console.log("[WebSocket] Received getProcesses request, telling client to use HTTP");
    ws.send(JSON.stringify({
      type: "useHttp",
      message: "Please use HTTP GET /~/processes to fetch processes",
      timestamp: new Date().toISOString()
    }));
  }
}

// src/server/serverClasses/Server_Docker.ts
var __promiseAll = Promise.all.bind(Promise);

class Server_Docker extends Server_WS {
  logProcesses = new Map;
  inputFiles = {};
  outputFiles = {};
  mode;
  constructor(configs, mode) {
    super(configs, mode);
    this.mode = mode;
  }
  generateServices() {
    const services = {};
    const processedRuntimes = new Set;
    let hasWebRuntime = false;
    for (const [runtimeTestsName, runtimeTests] of Object.entries(this.configs.runtimes)) {
      const runtime = runtimeTests.runtime;
      const dockerfile = runtimeTests.dockerfile;
      const buildOptions = runtimeTests.buildOptions;
      const testsObj = runtimeTests.tests;
      const checks = runtimeTests.checks;
      if (!RUN_TIMES.includes(runtime)) {
        throw `unknown runtime ${runtime}`;
      }
      if (runtime === "web") {
        hasWebRuntime = true;
      }
      const hasBuildKitOptions = runtimeTests.buildKitOptions !== undefined;
      if (!hasBuildKitOptions) {
        console.warn(`[Server_Docker] Warning: No BuildKit options configured for ${runtimeTestsName}. ` + `BuildKit is required for all builds.`);
      }
      if (!processedRuntimes.has(runtime)) {
        processedRuntimes.add(runtime);
        const builderServiceName = getBuilderServiceName(runtime);
        const composeFunc = runTimeToCompose[runtime][0];
        const projectConfigPath = "testeranto/testeranto.ts";
        const runtimeConfigPath = buildOptions;
        services[builderServiceName] = composeFunc(this.configs, builderServiceName, projectConfigPath, runtimeConfigPath, runtimeTestsName);
        if (!services[builderServiceName].environment) {
          services[builderServiceName].environment = {};
        }
        services[builderServiceName].environment.MODE = this.mode;
        if (runtimeTests.buildKitOptions) {
          delete services[builderServiceName].build;
          services[builderServiceName].image = `testeranto-${runtime}-${runtimeTestsName}:latest`;
        }
        console.log(`[Server_Docker] Added builder service: ${builderServiceName} for ${runtime}`);
      }
      for (const tName of testsObj) {
        const cleanedTestName = cleanTestName(tName);
        const uid = `${runtimeTestsName.toLowerCase()}-${cleanedTestName}`;
        const bddCommandFunc = runTimeToCompose[runtime][2];
        let f;
        if (runtime === "node" || runtime === "web") {
          f = tName.split(".").slice(0, -1).concat("mjs").join(".");
        } else {
          f = tName;
        }
        const bddCommand = bddCommandFunc(f, buildOptions, runtimeTestsName);
        console.log(`[Server_Docker] [generateServices] ${runtimeTestsName} BDD command: "${bddCommand}"`);
        services[getBddServiceName(uid)] = bddTestDockerComposeFile(this.configs, runtime, getBddServiceName(uid), bddCommand);
        services[getAiderServiceName(uid)] = aiderDockerComposeFile(getAiderServiceName(uid));
        checks.forEach((check, ndx) => {
          const command = check([]);
          services[getCheckServiceName(uid, ndx)] = staticTestDockerComposeFile(runtime, getCheckServiceName(uid, ndx), command, this.configs, runtimeTestsName);
        });
      }
    }
    if (hasWebRuntime) {
      services["chrome-service"] = chromeServiceConfig();
    }
    for (const serviceName in services) {
      if (!services[serviceName].networks) {
        services[serviceName].networks = ["allTests_network"];
      }
    }
    return services;
  }
  async start() {
    await super.start();
    this.writeConfigForExtension();
    await this.setupDockerCompose();
    const baseReportsDir = path3.join(process.cwd(), "testeranto", "reports");
    try {
      fs3.mkdirSync(baseReportsDir, { recursive: true });
      console.log(`[Server_Docker] Created base reports directory: ${baseReportsDir}`);
    } catch (error) {
      console.error(`[Server_Docker] Failed to create base reports directory ${baseReportsDir}: ${error.message}`);
    }
    const downCmd = DOCKER_COMPOSE_DOWN;
    await this.spawnPromise(downCmd);
    console.log("[Server_Docker] Building all runtimes with BuildKit");
    await this.buildWithBuildKit();
    console.log("[Server_Docker] Starting builder services to create test bundles");
    await this.startBuilderServices();
    for (const [configKey, configValue] of Object.entries(this.configs.runtimes)) {
      const runtime = configValue.runtime;
      const tests = configValue.tests;
      if (!this.inputFiles[configKey]) {
        this.inputFiles[configKey] = {};
      }
      for (const testName of tests) {
        if (!this.inputFiles[configKey][testName]) {
          this.inputFiles[configKey][testName] = [];
        }
        if (this.mode === "dev") {
          this.watchInputFile(runtime, testName);
        } else {
          this.loadInputFileOnce(runtime, testName, configKey);
        }
        if (this.mode === "dev") {
          this.watchOutputFile(runtime, testName, configKey);
        }
        await this.launchBddTest(runtime, testName, configKey, configValue);
        await this.launchChecks(runtime, testName, configKey, configValue);
      }
    }
    if (this.mode === "once") {
      try {
        console.log("[Server_Docker] Once mode: Waiting for tests to complete...");
        await this.waitForAllTestsToComplete();
        console.log("[Server_Docker] Once mode: All tests completed. Exiting now.");
        process.exit(0);
      } catch (error) {
        console.error("[Server_Docker] Error in once mode shutdown:", error);
        process.exit(1);
      }
    }
  }
  async watchOutputFile(runtime, testName, configKey) {
    const outputDir = getFullReportDir(process.cwd(), runtime);
    if (!this.outputFiles[configKey]) {
      this.outputFiles[configKey] = {};
    }
    if (!this.outputFiles[configKey][testName]) {
      this.outputFiles[configKey][testName] = [];
    }
    console.log(`[Server_Docker] Setting up output file watcher for: ${outputDir} (configKey: ${configKey}, test: ${testName})`);
    this.updateOutputFilesList(configKey, testName, outputDir);
    if (this.mode === "dev") {
      fs3.watch(outputDir, (eventType, filename) => {
        if (filename) {
          console.log(`[Server_Docker] Output directory changed: ${eventType} ${filename} in ${outputDir}`);
          this.updateOutputFilesList(configKey, testName, outputDir);
          this.resourceChanged("/~/outputfiles");
        }
      });
    }
  }
  updateOutputFilesList(configKey, testName, outputDir) {
    try {
      const files = fs3.readdirSync(outputDir);
      const testFiles = files.filter((file) => file.includes(testName.replace("/", "_").replace(".", "-")) || file.includes(`${configKey}-${testName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-")}`));
      const projectRoot = process.cwd();
      const relativePaths = testFiles.map((file) => {
        const absolutePath = path3.join(outputDir, file);
        let relativePath = path3.relative(projectRoot, absolutePath);
        relativePath = relativePath.split(path3.sep).join("/");
        return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
      });
      this.outputFiles[configKey][testName] = relativePaths;
      console.log(`[Server_Docker] Updated output files for ${configKey}/${testName}: ${relativePaths.length} files`);
      if (relativePaths.length > 0) {
        console.log(`[Server_Docker] Sample output file: ${relativePaths[0]}`);
      }
    } catch (error) {
      console.error(`[Server_Docker] Failed to read output directory ${outputDir}:`, error.message);
      this.outputFiles[configKey][testName] = [];
    }
  }
  loadInputFileOnce(runtime, testName, configKey) {
    let inputFilePath;
    try {
      inputFilePath = getInputFilePath(runtime, testName);
    } catch (error) {
      console.warn(`[Server_Docker] Could not get input file path for ${runtime}/${testName}: ${error.message}`);
      return;
    }
    console.log(`[Server_Docker] Loading input file once: ${inputFilePath} (configKey: ${configKey})`);
    if (!this.inputFiles[configKey]) {
      this.inputFiles[configKey] = {};
    }
    if (fs3.existsSync(inputFilePath)) {
      try {
        const fileContent = fs3.readFileSync(inputFilePath, "utf-8");
        const inputFiles = JSON.parse(fileContent);
        this.inputFiles[configKey][testName] = inputFiles;
        console.log(`[Server_Docker] Loaded ${inputFiles.length} input files from ${inputFilePath}`);
      } catch (error) {
        console.warn(`[Server_Docker] Failed to read input file ${inputFilePath}: ${error.message}`);
      }
    } else {
      console.log(`[Server_Docker] Input file does not exist: ${inputFilePath}`);
    }
  }
  async watchInputFile(runtime, testsName) {
    let configKey = "";
    for (const [key, configValue] of Object.entries(this.configs.runtimes)) {
      if (configValue.runtime === runtime && configValue.tests.includes(testsName)) {
        configKey = key;
        break;
      }
    }
    let inputFilePath;
    try {
      inputFilePath = getInputFilePath(runtime, testsName);
    } catch (error) {
      console.warn(`[Server_Docker] Could not get input file path for ${runtime}/${testsName}: ${error.message}`);
      return;
    }
    console.log(`[Server_Docker] \uD83D\uDC40 Setting up file watcher for: ${inputFilePath} (configKey: ${configKey})`);
    console.log(`[Server_Docker]   Runtime: ${runtime}, Test: ${testsName}`);
    console.log(`[Server_Docker]   Mode: ${this.mode}`);
    if (!this.inputFiles[configKey]) {
      this.inputFiles[configKey] = {};
    }
    if (fs3.existsSync(inputFilePath)) {
      try {
        const fileContent = fs3.readFileSync(inputFilePath, "utf-8");
        const inputFiles = JSON.parse(fileContent);
        this.inputFiles[configKey][testsName] = inputFiles;
        console.log(`[Server_Docker] \uD83D\uDCD6 Loaded ${inputFiles.length} input files from ${inputFilePath}`);
        console.log(`[Server_Docker]   Files: ${inputFiles.slice(0, 3).map((f) => path3.basename(f)).join(", ")}${inputFiles.length > 3 ? "..." : ""}`);
      } catch (error) {
        console.warn(`[Server_Docker] \u26A0\uFE0F Failed to read input file ${inputFilePath}: ${error.message}`);
      }
    } else {
      console.log(`[Server_Docker] \uD83D\uDCED Input file does not exist yet: ${inputFilePath}`);
      console.log(`[Server_Docker]   Tests will be triggered when this file is created.`);
    }
    if (this.mode === "dev") {
      try {
        fs3.watchFile(inputFilePath, (curr, prev) => {
          console.log(`[Server_Docker] \uD83D\uDD04 Input file changed: ${inputFilePath}`);
          console.log(`[Server_Docker] \uD83D\uDCCA Previous mtime: ${prev.mtime}, Current mtime: ${curr.mtime}`);
          if (!fs3.existsSync(inputFilePath)) {
            console.log(`[Server_Docker] \u26A0\uFE0F Input file no longer exists: ${inputFilePath}`);
            return;
          }
          try {
            const fileContent = fs3.readFileSync(inputFilePath, "utf-8");
            const inputFiles = JSON.parse(fileContent);
            this.inputFiles[configKey][testsName] = inputFiles;
            console.log(`[Server_Docker] \uD83D\uDCC4 Updated input files for ${configKey}/${testsName}: ${inputFiles.length} files`);
            this.resourceChanged("/~/inputfiles");
            for (const [ck, configValue] of Object.entries(this.configs.runtimes)) {
              if (configValue.runtime === runtime && configValue.tests.includes(testsName)) {
                console.log(`[Server_Docker] \uD83D\uDE80 Triggering tests for ${runtime}/${testsName} (config: ${ck})`);
                console.log(`[Server_Docker]   \u21B3 Launching BDD test...`);
                this.launchBddTest(runtime, testsName, ck, configValue);
                console.log(`[Server_Docker]   \u21B3 Launching checks...`);
                this.launchChecks(runtime, testsName, ck, configValue);
                console.log(`[Server_Docker]   \u21B3 Informing aider...`);
                this.informAider(runtime, testsName, ck, configValue, inputFiles);
                console.log(`[Server_Docker] \u2705 All tests triggered for ${runtime}/${testsName}`);
                break;
              }
            }
          } catch (error) {
            console.error(`[Server_Docker] \u274C Failed to read or parse input file ${inputFilePath}: ${error.message}`);
          }
        });
      } catch (e) {
        console.error(`[Server_Docker] \u274C Failed to watch file ${inputFilePath}: ${e.message}`);
      }
    } else {
      this.loadInputFileOnce(runtime, testsName, configKey);
    }
  }
  async informAider(runtime, testName, configKey, configValue, inputFiles) {
    const uid = generateUid(configKey, testName);
    const aiderServiceName = getAiderServiceName(uid);
    console.log(`[Server_Docker] Informing aider service: ${aiderServiceName} about updated input files`);
    try {
      const containerIdCmd = `docker compose -f "testeranto/docker-compose.yml" ps -q ${aiderServiceName}`;
      const containerId = execSync(containerIdCmd, {
        encoding: "utf-8"
      }).toString().trim();
      if (!containerId) {
        console.error(`[Server_Docker] No container found for aider service: ${aiderServiceName}`);
        return;
      }
      console.log(`[Server_Docker] Found container ID: ${containerId} for ${aiderServiceName}`);
      const inputFilesPath = `testeranto/bundles/${runtime}/${testName}-inputFiles.json`;
      let inputContent = "";
      try {
        inputContent = fs3.readFileSync(inputFilesPath, "utf-8");
        console.log(`[Server_Docker] Read input files from ${inputFilesPath}, length: ${inputContent.length}`);
      } catch (error) {
        console.error(`[Server_Docker] Failed to read input files: ${error.message}`);
      }
      const sendInputCmd = `echo ${JSON.stringify(inputContent)} | docker exec -i ${containerId} sh -c 'cat > /proc/1/fd/0'`;
      console.log(`[Server_Docker] Executing command to send input to aider process`);
      try {
        execSync(sendInputCmd, {
          encoding: "utf-8",
          stdio: "pipe"
        });
        console.log(`[Server_Docker] Successfully sent input to aider process`);
      } catch (error) {
        console.error(`[Server_Docker] Failed to send input via docker exec: ${error.message}`);
      }
    } catch (error) {
      console.error(`[Server_Docker] Failed to inform aider service ${aiderServiceName}: ${error.message}`);
      this.captureExistingLogs(aiderServiceName, runtime).catch((err) => console.error(`[Server_Docker] Also failed to capture logs:`, err));
    }
  }
  async launchBddTest(runtime, testName, configKey, configValue) {
    const uid = generateUid(configKey, testName);
    const bddServiceName = getBddServiceName(uid);
    console.log(`[Server_Docker] \uD83D\uDE80 Launching BDD test: ${bddServiceName}`);
    console.log(`[Server_Docker]   Config: ${configKey}, Test: ${testName}, Runtime: ${runtime}`);
    console.log(`[Server_Docker]   UID: ${uid}`);
    try {
      console.log(`[Server_Docker]   Starting Docker service...`);
      await this.spawnPromise(`docker compose -f "testeranto/docker-compose.yml" up -d ${bddServiceName}`);
      console.log(`[Server_Docker]   \u2705 Docker service started`);
      console.log(`[Server_Docker]   Capturing existing logs...`);
      await this.captureExistingLogs(bddServiceName, runtime);
      console.log(`[Server_Docker]   Starting log capture...`);
      this.startServiceLogging(bddServiceName, runtime).catch((error) => console.error(`[Server_Docker] \u274C Failed to start logging for ${bddServiceName}:`, error));
      this.resourceChanged("/~/processes");
      this.writeConfigForExtension();
      console.log(`[Server_Docker] \u2705 BDD test launched successfully: ${bddServiceName}`);
    } catch (error) {
      console.error(`[Server_Docker] \u274C Failed to start ${bddServiceName}: ${error.message}`);
      this.captureExistingLogs(bddServiceName, runtime).catch((err) => console.error(`[Server_Docker] Also failed to capture logs:`, err));
      this.writeConfigForExtension();
    }
  }
  async launchChecks(runtime, testName, configKey, configValue) {
    const uid = generateUid(configKey, testName);
    const checks = configValue.checks || [];
    for (let i = 0;i < checks.length; i++) {
      const checkServiceName = getCheckServiceName(uid, i);
      console.log(`[Server_Docker] Starting check service: ${checkServiceName}`);
      try {
        await this.spawnPromise(`docker compose -f "testeranto/docker-compose.yml" up -d ${checkServiceName}`);
        this.captureExistingLogs(checkServiceName, runtime).catch((error) => console.error(`[Server_Docker] Failed to capture existing logs for ${checkServiceName}:`, error));
        this.startServiceLogging(checkServiceName, runtime).catch((error) => console.error(`[Server_Docker] Failed to start logging for ${checkServiceName}:`, error));
        this.resourceChanged("/~/processes");
      } catch (error) {
        console.error(`[Server_Docker] Failed to start ${checkServiceName}: ${error.message}`);
        this.captureExistingLogs(checkServiceName, runtime).catch((err) => console.error(`[Server_Docker] Also failed to capture logs:`, err));
      }
    }
    this.writeConfigForExtension();
  }
  async captureExistingLogs(serviceName, runtime) {
    const reportDir = getFullReportDir(process.cwd(), runtime);
    const logFilePath = getLogFilePath(process.cwd(), runtime, serviceName);
    try {
      const checkCmd = `${DOCKER_COMPOSE_BASE} ps -a -q ${serviceName}`;
      const containerId = execSync(checkCmd, {
        encoding: "utf-8"
      }).toString().trim();
      if (!containerId) {
        console.debug(`[Server_Docker] No container found for service ${serviceName}`);
        return;
      }
      const cmd = `${DOCKER_COMPOSE_LOGS} ${serviceName} 2>/dev/null || true`;
      const existingLogs = execSync(cmd, {
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024
      });
      if (existingLogs && existingLogs.trim().length > 0) {
        fs3.writeFileSync(logFilePath, existingLogs);
        console.log(`[Server_Docker] Captured ${existingLogs.length} bytes of existing logs for ${serviceName}`);
      } else {
        fs3.writeFileSync(logFilePath, "");
      }
      this.captureContainerExitCode(serviceName, runtime);
    } catch (error) {
      console.debug(`[Server_Docker] No existing logs for ${serviceName}: ${error.message}`);
    }
  }
  async stop() {
    console.log("[Server_Docker] Stopping server...");
    for (const [containerId, logProcess] of this.logProcesses.entries()) {
      try {
        logProcess.process.kill("SIGTERM");
        console.log(`[Server_Docker] Stopped log process for container ${containerId} (${logProcess.serviceName})`);
      } catch (error) {
        console.error(`[Server_Docker] Error stopping log process for ${containerId}:`, error);
      }
    }
    this.logProcesses.clear();
    console.log("[Server_Docker] Stopping all docker containers...");
    const result = await this.DC_down();
    console.log(`[Server_Docker] Docker down result: ${result.exitCode === 0 ? "success" : "failed"}`);
    this.resourceChanged("/~/processes");
    writeConfigForExtensionOnStop();
    await super.stop();
    console.log("[Server_Docker] Server stopped successfully");
  }
  async setupDockerCompose() {
    const composeDir = path3.join(process.cwd(), "testeranto", "bundles");
    try {
      const requiredDirs = [
        path3.join(process.cwd(), "src"),
        path3.join(process.cwd(), "dist"),
        path3.join(process.cwd(), "testeranto"),
        composeDir
      ];
      const services = this.generateServices();
      writeComposeFile(services);
    } catch (err) {
      console.error(`Error in setupDockerCompose:`, err);
      throw err;
    }
  }
  writeConfigForExtension() {
    try {
      const configDir = path3.join(process.cwd(), "testeranto");
      const configPath = path3.join(configDir, "extension-config.json");
      if (!fs3.existsSync(configDir)) {
        fs3.mkdirSync(configDir, { recursive: true });
        console.log(`[Server_Docker] Created directory: ${configDir}`);
      }
      const runtimesArray = [];
      if (this.configs.runtimes && typeof this.configs.runtimes === "object") {
        for (const [key, value] of Object.entries(this.configs.runtimes)) {
          const runtimeObj = value;
          if (runtimeObj && typeof runtimeObj === "object") {
            const runtime = runtimeObj.runtime;
            const tests = runtimeObj.tests || [];
            console.log(`[Server_Docker] Found runtime: ${runtime}, tests:`, tests);
            if (runtime) {
              runtimesArray.push({
                key,
                runtime,
                label: this.getRuntimeLabel(runtime),
                tests: Array.isArray(tests) ? tests : []
              });
            } else {
              console.warn(`[Server_Docker] No runtime property found for key: ${key}`, runtimeObj);
            }
          } else {
            console.warn(`[Server_Docker] Invalid runtime configuration for key: ${key}, value type: ${typeof value}`);
          }
        }
      } else {
        console.warn(`[Server_Docker] No runtimes found in config`);
      }
      const processSummary = this.getProcessSummary();
      const configData = {
        runtimes: runtimesArray,
        timestamp: new Date().toISOString(),
        source: "testeranto.ts",
        serverStarted: true,
        processes: processSummary.processes || [],
        totalProcesses: processSummary.total || 0,
        lastUpdated: new Date().toISOString()
      };
      const configJson = JSON.stringify(configData, null, 2);
      fs3.writeFileSync(configPath, configJson);
      console.log(`[Server_Docker] Updated extension config with ${processSummary.total || 0} processes`);
    } catch (error) {
      console.error(`[Server_Docker] Failed to write extension config:`, error);
    }
  }
  getRuntimeLabel(runtime) {
    return getRuntimeLabel(runtime);
  }
  getInputFiles(runtime, testName) {
    console.log(`[Server_Docker] getInputFiles called for ${runtime}/${testName}`);
    let configKey = null;
    for (const [key, configValue] of Object.entries(this.configs.runtimes)) {
      if (configValue.runtime === runtime && configValue.tests.includes(testName)) {
        configKey = key;
        break;
      }
    }
    if (!configKey) {
      console.log(`[Server_Docker] No config found for runtime ${runtime} and test ${testName}`);
      return [];
    }
    console.log(`[Server_Docker] Found config key: ${configKey} for ${runtime}/${testName}`);
    console.log("INPUT FILES", this.inputFiles);
    if (this.inputFiles && typeof this.inputFiles === "object" && this.inputFiles[configKey] && typeof this.inputFiles[configKey] === "object" && this.inputFiles[configKey][testName]) {
      const files = this.inputFiles[configKey][testName];
      console.log(`[Server_Docker] Found ${files.length} input files in memory for ${configKey}/${testName}`);
      return Array.isArray(files) ? files : [];
    }
    console.log(`[Server_Docker] No input files in memory for ${configKey}/${testName}`);
    console.log(`[Server_Docker] Available config keys:`, Object.keys(this.inputFiles || {}));
    if (this.inputFiles && this.inputFiles[configKey]) {
      console.log(`[Server_Docker] Tests in ${configKey}:`, Object.keys(this.inputFiles[configKey]));
    }
    return [];
  }
  getOutputFiles(runtime, testName) {
    console.log(`[Server_Docker] getOutputFiles called for ${runtime}/${testName}`);
    let configKey = null;
    for (const [key, configValue] of Object.entries(this.configs.runtimes)) {
      if (configValue.runtime === runtime && configValue.tests.includes(testName)) {
        configKey = key;
        break;
      }
    }
    if (!configKey) {
      console.log(`[Server_Docker] No config found for runtime ${runtime} and test ${testName}`);
      return [];
    }
    console.log(`[Server_Docker] Found config key: ${configKey} for ${runtime}/${testName}`);
    if (this.outputFiles && typeof this.outputFiles === "object" && this.outputFiles[configKey] && typeof this.outputFiles[configKey] === "object" && this.outputFiles[configKey][testName]) {
      const files = this.outputFiles[configKey][testName];
      console.log(`[Server_Docker] Found ${files.length} output files in memory for ${configKey}/${testName}`);
      return Array.isArray(files) ? files : [];
    }
    console.log(`[Server_Docker] No output files in memory for ${configKey}/${testName}`);
    return [];
  }
  getAiderProcesses() {
    try {
      const summary = this.getProcessSummary();
      const aiderProcesses = summary.processes.filter((process2) => process2.name && process2.name.includes("-aider"));
      return aiderProcesses.map((process2) => {
        let runtime = "";
        let testName = "";
        let configKey = "";
        const name = process2.name || process2.containerName || "";
        if (name.includes("-aider")) {
          const match = name.match(/^(.+?)-(.+)-aider$/);
          if (match) {
            configKey = match[1];
            const testPart = match[2];
            for (const [key, configValue] of Object.entries(this.configs.runtimes)) {
              if (key === configKey) {
                runtime = configValue.runtime;
                for (const t of configValue.tests) {
                  const cleanedTestName = cleanTestName(t);
                  if (cleanedTestName === testPart) {
                    testName = t;
                    break;
                  }
                }
                break;
              }
            }
          }
        }
        const connectCommand = `docker exec -it ${process2.containerId} aider`;
        return {
          ...process2,
          name,
          containerId: process2.containerId || "",
          runtime,
          testName,
          configKey,
          status: process2.status || "",
          state: process2.state || "",
          isActive: process2.isActive || false,
          exitCode: process2.exitCode || null,
          startedAt: process2.startedAt || null,
          finishedAt: process2.finishedAt || null,
          connectCommand,
          terminalCommand: connectCommand,
          containerName: name,
          timestamp: new Date().toISOString()
        };
      });
    } catch (error) {
      console.error(`[Server_Docker] Error getting aider processes: ${error.message}`);
      return [];
    }
  }
  handleAiderProcesses() {
    try {
      const aiderProcesses = this.getAiderProcesses();
      return {
        aiderProcesses,
        timestamp: new Date().toISOString(),
        message: "Success"
      };
    } catch (error) {
      console.error(`[Server_Docker] Error in handleAiderProcesses: ${error.message}`);
      return {
        aiderProcesses: [],
        timestamp: new Date().toISOString(),
        message: `Error: ${error.message}`
      };
    }
  }
  getProcessSummary() {
    try {
      const cmd = 'docker ps -a --format "{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}|{{.State}}|{{.Command}}|{{.ID}}"';
      let output;
      try {
        output = execSync(cmd).toString();
      } catch (dockerError) {
        console.error(`[Server_Docker] Error running docker ps: ${dockerError.message}`);
        return {
          processes: [],
          total: 0,
          timestamp: new Date().toISOString(),
          error: `Docker not available: ${dockerError.message}`
        };
      }
      if (!output || output.trim() === "") {
        return {
          processes: [],
          total: 0,
          timestamp: new Date().toISOString(),
          message: "No docker containers found"
        };
      }
      const lines = output.trim().split("\n").filter((line) => line.trim());
      if (lines.length === 0) {
        return {
          processes: [],
          total: 0,
          timestamp: new Date().toISOString(),
          message: "No docker containers found"
        };
      }
      const processes = lines.map((line) => {
        const parts = line.split("|");
        const [name = "", image = "", status = "", ports = "", state = "", command = "", containerId = ""] = parts;
        let exitCode = null;
        let startedAt = null;
        let finishedAt = null;
        if (containerId && containerId.trim()) {
          try {
            const inspectCmd = `docker inspect --format='${getContainerInspectFormat()}' ${containerId} 2>/dev/null || echo ""`;
            const inspectOutput = execSync(inspectCmd).toString().trim();
            if (inspectOutput && inspectOutput !== "") {
              const [exitCodeStr, startedAtStr, finishedAtStr] = inspectOutput.split("|");
              if (exitCodeStr && exitCodeStr !== "" && exitCodeStr !== "<no value>") {
                exitCode = parseInt(exitCodeStr, 10);
              }
              if (startedAtStr && startedAtStr !== "" && startedAtStr !== "<no value>") {
                startedAt = startedAtStr;
              }
              if (finishedAtStr && finishedAtStr !== "" && finishedAtStr !== "<no value>") {
                finishedAt = finishedAtStr;
              }
            }
          } catch (error) {
            console.debug(`[Server_Docker] Could not inspect container ${containerId}: ${error}`);
          }
        }
        const isActive = isContainerActive(state);
        return {
          processId: name || containerId,
          containerId,
          command: command || image,
          image,
          timestamp: new Date().toISOString(),
          status,
          state,
          ports,
          exitCode,
          startedAt,
          finishedAt,
          isActive,
          health: "unknown"
        };
      });
      return {
        processes,
        total: processes.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`[Server_Docker] Unexpected error in getProcessSummary: ${error.message}`);
      return {
        processes: [],
        total: 0,
        timestamp: new Date().toISOString(),
        error: `Unexpected error: ${error.message}`
      };
    }
  }
  async startServiceLogging(serviceName, runtime) {
    const reportDir = getFullReportDir(process.cwd(), runtime);
    try {
      fs3.mkdirSync(reportDir, { recursive: true });
    } catch (error) {
      console.error(`[Server_Docker] Failed to create report directory ${reportDir}: ${error.message}`);
      return;
    }
    const logFilePath = getLogFilePath(process.cwd(), runtime, serviceName);
    const exitCodeFilePath = getExitCodeFilePath(process.cwd(), runtime, serviceName);
    const logScript = `
      # Wait for container to exist
      for i in {1..30}; do
        if docker compose -f "testeranto/docker-compose.yml" ps -q ${serviceName} > /dev/null 2>&1; then
          break
        fi
        sleep 1
      done
      # Capture logs from the beginning
      docker compose -f "testeranto/docker-compose.yml" logs --no-color -f ${serviceName}
    `;
    console.log(`[Server_Docker] Starting log capture for ${serviceName} to ${logFilePath}`);
    const logStream = fs3.createWriteStream(logFilePath, { flags: "w" });
    const timestamp2 = new Date().toISOString();
    logStream.write(`=== Log started at ${timestamp2} for service ${serviceName} ===\n\n`);
    const child = spawn("bash", ["-c", logScript], {
      stdio: ["ignore", "pipe", "pipe"]
    });
    let containerId = null;
    try {
      const containerIdCmd = `${DOCKER_COMPOSE_BASE} ps -q ${serviceName}`;
      containerId = execSync(containerIdCmd, {}).toString().trim();
    } catch (error) {
      console.warn(`[Server_Docker] Could not get container ID for ${serviceName}, will track by service name`);
    }
    child.stdout?.on("data", (data) => {
      logStream.write(data);
    });
    child.stderr?.on("data", (data) => {
      logStream.write(data);
    });
    child.on("error", (error) => {
      console.error(`[Server_Docker] Log process error for ${serviceName}:`, error);
      logStream.write(`\n=== Log process error: ${error.message} ===\n`);
      logStream.end();
      fs3.writeFileSync(exitCodeFilePath, "-1");
    });
    child.on("close", (code) => {
      const endTimestamp = new Date().toISOString();
      logStream.write(`\n=== Log ended at ${endTimestamp}, process exited with code ${code} ===\n`);
      logStream.end();
      console.log(`[Server_Docker] Log process for ${serviceName} exited with code ${code}`);
      fs3.writeFileSync(exitCodeFilePath, code?.toString() || "0");
      this.captureContainerExitCode(serviceName, runtime);
      if (containerId) {
        this.logProcesses.delete(containerId);
      } else {
        for (const [id, proc] of this.logProcesses.entries()) {
          if (proc.serviceName === serviceName) {
            this.logProcesses.delete(id);
            break;
          }
        }
      }
    });
    const trackingKey = containerId || serviceName;
    this.logProcesses.set(trackingKey, { process: child, serviceName });
    this.writeConfigForExtension();
  }
  async captureContainerExitCode(serviceName, runtime) {
    const containerIdCmd = `docker compose -f "testeranto/docker-compose.yml" ps -a -q ${serviceName}`;
    const containerId = execSync(containerIdCmd, {}).toString().trim();
    if (containerId) {
      const inspectCmd = `docker inspect --format='{{.State.ExitCode}}' ${containerId}`;
      const exitCode = execSync(inspectCmd, {}).toString().trim();
      const containerExitCodeFilePath = getContainerExitCodeFilePath(process.cwd(), runtime, serviceName);
      fs3.writeFileSync(containerExitCodeFilePath, exitCode);
      console.log(`[Server_Docker] Container ${serviceName} (${containerId.substring(0, 12)}) exited with code ${exitCode}`);
      const statusCmd = `docker inspect --format='{{.State.Status}}' ${containerId}`;
      const status = execSync(statusCmd, {}).toString().trim();
      const statusFilePath = getStatusFilePath(process.cwd(), runtime, serviceName);
      fs3.writeFileSync(statusFilePath, status);
      this.resourceChanged("/~/processes");
      this.writeConfigForExtension();
    } else {
      console.debug(`[Server_Docker] No container found for service ${serviceName}`);
    }
  }
  spawnPromise(command) {
    console.log(`[spawnPromise] Executing: ${command}`);
    return new Promise((resolve, reject) => {
      const child = spawn(command, {
        stdio: ["ignore", "pipe", "pipe"],
        shell: true
      });
      let stdout = "";
      let stderr = "";
      child.stdout?.on("data", (data) => {
        const chunk = data.toString();
        stdout += chunk;
        process.stdout.write(chunk);
      });
      child.stderr?.on("data", (data) => {
        const chunk = data.toString();
        stderr += chunk;
        process.stderr.write(chunk);
      });
      child.on("error", (error) => {
        console.error(`[spawnPromise] Failed to start process: ${error.message}`);
        console.error(`[spawnPromise] Command: ${command}`);
        reject(error);
      });
      child.on("close", (code) => {
        if (code === 0) {
          console.log(`[spawnPromise] Process completed successfully`);
          console.log(`[spawnPromise] Command: ${command}`);
          resolve(code);
        } else {
          console.error(`[spawnPromise] Process exited with code ${code}`);
          console.error(`[spawnPromise] Command: ${command}`);
          console.error(`[spawnPromise] stdout: ${stdout}`);
          console.error(`[spawnPromise] stderr: ${stderr}`);
          reject(new Error(`Process exited with code ${code}\nCommand: ${command}\nstdout: ${stdout}\nstderr: ${stderr}`));
        }
      });
    });
  }
  async DC_upAll() {
    const result = await executeDockerComposeCommand(DC_COMMANDS.up, {
      errorMessage: "docker compose up"
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await this.spawnPromise(DC_COMMANDS.up);
        return { exitCode: 0, out: "", err: "", data: null };
      } catch (error) {
        console.error(`[Docker] docker compose up \u274C ${import_ansi_colors.default.bgBlue(error.message.replaceAll("\\n", "\n"))}`);
        return { exitCode: 1, out: "", err: `Error starting services: ${error.message}`, data: null };
      }
    }
    return result;
  }
  async DC_down() {
    const result = await executeDockerComposeCommand(DC_COMMANDS.down, {
      errorMessage: "docker compose down"
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await this.spawnPromise(DC_COMMANDS.down);
        return { exitCode: 0, out: "", err: "", data: null };
      } catch (error) {
        console.log(`[DC_down] Error during down: ${error.message}`);
        return { exitCode: 1, out: "", err: `Error stopping services: ${error.message}`, data: null };
      }
    }
    return result;
  }
  async DC_ps() {
    return executeDockerComposeCommand(DC_COMMANDS.ps, {
      useExec: true,
      execOptions: { cwd: process.cwd() },
      errorMessage: "Error getting service status"
    });
  }
  async DC_logs(serviceName, options) {
    const tail = options?.tail ?? 100;
    const command = DC_COMMANDS.logs(serviceName, tail);
    return executeDockerComposeCommand(command, {
      useExec: true,
      execOptions: { cwd: process.cwd() },
      errorMessage: `Error getting logs for ${serviceName}`
    });
  }
  async DC_configServices() {
    return executeDockerComposeCommand(DC_COMMANDS.config, {
      useExec: true,
      execOptions: { cwd: process.cwd() },
      errorMessage: "Error getting services from config"
    });
  }
  async DC_start() {
    const result = await executeDockerComposeCommand(DC_COMMANDS.start, {
      errorMessage: "docker compose start"
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await this.spawnPromise(DC_COMMANDS.start);
        return { exitCode: 0, out: "", err: "", data: null };
      } catch (error) {
        console.error(`[Docker] docker compose start \u274C ${import_ansi_colors.default.bgBlue(error.message.replaceAll("\\n", "\n"))}`);
        return { exitCode: 1, out: "", err: `Error starting services: ${error.message}`, data: null };
      }
    }
    return result;
  }
  async buildWithBuildKit() {
    console.log("[Server_Docker] Starting BuildKit builds for all runtimes");
    const buildKitAvailable = await BuildKitBuilder.checkBuildKitAvailable();
    console.log(`[Server_Docker] BuildKit available: ${buildKitAvailable}`);
    if (!buildKitAvailable) {
      throw new Error("BuildKit is not available. Please ensure Docker BuildKit is enabled. " + "You can enable it by setting DOCKER_BUILDKIT=1 environment variable or " + "by configuring Docker Desktop to use BuildKit.");
    }
    console.log("[Server_Docker] BuildKit is available. Building all runtimes...");
    const buildErrors = [];
    console.log("[Server_Docker] Building aider image...");
    try {
      await this.buildAiderImage();
      console.log("[Server_Docker] \u2705 Aider image built successfully");
    } catch (error) {
      console.error(`[Server_Docker] \u274C Aider image build failed:`, error.message);
      buildErrors.push(`aider: ${error.message}`);
    }
    for (const [configKey, configValue] of Object.entries(this.configs.runtimes)) {
      const runtime = configValue.runtime;
      console.log(`[Server_Docker] Building ${runtime} runtime (${configKey})...`);
      try {
        switch (runtime) {
          case "node":
            console.log(`[Server_Docker] Building node runtime: ${configKey}`);
            await nodeBuildKitBuild(this.configs, configKey);
            console.log(`[Server_Docker] \u2705 BuildKit build successful for ${configKey} (node)`);
            break;
          case "web":
            console.log(`[Server_Docker] Building web runtime: ${configKey}`);
            await webBuildKitBuild(this.configs, configKey);
            console.log(`[Server_Docker] \u2705 BuildKit build successful for ${configKey} (web)`);
            break;
          case "golang":
            console.log(`[Server_Docker] Building golang runtime: ${configKey}`);
            await golangBuildKitBuild(this.configs, configKey);
            console.log(`[Server_Docker] \u2705 BuildKit build successful for ${configKey} (golang)`);
            break;
          case "ruby":
            console.log(`[Server_Docker] Building ruby runtime: ${configKey}`);
            await rubyBuildKitBuild(this.configs, configKey);
            console.log(`[Server_Docker] \u2705 BuildKit build successful for ${configKey} (ruby)`);
            break;
          case "rust":
            console.log(`[Server_Docker] Building rust runtime: ${configKey}`);
            await rustBuildKitBuild(this.configs, configKey);
            console.log(`[Server_Docker] \u2705 BuildKit build successful for ${configKey} (rust)`);
            break;
          case "java":
            console.log(`[Server_Docker] Building java runtime: ${configKey}`);
            await javaBuildKitBuild(this.configs, configKey);
            console.log(`[Server_Docker] \u2705 BuildKit build successful for ${configKey} (java)`);
            break;
          case "python":
            console.log(`[Server_Docker] Building python runtime: ${configKey}`);
            await pythonBuildKitBuild(this.configs, configKey);
            console.log(`[Server_Docker] \u2705 BuildKit build successful for ${configKey} (python)`);
            break;
          default:
            throw new Error(`Unknown runtime: ${runtime} for ${configKey}`);
        }
      } catch (error) {
        console.error(`[Server_Docker] \u274C BuildKit build failed for ${configKey} (${runtime}):`, error.message);
        buildErrors.push(`${configKey} (${runtime}): ${error.message}`);
      }
    }
    if (buildErrors.length > 0) {
      const errorMessage = `BuildKit builds failed for ${buildErrors.length} runtime(s):\n` + buildErrors.map((error) => `  - ${error}`).join("\n");
      throw new Error(errorMessage);
    } else {
      console.log(`[Server_Docker] \u2705 All BuildKit builds completed successfully!`);
    }
  }
  async startBuilderServices() {
    console.log("[Server_Docker] Starting all builder services...");
    const builderServices = [];
    const processedRuntimes = new Set;
    for (const [runtimeTestsName, runtimeTests] of Object.entries(this.configs.runtimes)) {
      const runtime = runtimeTests.runtime;
      if (!processedRuntimes.has(runtime)) {
        processedRuntimes.add(runtime);
        const builderServiceName = getBuilderServiceName(runtime);
        builderServices.push(builderServiceName);
      }
    }
    for (const serviceName of builderServices) {
      console.log(`[Server_Docker] Starting builder service: ${serviceName}`);
      try {
        await this.spawnPromise(`docker compose -f "testeranto/docker-compose.yml" up -d ${serviceName}`);
        console.log(`[Server_Docker] \u2705 Builder service ${serviceName} started successfully`);
        let runtimeForService = "";
        for (const [runtimeTestsName, runtimeTests] of Object.entries(this.configs.runtimes)) {
          const runtime = runtimeTests.runtime;
          if (getBuilderServiceName(runtime) === serviceName) {
            runtimeForService = runtime;
            break;
          }
        }
        if (runtimeForService) {
          this.startServiceLogging(serviceName, runtimeForService).catch((error) => console.error(`[Server_Docker] Failed to start logging for ${serviceName}:`, error));
        }
      } catch (error) {
        console.error(`[Server_Docker] \u274C Failed to start builder service ${serviceName}:`, error.message);
      }
    }
    console.log("[Server_Docker] \u2705 All builder services started");
  }
  async buildAiderImage() {
    const dockerfilePath = "aider.Dockerfile";
    if (!fs3.existsSync(dockerfilePath)) {
      console.warn(`[Server_Docker] \u26A0\uFE0F aider.Dockerfile not found at ${dockerfilePath}. Aider services may not work correctly.`);
      const defaultAiderDockerfile = `FROM python:3.11-slim
WORKDIR /workspace
RUN pip install --no-cache-dir aider-chat
USER 1000
CMD ["tail", "-f", "/dev/null"]`;
      try {
        fs3.writeFileSync(dockerfilePath, defaultAiderDockerfile);
        console.log(`[Server_Docker] Created default ${dockerfilePath}`);
      } catch (error) {
        console.error(`[Server_Docker] Failed to create ${dockerfilePath}: ${error.message}`);
        return;
      }
    }
    const buildKitOptions = {
      runtime: "aider",
      configKey: "aider",
      dockerfilePath,
      buildContext: process.cwd(),
      cacheMounts: [],
      targetStage: undefined,
      buildArgs: {}
    };
    console.log(`[Server_Docker] Building aider image with BuildKit...`);
    const result = await BuildKitBuilder.buildImage({
      ...buildKitOptions,
      runtime: "aider",
      configKey: "aider"
    });
    if (result.success) {
      console.log(`[Server_Docker] \u2705 Aider image built successfully in ${result.duration}ms`);
    } else {
      console.error(`[Server_Docker] \u274C Aider image build failed: ${result.error}`);
      console.warn(`[Server_Docker] Aider services may not work, but continuing with other builds`);
    }
  }
  async waitForAllTestsToComplete() {
    console.log("[Server_Docker] Once mode: Waiting for all tests to complete...");
    console.log("[Server_Docker] Waiting 10 seconds for containers to start...");
    await new Promise((resolve) => setTimeout(resolve, 1e4));
    const maxAttempts = 120;
    const checkInterval = 5000;
    for (let attempt = 0;attempt < maxAttempts; attempt++) {
      const summary = this.getProcessSummary();
      const testContainers = summary.processes.filter((process2) => {
        const name = process2.name || "";
        return name.includes("-bdd") || name.includes("-check-") || name.includes("-builder") || name.includes("-aider");
      });
      const runningContainers = testContainers.filter((process2) => {
        const state = (process2.state || "").toLowerCase();
        return state === "running" || state === "restarting" || state === "created";
      });
      if (runningContainers.length === 0) {
        console.log(`[Server_Docker] All ${testContainers.length} test containers have completed.`);
        const containersWithoutExitCode = testContainers.filter((process2) => {
          return process2.exitCode === null || process2.exitCode === undefined;
        });
        if (containersWithoutExitCode.length > 0) {
          console.log(`[Server_Docker] Note: ${containersWithoutExitCode.length} containers don't have exit codes yet`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        return;
      }
      console.log(`[Server_Docker] Waiting for ${runningContainers.length} test containers to finish... (attempt ${attempt + 1}/${maxAttempts})`);
      runningContainers.forEach((container) => {
        console.log(`  - ${container.name || container.containerId}: state=${container.state}, status=${container.status}, exitCode=${container.exitCode}`);
      });
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }
    console.warn("[Server_Docker] Timeout waiting for all tests to complete. Some tests may still be running.");
    console.log("[Server_Docker] Forcing shutdown due to timeout...");
  }
  async DC_build() {
    throw new Error("Traditional docker-compose build is not supported. Use BuildKit instead.");
  }
}

// src/server/serverClasses/Server.ts
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY)
  process.stdin.setRawMode(true);

class Server extends Server_Docker {
  constructor(configs, mode) {
    super(configs, mode);
    console.log("[Server] Press 'q' to initiate a graceful shutdown.");
    console.log("[Server] Press 'CTRL + c' to quit forcefully.");
    process.stdin.on("keypress", async (str2, key) => {
      if (key.name === "q") {
        console.log("Testeranto is shutting down gracefully...");
        await this.stop();
        process.exit(0);
      }
      if (key.ctrl && key.name === "c") {
        console.log("\nForce quitting...");
        process.exit(1);
      }
    });
    process.on("SIGINT", async () => {
      console.log("\nForce quitting...");
      process.exit(1);
    });
  }
  async start() {
    console.log(`[Server] start()`);
    const runtimesDir = `testeranto/runtimes/`;
    fs4.mkdirSync(runtimesDir, { recursive: true });
    await super.start();
  }
  async stop() {
    console.log(`[Server] stop()`);
    await super.stop();
  }
}

// src/index.ts
var mode = process.argv[2];
if (mode !== "once" && mode !== "dev" && mode != "-v") {
  console.error(`The 3rd argument should be 'dev' or 'once', not '${mode}'.`);
  console.error(`you passed '${process.argv}'.`);
  process.exit(-1);
}
if (mode === "-v") {
  console.log(`v${"0.225.2"} `);
  process.exit(0);
}
var config = (await import(process.cwd() + "/testeranto/testeranto.ts")).default;
var server = new Server(config, mode);
server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
console.log(`hello testeranto v0.224.4 - running in ${mode} mode`);
if (mode === "once") {
  const forceExitTimeout = setTimeout(() => {
    console.error("Force exiting after 30 minutes");
    process.exit(1);
  }, 1800000);
  process.on("exit", () => {
    clearTimeout(forceExitTimeout);
  });
}
