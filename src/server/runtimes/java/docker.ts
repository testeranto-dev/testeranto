import { join } from "node:path";
import type { ITesterantoConfig } from "../../../Types";
import type { IConfigSlice } from "../../types";
import { BuildKitBuilder } from "../../buildkit/BuildKit_Utils";

// Import the java runtime file as text
import javaContent from "./main.java" with { type: "text" };

// Write the java file to a location that will be mounted in the container
const javaScriptPath = join(process.cwd(), "testeranto", "java_runtime.java");
await Bun.write(javaScriptPath, javaContent);

export const javaDockerComposeFile = (
  config: ITesterantoConfig,
  container_name: string,
  projectConfigPath: string,
  javaConfigPath: string,
  slice: IConfigSlice
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
      ...config.volumes,
      `${process.cwd()}/testeranto:/workspace/testeranto`,
    ],
    command: javaBuildCommand(
      projectConfigPath,
      javaConfigPath,
      slice
    ),
    networks: ["allTests_network"],
  };

  return service;
};

export const javaBuildCommand = (
  projectConfigPath: string,
  javaConfigPath: string,
  slice: IConfigSlice
) => {
  const configJson = JSON.stringify(slice);
  return `sh -c "cd /workspace && javac -cp \\".:lib/*\\" testeranto/*.java && java -cp \\"testeranto:.:lib/*\\" java_runtime /workspace/${projectConfigPath} /workspace/${javaConfigPath} '${configJson}'"`;
}

export const javaBddCommand = (fpath: string, javaConfigPath: string, configKey: string) => {
  // Extract just the filename from the path
  // Handle both forward and backward slashes
  const normalizedPath = fpath.replace(/\\/g, '/');
  const pathParts = normalizedPath.split('/');
  const fileName = pathParts[pathParts.length - 1];

  // Remove .java extension
  let baseName = fileName;
  if (baseName.endsWith('.java')) {
    baseName = baseName.substring(0, baseName.length - 5);
  }

  // Also remove any other extensions just in case
  const dotIndex = baseName.lastIndexOf('.');
  if (dotIndex !== -1) {
    baseName = baseName.substring(0, dotIndex);
  }

  const jsonStr = JSON.stringify({
    ports: [1111],
    fs: `testeranto/reports/${configKey}/${baseName}/`,
  });

  // The JAR should be at testeranto/bundles/{configKey}/{baseName}.jar
  // Since the command runs from /workspace, use relative path
  const jarPath = `testeranto/bundles/${configKey}/${baseName}.jar`;

  // Add debugging to check if JAR exists
  // Escape single quotes in JSON string for shell
  const escapedJsonStr = jsonStr.replace(/'/g, "'\"'\"'");

  return `sh -c "echo '=== Java BDD Test Starting ===' && echo 'Looking for JAR at: ${jarPath}' && echo 'Current directory:' && pwd && if [ -f ${jarPath} ]; then echo '✅ JAR found' && java -jar ${jarPath} '${escapedJsonStr}'; else echo '❌ JAR not found!' && echo 'Listing testeranto/bundles/${configKey}/:' && ls -la testeranto/bundles/${configKey}/ 2>/dev/null || echo 'Directory not found' && echo 'Searching for JARs in workspace...' && find /workspace -name '*.jar' 2>/dev/null | head -10 && exit 1; fi"`;
}

// BuildKit-based building for java runtime
export const javaBuildKitBuild = async (
  config: ITesterantoConfig,
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
