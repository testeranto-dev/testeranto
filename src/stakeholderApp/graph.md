graphs form the data structure built by the server and rendered by the stakeholderApp. We use the graphology library. 

The graph encodes relationships between entities. 

## nodes

features    - markdown files attached to suites
suite       - a collection of tests associated with a list of features
test        - one of many in a collection.
test result - the outcome of a single test

## edges

feature-to-feature: 'dependsUpon', 'blocks'
feature-to-test-result: for a feature, see the results of the associated tests.
file: relate nodes to one another based on their place in the file system

## Data Transport Architecture

### Dual-Mode System

The stakeholder app supports two modes of operation:

1. **Static Mode** (GitHub Pages)
   - Single HTML + JSON file deployment
   - Graph data stored in separate JSON file
   - Read-only, no server required
   - Perfect for GitHub Pages

2. **API Mode** (Local Development)
   - Real-time data updates
   - Graph data served via API endpoints
   - Interactive development experience
   - Supports saving/updating data

### Implementation Plan

#### 1. Data Transport Layer

```typescript
// Core data transport interface
interface DataTransport {
  mode: 'static' | 'api';
  loadGraphData(): Promise<GraphData>;
  saveGraphData(data: GraphData): Promise<void>;
}

// Static mode implementation
class StaticDataTransport implements DataTransport {
  async loadGraphData(): Promise<GraphData> {
    // Load from static JSON file
    const response = await fetch('/graph-data.json');
    return response.json();
  }
  
  async saveGraphData(data: GraphData): Promise<void> {
    // In static mode, save triggers file download
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph-data.json';
    a.click();
  }
}

// API mode implementation  
class ApiDataTransport implements DataTransport {
  async loadGraphData(): Promise<GraphData> {
    // Load from server API
    const response = await fetch('/api/graph-data');
    return response.json();
  }
  
  async saveGraphData(data: GraphData): Promise<void> {
    // Save via server API
    await fetch('/api/graph-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
}
```

#### 2. Server-Side Changes

```typescript
// New API endpoints
GET /api/graph-data     - Returns current graph data
POST /api/graph-data    - Updates graph data
GET /api/graph-data/export - Exports as static JSON file

// Static file generation
function generateStaticSite(graphData: GraphData): void {
  // 1. Generate index.html with minimal embedded data
  // 2. Generate graph-data.json with full graph data
  // 3. Copy bundled stakeholder app
}
```

#### 3. Frontend Integration

```typescript
// Determine mode based on environment
const mode = window.location.hostname.includes('github.io') 
  ? 'static' 
  : 'api';

// Initialize appropriate transport
const transport = mode === 'static' 
  ? new StaticDataTransport() 
  : new ApiDataTransport();

// Load data
const graphData = await transport.loadGraphData();

// Save data (if in API mode)
if (mode === 'api') {
  await transport.saveGraphData(updatedGraphData);
}
```

### Graph Data Structure

#### Static Mode Format
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0",
  "data": {
    "featureGraph": {
      "nodes": [...],
      "edges": [...]
    },
    "fileTreeGraph": {
      "nodes": [...],
      "edges": [...]
    },
    "vizConfig": {...}
  }
}
```

#### API Mode Format
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "featureGraph": {...},
    "fileTreeGraph": {...},
    "vizConfig": {...}
  }
}
```

### Migration Strategy

#### Phase 1: Core Infrastructure
1. Create data transport interfaces
2. Add API endpoints to server
3. Update HTML generation to support dual mode

#### Phase 2: Frontend Integration
1. Update stakeholder app to use data transport
2. Attempt to call server, if that fails fallback to json file in read-only mode

### File Structure

```
testeranto/
├── reports/                    # Development reports
│   ├── index.html             # Main HTML (minimal embedded data)
│   ├── index.js               # Bundled stakeholder app
│   └── graph-data.json        # Graph data (static mode)
└── src/
    └── server/
        └── serverClasses/
            └── utils/
                ├── dataTransport.ts
```

### Configuration

```typescript
// Configuration options
interface TesterantoConfig {
  dataTransport: {
    mode: 'auto' | 'static' | 'api';
    staticPath?: string;
    apiEndpoint?: string;
  };
  visualization: {
    defaultView: 'tree' | 'eisenhower' | 'gantt' | 'kanban';
    enableInteractivity: boolean;
  };
}
```

This architecture ensures the stakeholder app works seamlessly in both development and production environments while maintaining optimal performance and user experience.
