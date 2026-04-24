export function getAiderServiceName(configKey: string, testName: string): string {
  return `${configKey}-${testName}-aider`;
}
