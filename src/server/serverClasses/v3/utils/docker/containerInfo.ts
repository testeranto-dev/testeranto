/**
 * Get container information
 */
export async function getContainerInfo(serviceName: string): Promise<any> {
  console.log(`[getContainerInfo] Getting info for container ${serviceName}`);
  return {
    Id: `container-${serviceName}`,
    Name: serviceName,
    State: { Running: true },
    Config: { Image: 'test-image' }
  };
}
