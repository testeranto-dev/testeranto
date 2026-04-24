export function yamlValueToString(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'string') {
    if (value.includes(':') || value.includes('#') || value.includes('{') || value.includes('}') || value.includes('[') || value.includes(']') || value.includes(',') || value.includes('&') || value.includes('*') || value.includes('?') || value.includes('|') || value.includes('-') || value.includes('<') || value.includes('>') || value.includes('=') || value.includes('!') || value.includes('%') || value.includes('@') || value.includes('`')) {
      return `"${value}"`;
    }
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (Array.isArray(value)) {
    return `[${value.map(yamlValueToString).join(', ')}]`;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
