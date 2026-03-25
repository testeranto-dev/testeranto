import { getLanguageFromPath } from "./fileUtils";

export interface EmbeddedData {
  fileContents?: Record<string, string>;
  documentation?: {
    contents?: Record<string, string>;
  };
}

export function createFileContentFromNode(
  node: any,
  embeddedData: EmbeddedData | undefined
): any {
  // Handle file nodes (source files, documentation, etc.)
  if (node.type === "file") {
    // Check if we have embedded content
    if (embeddedData && embeddedData.fileContents && embeddedData.fileContents[node.path]) {
      const content = embeddedData.fileContents[node.path];
      // Determine language from file extension
      const language = getLanguageFromPath(node.path);

      return {
        type: "file",
        path: node.path,
        name: node.name,
        content: content,
        language: language,
        size: content.length,
        fileType: node.fileType
      };
    } else if (embeddedData && embeddedData.documentation && embeddedData.documentation.contents &&
      embeddedData.documentation.contents[node.path]) {
      // Check documentation contents
      const content = embeddedData.documentation.contents[node.path];
      return {
        type: "documentation",
        path: node.path,
        name: node.name,
        content: content,
        language: 'markdown',
        size: content.length
      };
    } else {
      return {
        type: "file",
        path: node.path,
        name: node.name,
        message: `File content not embedded: ${node.path}`,
        fileType: node.fileType
      };
    }
  }
  // Handle documentation files
  else if (node.fileType === "documentation") {
    if (embeddedData && embeddedData.documentation && embeddedData.documentation.contents &&
      embeddedData.documentation.contents[node.path]) {
      const content = embeddedData.documentation.contents[node.path];
      return {
        type: "documentation",
        path: node.path,
        name: node.name,
        content: content,
        language: 'markdown',
        size: content.length
      };
    } else {
      return {
        type: "documentation",
        path: node.path,
        name: node.name,
        message: `Documentation file: ${node.path}. Content not embedded.`
      };
    }
  }
  // Handle test nodes with BDD status
  else if (node.type === "test") {
    return {
      type: "test",
      path: node.path,
      name: node.name,
      bddStatus: node.bddStatus || { status: 'unknown', color: 'gray' },
      children: node.children
    };
  }
  // Handle feature nodes
  else if (node.type === "feature") {
    return {
      type: "feature",
      path: node.path,
      name: node.name,
      feature: node.feature,
      status: node.status || 'unknown'
    };
  }
  // Handle directory nodes
  else if (node.type === "directory") {
    return {
      type: "directory",
      path: node.path,
      name: node.name,
      children: node.children
    };
  }
  else {
    return null;
  }
}
