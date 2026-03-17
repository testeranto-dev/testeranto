import React, { useMemo, useCallback } from 'react';
import { GraphData, VizComponentProps, Node } from '../viz';
import { MarkdownChartProps } from './types';
import { useMarkdownFiles } from './hooks/useMarkdownFiles';
import { useChartSync } from './hooks/useChartSync';
import { markdownFilesToGraphData } from './markdown/parser';

export const MarkdownChart: React.FC<MarkdownChartProps> = ({
  filePattern,
  watchFiles = false,
  chartComponent: ChartComponent,
  chartConfig,
  attributeMapping,
  onFileChange,
  onNodeUpdate,
  width,
  height
}) => {
  const {
    files,
    loading,
    error,
    updateFile
  } = useMarkdownFiles(filePattern, watchFiles);

  const { handleNodeUpdate, handleNodeDrag } = useChartSync(
    files,
    updateFile,
    attributeMapping
  );

  // Convert markdown files to graph data
  const graphData = useMemo<GraphData>(() => {
    return markdownFilesToGraphData(files, attributeMapping);
  }, [files, attributeMapping]);

  // Handle node interactions
  const handleNodeClick = useCallback((node: Node) => {
    // Could open the markdown file for editing
    console.log('Node clicked:', node);
  }, []);

  const handleNodeHover = useCallback((node: Node | null) => {
    // Could show tooltip with file info
    console.log('Node hover:', node);
  }, []);

  const handleNodeInteraction = useCallback(async (
    node: Node,
    interactionType: 'drag' | 'attributeChange',
    data: any
  ) => {
    try {
      if (interactionType === 'drag') {
        await handleNodeDrag(node, data);
      } else if (interactionType === 'attributeChange') {
        await handleNodeUpdate(node, data);
      }
      
      // Notify parent component
      onNodeUpdate?.(node, data);
    } catch (error) {
      console.error('Failed to handle node interaction:', error);
    }
  }, [handleNodeDrag, handleNodeUpdate, onNodeUpdate]);

  if (loading) {
    return <div>Loading markdown files...</div>;
  }

  if (error) {
    return <div>Error loading files: {error.message}</div>;
  }

  if (files.length === 0) {
    return <div>No markdown files found matching pattern: {filePattern}</div>;
  }

  // Enhance chart config with attribute mapping
  const enhancedConfig = {
    ...chartConfig,
    projection: {
      ...chartConfig.projection,
      xAttribute: attributeMapping.xAttribute || chartConfig.projection.xAttribute,
      yAttribute: attributeMapping.yAttribute || chartConfig.projection.yAttribute
    }
  };

  return (
    <div className="markdown-chart-container">
      <div className="chart-header">
        <h3>Visualizing {files.length} markdown files</h3>
        <div className="file-info">
          Files will be updated as you interact with the chart
        </div>
      </div>
      
      <ChartComponent
        data={graphData}
        config={enhancedConfig}
        width={width}
        height={height}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        // Additional props for drag interactions could be passed here
      />
      
      <div className="chart-footer">
        <small>
          Each node represents a markdown file. Drag nodes to update their attributes.
        </small>
      </div>
    </div>
  );
};
