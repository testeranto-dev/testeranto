this folder is dedicated to the overlap of the server, grafeovidajo, and the stakeholder via the graph-data store.

The stakeholder app is based on graph-theoretical data store using the graphology library. The stakeholder app can be served statically and read-only, in which case the graph data lives in a json file. In development mode, however, the Server allows read-write capabilities. While the stakeholder app needs to update and reflect this graph structure, the server must parse the data from the markdown files, serialize it, accepts update and write them back to the markdown files. 


# synchronization

## **Current Synchronization Status:**

### ✅ **Implemented:**
1. **Simplified Architecture**: Client loads baseline from `graph-data.json`, server handles updates via POST
2. **GET `/~/graph` Removed**: Returns 410 Gone with instructions to use `graph-data.json`
3. **WebSocket Broadcasts**: Server sends `graphUpdated` events to all clients
4. **Client-Side Graph Client**: `StakeholderGraphClient` with WebSocket connection

### ❌ **Critical Missing Components:**

#### 1. **No Hashing Function**
- Cannot verify state consistency between client and server
- No way to detect if mutations were applied identically

#### 2. **No Queue System**
- Client sends updates directly (no retry logic)
- No offline capability
- No optimistic updates with rollback

#### 3. **No Conflict Resolution**
- Concurrent edits not handled
- No versioning or timestamp-based ordering

#### 4. **No State Verification**
- Client applies updates optimistically without verification
- Server doesn't validate client's current state before applying mutations

## **Immediate Roadmap:**

### **Phase 1: State Consistency (Next Priority)**
1. **Implement Common Hashing Function**:
   ```typescript
   // In src/graph/index.ts
   export function hashGraphData(graphData: GraphData): string {
     const stringified = JSON.stringify(graphData, Object.keys(graphData).sort());
     return crypto.createHash('sha256').update(stringified).digest('hex');
   }
   ```

2. **Add Versioning to Graph Operations**:
   ```typescript
   interface VersionedGraphOperation extends GraphOperation {
     clientId: string;
     timestamp: string;
     previousHash: string;
     expectedHash: string;
   }
   ```

3. **Server-Side Hash Verification**:
   - Verify client's `previousHash` matches server's current state
   - Compute new hash after applying mutation
   - Return confirmation with actual hash

### **Phase 2: Robust Updates**
1. **Client-Side Queue**:
   - Queue mutations for offline/retry scenarios
   - Optimistic updates with rollback capability
   - Exponential backoff for retries

2. **Server-Side Queue**:
   - Process mutations in order
   - Handle concurrent updates with ordering
   - Broadcast confirmed updates to all clients

### **Phase 3: Conflict Resolution**
1. **Timestamp-Based Versioning**:
   - Each node/edge has version timestamp
   - Last-write-wins for simple conflicts
   - User intervention for complex merges

2. **Merge Strategies**:
   - Attribute-level merging for node updates
   - Edge-level conflict detection
   - Manual merge UI for stakeholders

### **Phase 4: Advanced Features**
1. **Offline Mode**:
   - Local storage of pending mutations
   - Sync when connection restored
   - Conflict resolution on reconnection

2. **Collaborative Editing**:
   - Real-time presence indicators
   - Locking for critical sections
   - Change notifications with user attribution

## **Current Architecture Flow:**

```
1. Client loads baseline from graph-data.json
2. Client connects to WebSocket
3. User action → Client mutation
4. Client sends POST /~/graph with mutation
5. Server applies mutation, saves to graph-data.json
6. Server broadcasts graphUpdated via WebSocket
7. All clients refresh from graph-data.json
```

## **Target Architecture Flow:**

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

## **Key Technical Debt:**

1. **No hash verification** - State consistency not guaranteed
2. **No retry logic** - Failed updates are lost
3. **No offline support** - Requires constant connection
4. **No conflict handling** - Concurrent edits cause data loss

**The current implementation works for basic use cases but lacks robustness for collaborative editing scenarios. The roadmap prioritizes state consistency first, then robust updates, then conflict resolution.**
