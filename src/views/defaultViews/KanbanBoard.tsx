import React, { useState, useRef, useEffect } from 'react';
import { NodeDetailsModal } from './NodeDetailsModal';
import type { Node } from 'typescript';
import type { GraphData } from '../../graph';
import type { VizConfig, VizComponentProps } from '../../grafeovidajo';

export const KanbanSlicer = (graphData: GraphData): GraphData => {
  // Filter feature nodes with status
  const featureNodes = graphData.nodes.filter(node =>
    node.type === 'feature' ||
    node.id.startsWith('feature:') ||
    (node.metadata?.frontmatter?.status !== undefined)
  );

  const featureEdges = graphData.edges.filter(edge =>
    featureNodes.some(n => n.id === edge.source) &&
    featureNodes.some(n => n.id === edge.target)
  );

  return {
    nodes: featureNodes,
    edges: featureEdges,
    metadata: {
      ...graphData.metadata,
      viewType: 'kanban',
      timestamp: new Date().toISOString()
    }
  };
}

export interface KanbanConfig extends VizConfig {
  columns: Array<{
    id: string;
    title: string;
    statusFilter: (node: Node) => boolean;
    width: number;
    // The status value that nodes in this column should have
    targetStatus?: string;
  }>;
}

// Helper function to safely get node attributes
// export const getSafeNodeAttributes = (node: Node): Record<string, any> => {
//   return node.attributes || {};
// };

// Helper function to extract status from a node
export const getNodeStatus = (node: Node): string | undefined => {

  if (node.metadata.frontmatter.status) {
    return node.metadata.frontmatter.status
  }
  // debugger
  // if (!node) return undefined;

  // // Check node.attributes.status (YAML frontmatter)
  // if (node.attributes?.status !== undefined) {
  //   return String(node.attributes.status);
  // }

  // // Check node.attributes.metadata.status
  // if (node.attributes?.metadata?.status !== undefined) {
  //   return String(node.attributes.metadata.status);
  // }

  return undefined;
};

