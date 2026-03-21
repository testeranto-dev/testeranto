import fs from "fs";
import path from "path";
import { Server_HTTP_utils } from "./Server_HTTP_utils";
import { handleCollatedFiles } from "./handleCollatedFiles";
import { handleInputFiles, handleOutputFiles, handleTestResults } from "./handleFiles";

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
        return Server_HTTP_utils.jsonResponse(
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
            return Server_HTTP_utils.jsonResponse(
                {
                    error: `Route not found: ${routeName}`,
                },
                404,
            );
    }
};

export const handleConfigs = (server: any): Response => {
    if (!server.configs) {
        return Server_HTTP_utils.jsonResponse(
            {
                error: "Server configs not available",
            },
            503,
        );
    }
    return Server_HTTP_utils.jsonResponse({
        configs: server.configs,
        message: "Success",
    });
};

const handleProcesses = (server: any): Response => {
    const getProcessSummary = server.getProcessSummary;
    if (typeof getProcessSummary !== "function") {
        return Server_HTTP_utils.jsonResponse({
            processes: [],
            message: "Process summary not available",
        });
    }
    const summary = getProcessSummary();
    return Server_HTTP_utils.jsonResponse({
        processes: summary.processes || [],
        total: summary.total || 0,
        message: "Success",
    });
};

const handleCollatedTestResults = (server: any): Response => {
    return Server_HTTP_utils.jsonResponse({
        collatedTestResults: {},
        message: "Success",
    });
};

const handleCollatedInputFiles = (server: any): Response => {
    return Server_HTTP_utils.jsonResponse({
        collatedInputFiles: {},
        fsTree: {},
        message: "Success",
    });
};

const handleCollatedDocumentation = (): Response => {
    return Server_HTTP_utils.jsonResponse({
        tree: {},
        files: [],
        message: "Success",
    });
};

const handleDocumentation = (): Response => {
    return Server_HTTP_utils.jsonResponse({
        files: [],
        message: "Success",
    });
};

const handleReports = (): Response => {
    return Server_HTTP_utils.jsonResponse({
        tree: {},
        message: "Success",
    });
};

const handleHtmlReport = (): Response => {
    return Server_HTTP_utils.jsonResponse({
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
        return Server_HTTP_utils.jsonResponse({
            aiderProcesses: aiderProcesses || [],
            message: "Success",
        });
    }
    return Server_HTTP_utils.jsonResponse({
        aiderProcesses: [],
        message: "Aider processes not available",
    });
};
