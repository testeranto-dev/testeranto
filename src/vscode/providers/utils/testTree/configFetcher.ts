let configData: any = null;

export async function fetchConfigsViaHttp(): Promise<any> {
  const response = await fetch("http://localhost:3000/~/configs");
  const data = await response.json();
  configData = data;
  return data;
}

export function getConfigData(): any {
  return configData;
}

export function setConfigData(data: any): void {
  configData = data;
}
