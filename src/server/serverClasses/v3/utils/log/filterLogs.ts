export function filterLogs(
  logs: any[],
  filter: (log: any) => boolean,
): any[] {
  return logs.filter(filter);
}

export function filterByLevel(logs: any[], level: string): any[] {
  return filterLogs(logs, log => log.level === level);
}

export function filterByTimeRange(
  logs: any[],
  startTime: Date,
  endTime: Date,
): any[] {
  return filterLogs(logs, log => {
    if (!log.timestamp) return false;
    const logTime = new Date(log.timestamp);
    return logTime >= startTime && logTime <= endTime;
  });
}

export function filterBySource(logs: any[], source: string): any[] {
  return filterLogs(logs, log => {
    const logSource = log.source || log.serviceName || log.containerId;
    return logSource === source;
  });
}
