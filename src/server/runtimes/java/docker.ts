import type { ITestconfigV2 } from "../../../Types";
import { BuildKitBuilder } from "../../buildkit/BuildKit_Utils";

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
    command: javaBuildCommand(projectConfigPath, javaConfigPath, testName),
    networks: ["allTests_network"],
  };
  
  return service;
};

export const javaBuildCommand = (projectConfigPath: string, javaConfigPath: string, testName: string) => {
  // Compile and run the Java builder with arguments
  return `sh -c "cd /workspace && javac -cp \\".:lib/*\\" src/server/runtimes/java/main.java && java -cp \\"src/server/runtimes/java:.\\" main /workspace/${projectConfigPath} /workspace/${javaConfigPath} ${testName}"`;
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
