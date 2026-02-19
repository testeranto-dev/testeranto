
import type { BuildOptions } from "esbuild";
import featuresPlugin from "../../../esbuildConfigs/featuresPlugin.js";
import baseEsBuildConfig from "../../../esbuildConfigs/index.js";
import inputFilesPlugin from "../../../esbuildConfigs/inputFilesPlugin.js";
import rebuildPlugin from "../../../esbuildConfigs/rebuildPlugin.js";
import type { ITestconfigV2 } from "../../../Types.js";

export default (
  nodeConfig: object,
  testName: string,
  projectConfig: ITestconfigV2
): BuildOptions => {

  console.log("esbuild", testName, projectConfig)

  const entryPoints = projectConfig.runtimes[testName].tests;

  const { inputFilesPluginFactory, register } = inputFilesPlugin(
    "node",
    testName
  );

  return {
    ...baseEsBuildConfig(nodeConfig),

    // outdir: absoluteBundlesDir(),
    outdir: `testeranto/bundles/${testName}`,
    outbase: ".", // Preserve directory structure relative to outdir
    metafile: true,
    supported: {
      "dynamic-import": true,
    },

    define: {
      "process.env.FLUENTFFMPEG_COV": "0",
      ENV: `"node"`,
    },

    bundle: true,
    format: "esm",

    absWorkingDir: process.cwd(),
    platform: "node",

    packages: "external",

    entryPoints,
    plugins: [
      featuresPlugin,
      inputFilesPluginFactory,
      rebuildPlugin("node"),
      ...(nodeConfig.plugins?.map((p) => p(register, entryPoints)) || []),
    ],
  };
};
