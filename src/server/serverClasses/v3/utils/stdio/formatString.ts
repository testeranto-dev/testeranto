export function formatString(format: string, ...args: any[]): string {
  return format.replace(/{(\d+)}/g, (match, number) => {
    return typeof args[number] !== 'undefined' ? args[number] : match;
  });
}
