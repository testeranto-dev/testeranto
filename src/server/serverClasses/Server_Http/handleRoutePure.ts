import fs from 'fs';
import path from 'path';
import type { VscodeHttpEndpoint } from "../../../api";
import { vscodeHttpAPI } from "../../../api";
import { handleConfigs } from "./handleConfigs";
import { handleOptions } from "./handleOptions";
import { jsonResponse } from "./jsonResponse";


// Helper function to extract route name from API path
const extractRouteNameFromPath = (path: string): string => {
  // Remove leading /~/
  return path.startsWith("/~/") ? path.substring(3) : path;
};

// Helper function to get API definition for a route, optionally filtering by method
const getApiDefinitionForRoute = (routeName: string, method?: string): any => {
  // Check if routeName matches any API definition path
  for (const [key, definition] of Object.entries(vscodeHttpAPI)) {
    const apiDef = definition as any;
    const apiRouteName = extractRouteNameFromPath(apiDef.path);
    if (apiRouteName === routeName) {
      // If method is provided, check if it matches
      if (method && apiDef.method !== method) {
        continue;
      }
      return apiDef;
    }
  }
  return null;
};

// Helper function to build unified test tree
const buildUnifiedTestTree = (server: any): Record<string, any> => {
  const configs = server.configs;
  if (!configs || !configs.runtimes) {
    return {};
  }

  const tree: Record<string, any> = {};
  const projectRoot = process.cwd();

  for (const [runtimeKey, runtimeConfig] of Object.entries(configs.runtimes)) {
    const runtime = runtimeConfig as any;
    tree[runtimeKey] = {
      name: runtimeKey,
      runtime: runtime.runtime,
      tests: {},
    };

    // For each test in this runtime
    const tests = runtime.tests || [];
    for (const testName of tests) {
      const testEntry: Record<string, any> = {
        name: testName,
        sourceFiles: [],
        logs: [],
        results: null,
        outputFiles: [],
      };

      // Add the test file itself as a source file
      // testName might be a path relative to project root
      const testPath = path.isAbsolute(testName) ? testName : path.join(projectRoot, testName);
      if (fs.existsSync(testPath)) {
        testEntry.sourceFiles.push({
          path: testName,
          absolutePath: testPath,
          type: 'test'
        });

        // Also add other files in the same directory (source files)
        const testDir = path.dirname(testPath);
        try {
          const dirFiles = fs.readdirSync(testDir);
          for (const file of dirFiles) {
            if (file === path.basename(testPath)) {
              continue; // Skip the test file itself
            }
            const filePath = path.join(testDir, file);
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
              // Check if it's a source file by extension
              const ext = path.extname(file).toLowerCase();
              if (['.ts', '.js', '.tsx', '.jsx', '.go', '.py', '.rb', '.java', '.rs', '.c', '.cpp', '.h', '.hpp'].includes(ext)) {
                const relativePath = path.relative(projectRoot, filePath);
                testEntry.sourceFiles.push({
                  path: relativePath,
                  absolutePath: filePath,
                  type: 'source'
                });
              }
            }
          }
        } catch (error) {
          // Ignore errors reading directory
        }
      }

      // Look for logs and results in testeranto/reports/{runtimeKey}/{testName}/
      const testDir = path.dirname(testName);
      const testBaseName = path.basename(testName);

      // Try multiple possible locations for logs:
      const possibleLogDirs = [];

      // 1. Directory containing the test file (where logs actually are)
      const testFileDir = path.join(projectRoot, 'testeranto', 'reports', runtimeKey, testDir);
      possibleLogDirs.push(testFileDir);

      // 2. Directory named after the test file (without extension)
      const testNameWithoutExt = testBaseName.replace(/\.[^/.]+$/, '');
      const testNamedDir = path.join(projectRoot, 'testeranto', 'reports', runtimeKey, testDir, testNameWithoutExt);
      possibleLogDirs.push(testNamedDir);

      // 3. The exact testName path as a directory
      const exactTestDir = path.join(projectRoot, 'testeranto', 'reports', runtimeKey, testName);
      possibleLogDirs.push(exactTestDir);

      // 4. Also check the reports directory itself for any files matching the test name pattern
      const reportsRootDir = path.join(projectRoot, 'testeranto', 'reports', runtimeKey);
      possibleLogDirs.push(reportsRootDir);

      // Track which files we've already added to avoid duplicates
      const addedFiles = new Set<string>();

      for (const reportsDir of possibleLogDirs) {
        if (fs.existsSync(reportsDir)) {
          // Recursively collect all files
          const collectFiles = (dir: string, basePath: string) => {
            try {
              const entries = fs.readdirSync(dir, { withFileTypes: true });
              for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(basePath, fullPath);
                if (entry.isDirectory()) {
                  collectFiles(fullPath, basePath);
                } else if (entry.isFile()) {
                  // Calculate the path relative to the reports directory
                  const filePath = `testeranto/reports/${runtimeKey}/${path.relative(
                    path.join(projectRoot, 'testeranto', 'reports', runtimeKey),
                    fullPath
                  )}`;

                  // Skip if we've already added this file
                  if (addedFiles.has(filePath)) {
                    continue;
                  }
                  addedFiles.add(filePath);

                  // Check if this file belongs to our test
                  // Files for our test should contain the test name (without extension) in their filename
                  const fileName = entry.name;
                  const cleanTestName = testNameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '');
                  const cleanFileName = fileName.toLowerCase().replace(/[^a-z0-9]/g, '');

                  // Check if this file is related to our test
                  const isTestFile = cleanFileName.includes(cleanTestName) ||
                    fileName.includes(testNameWithoutExt) ||
                    // Also include all .log, .exitcode, .status files in the test directory
                    (dir === testFileDir && (
                      fileName.endsWith('.log') ||
                      fileName.endsWith('.exitcode') ||
                      fileName.endsWith('.status') ||
                      fileName.endsWith('.txt')
                    ));

                  if (fileName === 'test.json' || fileName === 'tests.json') {
                    testEntry.results = filePath;
                  } else if (isTestFile && (
                    fileName.endsWith('.log') ||
                    fileName.endsWith('.txt') ||
                    fileName.includes('log') ||
                    fileName.endsWith('.exitcode') ||
                    fileName.endsWith('.status')
                  )) {
                    // Include all .log, .txt, .exitcode, and .status files as logs
                    testEntry.logs.push(filePath);
                  } else if (isTestFile) {
                    testEntry.outputFiles.push(filePath);
                  }
                }
              }
            } catch (error) {
              // Ignore errors
            }
          };
          collectFiles(reportsDir, reportsDir);
        }
      }

      // Also look for files in the test directory that match patterns
      // This handles files like calculator-test-node-ts_aider.container.exitcode
      if (fs.existsSync(testFileDir)) {
        try {
          const files = fs.readdirSync(testFileDir);
          for (const file of files) {
            const filePath = path.join(testFileDir, file);
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
              const relativePath = `testeranto/reports/${runtimeKey}/${testDir}/${file}`;
              if (addedFiles.has(relativePath)) {
                continue;
              }

              // Check if file matches our test pattern
              const cleanTestName = testNameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '');
              const cleanFileName = file.toLowerCase().replace(/[^a-z0-9]/g, '');

              if (cleanFileName.includes(cleanTestName) ||
                file.includes(testNameWithoutExt) ||
                file.endsWith('.log') ||
                file.endsWith('.exitcode') ||
                file.endsWith('.status') ||
                file.endsWith('.txt')) {
                if (file === 'test.json' || file === 'tests.json') {
                  testEntry.results = relativePath;
                } else if (
                  file.endsWith('.log') ||
                  file.endsWith('.txt') ||
                  file.includes('log') ||
                  file.endsWith('.exitcode') ||
                  file.endsWith('.status')
                ) {
                  testEntry.logs.push(relativePath);
                } else {
                  testEntry.outputFiles.push(relativePath);
                }
              }
            }
          }
        } catch (error) {
          // Ignore errors
        }
      }

      tree[runtimeKey].tests[testName] = testEntry;
    }
  }

  return tree;
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

  // Get API definition for this route, considering the request method
  const apiDefinition = getApiDefinitionForRoute(routeName, request.method);

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
