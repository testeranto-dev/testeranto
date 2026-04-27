// export interface HandleSpawnAgentParams {
//   profile: string;
//   loadFiles?: string[];
//   message?: string;
//   model?: string;
// }

// export interface HandleSpawnAgentResult {
//   profile: string;
//   agentName: string;
//   containerId: string;
// }

// export function handleSpawnAgent(params: HandleSpawnAgentParams): HandleSpawnAgentResult {
//   const agentName = `${params.profile}-${Date.now()}`;
//   const containerId = `agent-${agentName}`;

//   return {
//     profile: params.profile,
//     agentName,
//     containerId,
//   };
// }
