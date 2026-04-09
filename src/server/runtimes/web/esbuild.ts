import type { BuildOptions } from "esbuild";
import featuresPlugin from "../../../esbuildConfigs/featuresPlugin.js";
import baseEsBuildConfig from "../../../esbuildConfigs/index.js";
import inputFilesPlugin from "../../../esbuildConfigs/inputFilesPlugin.js";
import rebuildPlugin from "../../../esbuildConfigs/rebuildPlugin.js";
import type { ITesterantoConfig } from "../../../Types.js";

export default (
  config: ITesterantoConfig,
  testName: string,
  projectConfig: ITesterantoConfig,
  entryPoints: string[]
): BuildOptions => {

  const { inputFilesPluginFactory, register } = inputFilesPlugin(
    "web",
    testName
  );

  // Handle case where config might be undefined
  const safeConfig = config || {};
  
  return {
    ...baseEsBuildConfig(safeConfig),
    outdir: `testeranto/bundles/${testName}`,
    outbase: ".",
    metafile: true,
    supported: {
      "dynamic-import": true,
    },
    define: {
      "process.env.FLUENTFFMPEG_COV": "0",
      ENV: `web`,
    },
    bundle: true,
    format: "esm",
    absWorkingDir: process.cwd(),
    platform: "browser",
    // Disable code splitting to avoid chunk files
    splitting: false,
    entryPoints,
    plugins: [
      featuresPlugin,
      inputFilesPluginFactory,
      rebuildPlugin("web"),
      ...((safeConfig.web?.plugins || safeConfig.plugins || [])?.map((p) => p(register, entryPoints)) || []),
    ],
  };
};
