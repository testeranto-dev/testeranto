import { HttpDependencies } from '../dependents/HttpDependencies';

export class ProcessesTreeDataProviderUtils {
  static async fetchProcessesViaHttp(): Promise<any> {
    return HttpDependencies.fetchJson('http://localhost:3000/~/processes');
  }
}
