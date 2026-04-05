import { stakeholderHttpAPI } from "../../api";
import type { GraphUpdateRequest, GraphUpdateResponse } from "../../api/stakeholderHttp";
import { jsonResponse } from "../serverClasses/Server_Http/jsonResponse";
import { handleStakeholderGraphUpdate } from "./graph";

/**
 * Handle stakeholder API requests
 */

/**
 * Handle POST /api/graph-update
 */
export async function handlePostGraphUpdate(
  request: Request,
  graphManager: any,
  broadcast?: (message: any) => void
): Promise<Response> {
  try {
    const body = await request.json() as GraphUpdateRequest;

    // Validate request body
    const { nodeId, updatedAttributes } = body;

    if (!nodeId || !updatedAttributes) {
      return jsonResponse(
        {
          success: false,
          message: "Missing nodeId or updatedAttributes",
          timestamp: new Date().toISOString()
        } as GraphUpdateResponse,
        400,
        stakeholderHttpAPI.postGraphUpdate
      );
    }

    // Use the consolidated stakeholder graph update function
    const result = await handleStakeholderGraphUpdate(
      nodeId,
      updatedAttributes,
      graphManager,
      broadcast
    );

    return jsonResponse(
      result as GraphUpdateResponse,
      200,
      stakeholderHttpAPI.postGraphUpdate
    );
  } catch (error) {
    console.error('[Stakeholder] Error updating graph:', error);
    return jsonResponse(
      {
        success: false,
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      } as GraphUpdateResponse,
      500,
      stakeholderHttpAPI.postGraphUpdate
    );
  }
}
