import type { ITesterantoConfig } from "../../../../../Types";
import type { IMode } from "../../../../types";

export function generateAgentService(
  configs: ITesterantoConfig,
  agentName: string,
  agentConfig: any,
  mode: IMode,
  projectRoot: string,
): any {
  const loadCommands = agentConfig.load || [];

  const loadContent = loadCommands
    .filter((cmd: string) => cmd.trim().length > 0)
    .join('\n');

  return {
    image: 'testeranto-aider:latest',
    container_name: `agent-${agentName}`,
    volumes: [
      ...(configs.volumes || []),
      `${projectRoot}:/workspace`,
      `${projectRoot}/.aider.conf.yml:/workspace/.aider.conf.yml`,
    ],
    working_dir: '/workspace',
    command: [
      'sh', '-c',
      `# Create agent instructions file from config
       echo "Creating agent instructions for ${agentName}"
         
       # Create the load file with only operations
       # The agent's personality/instructions are in the JSON slice file
      cat > /tmp/agent_load.txt << 'EOF'
${loadContent}
EOF
       echo "Starting aider for agent ${agentName}"
       aider --load /tmp/agent_load.txt --no-analytics --no-show-model-warnings --no-show-release-notes --no-check-update --message 'Adopt the persona given in the context files, then wait for further instructions. You will find a json file with your name on it. Within, you will find a list of other agents, yourself included.' 2>&1
       EXIT_CODE=$?
       echo "Aider exited with code $EXIT_CODE"
       # Exit with the same code (no restart)
       exit $EXIT_CODE`
    ],
    environment: {
      MODE: mode,
      NODE_ENV: 'production',
      AGENT_NAME: agentName,
      EDITOR: 'vim',
    },
    restart: 'no',
    networks: ['allTests_network'],
    tty: true,
    stdin_open: true,
    extra_hosts: ['host.docker.internal:host-gateway'],
  };
}
