# Views System

This directory implements the unified view system described in `index.md`.

## Overview

Each view is a React component associated with a slice of graph data. The system supports both static mode (read-only from JSON files) and dynamic mode (read-write with server updates).

## Core Components

### `View`
The main component that:
- Loads data from a JSON file
- Renders a provided React component
- Handles updates (in dynamic mode)
- Manages loading and error states

### `ViewManager`
Manages multiple views with:
- View switching
- Context for view state
- Consistent configuration

### `compileView`
Utility to compile views to static HTML files at build time.

### `viewRuntime`
JavaScript runtime for dynamic updates in compiled HTML.

## Usage

### Basic View
```tsx
import { View } from './View';

function MyComponent({ data, onUpdate }) {
  // Render data and optionally call onUpdate
}

function MyView() {
  return (
    <View
      dataPath="/data/my-view.json"
      component={MyComponent}
      staticMode={false}
      onSendUpdate={async (path, data) => {
        // Send update to server
      }}
    />
  );
}
```

### View Manager
```tsx
import { ViewManager } from './ViewManager';
import { KanbanBoard, GanttChart } from './defaultViews';

const views = [
  {
    id: 'kanban',
    name: 'Kanban Board',
    dataPath: '/data/kanban.json',
    component: KanbanBoard,
  },
  {
    id: 'gantt',
    name: 'Gantt Chart',
    dataPath: '/data/gantt.json',
    component: GanttChart,
  },
];

function App() {
  return (
    <ViewManager
      views={views}
      staticMode={false}
      onSendUpdate={async (path, data) => {
        // Handle updates
      }}
    >
      {/* Optional: Add view selector UI here */}
    </ViewManager>
  );
}
```

## Data Flow

1. **Static Mode**:
   - Data is loaded from JSON files
   - No updates are sent to the server
   - Suitable for compiled HTML output

2. **Dynamic Mode**:
   - Data is loaded from JSON files
   - Updates can be sent to the server via `onSendUpdate`
   - WebSocket or polling for real-time updates
   - Server saves updates and broadcasts to clients

## Compilation

To compile a view to static HTML:
```typescript
import { compileView } from './compileView';
import { KanbanBoard } from './defaultViews/KanbanBoard';

await compileView({
  component: KanbanBoard,
  dataPath: '/data/kanban.json',
  outputPath: './dist/kanban.html',
  includeRuntime: false, // Set to true for dynamic updates
});
```

## Integration with Server

The server should:
1. Serve JSON data files at the specified paths
2. Accept updates at API endpoints
3. Broadcast changes via WebSocket
4. Save updated data to JSON files

## Default Views

The system includes several default views:
- `KanbanBoard` - Kanban board visualization
- `GanttChart` - Gantt chart visualization
- `EisenhowerMatrix` - Eisenhower matrix
- `BaseChart` - Base chart component for custom visualizations

## Next Steps

1. Implement server-side API for handling updates
2. Add WebSocket support for real-time updates
3. Create build script to compile all views
4. Integrate with existing graph data system
5. Remove deprecated stakeholderApp folder
