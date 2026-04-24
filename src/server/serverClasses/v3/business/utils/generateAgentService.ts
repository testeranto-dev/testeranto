export const generateAgentService = (
  agentName: string,
  agentConfig: any,
  mode: string,
): any => {
  return {
    image: 'testeranto-aider:latest',
    container_name: `agent-${agentName}`,
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/test:/workspace/test`,
      `${process.cwd()}/SOUL.md:/workspace/SOUL.md`,
      `${process.cwd()}:/workspace`,
      `${process.cwd()}/.aider.conf.yml:/workspace/.aider.conf.yml`,
    ],
    working_dir: '/workspace',
    command: [
      'sh',
      '-c',
      `# Create agent instructions file from config
         echo "Creating agent instructions for ${agentName}"
         
         # Create the instruction file with content from config
         cat > /tmp/agent_load.txt << 'EOF'
/read SOUL.md
/read testeranto/slices/agents/${agentName}.json
/read testeranto/agents/${agentName}.md
EOF

         # Create the instruction file with content from config
         cat > /tmp/agent_message.txt << 'EOF'
${agentConfig.message || `Your name is "${agentName}".`}
EOF

         echo "Starting aider for agent ${agentName} with instructions from config"
         aider --load /tmp/agent_load.txt --no-analytics --no-show-model-warnings --no-show-release-notes --no-check-update 2>&1
         EXIT_CODE=$?
         echo "Aider exited with code $EXIT_CODE"
         # Exit with the same code (no restart)
         exit $EXIT_CODE`,
    ],
    environment: {
      MODE: mode,
      NODE_ENV: 'production',
      AGENT_NAME: agentName,
      EDITOR: 'vim',
      EXIT_CODE: '0',
    },
    restart: 'no',
    networks: ['allTests_network'],
    tty: true,
    stdin_open: true,
    extra_hosts: {
      'host.docker.internal': 'host-gateway',
    },
  };
};
