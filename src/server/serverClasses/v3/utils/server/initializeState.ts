export function initializeState(): {
  initialized: boolean;
  timestamp: string;
} {
  return {
    initialized: true,
    timestamp: new Date().toISOString(),
  };
}
