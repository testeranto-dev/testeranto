export interface AgentCounters {
  [profile: string]: number;
}

export function saveAgentCounter(
  counters: AgentCounters,
  profile: string,
  counter: number,
): AgentCounters {
  return {
    ...counters,
    [profile]: counter,
  };
}
