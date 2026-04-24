export const generateAiderService = (
  configKey: string,
  configValue: any,
  testName: string,
): any => {
  const cleanTestName = testName
    .replace(/\//g, '_')
    .replace(/\./g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase();

  return {
    image: 'testeranto-aider:latest',
    container_name: `${configKey}-${cleanTestName}-aider`,
    environment: {
      NODE_ENV: 'production',
    },
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/test:/workspace/test`,
      `${process.cwd()}/SOUL.md:/workspace/SOUL.md`,
      `${process.cwd()}/testeranto:/workspace/testeranto`,
      `${process.cwd()}/.aider.conf.yml:/workspace/.aider.conf.yml`,
      `${process.cwd()}:/workspace`,
    ],
    working_dir: '/workspace',
    command: 'tail -f /dev/null',
    networks: ['allTests_network'],
    tty: true,
    stdin_open: true,
    restart: 'no',
    extra_hosts: {
      'host.docker.internal': 'host-gateway',
    },
  };
};
