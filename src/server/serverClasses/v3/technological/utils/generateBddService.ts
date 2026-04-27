export const generateBddService = (
  configKey: string,
  configValue: any,
  testName: string,
): any => {
  const runtime = configValue.runtime || 'node';

  const cleanTestName = testName
    .replace(/\//g, '_')
    .replace(/\./g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase();

  const extensionMap: Record<string, string> = {
    node: 'mjs',
    web: 'mjs',
    golang: 'go',
    ruby: 'rb',
    java: 'java',
    rust: 'rs',
    python: 'py',
  };

  const ext = extensionMap[runtime] || 'mjs';
  const fpath = testName.split(".").slice(0, -1).concat(ext).join(".");
  const buildOptions =
    configValue.buildOptions ||
    `testeranto/runtimes/${runtime}/${runtime}.${ext}`;

  const jsonStr = JSON.stringify({
    name: `${runtime}-test`,
    ports: [1111],
    fs: `testeranto/reports/${configKey}/${fpath}/`,
    timeout: 30000,
    retries: 0,
    environment: {},
  });

  const commandMap: Record<string, string> = {
    node: `yarn tsx testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`,
    web: `yarn tsx /workspace/testeranto/web_hoist.ts testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`,
    ruby: `ruby testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`,
    golang: `./testeranto/bundles/${configKey}/${fpath.replace(/\.go$/, '').replace(/\./g, '_')} '${jsonStr}'`,
    rust: `./testeranto/bundles/${configKey}/${fpath.replace(/\//g, '_').replace(/\./g, '_').replace(/[^a-zA-Z0-9_]/g, '')} '${jsonStr}'`,
    python: `python3 testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`,

    // java: `java -jar testeranto/bundles/${configKey}/${fpath.replace(/\.java$/, '.jar')} '${jsonStr}'`,
  };

  const command = commandMap[runtime] || commandMap.node;

  const serviceConfig: any = {
    build: {
      context: process.cwd(),
      dockerfile: `testeranto/runtimes/${runtime}/${runtime}.Dockerfile`,
    },
    container_name: `${configKey}-${cleanTestName}-bdd`,
    working_dir: '/workspace',
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/test:/workspace/test`,
      `${process.cwd()}/SOUL.md:/workspace/SOUL.md`,
      `${process.cwd()}/testeranto:/workspace/testeranto`,
    ],
    command: command,
    networks: ['allTests_network'],
    restart: 'no',
    extra_hosts: {
      'host.docker.internal': 'host-gateway',
    },
  };

  return serviceConfig;
};
