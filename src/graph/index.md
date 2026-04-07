This folder contains the unified graph data store implementation used by the server, stakeholder app, and VS Code extension.

## Architecture

The graph system uses a single `graph-data.json` file as the baseline data source. In development mode, the server accepts mutations via POST `/~/graph` and broadcasts updates via WebSocket. The stakeholder app and VS Code extension both read from this unified graph.

## Current Implementation

### ✅ **Implemented:**
- Unified `GraphDataFile` format
- `GraphManager` handles operations
- WebSocket broadcasts
- VS Code integration
- Markdown synchronization

### **Data Flow:**
1. Load baseline from `graph-data.json`
2. Connect WebSocket
3. Send mutations via POST `/~/graph`
4. Server applies and saves
5. Broadcast `graphUpdated`
6. Clients update

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
