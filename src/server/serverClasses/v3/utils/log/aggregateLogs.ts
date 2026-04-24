export function aggregateLogs(
  logs: any[],
  aggregationKey: string,
): Map<string, any[]> {
  const aggregated = new Map<string, any[]>();

  for (const log of logs) {
    const key = log[aggregationKey];
    if (!key) continue;

    if (!aggregated.has(key)) {
      aggregated.set(key, []);
    }
    aggregated.get(key)!.push(log);
  }

  return aggregated;
}
