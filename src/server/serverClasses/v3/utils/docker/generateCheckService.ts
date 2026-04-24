export function generateCheckService(
  configKey: string,
  configValue: any,
  testName: string,
  checkIndex: number,
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
      CHECK_INDEX: String(checkIndex),
      MODE: 'check',
    },
    volumes: [
      './src:/workspace/src',
      './test:/workspace/test',
      './testeranto:/workspace/testeranto',
    ],
    networks: ['allTests_network'],
  };
}
