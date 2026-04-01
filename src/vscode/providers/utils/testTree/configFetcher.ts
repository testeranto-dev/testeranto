import { ApiUtils } from '../apiUtils';
import type { ConfigsResponse } from '../../../api';

let configData: ConfigsResponse | null = null;

export async function fetchConfigsViaHttp(): Promise<ConfigsResponse> {
  try {
    const response = await ApiUtils.fetchWithTimeout(ApiUtils.getConfigsUrl(), {}, 3000);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data: ConfigsResponse = await response.json();
    configData = data;
    return data;
  } catch (error) {
    console.error('[configFetcher] Error fetching configs:', error);
    throw error;
  }
}

export function getConfigData(): ConfigsResponse | null {
  return configData;
}

export function setConfigData(data: ConfigsResponse): void {
  configData = data;
}
