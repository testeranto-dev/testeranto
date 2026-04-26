// deprecated
// import type { ITesterantoConfig } from "../../../../../Types";
// import type { IMode } from "../../../../types";
// import { generateServiceName } from "../generateServiceName";

// export function generateAiderService(
//   configs: ITesterantoConfig,
//   configKey: string,
//   configValue: any,
//   testName: string,
//   mode: IMode,
//   projectRoot: string,
// ): any {
//   const serviceName = generateServiceName(configKey, testName, 'aider');
//   const runtime = configValue.runtime || 'node';

//   const aiderCommand = [
//     'sh', '-c',
//     `
//       echo "Aider service started for ${testName} (${configKey})"
//       echo "Waiting for aider-message.txt..."
      
//       MESSAGE_FILE="/workspace/testeranto/reports/${configKey}/${testName}/aider-message.txt"
//       MAX_WAIT=300
//       WAITED=0
//       while [ ! -f "$MESSAGE_FILE" ] && [ $WAITED -lt $MAX_WAIT ]; do
//         sleep 1
//         WAITED=$((WAITED + 1))
//       done
      
//       if [ -f "$MESSAGE_FILE" ]; then
//         echo "Message file found, running aider..."
//         cat "$MESSAGE_FILE"
//         echo ""
//         echo "--- Running aider ---"
//         aider --message-file "$MESSAGE_FILE" --no-analytics --no-show-model-warnings --no-show-release-notes --no-check-update 2>&1
//         EXIT_CODE=$?
//         echo "Aider exited with code $EXIT_CODE"
//         exit $EXIT_CODE
//       else
//         echo "Timeout waiting for message file"
//         exit 1
//       fi
//     `,
//   ];

//   return {
//     image: `testeranto-${runtime}-${configKey}:latest`,
//     container_name: serviceName,
//     volumes: [
//       ...(configs.volumes || []),
//       `${projectRoot}:/workspace`,
//       `${projectRoot}/.aider.conf.yml:/workspace/.aider.conf.yml`,
//     ],
//     working_dir: '/workspace',
//     command: aiderCommand,
//     environment: {
//       MODE: mode,
//       NODE_ENV: 'production',
//       CONFIG_KEY: configKey,
//       TEST_NAME: testName,
//       RUNTIME: runtime,
//     },
//     restart: 'no',
//     networks: ['allTests_network'],
//     tty: true,
//     stdin_open: true,
//     extra_hosts: ['host.docker.internal:host-gateway'],
//   };
// }
