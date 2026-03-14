import { join } from "node:path";
import type { ITestconfigV2 } from "../../../Types";
import { BuildKitBuilder } from "../../buildkit/BuildKit_Utils";

// Import the java runtime file as text
import javaContent from "./main.java" with { type: "text" };

// Write the java file to a location that will be mounted in the container
const javaScriptPath = join(process.cwd(), "testeranto", "java_runtime.java");
await Bun.write(javaScriptPath, javaContent);

export const javaDockerComposeFile = (
  config: ITestconfigV2,
  container_name: string,
  projectConfigPath: string,
  javaConfigPath: string,
  testName: string
) => {
  // For java builder service, we need a proper build configuration
  const service: any = {
    build: {
      context: process.cwd(),
      dockerfile: config.runtimes[container_name]?.dockerfile || 'testeranto/runtimes/java/java.Dockerfile',
    },
    container_name,
    environment: {
      ENV: "java",
      MODE: process.env.MODE || 'once',
    },
    working_dir: "/workspace",
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/testeranto:/workspace/testeranto`,
    ],
    command: [
      "sh",
      "-c",
      `cd /workspace && javac -cp ".:lib/*" testeranto/java_runtime.java && java -cp "testeranto:." main /workspace/${projectConfigPath} /workspace/${javaConfigPath} ${testName}`
    ],
    networks: ["allTests_network"],
  };
  
  return service;
};

export const javaBuildCommand = (projectConfigPath: string, javaConfigPath: string, testName: string) => {
  // This function is used elsewhere, so keep it consistent
  // Return a string that can be used in shell contexts
  // Note: This might not be used for the builder service anymore, but keep it for compatibility
  return `sh -c "cd /workspace && javac -cp \\".:lib/*\\" testeranto/java_runtime.java && java -cp \\"testeranto:.\\" main /workspace/${projectConfigPath} /workspace/${javaConfigPath} ${testName}"`;
}

export const javaBddCommand = (fpath: string, javaConfigPath: string, configKey: string) => {
  const jsonStr = JSON.stringify({ 
    name: 'java-test',
    ports: [1111], 
    fs: "testeranto/reports/java",
    timeout: 30000,
    retries: 0,
    environment: {}
  });
  return `java -jar testeranto/bundles/${configKey}/${fpath.replace('.java', '.jar')} '${jsonStr}'`;
}

// BuildKit-based building for java runtime
export const javaBuildKitBuild = async (
  config: ITestconfigV2,
  configKey: string
): Promise<void> => {
  const runtimeConfig = config.runtimes[configKey];
  
  if (!runtimeConfig) {
    throw new Error(`Configuration not found for ${configKey}`);
  }
  
  const buildKitConfig = runtimeConfig.buildKitOptions || {};
  
  const buildKitOptions = {
    runtime: 'java',
    configKey,
    dockerfilePath: runtimeConfig.dockerfile,
    buildContext: process.cwd(),
    cacheMounts: buildKitConfig.cacheMounts || ['/root/.m2', '/root/.gradle'],
    targetStage: buildKitConfig.targetStage, // Keep as is (undefined if not specified)
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
