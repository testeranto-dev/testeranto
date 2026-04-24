export function generateBddService(
  configKey: string,
  configValue: any,
  testName: string,
): any {
  return {
    image: `testeranto-${configValue.runtime || 'node'}-${configKey}:latest`,
    build: {
      context: '.',
      dockerfile: configValue.dockerfile || `Dockerfile.${configValue.runtime || 'node'}`,
    },
    environment: {
      CONFIG_KEY: configKey,
      TEST_NAME: testName,
      MODE: 'bdd',
    },
    volumes: [
      './src:/workspace/src',
      './test:/workspace/test',
      './testeranto:/workspace/testeranto',
    ],
    networks: ['allTests_network'],
  };
}
