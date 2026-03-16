export class TesterantoTreeDataProviderUtils {
  static async loadDocumentationFiles(): Promise<string[]> {
    const response = await fetch('http://localhost:3000/~/documentation');
    const data = await response.json();
    return data.files || [];
  }
}
