import { nodeBddCommand } from "../../../../runtimes/node/utils/nodeBddCommand";

export const generateBddService = (
  configKey: string,
  configValue: any,
  testName: string,
): any => {
  const cleanTestName = testName
    .replace(/\//g, '_')
    .replace(/\./g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase();

  const fpath = testName.split(".").slice(0, -1).concat("mjs").join(".");
  const buildOptions =
    configValue.buildOptions ||
    `testeranto/runtimes/${configValue.runtime || 'node'}/${configValue.runtime || 'node'}.mjs`;
  const command = nodeBddCommand(fpath, buildOptions, configKey);

  const serviceConfig: any = {
    build: {
      context: process.cwd(),
      dockerfile: `testeranto/runtimes/${configValue.runtime || 'node'}/${configValue.runtime || 'node'}.Dockerfile`,
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
