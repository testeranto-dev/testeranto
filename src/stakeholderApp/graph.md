graphs form the data structure built by the server and rendered by the stakeholderApp. We use the graphology library. 

The graph encodes relationships between entities. 

## nodes

features    - markdown files attached to suites/setup steps
suite       - a collection of tests associated with a list of features
test        - one of many in a suite.
test result - the outcome of a single test

## edges

feature-to-feature: 'dependsUpon', 'blocks'
feature-to-test-result: for a feature, see the results of the associated tests.
file: relate nodes to one another based on their place in the file system

## Synchronization Roadmap

### **Current Synchronization Status:**

#### ✅ **Implemented:**
1. **Simplified Architecture**: Client loads baseline from `graph-data.json`, server handles updates via POST
2. **GET `/~/graph` Removed**: Returns 410 Gone with instructions to use `graph-data.json`
3. **WebSocket Broadcasts**: Server sends `graphUpdated` events to all clients
4. **Client-Side Graph Client**: `StakeholderGraphClient` with WebSocket connection

#### ❌ **Critical Missing Components:**

1. **No Hashing Function** - Cannot verify state consistency
2. **No Queue System** - No retry logic or offline capability
3. **No Conflict Resolution** - Concurrent edits not handled
4. **No State Verification** - Optimistic updates without verification

### **Immediate Roadmap:**

#### **Phase 1: State Consistency (Next Priority)**
1. **Implement Common Hashing Function**: SHA-256 hash of sorted JSON
2. **Add Versioning to Graph Operations**: Include clientId, timestamps, and hash verification
3. **Server-Side Hash Verification**: Validate client state before applying mutations

#### **Phase 2: Robust Updates**
1. **Client-Side Queue**: Offline/retry scenarios with optimistic updates
2. **Server-Side Queue**: Ordered mutation processing
3. **Exponential Backoff**: For retry scenarios

#### **Phase 3: Conflict Resolution**
1. **Timestamp-Based Versioning**: Last-write-wins for simple conflicts
2. **Merge Strategies**: Attribute-level merging and manual intervention
3. **Collaborative Editing**: Real-time presence and change attribution

#### **Phase 4: Advanced Features**
1. **Offline Mode**: Local storage and sync on reconnection
2. **Collaborative Editing**: Locking and presence indicators

### **Current Architecture Flow:**

```
1. Client loads baseline from graph-data.json
2. Client connects to WebSocket
3. User action → Client mutation
4. Client sends POST /~/graph with mutation
5. Server applies mutation, saves to graph-data.json
6. Server broadcasts graphUpdated via WebSocket
7. All clients refresh from graph-data.json
```

### **Target Architecture Flow:**

```
1. Client loads baseline from graph-data.json + computes hash
2. Client connects to WebSocket
3. User action → Client creates versioned mutation with hash
4. Client adds mutation to queue, applies optimistically
5. Queue sends mutation to server with previousHash
6. Server verifies previousHash, applies mutation, computes newHash
7. Server returns confirmation with newHash
8. Server broadcasts incremental update to all clients
9. Clients verify hash and apply incremental update
```

### **Key Technical Debt:**

1. **No hash verification** - State consistency not guaranteed
2. **No retry logic** - Failed updates are lost
3. **No offline support** - Requires constant connection
4. **No conflict handling** - Concurrent edits cause data loss

**The current implementation works for basic use cases but lacks robustness for collaborative editing scenarios. The roadmap prioritizes state consistency first, then robust updates, then conflict resolution.**

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

### Implementation

The current implementation uses:
- `graph-data.json` for baseline data in all modes
- WebSocket for real-time updates in API mode
- POST `/~/graph` for sending mutations
- Server broadcasts `graphUpdated` events to all connected clients

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

This architecture ensures the stakeholder app works seamlessly in both development and production environments while maintaining optimal performance and user experience.
