export function createStructuredLog(
  structureType: string,
  data: any,
  structures: Map<string, any>,
): any {
  const structure = structures.get(structureType);
  if (!structure) {
    return data;
  }

  // Merge structure template with provided data
  const result = { ...structure };
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      result[key] = data[key];
    }
  }

  // Fill in defaults
  if (!result.timestamp && !result.ts) {
    result.timestamp = new Date().toISOString();
  }

  return result;
}
