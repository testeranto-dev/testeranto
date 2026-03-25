import {
  consoleError,
  consoleLog,
  consoleWarn,
  existsSync,
  join,
  processCwd,
  readFileSync,
  unlinkSync,
  writeFileSync,
  yamlDump,
} from "../Server_Docker_Dependents";
import { BaseCompose } from "./BaseCompose";


export const writeComposeFile = (services: Record<string, any>) => {
  const composeFilePath = join(processCwd(), "testeranto/docker-compose.yml");

  // Delete the old file first to ensure fresh generation
  if (existsSync(composeFilePath)) {
    // consoleLog(`[writeComposeFile] Removing old docker-compose.yml`);
    try {
      unlinkSync(composeFilePath);
    } catch (error: any) {
      consoleWarn(
        `[writeComposeFile] Could not delete old docker-compose.yml: ${error.message}`,
      );
    }
  }

  const dockerComposeFileContents = BaseCompose(services);

  // Log the structure for debugging
  const structure = JSON.stringify(
    {
      services: Object.keys(dockerComposeFileContents.services || {}),
      networks: Object.keys(dockerComposeFileContents.networks || {}),
      volumes: Object.keys(dockerComposeFileContents.volumes || {}),
    },
    null,
    2
  );


  const yamlContent = yamlDump(dockerComposeFileContents, {
    lineWidth: -1,
    noRefs: true,
  });

  writeFileSync(composeFilePath, yamlContent);

};
