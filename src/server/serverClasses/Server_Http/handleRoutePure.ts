import { handleCollatedFiles } from "./handleCollatedFiles";
import { handleConfigs } from "./handleConfigs";
import { handleInputFiles } from "./handleInputFiles";
import { handleOutputFiles } from "./handleOutputFiles";
import { handleTestResults } from "./handleTestResults";
import { jsonResponse } from "./jsonResponse";
import { handleOptions } from "./handleOptions";
import { vscodeHttpAPI, VscodeHttpEndpoint } from "../../../api";

// Helper function to extract route name from API path
const extractRouteNameFromPath = (path: string): string => {
  // Remove leading /~/
  return path.startsWith("/~/") ? path.substring(3) : path;
};

// Helper function to get API definition for a route
const getApiDefinitionForRoute = (routeName: string): any => {
  // Check if routeName matches any API definition path
  for (const [key, definition] of Object.entries(vscodeHttpAPI)) {
    const apiDef = definition as any;
    const apiRouteName = extractRouteNameFromPath(apiDef.path);
    if (apiRouteName === routeName) {
      return apiDef;
    }
  }
  return null;
};

// Create route handlers map from API definitions
const createRouteHandlersMap = (): Record<string, (server: any, url?: URL, params?: Record<string, string>) => Response> => {
  const handlers: Record<string, (server: any, url?: URL, params?: Record<string, string>) => Response> = {};

  // Map each API definition to its handler
  for (const [key, definition] of Object.entries(vscodeHttpAPI)) {
    const apiDef = definition as any;
    const routeName = extractRouteNameFromPath(apiDef.path);

    // Skip parameterized routes (they're handled separately)
    if (routeName.includes(':')) {
      continue;
    }

    // Map route name to appropriate handler using API definition keys
    switch (key as VscodeHttpEndpoint) {
      case 'getConfigs':
        handlers[routeName] = (server, url, request) => handleConfigs(server, request);
        break;
      case 'getInputFiles':
        handlers[routeName] = (server, url, request) => handleInputFiles(url!, server, request);
        break;
      case 'getOutputFiles':
        handlers[routeName] = (server, url, request) => handleOutputFiles(url!, server, request);
        break;
      case 'getTestResults':
        handlers[routeName] = (server, url, request) => handleTestResults(url!, server, request);
        break;
      case 'getCollatedFiles':
        handlers[routeName] = (server, url, request) => handleCollatedFiles(server, request);
        break;
      case 'getProcesses':
        handlers[routeName] = (server: any, url, request) => {
          // Validate against API definition
          const apiDef = vscodeHttpAPI.getProcesses;
          if (request && request.method !== apiDef.method) {
            return jsonResponse(
              {
                error: `Method ${request.method} not allowed for processes. Expected ${apiDef.method}`,
              },
              405,
            );
          }
          const getProcessSummary = server.getProcessSummary;
          if (typeof getProcessSummary !== "function") {
            return jsonResponse({
              processes: [],
              message: "Process summary not available",
            });
          }
          const summary = getProcessSummary();
          return jsonResponse({
            processes: summary.processes || [],
            total: summary.total || 0,
            message: "Success",
          });
        };
        break;
      case 'getAiderProcesses':
        handlers[routeName] = (server: any, url, request) => {
          // Validate against API definition
          const apiDef = vscodeHttpAPI.getAiderProcesses;
          if (request && request.method !== apiDef.method) {
            return jsonResponse(
              {
                error: `Method ${request.method} not allowed for aider-processes. Expected ${apiDef.method}`,
              },
              405,
            );
          }
          const getAiderProcesses = server.getAiderProcesses;
          if (typeof getAiderProcesses === "function") {
            const aiderProcesses = getAiderProcesses();
            return jsonResponse({
              aiderProcesses: aiderProcesses || [],
              message: "Success",
            });
          }
          return jsonResponse({
            aiderProcesses: [],
            message: "Aider processes not available",
          });
        };
        break;
      case 'getCollatedTestResults':
        handlers[routeName] = (server: any, url, request) => {
          // Validate against API definition
          const apiDef = vscodeHttpAPI.getCollatedTestResults;
          if (request && request.method !== apiDef.method) {
            return jsonResponse(
              {
                error: `Method ${request.method} not allowed for collated-testresults. Expected ${apiDef.method}`,
              },
              405,
            );
          }
          // Try to get collated test results from server if available
          const getCollatedTestResults = server.getCollatedTestResults;
          if (typeof getCollatedTestResults === "function") {
            const collatedTestResults = getCollatedTestResults();
            return jsonResponse({
              collatedTestResults: collatedTestResults || {},
              message: "Success",
            }, 200, apiDef);
          }
          return jsonResponse({
            collatedTestResults: {},
            message: "Collated test results not available",
          }, 200, apiDef);
        };
        break;
      case 'getCollatedInputFiles':
        handlers[routeName] = (server: any, url, request) => {
          // Validate against API definition
          const apiDef = vscodeHttpAPI.getCollatedInputFiles;
          if (request && request.method !== apiDef.method) {
            return jsonResponse(
              {
                error: `Method ${request.method} not allowed for collated-inputfiles. Expected ${apiDef.method}`,
              },
              405,
            );
          }
          // Try to get collated input files from server if available
          const getCollatedInputFiles = server.getCollatedInputFiles;
          if (typeof getCollatedInputFiles === "function") {
            const result = getCollatedInputFiles();
            return jsonResponse({
              collatedInputFiles: result.collatedInputFiles || {},
              fsTree: result.fsTree || {},
              message: "Success",
            }, 200, apiDef);
          }
          return jsonResponse({
            collatedInputFiles: {},
            fsTree: {},
            message: "Collated input files not available",
          }, 200, apiDef);
        };
        break;
      case 'getCollatedDocumentation':
        handlers[routeName] = (server: any, url, request) => {
          // Validate against API definition
          const apiDef = vscodeHttpAPI.getCollatedDocumentation;
          if (request && request.method !== apiDef.method) {
            return jsonResponse(
              {
                error: `Method ${request.method} not allowed for collated-documentation. Expected ${apiDef.method}`,
              },
              405,
            );
          }
          return jsonResponse({
            tree: {},
            files: [],
            message: "Success",
          });
        };
        break;
      case 'getDocumentation':
        handlers[routeName] = (server: any, url, request) => {
          // Validate against API definition
          const apiDef = vscodeHttpAPI.getDocumentation;
          if (request && request.method !== apiDef.method) {
            return jsonResponse(
              {
                error: `Method ${request.method} not allowed for documentation. Expected ${apiDef.method}`,
              },
              405,
            );
          }
          return jsonResponse({
            files: [],
            message: "Success",
          });
        };
        break;
      case 'getReports':
        handlers[routeName] = (server: any, url, request) => {
          // Validate against API definition
          const apiDef = vscodeHttpAPI.getReports;
          if (request && request.method !== apiDef.method) {
            return jsonResponse(
              {
                error: `Method ${request.method} not allowed for reports. Expected ${apiDef.method}`,
              },
              405,
            );
          }
          return jsonResponse({
            tree: {},
            message: "Success",
          });
        };
        break;
      case 'getHtmlReport':
        handlers[routeName] = (server: any, url, request) => {
          // Validate against API definition
          const apiDef = vscodeHttpAPI.getHtmlReport;
          if (request && request.method !== apiDef.method) {
            return jsonResponse(
              {
                error: `Method ${request.method} not allowed for html-report. Expected ${apiDef.method}`,
              },
              405,
            );
          }
          return jsonResponse({
            message: "HTML report would be generated here",
            url: "/testeranto/reports/index.html",
          });
        };
        break;
      case 'getAppState':
        handlers[routeName] = (server: any, url, request) => {
          // Validate against API definition
          const apiDef = vscodeHttpAPI.getAppState;
          if (request && request.method !== apiDef.method) {
            return jsonResponse(
              {
                error: `Method ${request.method} not allowed for app-state. Expected ${apiDef.method}`,
              },
              405,
            );
          }
          return jsonResponse({
            appState: {},
            message: "App state endpoint not implemented",
          });
        };
        break;
      default:
        // For any API definition without a specific handler, return a placeholder
        handlers[routeName] = () => jsonResponse({
          message: `Endpoint ${routeName} is defined in API but handler not implemented`,
          status: "not_implemented"
        }, 501);
        break;
    }
  }

  return handlers;
};

