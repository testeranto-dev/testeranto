import { GraphData, Node, VizConfig, VizComponentProps } from '../viz';

export interface MarkdownFile {
  path: string;
  content: string;
  frontmatter: Record<string, any>;
  body: string;
}

export interface MarkdownChartProps {
  // File system configuration
  filePattern: string | string[]; // Glob pattern(s) for markdown files
  watchFiles?: boolean; // Watch for file changes
  
  // Chart configuration
  chartComponent: React.ComponentType<VizComponentProps>;
  chartConfig: VizConfig;
  
  // Attribute mapping
  attributeMapping: {
    idAttribute: string; // Which frontmatter field becomes node.id
    xAttribute?: string; // Maps to projection.xAttribute
    yAttribute?: string; // Maps to projection.yAttribute
    // Additional attribute mappings can be inferred from frontmatter
  };
  
  // Callbacks
  onFileChange?: (file: MarkdownFile) => void;
  onNodeUpdate?: (node: Node, oldAttributes: Record<string, any>) => void;
  
  // Display
  width: number;
  height: number;
}

export interface FileSystemAdapter {
  readFiles(pattern: string | string[]): Promise<MarkdownFile[]>;
  writeFile(file: MarkdownFile): Promise<void>;
  watchFiles(pattern: string | string[], callback: (files: MarkdownFile[]) => void): () => void;
}
