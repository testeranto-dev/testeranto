export interface AgentCounters {
  [profile: string]: number;
}

export function getAgentCounter(
  counters: AgentCounters,
  profile: string,
): number {
  return counters[profile] || 0;
}
