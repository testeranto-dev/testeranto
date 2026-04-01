import { ApiUtils } from '../apiUtils';
import type { ConfigsResponse } from '../../../api';

let configData: ConfigsResponse | null = null;

export async function fetchConfigsViaHttp(): Promise<ConfigsResponse> {
  const response = await fetch(ApiUtils.getConfigsUrl());
  const data: ConfigsResponse = await response.json();
  configData = data;
  return data;
}

export function getConfigData(): ConfigsResponse | null {
  return configData;
}

export function setConfigData(data: ConfigsResponse): void {
  configData = data;
}
