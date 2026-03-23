import {
  consoleError,
  existsSync,
  join,
  mkdirSync,
  processCwd,
  writeFileSync,
} from "../Server_Docker_Dependents";

export const writeConfigForExtensionOnStop = () => {
  try {
    const configDir = join(processCwd(), "testeranto");
    const configPath = join(configDir, "extension-config.json");

    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    const configData = {
      runtimes: [],
      timestamp: new Date().toISOString(),
      source: "testeranto.ts",
      serverStarted: false,
    };

    const configJson = JSON.stringify(configData, null, 2);
    writeFileSync(configPath, configJson);
  } catch (error: any) {
    consoleError(
      `[Server_Docker] Failed to write extension config on stop: ${error}`,
    );
  }
};
