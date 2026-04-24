export function resourceChanged(path: string): {
  path: string;
  timestamp: string;
} {
  return {
    path,
    timestamp: new Date().toISOString(),
  };
}
