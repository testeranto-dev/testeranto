## Status: IMPLEMENTED ✅

Endpoints serve slices of the graph. Clients can register for WebSocket updates when they subscribe to a slice.

### Implemented Endpoints:

1. **`GET /~/files`** - Files and folders slice
   - Returns only file and folder nodes from the graph
   - WebSocket: Subscribe to `files` for updates

2. **`GET /~/process`** - Docker processes slice
   - Returns docker process nodes (bdd_process, check_process, aider_process, builder_process)
   - WebSocket: Subscribe to `process` for updates

3. **`GET /~/aider`** - Aider processes slice
   - Returns aider-related nodes (aider, aider_process)
   - WebSocket: Subscribe to `aider` for updates

4. **`GET /~/runtime`** - Runtimes slice
   - Returns runtime-related nodes (config, entrypoint with runtime metadata)
   - WebSocket: Subscribe to `runtime` for updates

5. **Dynamic Agent Endpoints** - `GET /~/agents/{agentName}`
   - Returns agent-specific slices based on config
   - Supports three agents: `prodirek`, `arko`, `juna`
   - WebSocket: Subscribe to `agents/{agentName}` for updates

6. **`POST /~/agents/{agentName}`** - Agent management endpoint
   - Agents are now created as Docker services at server startup
   - This endpoint acknowledges that agents are already running
   - Returns information about the agent's Docker service

### WebSocket Subscription:
Clients can subscribe to slice updates using WebSocket messages:
```javascript
// Subscribe to a slice
ws.send(JSON.stringify({
  type: 'subscribeToSlice',
  slicePath: '/files'  // or '/process', '/aider', '/runtime', '/agents/prodirek', etc.
}));

// Unsubscribe from a slice
ws.send(JSON.stringify({
  type: 'unsubscribeFromSlice',
  slicePath: '/files'
}));
```

### Legacy Endpoint:
- **`/graph`** - Legacy route for dumping entire graph (deprecated in favor of slice-based approach)

### Implementation Details:
- All endpoints return data in consistent format: `{ nodes: [], edges: [] }`
- Server broadcasts updates via WebSocket when graph changes
- VS Code extension uses these endpoints for tree views
- Stakeholder app uses `graph-data.json` for static operation

The slice-based architecture allows efficient updates and reduces data transfer for clients that only need specific parts of the graph.

