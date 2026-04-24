export const yamlValueToString = (value: any): string => {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'string') {
    // Check if string needs quotes
    if (value.includes(':') || value.includes('{') || value.includes('}') ||
      value.includes('[') || value.includes(']') || value.includes(',') ||
      value.includes('#') || value.includes('&') || value.includes('*') ||
      value.includes('?') || value.includes('|') || value.includes('-') ||
      value.includes('>') || value.includes('\'') || value.includes('"') ||
      value.includes(' ') || value.includes('\t') || value.includes('\n')) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return `[${value.map(v => yamlValueToString(v)).join(', ')}]`;
  }
  // For objects, convert to JSON string
  return JSON.stringify(value);
};
