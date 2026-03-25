/**
 * Utility functions for node styling
 */

export function getNodeBackgroundColor(
  node: any,
  selectedFile: string | null
): string {
  if (selectedFile === node.path) {
    if (node.fileType === "documentation") {
      return "#e8f5e9";
    }
    if (node.type === "feature") {
      return "#fff3e0";
    }
    if (node.type === "test") {
      return "#e3f2fd";
    }
    // default for file
    return "transparent";
  }
  return "transparent";
}
