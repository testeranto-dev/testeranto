export interface GraphDataResponse {
  success: boolean;
  timestamp: string;
  data: any;
}


export const stakeholderHttpAPI = {
  // THIS IS ALL FUCKING WRONG.
  // ONLY SERVE STATIC FILES, NOTHING ELSE
  // 
  // // Graph data endpoints
  // getGraphData: {
  //   method: 'GET' as const,
  //   path: '/api/graph-data',
  //   description: 'Get graph data for visualization (API mode only)',
  //   response: {} as GraphDataResponse
  // },

  // getGraphDataJson: {
  //   method: 'GET' as const,
  //   path: '/graph-data.json',
  //   description: 'Get graph data as JSON file (static mode)',
  //   response: {} as any // Raw JSON data
  // }
} as const;