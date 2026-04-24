export type LogFormatter = (level: string, message: string, meta?: any) => string | object;

export function initializeLogFormats(): Map<string, LogFormatter> {
  const formats = new Map<string, LogFormatter>();

  // JSON format
  formats.set('json', (level, message, meta) => {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    });
  });

  // Text format
  formats.set('text', (level, message, meta) => {
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${new Date().toISOString()}] [${level}] ${message}${metaStr}`;
  });

  // Simple format
  formats.set('simple', (level, message) => {
    return `[${level}] ${message}`;
  });

  // Structured format (for machine parsing)
  formats.set('structured', (level, message, meta) => {
    const base = {
      ts: Date.now(),
      lvl: level.charAt(0),
      msg: message,
    };
    if (meta) {
      return { ...base, ...meta };
    }
    return base;
  });

  return formats;
}
