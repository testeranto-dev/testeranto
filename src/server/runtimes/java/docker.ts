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
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/dist:/workspace/dist`,
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
  // First compile the project with Gradle (try ./gradlew first, fall back to global gradle), then compile and run java_runtime
  // Use --no-daemon to avoid daemon issues, --stacktrace for debugging, and --refresh-dependencies for fresh downloads
  // Add JVM arguments to fix Java 17 module access issues with Gradle
  // Use both GRADLE_OPTS environment variable and -Dorg.gradle.jvmargs system property for maximum compatibility
  // Always create a proper build.gradle with all necessary dependencies
  return `sh -c "cd /workspace && echo '=== Creating proper build.gradle ===' && cat > build.gradle << 'EOF'
plugins {
    id 'java'
}

group 'com.example'
version '1.0-SNAPSHOT'

repositories {
    mavenCentral()
    mavenLocal()
}

dependencies {
    testImplementation 'org.junit.jupiter:junit-jupiter:5.9.2'
    testImplementation 'org.assertj:assertj-core:3.24.2'
    
    // For JSON processing
    implementation 'com.fasterxml.jackson.core:jackson-databind:2.15.2'
    
    // Kafe library is included in source code, not from Maven
    // implementation 'com.testeranto:testeranto.kafe:0.1.21'
    
    // Add JSON library for org.json
    implementation 'org.json:json:20230227'
}

test {
    useJUnitPlatform()
}

sourceSets {
    main {
        java {
            srcDirs = ['src/java/main/java']
        }
    }
    test {
        java {
            srcDirs = ['src/java/test/java']
        }
    }
}

compileJava {
    options.compilerArgs += ['-Xlint:unchecked']
}
EOF
&& ls -la build.gradle && echo '=== Contents of build.gradle (first 20 lines) ===' && head -30 build.gradle && echo '=== Running gradle tasks to see available tasks ===' && export GRADLE_OPTS='--add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.lang.invoke=ALL-UNNAMED --add-opens java.base/java.util=ALL-UNNAMED' && (if [ -f ./gradlew ]; then ./gradlew --no-daemon tasks --all; else gradle --no-daemon tasks --all; fi) && echo '=== Building with Gradle ===' && (if [ -f ./gradlew ]; then ./gradlew --no-daemon --stacktrace --refresh-dependencies -Dorg.gradle.jvmargs='--add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.lang.invoke=ALL-UNNAMED --add-opens java.base/java.util=ALL-UNNAMED' build; else gradle --no-daemon --stacktrace --refresh-dependencies -Dorg.gradle.jvmargs='--add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.lang.invoke=ALL-UNNAMED --add-opens java.base/java.util=ALL-UNNAMED' build; fi) && javac -cp \\".:lib/*\\" testeranto/java_runtime.java && java -cp \\"testeranto:.:lib/*\\" java_runtime /workspace/${projectConfigPath} /workspace/${javaConfigPath} ${testName} ${tests.join(" ")}"`;
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
