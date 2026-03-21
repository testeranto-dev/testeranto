this file documents how test results can be visualized.

testeranto includes user-defined visualizations, in the form of react components passed via configuration.

The grafeovidajo library is a set of react components to assist that. At it's core, it takes graph data, and projects it onto a 2d space, similar to d3. The goal is to provide the right hooks to allow the creation of multiple popular charts.

- eishhower matrix
- gantt chart
- kanan board
- trees and graphs

given 2 attributes on the nodes and some customizations, the grafeovidajo library project your graph data onto the 2d screen.

First, an x and y attribute are chosen
Second, if those attributes are a set or continuous
Third, a little styling to bring it together

If no x is chosen, the chart is 1d chart horizontal.
If no y is chosen, the chart is 1d chart veritcal.

If niether x nor y are congigured, the chart defaults to a graph

## API Design

### Core Types

```typescript
// Basic graph structure
interface GraphData {
  nodes: Node[];
  edges?: Edge[];
}

interface Node {
  id: string;
  attributes: Record<string, any>;
}

interface Edge {
  source: string;
  target: string;
  attributes?: Record<string, any>;
}

// Projection configuration
interface ProjectionConfig {
  xAttribute: string;
  yAttribute: string;
  xType: "categorical" | "continuous" | "ordinal" | "temporal";
  yType: "categorical" | "continuous" | "ordinal" | "temporal";

  layout?: "grid" | "force" | "tree" | "timeline";
  spacing?: {
    x: number;
    y: number;
  };

  xDomain?: [min: number, max: number] | string[];
  yDomain?: [min: number, max: number] | string[];

  xTransform?: (value: any) => number;
  yTransform?: (value: any) => number;
}

// Styling configuration
interface StyleConfig {
  nodeSize: number | ((node: Node) => number);
  nodeColor: string | ((node: Node) => string);
  nodeShape: "circle" | "square" | "diamond" | ((node: Node) => string);
  edgeColor?: string;
  edgeWidth?: number;
  labels?: {
    show: boolean;
    attribute: string;
    fontSize: number;
  };
}

// Complete visualization configuration
interface VizConfig {
  projection: ProjectionConfig;
  style: StyleConfig;
  interactivity?: {
    hover?: boolean;
    click?: boolean;
    drag?: boolean;
    zoom?: boolean;
  };
}
```

### Core API Functions

```typescript
// Project graph data to screen coordinates
function projectGraph(
  graph: GraphData,
  config: ProjectionConfig,
): ProjectedGraph;

interface ProjectedGraph {
  nodes: ProjectedNode[];
  edges?: ProjectedEdge[];
  bounds: {
    x: [min: number, max: number];
    y: [min: number, max: number];
  };
}

interface ProjectedNode extends Node {
  x: number;
  y: number;
  screenX?: number;
  screenY?: number;
}

// Layout algorithms
function layoutGrid(
  nodes: ProjectedNode[],
  spacing: { x: number; y: number },
): ProjectedNode[];
function layoutForce(nodes: ProjectedNode[], edges?: Edge[]): ProjectedNode[];
function layoutTree(
  nodes: ProjectedNode[],
  edges: Edge[],
  rootId?: string,
): ProjectedNode[];
function layoutTimeline(
  nodes: ProjectedNode[],
  timeAttribute: string,
): ProjectedNode[];

// Apply styles to projected graph
function applyStyles(
  projectedGraph: ProjectedGraph,
  styleConfig: StyleConfig,
): StyledGraph;

interface StyledGraph extends ProjectedGraph {
  nodes: StyledNode[];
}

interface StyledNode extends ProjectedNode {
  size: number;
  color: string;
  shape: string;
  label?: string;
}

// Main Viz Component Props
interface VizComponentProps {
  data: GraphData;
  config: VizConfig;
  width: number;
  height: number;
  onNodeClick?: (node: Node) => void;
  onNodeHover?: (node: Node | null) => void;
}
```

### Specialized Chart APIs

```typescript
// Eisenhower Matrix
interface EisenhowerConfig extends VizConfig {
  quadrants: {
    urgentImportant: { x: [0, 0.5]; y: [0, 0.5] };
    notUrgentImportant: { x: [0.5, 1]; y: [0, 0.5] };
    urgentNotImportant: { x: [0, 0.5]; y: [0.5, 1] };
    notUrgentNotImportant: { x: [0.5, 1]; y: [0.5, 1] };
  };
}

// Gantt Chart
interface GanttConfig extends VizConfig {
  timeRange: [start: Date, end: Date];
  rowHeight: number;
  showDependencies: boolean;
}

// Kanban Board
interface KanbanConfig extends VizConfig {
  columns: Array<{
    id: string;
    title: string;
    statusFilter: (node: Node) => boolean;
    width: number;
  }>;
}

// Tree/Graph
interface TreeConfig extends VizConfig {
  rootId?: string;
  orientation: "horizontal" | "vertical";
  nodeSeparation: number;
  levelSeparation: number;
}
```

### Example Usage

```typescript
// Creating an Eisenhower matrix for test results
const testResultsGraph: GraphData = {
  nodes: [
    { id: 'test1', attributes: { urgency: 0.8, importance: 0.9, status: 'passed' } },
    { id: 'test2', attributes: { urgency: 0.3, importance: 0.7, status: 'failed' } },
  ]
};

const eisenhowerConfig: EisenhowerConfig = {
  projection: {
    xAttribute: 'urgency',
    yAttribute: 'importance',
    xType: 'continuous',
    yType: 'continuous',
    xDomain: [0, 1],
    yDomain: [0, 1]
  },
  style: {
    nodeSize: (node) => node.attributes.status === 'failed' ? 20 : 10,
    nodeColor: (node) => node.attributes.status === 'passed' ? 'green' : 'red',
    nodeShape: 'circle'
  },
  quadrants: {
    urgentImportant: { x: [0, 0.5], y: [0, 0.5] },
    notUrgentImportant: { x: [0.5, 1], y: [0, 0.5] },
    urgentNotImportant: { x: [0, 0.5], y: [0.5, 1] },
    notUrgentNotImportant: { x: [0.5, 1], y: [0.5, 1] }
  }
};

// Usage in React component
<EisenhowerMatrix
  data={testResultsGraph}
  config={eisenhowerConfig}
  width={800}
  height={600}
  onNodeClick={(node) => console.log('Test clicked:', node.id)}
/>
```

### Key Design Principles

1. **Separation of Concerns**: Projection, layout, and styling are separate steps
2. **Flexible Attribute Mapping**: Any node attribute can map to X/Y axes
3. **Extensible Layouts**: Easy to add new layout algorithms
4. **Responsive Design**: Works with any screen size
5. **Interactive**: Built-in support for hover, click, drag interactions

```

```
