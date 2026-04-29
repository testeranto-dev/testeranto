export function getStoredHash(
  storedHashes: Map<string, Map<string, string>>,
  configKey: string,
  testName: string,
): string | undefined {
  return storedHashes.get(configKey)?.get(testName);
}

export function setStoredHash(
  storedHashes: Map<string, Map<string, string>>,
  configKey: string,
  testName: string,
  hash: string,
): void {
  if (!storedHashes.has(configKey)) {
    storedHashes.set(configKey, new Map());
  }
  storedHashes.get(configKey)!.set(testName, hash);
}
