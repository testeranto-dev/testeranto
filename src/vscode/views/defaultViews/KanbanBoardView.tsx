// DO NOT PUT THE SLICER FUNCTION IN THIS FILE

import React from 'react';
import { BaseViewClass } from '../BaseViewClass';
import type { IKanban, KanbanItem } from './KanbanBoard';

export interface KanbanConfig {
  columns: Array<{
    id: string;
    title: string;
    statusFilter: (item: KanbanItem) => boolean;
    width: number;
    targetStatus?: string;
  }>;
}

interface KanbanBoardState {
  selectedItem: KanbanItem | null;
  columnWidths: number[];
  isResizing: boolean;
  resizeStartX: number;
  resizeStartWidths: number[];
  resizeColumnIndex: number | null;
  draggedItem: KanbanItem | null;
  dragOverColumn: string | null;
}

export class KanbanBoard extends BaseViewClass<IKanban> {
  state: KanbanBoardState = {
    selectedItem: null,
    columnWidths: [],
    isResizing: false,
    resizeStartX: 0,
    resizeStartWidths: [],
    resizeColumnIndex: null,
    draggedItem: null,
    dragOverColumn: null,
  };

  containerRef = React.createRef<HTMLDivElement>();

  get config(): KanbanConfig {
    return this.props.config || {
      columns: [
        {
          id: 'todo',
          title: 'To Do',
          statusFilter: (item: KanbanItem) => {
            const status = item.status;
            return status === 'todo' || status === undefined;
          },
          width: 25,
          targetStatus: 'todo'
        },
        {
          id: 'doing',
          title: 'In Progress',
          statusFilter: (item: KanbanItem) => {
            const status = item.status;
            return status === 'doing';
          },
          width: 25,
          targetStatus: 'doing'
        },
        {
          id: 'done',
          title: 'Done',
          statusFilter: (item: KanbanItem) => {
            const status = item.status;
            return status === 'done';
          },
          width: 25,
          targetStatus: 'done'
        },
        {
          id: 'blocked',
          title: 'Blocked',
          statusFilter: (item: KanbanItem) => {
            const status = item.status;
            return status === 'blocked';
          },
          width: 25,
          targetStatus: 'blocked'
        }
      ]
    };
  }

