export function generateBuilderService(
  configKey: string,
  configValue: any,
  mode: string,
): any {
  return {
    image: `testeranto-${configValue.runtime || 'node'}-${configKey}:latest`,
    build: {
      context: '.',
      dockerfile: configValue.dockerfile || `Dockerfile.${configValue.runtime || 'node'}`,
    },
    environment: {
      CONFIG_KEY: configKey,
      MODE: mode,
    },
    volumes: [
      './src:/workspace/src',
      './test:/workspace/test',
      './testeranto:/workspace/testeranto',
    ],
    networks: ['allTests_network'],
  };
}
