import { API } from "../../../../../api";
import type { ITesterantoConfig } from "../../../../../Types";
import type { IMode } from "../../../../types";

export async function handleDefaultApiRequest(
  request: Request,
  endpointKey: string,
  configs: ITesterantoConfig,
  mode: IMode,
  isRunning: boolean,
  startedAt: Date | null,
  handleFilesRoute: (request: Request) => Promise<Response>,
  handleProcessRoute: (request: Request) => Promise<Response>,
  handleAiderRoute: (request: Request) => Promise<Response>,
  handleRuntimeRoute: (request: Request) => Promise<Response>,
  handleAgentsRoute: (request: Request) => Promise<Response>,
  handleAgentSliceRoute: (request: Request, agentName: string) => Promise<Response>,
  handleAllViewsRoute: (request: Request) => Promise<Response>,
  handleViewRoute: (request: Request, viewName: string) => Promise<Response>,
  handlePostChatMessage: (request: Request) => Promise<Response>,
  handleGetChatHistory: (request: Request) => Promise<Response>,
  handleLaunchAiderForTest: (request: Request) => Promise<Response>,
  openProcessTerminal: (nodeId: string, label: string, containerId: string, serviceName: string) => Promise<{ command: string }>,
): Promise<Response> {
  const url = new URL(request.url);

  switch (endpointKey) {
    case "getFiles":
      return await handleFilesRoute(request);
    case "getProcess":
      return await handleProcessRoute(request);
    case "getAider":
      return await handleAiderRoute(request);
    case "getRuntime":
      return await handleRuntimeRoute(request);
    case "getAgents":
    case "getAllAgents":
      return await handleAgentsRoute(request);
    case "getAgentSlice":
      const agentName = url.pathname.split("/").pop();
      return await handleAgentSliceRoute(request, agentName || "");
    case "getAllViews":
      return await handleAllViewsRoute(request);
    case "getView":
      const viewName = url.pathname.split("/").pop();
      return await handleViewRoute(request, viewName || "");
    case "getConfigs":
      return new Response(
        JSON.stringify({
          configs,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    case "getAppState":
      return new Response(
        JSON.stringify({
          isRunning,
          startedAt,
          mode,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    case "postChatMessage":
      return await handlePostChatMessage(request);
    case "getChatHistory":
      return await handleGetChatHistory(request);
    case "launchAiderForTest":
      return await handleLaunchAiderForTest(request);
    case "openProcessTerminal":
      {
        const body = await request.json().catch(() => ({}));
        const { nodeId, label, containerId, serviceName } = body;
        if (!nodeId) {
          return new Response("Missing required field: nodeId", {
            status: 400,
            headers: { "Content-Type": "text/plain" },
          });
        }
        try {
          const result = await openProcessTerminal(
            nodeId,
            label || nodeId,
            containerId || "",
            serviceName || "",
          );
          return new Response(result.command, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        } catch (error: any) {
          return new Response(error.message, {
            status: 500,
            headers: { "Content-Type": "text/plain" },
          });
        }
      }
    default:
      return new Response(
        JSON.stringify({
          endpoint: endpointKey,
          method: request.method,
          path: url.pathname,
          message: `Endpoint '${endpointKey}' is registered but handler not implemented`,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 501,
          headers: { "Content-Type": "application/json" },
        },
      );
  }
}