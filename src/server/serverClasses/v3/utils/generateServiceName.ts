export const generateServiceName = (
  configKey: string,
  testName: string,
  type: string,
): string => {
  const cleanTestName = testName
    .replace(/\//g, '_')
    .replace(/\./g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase();

  return `${configKey}-${cleanTestName}-${type}`;
};
