import * as vscode from 'vscode';
import type { VscodeHttpEndpoint } from "../../../api/api";
import { vscodeHttpAPI } from "../../../api/vscodeExtensionHttp";

export class ApiUtils {
    static getBaseUrl(): string {
        // Try to get from configuration or use default
        try {
            const config = vscode.workspace.getConfiguration('testeranto');
            const serverPort = config.get<number>('serverPort') || 3000;
            const baseUrl = `http://localhost:${serverPort}`;
            console.log(`[ApiUtils] Using server URL: ${baseUrl}`);
            return baseUrl;
        } catch (error) {
            console.log('[ApiUtils] Using default server URL');
            return 'http://localhost:3000';
        }
    }

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
        const url = `${this.getBaseUrl()}${path}`;
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

    static async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`Request to ${url} timed out after ${timeout}ms`);
            }
            throw error;
        }
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

    static getHtmlReportUrl(): string {
        return this.getUrl('getHtmlReport');
    }

    static getAppStateUrl(): string {
        return this.getUrl('getAppState');
    }

    static getUnifiedTestTreeUrl(): string {
        return this.getUrl('getUnifiedTestTree');
    }

    static getLockStatusUrl(): string {
        return this.getUrl('getLockStatus');
    }

    static getChatUrl(agent: string, message: string): string {
        return this.getUrl('sendChatMessage', {}, { agent, message });
    }

    static getLaunchAgentUrl(agentName: string): string {
        return this.getUrl('launchAgent', { agentName });
    }

    static getAgentSliceUrl(agentName: string): string {
        return this.getUrl('getAgentSlice', { agentName });
    }

    static getAgentsUrl(): string {
        return this.getUrl('getAgents');
    }

    static getWebSocketUrl(): string {
        // Convert http:// to ws://
        const httpUrl = this.getBaseUrl();
        if (httpUrl.startsWith('http://')) {
            return httpUrl.replace('http://', 'ws://');
        } else if (httpUrl.startsWith('https://')) {
            return httpUrl.replace('https://', 'wss://');
        }
        // Default to ws://localhost:3000 if baseUrl doesn't start with http(s)://
        return 'ws://localhost:3000';
    }

    // New methods for slice endpoints
    static getRuntimeSliceUrl(): string {
        return `${this.getBaseUrl()}/~/runtime`;
    }

    static getProcessSliceUrl(): string {
        return `${this.getBaseUrl()}/~/process`;
    }

    static getAiderSliceUrl(): string {
        return `${this.getBaseUrl()}/~/aider`;
    }

    static getFilesSliceUrl(): string {
        return `${this.getBaseUrl()}/~/files`;
    }
}
