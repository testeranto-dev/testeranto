import { join } from "node:path";
import type { ITesterantoConfig } from "../../../Types";
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
  testName: string
) => {
  const tests = config.runtimes[testName]?.tests || [];

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
      testName,
      tests,
    ),
    networks: ["allTests_network"],
  };

  return service;
};

export const javaBuildCommand = (projectConfigPath: string, javaConfigPath: string, testName: string, tests: string[]) => {
  // Use existing build.gradle (should be present from volume mount or Dockerfile)
  // Build with Gradle, then compile and run java_runtime
  // Use --no-daemon to avoid daemon issues, --stacktrace for debugging
  // Add JVM arguments to fix Java 17 module access issues with Gradle
  return `sh -c "cd /workspace && echo '=== Using existing build.gradle ===' && ls -la build.gradle && echo '=== Contents of build.gradle (first 20 lines) ===' && head -30 build.gradle && echo '=== Building with Gradle ===' && export GRADLE_OPTS='--add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.lang.invoke=ALL-UNNAMED --add-opens java.base/java.util=ALL-UNNAMED' && (if [ -f ./gradlew ]; then ./gradlew --no-daemon --stacktrace -Dorg.gradle.jvmargs='--add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.lang.invoke=ALL-UNNAMED --add-opens java.base/java.util=ALL-UNNAMED' build; else gradle --no-daemon --stacktrace -Dorg.gradle.jvmargs='--add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.lang.invoke=ALL-UNNAMED --add-opens java.base/java.util=ALL-UNNAMED' build; fi) && javac -cp \\".:lib/*\\" testeranto/java_runtime.java && java -cp \\"testeranto:.:lib/*\\" java_runtime /workspace/${projectConfigPath} /workspace/${javaConfigPath} ${testName} ${tests.join(" ")}"`;
}

export const javaBddCommand = (fpath: string, javaConfigPath: string, configKey: string) => {
  const jsonStr = JSON.stringify({
    // name: 'java-test',
    ports: [1111],
    fs: `testeranto/reports/${configKey}/${fpath}/`,
    // timeout: 30000,
    // retries: 0,
    // environment: {}
  });
  return `java -jar testeranto/bundles/${configKey}/${fpath.replace('.java', '.jar')} '${jsonStr}'`;
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
