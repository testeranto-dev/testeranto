export function getBddServiceName(configKey: string, testName: string): string {
  return `${configKey}-${testName}-bdd`;
}
