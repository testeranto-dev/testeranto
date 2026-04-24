export function cleanupClientSubscriptionsV2(clientId: string): {
  clientId: string;
  timestamp: string;
} {
  return {
    clientId,
    timestamp: new Date().toISOString(),
  };
}
