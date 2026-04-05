export interface GraphUpdateRequest {
  nodeId: string;
  updatedAttributes: Record<string, any>;
}

export interface GraphUpdateResponse {
  success: boolean;
  message: string;
  timestamp: string;
  newHash?: string;
}

export const stakeholderHttpAPI = {
  // Development mode API endpoint - only for updates
  // Initial graph data is loaded from graph-data.json static file
  postGraphUpdate: {
    method: 'POST' as const,
    path: '/api/graph-update',
    description: 'Update graph data (development mode only) - initial load is from graph-data.json',
    response: {} as GraphUpdateResponse
  },
  // Static mode uses graph-data.json directly (no API endpoints needed)
} as const;
