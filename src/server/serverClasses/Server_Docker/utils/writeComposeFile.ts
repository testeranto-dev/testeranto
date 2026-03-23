import { consoleError, consoleLog, consoleWarn, existsSync, join, readFileSync, unlinkSync, writeFileSync, yamlDump } from "../Server_Docker_Dependents";
import { getCwdPure, } from "../Server_Docker_Utils";
import { BaseCompose } from "../Server_Docker_Utils_Setup";


export const writeComposeFile = (services: Record<string, any>) => {
  const composeFilePath = join(getCwdPure(), "testeranto/docker-compose.yml");

  // Delete the old file first to ensure fresh generation
  if (existsSync(composeFilePath)) {
    consoleLog(`[writeComposeFile] Removing old docker-compose.yml`);
    try {
      unlinkSync(composeFilePath);
    } catch (error: any) {
      consoleWarn(
        `[writeComposeFile] Could not delete old docker-compose.yml: ${error.message}`,
      );
    }
  }

  consoleLog(
    `[writeComposeFile] Writing ${Object.keys(services).length} services to docker-compose.yml`,
  );
  consoleLog(
    `[writeComposeFile] Services: ${Object.keys(services).join(", ")}`,
  );

  // Check if chrome-service is in services
  if (services["chrome-service"]) {
    consoleLog(`[writeComposeFile] chrome-service is included in services`);
  } else {
    consoleWarn(
      `[writeComposeFile] chrome-service is NOT included in services`,
    );
  }

  const dockerComposeFileContents = BaseCompose(services);

  // Log the structure for debugging
  consoleLog(
    `[writeComposeFile] docker-compose.yml structure:`,
    JSON.stringify(
      {
        services: Object.keys(dockerComposeFileContents.services || {}),
        networks: Object.keys(dockerComposeFileContents.networks || {}),
        volumes: Object.keys(dockerComposeFileContents.volumes || {}),
      },
      null,
      2,
    ),
  );

  const yamlContent = yamlDump(dockerComposeFileContents, {
    lineWidth: -1,
    noRefs: true,
  });

  writeFileSync(composeFilePath, yamlContent);
  consoleLog(
    `[writeComposeFile] docker-compose.yml written successfully to ${composeFilePath}`,
  );

  // Verify the file was written
  if (existsSync(composeFilePath)) {
    const fileContent = readFileSync(composeFilePath, "utf-8");
    consoleLog(
      `[writeComposeFile] First 500 chars of docker-compose.yml:\n${fileContent.substring(0, 500)}...`,
    );

    // Check if chrome-service appears in the file
    if (fileContent.includes("chrome-service:")) {
      consoleLog(
        `[writeComposeFile] ✅ chrome-service found in docker-compose.yml`,
      );
    } else {
      consoleWarn(
        `[writeComposeFile] ⚠️ chrome-service NOT found in docker-compose.yml content`,
      );
    }
  } else {
    consoleError(
      `[writeComposeFile] ❌ docker-compose.yml was not created at ${composeFilePath}`,
    );
  }
};
