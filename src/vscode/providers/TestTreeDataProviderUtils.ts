export class TestTreeDataProviderUtils {
  static async fetchConfigsViaHttp(): Promise<any> {
    const response = await fetch('http://localhost:3000/~/configs');
    return response.json();
  }
}
