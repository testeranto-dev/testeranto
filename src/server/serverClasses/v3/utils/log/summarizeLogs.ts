export interface LogSummary {
  total: number;
  byLevel: Map<string, number>;
  bySource: Map<string, number>;
  errors: number;
  warnings: number;
  startTime: Date | null;
  endTime: Date | null;
}

export function summarizeLogs(logs: any[]): LogSummary {
  const summary: LogSummary = {
    total: logs.length,
    byLevel: new Map(),
    bySource: new Map(),
    errors: 0,
    warnings: 0,
    startTime: null,
    endTime: null,
  };

  for (const log of logs) {
    // Count by level
    const level = log.level || 'INFO';
    summary.byLevel.set(level, (summary.byLevel.get(level) || 0) + 1);

    // Count errors and warnings
    if (level === 'ERROR' || level === 'FATAL') summary.errors++;
    if (level === 'WARN') summary.warnings++;

    // Track by source if available
    const source = log.source || log.serviceName || log.containerId || 'unknown';
    summary.bySource.set(source, (summary.bySource.get(source) || 0) + 1);

    // Track time range
    const timestamp = log.timestamp ? new Date(log.timestamp) : null;
    if (timestamp) {
      if (!summary.startTime || timestamp < summary.startTime) {
        summary.startTime = timestamp;
      }
      if (!summary.endTime || timestamp > summary.endTime) {
        summary.endTime = timestamp;
      }
    }
  }

  return summary;
}
