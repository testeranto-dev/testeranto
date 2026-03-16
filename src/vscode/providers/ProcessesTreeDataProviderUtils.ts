export class ProcessesTreeDataProviderUtils {
  static async fetchProcessesViaHttp(): Promise<any> {
    const response = await fetch('http://localhost:3000/~/processes');
    return response.json();
  }
}
