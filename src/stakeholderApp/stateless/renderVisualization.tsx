import React from "react";
import { type GraphData, type Node, EisenhowerMatrix, GanttChart, KanbanBoard, TreeGraph } from "../../grafeovidajo/index";

export interface RenderVisualizationProps {
  data: {
    featureGraph?: GraphData;
    fileTreeGraph?: GraphData;
    vizConfig?: any;
  };
  vizType: 'eisenhower' | 'gantt' | 'kanban' | 'tree' | 'file-tree';
  onNodeClick?: (node: Node) => void;
  onNodeHover?: (node: Node | null) => void;
}

export function renderVisualization({
  data,
  vizType,
  onNodeClick,
  onNodeHover
}: RenderVisualizationProps): React.ReactElement {
  if (!data.featureGraph || !data.featureGraph.nodes || data.featureGraph.nodes.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>No Feature Graph Available</h3>
        <p>Features need to be extracted from test results to create visualizations.</p>
        <p>Run tests to generate feature data.</p>
      </div>
    );
  }

  const graphData: GraphData = {
    nodes: data.featureGraph.nodes,
    edges: data.featureGraph.edges || []
  };

  const baseConfig = data.vizConfig || {
    projection: {
      xAttribute: 'status',
      yAttribute: 'points',
      xType: 'categorical',
      yType: 'continuous',
      layout: 'grid'
    },
    style: {
      nodeSize: (node: any) => {
        if (node.attributes.points) return Math.max(10, node.attributes.points * 5);
        return 10;
      },
      nodeColor: (node: any) => {
        const status = node.attributes.status;
        if (status === 'done') return '#4caf50';
        if (status === 'doing') return '#ff9800';
        if (status === 'todo') return '#f44336';
        return '#9e9e9e';
      },
      nodeShape: 'circle',
      labels: {
        show: true,
        attribute: 'name',
        fontSize: 12
      }
    }
  };

  const commonProps = {
    data: graphData,
    width: 800,
    height: 500,
    onNodeClick: onNodeClick || (() => { }),
    onNodeHover: onNodeHover || (() => { })
  };

  switch (vizType) {
    case 'eisenhower':
      return (
        <div>
          <h3>Eisenhower Matrix</h3>
          <p>Urgency vs Importance of features</p>
          <EisenhowerMatrix
            {...commonProps}
            config={{
              ...baseConfig,
              projection: {
                ...baseConfig.projection,
                xAttribute: 'urgency',
                yAttribute: 'importance',
                xType: 'continuous',
                yType: 'continuous'
              },
              quadrants: {
                urgentImportant: { x: [0, 0.5], y: [0, 0.5] },
                notUrgentImportant: { x: [0.5, 1], y: [0, 0.5] },
                urgentNotImportant: { x: [0, 0.5], y: [0.5, 1] },
                notUrgentNotImportant: { x: [0.5, 1], y: [0.5, 1] }
              }
            }}
          />
        </div>
      );
    case 'gantt':
      return (
        <div>
          <h3>Gantt Chart</h3>
          <p>Feature timeline</p>
          <GanttChart
            {...commonProps}
            config={{
              ...baseConfig,
              timeRange: [new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)],
              rowHeight: 30,
              showDependencies: true
            }}
          />
        </div>
      );
    case 'kanban':
      return (
        <div>
          <h3>Kanban Board</h3>
          <p>Feature status columns</p>
          <KanbanBoard
            {...commonProps}
            config={{
              ...baseConfig,
              columns: [
                {
                  id: 'todo',
                  title: 'To Do',
                  statusFilter: (node: Node) => node.attributes.status === 'todo',
                  width: 25
                },
                {
                  id: 'doing',
                  title: 'Doing',
                  statusFilter: (node: Node) => node.attributes.status === 'doing',
                  width: 25
                },
                {
                  id: 'review',
                  title: 'Review',
                  statusFilter: (node: Node) => node.attributes.status === 'review',
                  width: 25
                },
                {
                  id: 'done',
                  title: 'Done',
                  statusFilter: (node: Node) => node.attributes.status === 'done',
                  width: 25
                }
              ]
            }}
          />
        </div>
      );
    case 'tree':
      return (
        <div>
          <h3>Feature Dependency Tree</h3>
          <p>Feature relationships</p>
          <TreeGraph
            {...commonProps}
            config={{
              ...baseConfig,
              projection: {
                ...baseConfig.projection,
                layout: 'tree'
              },
              orientation: 'horizontal',
              nodeSeparation: 100,
              levelSeparation: 80
            }}
          />
        </div>
      );
    case 'file-tree':
      // Use fileTreeGraph if available, otherwise fall back to featureGraph
      const fileTreeData = data.fileTreeGraph || data.featureGraph;
      if (!fileTreeData || !fileTreeData.nodes || fileTreeData.nodes.length === 0) {
        return (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <h3>No File Tree Graph Available</h3>
            <p>File tree data needs to be extracted to create visualizations.</p>
          </div>
        );
      }
      return (
        <div>
          <h3>File Tree Structure</h3>
          <p>Hierarchical view of files and directories</p>
          <TreeGraph
            data={fileTreeData}
            config={{
              projection: {
                layout: 'tree',
                xAttribute: 'depth',
                yAttribute: 'name',
                xType: 'continuous',
                yType: 'categorical'
              },
              style: {
                nodeSize: (node: any) => {
                  const type = node.attributes.type;
                  if (type === 'directory') return 15;
                  if (type === 'file') return 10;
                  return 8;
                },
                nodeColor: (node: any) => {
                  const type = node.attributes.type;
                  if (type === 'directory') return '#007acc';
                  if (type === 'file') return '#4caf50';
                  if (type === 'documentation') return '#ff9800';
                  return '#9e9e9e';
                },
                nodeShape: (node: any) => {
                  const type = node.attributes.type;
                  if (type === 'directory') return 'square';
                  return 'circle';
                },
                labels: {
                  show: true,
                  attribute: 'name',
                  fontSize: 12
                }
              }
            }}
            width={800}
            height={500}
            onNodeClick={onNodeClick || (() => { })}
            onNodeHover={onNodeHover || (() => { })}
          />
        </div>
      );
    default:
      return <div>Select a visualization type</div>;
  }
}
