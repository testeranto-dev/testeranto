This folder contains the unified graph data store implementation used by the server, stakeholder app, and VS Code extension.

## Architecture

The graph system uses a single `graph-data.json` file as the baseline data source. In development mode, the server accepts mutations via POST `/~/graph` and broadcasts updates via WebSocket. The stakeholder app and VS Code extension both read from this unified graph.

## Current Implementation

### ✅ **Implemented Features:**
1. **Unified Graph Format**: All components use the same `GraphDataFile` structure
2. **Server-Side Graph Management**: `GraphManager` handles all graph operations
3. **WebSocket Broadcasts**: Real-time updates to connected clients
4. **VS Code Integration**: Tree providers use graph data where available
5. **Markdown Synchronization**: Graph nodes can be serialized to/from markdown files

### **Data Flow:**
```
1. All clients load baseline from graph-data.json
2. Clients connect to WebSocket for real-time updates
3. User actions create graph mutations
4. Mutations sent to server via POST /~/graph
5. Server applies mutations and saves to graph-data.json
6. Server broadcasts graphUpdated to all clients
7. Clients update their views accordingly
```

## File Structure

- `index.ts` - Core graph types and interfaces
- `createGraph.ts` - Graphology graph creation
- `graphToData.ts` / `dataToGraph.ts` - Serialization helpers
- `createGraphDataFile.ts` - GraphDataFile structure creation
- `isGraphData.ts` / `isGraphDataFile.ts` - Type guards
- `mergeGraphData.ts` - Graph data merging utilities

## Usage

The graph system is designed to work in both static mode (read-only from JSON file) and development mode (read-write with server). All components should use the `GraphDataFile` format for consistency.
````
