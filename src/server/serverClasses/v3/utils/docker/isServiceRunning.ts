import { getContainerInfo } from "./getContainerInfo";

export async function isServiceRunning(serviceName: string): Promise<boolean> {
  try {
    const info = await getContainerInfo(serviceName);
    return info.State === 'running';
  } catch {
    return false;
  }
}
