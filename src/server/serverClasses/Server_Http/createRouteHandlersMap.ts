import { vscodeHttpAPI, type VscodeHttpEndpoint } from "../../../api";
import { extractRouteNameFromPath } from "./extractRouteNameFromPath";
import { handleConfigs } from "./handleConfigs";
import { jsonResponse } from "./jsonResponse";
import { buildUnifiedTestTree } from "./buildUnifiedTestTree"

// Create route handlers map from API definitions
export const createRouteHandlersMap = (): Record<string, (server: any, url?: URL, params?: Record<string, string>) => Response> => {
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
      case 'getUnifiedTestTree':
        handlers[routeName] = (server: any, url, request) => {
          // Validate against API definition
          const apiDef = vscodeHttpAPI.getUnifiedTestTree;
          if (request && request.method !== apiDef.method) {
            return jsonResponse(
              {
                error: `Method ${request.method} not allowed for unified-test-tree. Expected ${apiDef.method}`,
              },
              405,
            );
          }
          // Build unified tree
          const tree = buildUnifiedTestTree(server);
          return jsonResponse({
            tree: tree,
            message: "Success",
          }, 200, apiDef);
        };
        break;
      case 'getInputFiles':
        handlers[routeName] = (server: any, url, request) => {
          // Deprecated: Use getUnifiedTestTree instead
          return jsonResponse({
            message: "Endpoint deprecated. Use /~/unified-test-tree instead.",
            deprecated: true,
            alternative: "/~/unified-test-tree"
          }, 410, vscodeHttpAPI.getInputFiles);
        };
        break;
      case 'getOutputFiles':
        handlers[routeName] = (server: any, url, request) => {
          // Deprecated: Use getUnifiedTestTree instead
          return jsonResponse({
            message: "Endpoint deprecated. Use /~/unified-test-tree instead.",
            deprecated: true,
            alternative: "/~/unified-test-tree"
          }, 410, vscodeHttpAPI.getOutputFiles);
        };
        break;
      case 'getTestResults':
        handlers[routeName] = (server: any, url, request) => {
          // Deprecated: Use getUnifiedTestTree instead
          return jsonResponse({
            message: "Endpoint deprecated. Use /~/unified-test-tree instead.",
            deprecated: true,
            alternative: "/~/unified-test-tree"
          }, 410, vscodeHttpAPI.getTestResults);
        };
        break;
      case 'getCollatedFiles':
        handlers[routeName] = (server: any, url, request) => {
          // Deprecated: Not used
          return jsonResponse({
            message: "Endpoint deprecated. Not used in current implementation.",
            deprecated: true
          }, 410, vscodeHttpAPI.getCollatedFiles);
        };
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
          if (server && typeof server.getAiderProcesses === "function") {
            const aiderProcesses = server.getAiderProcesses();
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
      case 'getGraphData':
        handlers[routeName] = (server: any, url, request) => {
          // Validate against API definition
          const apiDef = vscodeHttpAPI.getGraphData;
          if (request && request.method !== apiDef.method) {
            return jsonResponse(
              {
                error: `Method ${request.method} not allowed for graph-data. Expected ${apiDef.method}`,
              },
              405,
            );
          }
          // Generate graph data
          const graphData = server.graphData || { nodes: [], edges: [] };
          return jsonResponse({
            graphData: graphData,
            message: "Success",
          });
        };
        break;
      case 'getGraph':
      case 'updateGraph':
        // Combined handler for graph route that handles only POST for updates
        // GET requests are no longer supported - clients should load from graph-data.json
        handlers[routeName] = async (server: any, url, request) => {
          const method = request?.method;

          if (method === 'GET') {
            // GET is no longer supported - return 410 Gone with instructions
            return jsonResponse(
              {
                error: 'GET method no longer supported for /~/graph endpoint',
                message: 'Please load baseline graph data from graph-data.json file',
                instructions: 'Client should always load baseline from graph-data.json and only use POST for updates'
              },
              410, // Gone - resource is no longer available
            );
          } else if (method === 'POST') {
            // Handle POST request for graph updates
            try {
              const body = await request.json();
              const graphManager = (server as any).graphManager;
              if (!graphManager) {
                return jsonResponse({
                  graphData: { nodes: [], edges: [] },
                  message: "Graph manager not available",
                }, 500);
              }
              const updatedGraph = graphManager.applyUpdate(body);
              // Broadcast graph update to WebSocket clients
              if (server.broadcast) {
                server.broadcast({
                  type: 'graphUpdated',
                  timestamp: new Date().toISOString(),
                  message: 'Graph has been updated'
                });
              }
              return jsonResponse({
                graphData: updatedGraph,
                message: "Graph updated successfully",
              });
            } catch (error) {
              return jsonResponse({
                error: 'Failed to update graph',
                message: error.message,
              }, 400);
            }
          } else {
            // Method not allowed
            return jsonResponse(
              {
                error: `Method ${method} not allowed for graph. Expected POST only`,
              },
              405,
            );
          }
        };
        break;

      case 'parseMarkdownToGraph':
        handlers[routeName] = async (server: any, url, request) => {
          const apiDef = vscodeHttpAPI.parseMarkdownToGraph;
          if (request && request.method !== apiDef.method) {
            return jsonResponse(
              {
                error: `Method ${request.method} not allowed for parse-markdown. Expected ${apiDef.method}`,
              },
              405,
            );
          }
          try {
            const graphManager = (server as any).graphManager;
            if (!graphManager) {
              return jsonResponse({
                graphData: { nodes: [], edges: [] },
                message: "Graph manager not available",
              }, 500);
            }
            const update = graphManager.parseMarkdownFiles('**/*.md');
            const updatedGraph = graphManager.applyUpdate(update);
            return jsonResponse({
              graphData: updatedGraph,
              message: "Markdown parsed and graph updated",
            });
          } catch (error) {
            return jsonResponse({
              error: 'Failed to parse markdown',
              message: error.message,
            }, 400);
          }
        };
        break;

      case 'serializeGraphToMarkdown':
        handlers[routeName] = async (server: any, url, request) => {
          const apiDef = vscodeHttpAPI.serializeGraphToMarkdown;
          if (request && request.method !== apiDef.method) {
            return jsonResponse(
              {
                error: `Method ${request.method} not allowed for serialize-markdown. Expected ${apiDef.method}`,
              },
              405,
            );
          }
          try {
            const graphManager = (server as any).graphManager;
            if (!graphManager) {
              return jsonResponse({
                message: "Graph manager not available",
              }, 500);
            }
            graphManager.serializeToMarkdown();
            return jsonResponse({
              message: "Graph serialized to markdown files",
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            return jsonResponse({
              error: 'Failed to serialize graph',
              message: error.message,
            }, 400);
          }
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
