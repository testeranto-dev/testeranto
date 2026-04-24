export function getBaseServiceName(configKey: string, testName: string): string {
  return `${configKey}-${testName}`;
}
