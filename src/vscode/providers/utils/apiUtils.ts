import { vscodeHttpAPI, type VscodeHttpEndpoint, type VscodeHttpResponse } from '../../../api';

export class ApiUtils {
    private static baseUrl = 'http://localhost:3000';

    static getUrl<T extends VscodeHttpEndpoint>(
        endpointKey: T, 
        params?: Record<string, string>, 
        query?: Record<string, string>
    ): string {
        const endpoint = vscodeHttpAPI[endpointKey];
        if (!endpoint) {
            throw new Error(`Endpoint ${endpointKey} not found in vscodeHttpAPI`);
        }

        let path = endpoint.path;
        
        // Replace path parameters
        if (params && endpoint.params) {
            for (const [key, value] of Object.entries(params)) {
                if (endpoint.params[key as keyof typeof endpoint.params]) {
                    path = path.replace(`:${key}`, value);
                }
            }
        }

        // Add query parameters
        const url = `${this.baseUrl}${path}`;
        if (query && Object.keys(query).length > 0) {
            const queryParams = new URLSearchParams();
            for (const [key, value] of Object.entries(query)) {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, value);
                }
            }
            const queryString = queryParams.toString();
            if (queryString) {
                return `${url}?${queryString}`;
            }
        }
        return url;
    }

    static getConfigsUrl(): string {
        return this.getUrl('getConfigs');
    }

    static getProcessesUrl(): string {
        return this.getUrl('getProcesses');
    }

    static getProcessLogsUrl(processId: string): string {
        return this.getUrl('getProcessLogs', { processId });
    }

    static getAiderProcessesUrl(): string {
        return this.getUrl('getAiderProcesses');
    }

    static getInputFilesUrl(runtime?: string, testName?: string): string {
        const query: Record<string, string> = {};
        if (runtime) query.runtime = runtime;
        if (testName) query.testName = testName;
        return this.getUrl('getInputFiles', undefined, query);
    }

    static getOutputFilesUrl(runtime?: string, testName?: string): string {
        const query: Record<string, string> = {};
        if (runtime) query.runtime = runtime;
        if (testName) query.testName = testName;
        return this.getUrl('getOutputFiles', undefined, query);
    }

    static getTestResultsUrl(runtime?: string, testName?: string): string {
        const query: Record<string, string> = {};
        if (runtime) query.runtime = runtime;
        if (testName) query.testName = testName;
        return this.getUrl('getTestResults', undefined, query);
    }

    static getCollatedTestResultsUrl(): string {
        return this.getUrl('getCollatedTestResults');
    }

    static getCollatedInputFilesUrl(): string {
        return this.getUrl('getCollatedInputFiles');
    }

    static getCollatedFilesUrl(): string {
        return this.getUrl('getCollatedFiles');
    }

    static getCollatedDocumentationUrl(): string {
        return this.getUrl('getCollatedDocumentation');
    }

    static getDocumentationUrl(): string {
        return this.getUrl('getDocumentation');
    }

    static getReportsUrl(): string {
        return this.getUrl('getReports');
    }

    static getHtmlReportUrl(): string {
        return this.getUrl('getHtmlReport');
    }

    static getAppStateUrl(): string {
        return this.getUrl('getAppState');
    }

    static getWebSocketUrl(): string {
        // Convert http:// to ws://
        const httpUrl = this.baseUrl;
        if (httpUrl.startsWith('http://')) {
            return httpUrl.replace('http://', 'ws://');
        } else if (httpUrl.startsWith('https://')) {
            return httpUrl.replace('https://', 'wss://');
        }
        // Default to ws://localhost:3000 if baseUrl doesn't start with http(s)://
        return 'ws://localhost:3000';
    }
}
