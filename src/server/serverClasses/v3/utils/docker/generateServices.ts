import type { ITesterantoConfig } from "../../../../../Types";
import type { IMode } from "../../../../types";
import { generateBddService } from "../../business/utils/generateBddService";
import { generateBuilderService } from "../../business/utils/generateBuilderService";
import { generateCheckService } from "../../business/utils/generateCheckService";
import { generateServiceName } from "../../utils/generateServiceName";

export function generateServices(
  configs: ITesterantoConfig,
  mode: IMode,
  projectRoot: string = process.cwd(),
): Record<string, any> {
  const services: Record<string, any> = {};

  // Add builder services
  for (const [configKey, configValue] of Object.entries(configs.runtimes)) {
    const builderServiceName = `${configKey}-builder`;
    services[builderServiceName] = generateBuilderService(configKey, configValue, mode);
  }

  // Add test services (BDD, checks, and aider services)
  for (const [configKey, configValue] of Object.entries(configs.runtimes)) {
    if (configValue.tests) {
      for (const testName of configValue.tests) {
        // BDD service
        const bddServiceName = generateServiceName(configKey, testName, 'bdd');
        services[bddServiceName] = generateBddService(configKey, configValue, testName);

        // Aider service
        const aiderServiceName = generateServiceName(configKey, testName, 'aider');
        services[aiderServiceName] = generateAiderService(configs, configKey, configValue, testName, mode, projectRoot);

        // Check services (if checks exist)
        if (configValue.checks && configValue.checks.length > 0) {
          for (let i = 0; i < configValue.checks.length; i++) {
            const checkServiceName = generateServiceName(configKey, testName, `check-${i}`);
            services[checkServiceName] = generateCheckService(configKey, configValue, testName, i);
          }
        }
      }
    }
  }

  // Add network
  services.networks = {
    allTests_network: {
      driver: 'bridge',
    },
  };

  return services;
}

function generateAiderService(
  configs: ITesterantoConfig,
  configKey: string,
  configValue: any,
  testName: string,
  mode: IMode,
  projectRoot: string = process.cwd(),
): any {
  const serviceName = generateServiceName(configKey, testName, 'aider');
  const runtime = configValue.runtime || 'node';

  const aiderCommand = [
    'sh', '-c',
    `
      echo "Aider service started for ${testName} (${configKey})"
      echo "Waiting for aider-message.txt..."
      
      MESSAGE_FILE="/workspace/testeranto/reports/${configKey}/${testName}/aider-message.txt"
      MAX_WAIT=300
      WAITED=0
      while [ ! -f "$MESSAGE_FILE" ] && [ $WAITED -lt $MAX_WAIT ]; do
        sleep 1
        WAITED=$((WAITED + 1))
      done
      
      if [ -f "$MESSAGE_FILE" ]; then
        echo "Message file found, running aider..."
        cat "$MESSAGE_FILE"
        echo ""
        echo "--- Running aider ---"
        aider --message-file "$MESSAGE_FILE" --no-analytics --no-show-model-warnings --no-show-release-notes --no-check-update 2>&1
        EXIT_CODE=$?
        echo "Aider exited with code $EXIT_CODE"
        exit $EXIT_CODE
      else
        echo "Timeout waiting for message file"
        exit 1
      fi
    `,
  ];

  return {
    image: `testeranto-${runtime}-${configKey}:latest`,
    container_name: serviceName,
    volumes: [
      ...(configs.volumes || []),
      `${projectRoot}:/workspace`,
      `${projectRoot}/.aider.conf.yml:/workspace/.aider.conf.yml`,
    ],
    working_dir: '/workspace',
    command: aiderCommand,
    environment: {
      MODE: mode,
      NODE_ENV: 'production',
      CONFIG_KEY: configKey,
      TEST_NAME: testName,
      RUNTIME: runtime,
    },
    restart: 'no',
    networks: ['allTests_network'],
    tty: true,
    stdin_open: true,
    extra_hosts: ['host.docker.internal:host-gateway'],
  };
}
