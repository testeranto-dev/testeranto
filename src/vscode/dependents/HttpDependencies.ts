export class HttpDependencies {
  static async fetchJson(url: string): Promise<any> {
    const response = await fetch(url);
    return response.json();
  }
}
