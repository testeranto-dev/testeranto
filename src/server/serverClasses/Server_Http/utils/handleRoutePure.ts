import { handleCollatedFiles } from "./handleCollatedFiles";
import { handleConfigs } from "./handleConfigs";
import { handleInputFiles } from "./handleInputFiles";
import { handleOutputFiles } from "./handleOutputFiles";
import { handleTestResults } from "./handleTestResults";
import { jsonResponse } from "./jsonResponse";


export const handleRoutePure = (
  routeName: string,
  request: Request,
  url: URL,
  server: any,
): Response => {
  // Handle OPTIONS requests
  if (request.method === "OPTIONS") {
    return Server_HTTP_utils.handleOptions();
  }

  // Only handle GET requests for now
  if (request.method !== "GET") {
    return jsonResponse(
      {
        error: `Method ${request.method} not allowed`,
      },
      405,
    );
  }

  switch (routeName) {
    case "configs":
      return handleConfigs(server);
    case "processes":
      return handleProcesses(server);
    case "inputfiles":
      return handleInputFiles(url, server);
    case "outputfiles":
      return handleOutputFiles(url, server);
    case "testresults":
      return handleTestResults(url, server);
    case "collated-testresults":
      return handleCollatedTestResults(server);
    case "collated-inputfiles":
      return handleCollatedInputFiles(server);
    case "collated-documentation":
      return handleCollatedDocumentation();
    case "documentation":
      return handleDocumentation();
    case "reports":
      return handleReports();
    case "html-report":
      return handleHtmlReport();
    case "aider-processes":
      return handleAiderProcesses(server);
    case "collated-files":
      return handleCollatedFiles(server);
    case `app-state`:
      return handleAppState(server);
    default:
      return jsonResponse(
        {
          error: `Route not found: ${routeName}`,
        },
        404,
      );
  }
};

const handleProcesses = (server: any): Response => {
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

const handleCollatedTestResults = (server: any): Response => {
  return jsonResponse({
    collatedTestResults: {},
    message: "Success",
  });
};

const handleCollatedInputFiles = (server: any): Response => {
  return jsonResponse({
    collatedInputFiles: {},
    fsTree: {},
    message: "Success",
  });
};

const handleCollatedDocumentation = (): Response => {
  return jsonResponse({
    tree: {},
    files: [],
    message: "Success",
  });
};

const handleDocumentation = (): Response => {
  return jsonResponse({
    files: [],
    message: "Success",
  });
};

const handleReports = (): Response => {
  return jsonResponse({
    tree: {},
    message: "Success",
  });
};

const handleHtmlReport = (): Response => {
  return jsonResponse({
    message: "HTML report would be generated here",
    url: "/testeranto/reports/index.html",
  });
};

// TODO
const handleAppState = (server: any): Response => { };

const handleAiderProcesses = (server: any): Response => {
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
