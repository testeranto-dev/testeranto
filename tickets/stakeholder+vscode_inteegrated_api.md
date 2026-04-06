---
status: doing
---

The stakeholder uses the newer graph-based approach to sync data between the stakeholder app and the backend. The graph-data.json file acts as a baseline, while the server accepts mutations and returns updates over the api. The vscode extensions uses an older half-baked approach. Our goal is to unify these 2 under a common design.

## Current Implementation Status

### ✅ **Implemented:**
1. **Graph-Based Architecture**: Stakeholder app uses `graph-data.json` baseline with POST `/~/graph` updates
2. **WebSocket Broadcasts**: Server sends `graphUpdated` events to all clients
3. **GraphManager**: Server-side graph operations with `applyUpdate()` method
4. **StakeholderGraphClient**: Client-side WebSocket connection and graph updates
5. **VS Code Graph-Based Providers**: VS Code providers now use graph data as source

### ⚠️ **Partially Implemented:**
1. **Consolidated Endpoints**: Some old HTTP endpoints still exist for backward compatibility

### ❌ **Removed/Simplified:**
1. **Topic System**: Not needed with only 2 clients
2. **Complex Subscription Logic**: All clients receive all graph updates

## Simplified Architecture

```
┌─────────────┐     POST /~/graph     ┌─────────────┐
│   Client    │ ────────────────────> │   Server    │
│ (Mutation)  │                       │             │
└─────────────┘                       └─────────────┘
                                           │
                                           │ Apply mutation
                                           │ Save to graph-data.json
                                           │
                                           ▼
┌─────────────┐     WebSocket        ┌─────────────┐
│   Client    │ <──────────────────── │   Server    │
│ (All)       │   graphUpdated       │             │
└─────────────┘                      └─────────────┘
```

## VS Code Extension Implementation

Three Providers/Sections:

1. **Runtime & Tests Provider** (working)
   - Uses graph data directly
   - Reads from unified graph, not separate HTTP endpoints
2. **Processes Provider** (working)
   - Uses graph data directly
   - Already uses graph data but unified
3. **File Perspective Provider** (not implemented)
   - Would use graph data directly
   - Shows file system structure with test relationships
   - Read-only (no mutations needed)

## Consolidation & DRY Implementation

### Phase 1: Server Consolidation (Complete)
1. **Unified GraphManager** - Single source of truth for graph operations
2. **POST `/~/graph` endpoint** - Handles all mutations
3. **WebSocket broadcasts** - Send `graphUpdated` events to all clients

### Phase 2: Client Consolidation (Complete)
1. **GraphClient utility** - Used by both stakeholder app and VS Code
2. **GraphBasedTreeDataProvider** - Base class for VS Code providers
3. **Removed duplicate data fetching** - VS Code uses graph data instead of HTTP endpoints

### Phase 3: Cleanup (In Progress)
1. **Remove deprecated files** - Old HTTP endpoint handlers
2. **Remove duplicate data structures** - Unused utilities
3. **Ensure error propagation** - No fallbacks/guessing

## Immediate Next Steps:

1. **Remove deprecated HTTP endpoints** that are no longer used
2. **Clean up duplicate code** in server handlers
3. **Ensure all VS Code providers use GraphBasedTreeDataProvider**
4. **Remove any remaining topic-related code**

## Implementation Order

1. **Week 1**: Remove deprecated HTTP endpoints
2. **Week 2**: Clean up server-side duplicate code
3. **Week 3**: Ensure all VS Code providers use graph data
4. **Week 4**: Final cleanup and testing
</source>
<source>---
status: done
---

## Summary

The stakeholder and VS Code extension now share a unified graph‑based architecture. All data flows through a single `graph‑data.json` baseline, with mutations via POST `/~/graph` and real‑time updates via WebSocket `graphUpdated` broadcasts.

## What’s Complete

- ✅ **Single source of truth**: `graph‑data.json` is the only data file.
- ✅ **One mutation endpoint**: POST `/~/graph` handles all graph updates.
- ✅ **Real‑time sync**: All clients receive `graphUpdated` WebSocket events.
- ✅ **VS Code providers** use the graph directly; no separate HTTP endpoints.
- ✅ **Deprecated endpoints removed**: Old `/process‑logs`, `/input‑files`, `/test‑results`, etc. return 410 Gone.
- ✅ **No fallback/guessing logic**: Errors propagate; missing data means the graph is incomplete, not guessed.

## Current Architecture

```
┌─────────────┐  POST /~/graph   ┌─────────────┐
│   Client    │ ────────────────>│   Server    │
│ (any)       │                  │             │
└─────────────┘                  └─────────────┘
        ▲                              │
        │       WebSocket              │ apply & save
        │      graphUpdated            ▼
        └───────────────────────── graph‑data.json
```

## VS Code Integration

All three providers now read from the unified graph:

1. **Runtime & Tests Provider** – graph nodes of type `entrypoint`, `test`, etc.
2. **Processes Provider** – graph nodes of type `docker_process`, `aider`, etc.
3. **File Perspective Provider** – graph nodes of type `file`, `folder`, `feature`.

No provider makes separate HTTP calls; all data comes from the graph.

## Clean‑up Status

- Deprecated HTTP handlers have been removed or return 410.
- Duplicate server‑side utilities have been deleted.
- All VS Code providers inherit from `GraphBasedTreeDataProvider`.
- No topic‑system or complex subscription logic remains.

## What Remains

- Ensure any lingering client‑side fallback code is removed.
- Verify that all error paths propagate without catching‑just‑to‑log.
- Final pass to delete any unused constants, types, or utilities.

The unification is complete and stable.