  initializeColumnWidths() {
    const allColumns = [
      ...this.config.columns,
      {
        id: 'backlog',
        title: 'Backlog',
        statusFilter: (item: KanbanItem) => {
          for (const column of this.config.columns) {
            try {
              if (column.statusFilter(item)) {
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

    const totalWidth = allColumns.reduce((sum, col) => sum + col.width, 0);
    const initialWidths = allColumns.map(col => (col.width / totalWidth) * 100);
    this.setState({ columnWidths: initialWidths });
  }

  handleResizeStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      isResizing: true,
      resizeColumnIndex: index,
      resizeStartX: e.clientX,
      resizeStartWidths: [...this.state.columnWidths]
    });
  };

  handleMouseMove = (e: MouseEvent) => {
    if (!this.state.isResizing || this.state.resizeColumnIndex === null) return;

    const deltaX = e.clientX - this.state.resizeStartX;
    const containerWidth = this.containerRef.current?.clientWidth || this.props.width || 800;
    const deltaPercent = (deltaX / containerWidth) * 100;

    const newWidths = [...this.state.resizeStartWidths];
    const leftIndex = this.state.resizeColumnIndex - 1;
    const rightIndex = this.state.resizeColumnIndex;

    const minWidth = 5;
    if (
      newWidths[leftIndex] + deltaPercent >= minWidth &&
      newWidths[rightIndex] - deltaPercent >= minWidth
    ) {
      newWidths[leftIndex] += deltaPercent;
      newWidths[rightIndex] -= deltaPercent;
      this.setState({ columnWidths: newWidths });
    }
  };

  handleMouseUp = () => {
    this.setState({
      isResizing: false,
      resizeColumnIndex: null
    });
  };

  handleDragStart = (item: KanbanItem, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', item.id);
    this.setState({ draggedItem: item });
    e.dataTransfer.effectAllowed = 'move';
  };

  handleDragOver = (columnId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.setState({ dragOverColumn: columnId });
  };

  handleDrop = (columnId: string, e: React.DragEvent) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    const item = this.getItems().find(n => n.id === itemId);

    if (item) {
      const targetColumn = this.getAdjustedColumns().find(col => col.id === columnId);
      if (targetColumn) {
        const targetStatus = targetColumn.targetStatus ||
          (columnId === 'backlog' ? 'todo' : columnId);

        // Call onItemUpdate if provided via props
        if ((this.props as any).onItemUpdate) {
          (this.props as any).onItemUpdate(item.id, { ...item, status: targetStatus });
        }

        if ((this.props as any).onItemClick) {
          (this.props as any).onItemClick(item);
        }
      }
    }

    this.setState({ dragOverColumn: null, draggedItem: null });
  };

  handleDragEnd = () => {
    this.setState({ dragOverColumn: null, draggedItem: null });
  };

  getItems() {
    const data = this.state.data;
    if (!data) return [];
    return data.items;
  }

  getAdjustedColumns() {
    const allColumns = [
      ...this.config.columns,
      {
        id: 'backlog',
        title: 'Backlog',
        statusFilter: (item: KanbanItem) => {
          for (const column of this.config.columns) {
            try {
              if (column.statusFilter(item)) {
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

    return allColumns.map((col, index) => ({
      ...col,
      width: this.state.columnWidths[index] || (col.width / 100) * 100
    }));
  }

  renderColumns() {
    const adjustedColumns = this.getAdjustedColumns();
    const items = this.getItems();

    return adjustedColumns.map((column, index) => {
      const columnItems = items.filter(item => {
        if (!item) return false;
        try {
          return column.statusFilter(item);
        } catch (error) {
          console.warn(`Error in statusFilter for column "${column.title}":`, error);
          return false;
        }
      });

      const isDragOver = this.state.dragOverColumn === column.id;

      return (
        <React.Fragment key={`column-${column.id}`}>
          {index > 0 && (
            <div
              style={{
                width: '5px',
                backgroundColor: this.state.isResizing && this.state.resizeColumnIndex === index ? '#007acc' : '#ddd',
                cursor: 'col-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 2
              }}
              onMouseDown={(e) => this.handleResizeStart(index, e)}
              title="Drag to resize"
            >
              <div style={{ width: '1px', height: '20px', backgroundColor: '#999' }} />
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
            onDragOver={(e) => this.handleDragOver(column.id, e)}
            onDrop={(e) => this.handleDrop(column.id, e)}
            onDragLeave={() => this.setState({ dragOverColumn: null })}
          >
            <div style={{
              padding: '10px',
              borderBottom: '1px solid #ddd',
              backgroundColor: '#e0e0e0',
              fontWeight: 'bold',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{column.title} ({columnItems.length})</span>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {column.width.toFixed(1)}%
              </span>
            </div>
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
              {columnItems.map(item => {
                const isDragging = this.state.draggedItem?.id === item.id;

                return (
                  <div
                    key={item.id}
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
                      this.setState({ selectedItem: item });
                      if ((this.props as any).onItemClick) {
                        (this.props as any).onItemClick(item);
                      }
                    }}
                    onMouseEnter={() => (this.props as any).onItemHover?.(item)}
                    onMouseLeave={() => (this.props as any).onItemHover?.(null)}
                    onDragStart={(e) => this.handleDragStart(item, e)}
                    onDragEnd={this.handleDragEnd}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {item.label}
                    </div>
                    {item.status && (
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                        Status: {item.status}
                      </div>
                    )}
                    {item.priority && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Priority: {item.priority}
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
  }

  componentDidMount() {
    super.componentDidMount();
    this.initializeColumnWidths();
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    super.componentDidUpdate(prevProps, prevState);
    if (prevProps.config !== this.props.config) {
      this.initializeColumnWidths();
    }
  }

  renderContent() {
    const { width = '100%', height = 600 } = this.props;

    return (
      <div
        ref={this.containerRef}
        style={{
          width: '100%',
          height,
          position: 'relative'
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          this.setState({ dragOverColumn: null });
        }}
      >
        <div style={{
          display: 'flex',
          height: '100%',
          overflow: 'hidden',
          userSelect: this.state.isResizing ? 'none' : 'auto'
        }}>
          {this.renderColumns()}
        </div>
        {this.state.isResizing && (
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
        {this.state.draggedItem && (
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
            Dragging: {this.state.draggedItem.label}
          </div>
        )}
      </div>
    );
  }
}

// Wrapper component for backward compatibility
export const KanbanView: React.FC<{ slicePath: string; width?: number; height?: number }> = ({
  slicePath,
  width = 800,
  height = 600
}) => {
  return (
    <KanbanBoard
      slicePath={slicePath}
      width={width}
      height={height}
    />
  );
};

// Default export for the view
export default KanbanView;