// Dynamic handler for process-logs
const handleProcessLogs = (server: any, processId: string): Response => {
  const getProcessLogs = server.getProcessLogs;
  if (typeof getProcessLogs === "function") {
    const logs = getProcessLogs(processId);
    return jsonResponse({
      logs: logs || [],
      status: "retrieved",
      message: "Success",
    });
  }
  return jsonResponse({
    logs: [],
    status: "not_available",
    message: "Process logs not available",
  });
};

export const handleRoutePure = (
  routeName: string,
  request: Request,
  url: URL,
  server: any,
): Response => {
  // Handle OPTIONS requests
  if (request.method === "OPTIONS") {
    return handleOptions(request, routeName);
  }

  // Get API definition for this route
  const apiDefinition = getApiDefinitionForRoute(routeName);

  // Validate HTTP method against API definition
  if (apiDefinition && request.method !== apiDefinition.method) {
    return jsonResponse(
      {
        error: `Method ${request.method} not allowed for route ${routeName}. Expected ${apiDefinition.method}`,
      },
      405,
    );
  }

  // Only handle GET requests for now (unless API definition specifies otherwise)
  if (!apiDefinition && request.method !== "GET") {
    return jsonResponse(
      {
        error: `Method ${request.method} not allowed`,
      },
      405,
    );
  }

  // Check for process-logs route (parameterized route)
  if (routeName.startsWith("process-logs/")) {
    const processId = routeName.substring("process-logs/".length);
    // Validate against API definition
    const apiDef = vscodeHttpAPI.getProcessLogs;
    if (request.method !== apiDef.method) {
      return jsonResponse(
        {
          error: `Method ${request.method} not allowed for process-logs. Expected ${apiDef.method}`,
        },
        405,
      );
    }
    return handleProcessLogs(server, processId);
  }

  // Get route handlers from API definitions
  const routeHandlers = createRouteHandlersMap();
  const handler = routeHandlers[routeName];

  if (handler) {
    return handler(server, url, request);
  }

  return jsonResponse(
    {
      error: `Route not found: ${routeName}`,
    },
    404,
  );
};