export const KanbanBoard: React.FC<VizComponentProps & { config: KanbanConfig }> = (props) => {
  const { config, height } = props;
  // Use the provided width, but default to 100% if not specified
  const width = props.width || '100%';
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidths, setResizeStartWidths] = useState<number[]>([]);
  const [resizeColumnIndex, setResizeColumnIndex] = useState<number | null>(null);
  const [draggedNode, setDraggedNode] = useState<Node | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter nodes to only include features
  const featureNodes = props.data.nodes.filter(node => {
    if (!node) return false;

    // Check if the node id starts with 'feature:' (most reliable)
    const isFeatureById = node.id?.startsWith('feature:');

    // According to the Node interface, type is a direct property
    const nodeType = node.type;

    // Check if the node has feature-like metadata
    const hasFeatureMetadata = node.metadata?.frontmatter?.feature ||
      node.metadata?.frontmatter?.scenario;

    // Check if label or description suggests it's a feature
    const label = node.label || '';
    const description = node.description || '';
    const isFeatureByText = label.toLowerCase().includes('feature') ||
      description.toLowerCase().includes('scenario');

    // Also check if the node id contains 'feature' anywhere (case-insensitive)
    const idContainsFeature = node.id?.toLowerCase().includes('feature');

    // Check for YAML frontmatter fields that are common in feature files
    // Feature files often have status, title, description in frontmatter
    const hasFrontmatterFields = node.metadata?.frontmatter?.status ||
      node.metadata?.frontmatter?.title ||
      node.metadata?.frontmatter?.description;

    return isFeatureById ||
      nodeType === 'feature' ||
      hasFeatureMetadata ||
      isFeatureByText ||
      idContainsFeature ||
      hasFrontmatterFields;
  });

  // Create a set of feature node IDs for quick lookup
  const featureNodeIds = new Set(featureNodes.map(node => node.id));

  // Filter edges to only include those where both source and target are feature nodes
  const featureEdges = props.data.edges?.filter(edge => {
    return featureNodeIds.has(edge.source) && featureNodeIds.has(edge.target);
  });

  // Create a new data object with only feature nodes and edges
  const featureData = {
    ...props.data,
    nodes: featureNodes,
    edges: featureEdges || []
  };

  // Initialize column widths
  useEffect(() => {
    // Create a backlog column for nodes that don't match any other column
    const allColumns = [
      ...config.columns,
      {
        id: 'backlog',
        title: 'Backlog',
        statusFilter: (node: Node) => {
          // Check if node matches any of the other columns
          for (const column of config.columns) {
            try {
              if (column.statusFilter(node)) {
                return false;
              }
            } catch (error) {
              // If a column's filter throws, treat it as not matching
              continue;
            }
          }
          // Node doesn't match any column, so it belongs in backlog
          return true;
        },
        width: 20 // Default width for backlog column
      }
    ];

    // Adjust column widths to ensure they sum to 100%
    const totalWidth = allColumns.reduce((sum, col) => sum + col.width, 0);
    const initialWidths = allColumns.map(col => (col.width / totalWidth) * 100);
    setColumnWidths(initialWidths);
  }, [config.columns]);

  // Create columns with current widths
  const allColumns = [
    ...config.columns,
    {
      id: 'backlog',
      title: 'Backlog',
      statusFilter: (node: Node) => {
        for (const column of config.columns) {
          try {
            if (column.statusFilter(node)) {
              return false;
            }
          } catch (error) {
            continue;
          }
        }
        return true;
      },
      width: 20
    }
  ];

  const adjustedColumns = allColumns.map((col, index) => ({
    ...col,
    width: columnWidths[index] || (col.width / 100) * 100
  }));

  // Handle resize start
  const handleResizeStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeColumnIndex(index);
    setResizeStartX(e.clientX);
    setResizeStartWidths([...columnWidths]);
  };

  // Handle mouse move during resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || resizeColumnIndex === null) return;

      const deltaX = e.clientX - resizeStartX;
      const containerWidth = containerRef.current?.clientWidth || (typeof width === 'number' ? width : 800);
      const deltaPercent = (deltaX / containerWidth) * 100;

      const newWidths = [...resizeStartWidths];

      // Adjust the widths of the two adjacent columns
      const leftIndex = resizeColumnIndex - 1;
      const rightIndex = resizeColumnIndex;

      // Ensure we don't go below minimum width (e.g., 5%)
      const minWidth = 5;
      // Swap the adjustment direction: left column gets deltaPercent added, right column gets deltaPercent subtracted
      if (
        newWidths[leftIndex] + deltaPercent >= minWidth &&
        newWidths[rightIndex] - deltaPercent >= minWidth
      ) {
        newWidths[leftIndex] += deltaPercent;
        newWidths[rightIndex] -= deltaPercent;
        setColumnWidths(newWidths);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeColumnIndex(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeColumnIndex, resizeStartX, resizeStartWidths, width]);

  // Handle drag start
  const handleDragStart = (node: Node, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', node.id);
    setDraggedNode(node);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (columnId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  // Handle drop
  const handleDrop = (columnId: string, e: React.DragEvent) => {
    e.preventDefault();
    const nodeId = e.dataTransfer.getData('text/plain');
    const node = featureNodes.find(n => n.id === nodeId);

    if (node) {
      // Determine which column the node was dropped into
      const targetColumn = adjustedColumns.find(col => col.id === columnId);
      if (targetColumn) {
        // Update the node's status to match the column
        // We need to determine what attribute change is needed
        // For now, we'll update the node's status attribute
        // This should trigger a GraphOperation to be sent to the server
        console.log(`Dropped node ${nodeId} into column ${columnId}`);

        // Update the node's attributes to match the target column
        // Use targetStatus if provided, otherwise use column id
        const targetStatus = targetColumn.targetStatus ||
          (columnId === 'backlog' ? 'todo' : columnId);

        // We need to update the node's attributes in a way that makes the statusFilter return true
        // For now, update the status attribute
        const updatedAttributes: Node = {
          ...node,
          metadata: {
            ...node.metadata,
            frontmatter: {
              ...node.metadata.frontmatter,
              status: targetStatus
            }
          }
        };

        // Call a callback to send the update to the server
        if (props.onNodeUpdate) {
          props.onNodeUpdate(node.id, updatedAttributes);
        }

        // Also call onNodeClick if provided
        props.onNodeClick?.(node);
      }
    }

    setDragOverColumn(null);
    setDraggedNode(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDragOverColumn(null);
    setDraggedNode(null);
  };

  // Render columns as HTML divs
  const renderColumns = () => {
    return adjustedColumns.map((column, index) => {
      // Filter feature nodes for this column
      const columnNodes = featureNodes.filter(node => {
        if (!node) return false;

        // Create a safe node object with guaranteed attributes
        // const safeNode = {
        //   id: node.id || '',
        //   attributes: getSafeNodeAttributes(node)
        // };

        try {
          return column.statusFilter(node);
        } catch (error) {
          console.warn(`Error in statusFilter for column "${column.title}":`, error);
          return false;
        }
      });

      const isDragOver = dragOverColumn === column.id;

      return (
        <React.Fragment key={`column-${column.id}`}>
          {index > 0 && (
            <div
              style={{
                width: '5px',
                backgroundColor: isResizing && resizeColumnIndex === index ? '#007acc' : '#ddd',
                cursor: 'col-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 2
              }}
              onMouseDown={(e) => handleResizeStart(index, e)}
              title="Drag to resize"
            >
              <div
                style={{
                  width: '1px',
                  height: '20px',
                  backgroundColor: '#999'
                }}
              />
            </div>
          )}
          <div
            style={{
              flex: `0 0 ${column.width}%`,
              border: '1px solid #ddd',
              backgroundColor: isDragOver ? '#e8f4fd' : '#f5f5f5',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
              minWidth: '50px',
              transition: 'background-color 0.2s'
            }}
            onDragOver={(e) => handleDragOver(column.id, e)}
            onDrop={(e) => handleDrop(column.id, e)}
            onDragLeave={() => setDragOverColumn(null)}
          >
            <div
              style={{
                padding: '10px',
                borderBottom: '1px solid #ddd',
                backgroundColor: '#e0e0e0',
                fontWeight: 'bold',
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{column.title} ({columnNodes.length})</span>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {column.width.toFixed(1)}%
              </span>
            </div>
            <div
              style={{
                flex: 1,
                padding: '10px',
                overflowY: 'auto'
              }}
            >
              {columnNodes.map(node => {
                const label = node.label || node.id;
                const status = node.metadata?.frontmatter?.status;
                const priority = node.metadata?.frontmatter?.priority;
                const isDragging = draggedNode?.id === node.id;

                return (
                  <div
                    key={node.id}
                    draggable
                    style={{
                      padding: '8px',
                      marginBottom: '8px',
                      backgroundColor: isDragging ? '#f0f0f0' : 'white',
                      border: isDragging ? '2px dashed #007acc' : '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'grab',
                      opacity: isDragging ? 0.5 : 1,
                      transition: 'all 0.2s'
                    }}
                    onClick={() => {
                      setSelectedNode(node);
                      setIsModalOpen(true);
                      props.onNodeClick?.(node);
                    }}
                    onMouseEnter={() => props.onNodeHover?.(node)}
                    onMouseLeave={() => props.onNodeHover?.(null)}
                    onDragStart={(e) => handleDragStart(node, e)}
                    onDragEnd={handleDragEnd}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {label}
                    </div>
                    {status && (
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                        Status: {status}
                      </div>
                    )}
                    {priority && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Priority: {priority}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </React.Fragment>
      );
    });
  };


  return (
    <>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height,
          position: 'relative'
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverColumn(null);
        }}
      >
        <div style={{
          display: 'flex',
          height: '100%',
          overflow: 'hidden',
          userSelect: isResizing ? 'none' : 'auto'
        }}>
          {renderColumns()}
        </div>
        {isResizing && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            cursor: 'col-resize'
          }} />
        )}
        {draggedNode && (
          <div style={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: 'rgba(0, 122, 204, 0.9)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1001
          }}>
            Dragging: {draggedNode.label || draggedNode.id}
          </div>
        )}
      </div>
      <NodeDetailsModal
        node={selectedNode}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNode(null);
        }}
      />
    </>
  );
};
// TODO
export const KanbanSlice = () => {

}