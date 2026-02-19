
import type { BuildOptions } from "esbuild";
import featuresPlugin from "../../../esbuildConfigs/featuresPlugin.js";
import baseEsBuildConfig from "../../../esbuildConfigs/index.js";
import inputFilesPlugin from "../../../esbuildConfigs/inputFilesPlugin.js";
import rebuildPlugin from "../../../esbuildConfigs/rebuildPlugin.js";
import type { ITestconfigV2 } from "../../../Types.js";

export default (config: ITestconfigV2, testName: string): BuildOptions => {
  // Use the same entry points as node tests for consistency
  const entrypoints = ["./example/Calculator.test.ts"];

  const { inputFilesPluginFactory, register } = inputFilesPlugin(
    "web",
    testName
  );

  return {
    ...baseEsBuildConfig(config),
    outdir: `testeranto/bundles/${testName}`,
    outbase: ".",
    metafile: true,
    supported: {
      "dynamic-import": true,
    },
    define: {
      "process.env.FLUENTFFMPEG_COV": "0",
      ENV: `"web"`,
    },
    absWorkingDir: process.cwd(),
    platform: "browser",
    packages: "external",
    entryPoints: entrypoints,
    bundle: true,
    format: "esm",
    plugins: [
      featuresPlugin,
      inputFilesPluginFactory,
      rebuildPlugin("web"),
      ...(config.web?.plugins?.map((p) => p(register, entrypoints)) || []),
    ],
  };
};
