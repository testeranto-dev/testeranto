## Status: PLANNING ⚠️

we need to be able to switch branches. this means that we should add some endpoints.

`~/down` - brings down all services and builders as if shutdown was initiated, but does not stop the server. This does NOT bring down the user-defined agents, but it does reset them.

`~/up` - brings the sevices and builders back up

`~/switch-branch?aBranch-bBranch` - issue command to switch branches

Thus the user defined agents can shutdown, switch branches, and restart without shutting down the server itself. Realistically, the Sipestro agent is the only one who will do this.

### **Implementation Status:**
- **NOT YET IMPLEMENTED** - Endpoints need to be added to `Server_HTTP_Routes.ts`
- **Depends on**: Resource locking system (`tickets/resourceLocking.md`)

### **Strengths:**
1. **Clear separation of concerns** - The endpoints are well-defined:
   - `~/down` - Stops services/builders and agents
   - `~/up` - Restarts services/builders
   - `~/switch-branch` - Performs the actual branch switch


3. **Practical use case** - The Sipestro agent scenario makes sense for automated branch management.

### **Issues/Concerns:**

1. **Missing Implementation Details:**
   - No specification of how to handle Docker container state during branch switches
   - No mention of file system synchronization (mounts, volumes)
   - No error handling strategy for failed branch switches

2. **Potential Race Conditions:**
   - What happens if `~/switch-branch` is called while services are still shutting down?
   - How do we ensure all services are properly stopped before switching?

3. **Security Considerations:**
   - Branch switching could have security implications (different code, dependencies)
   - No authentication/authorization specified for these endpoints

4. **Integration with Current Architecture:**
   - The current system uses Docker Compose for service management
   - Need to consider how branch switching interacts with the graph data and test results

### **Recommendations:**

1. **Add Sequence Control:**
   - The endpoints should enforce a sequence: `down` → `switch-branch` → `up`
   - Add a `status` endpoint to check if it's safe to switch

2. **Specify Branch Switching Mechanism:**
   - Should it use `git checkout` in the workspace?
   - How to handle uncommitted changes?
   - Should there be a `force` parameter?

3. **Handle Graph Data:**
   - The graph data in `graph-data.json` will become stale after branch switch
   - Need to regenerate or invalidate graph data

4. **Agent Communication:**
   - Agents should be notified about the branch switch
   - They might need to reload their configuration/slices

### **Implementation Questions:**

1. Should `~/down` wait for all services to fully stop before returning? 
  YES
2. Should `~/switch-branch` validate that the target branch exists? 
   partially correct. we will need to expose git commands so that the server, the agents (and/or/both) the means of coordinating git procedures. We will need the means of staging and committting work, switching branches, and merging branches
3. How to handle Docker volume data that might be branch-specific?
   IDK??
4. What happens to running tests during the switch?
  The resource locking mechanism prevent them from starting when server is in restart mode,. 

  ## Analysis of Git Operations Needed

From `tickets/switchBranches.md` and `testeranto/agents/sipestro.md`:
1. **Switch branches** - Primary function
2. **Stage and commit work** - For preparing changes
3. **Merge branches** - For integrating work
4. **Address merge conflicts** - For handling conflicts
5. **Coordinate git procedures** - Between agents

## Safety Concerns

Allowing arbitrary git commands is dangerous because:
1. **Destructive operations** - `git reset --hard`, `git clean -fd`, `git push --force`
2. **Security risks** - Could expose sensitive information or modify protected branches
3. **System stability** - Could break the workspace or cause data loss

## Recommended Approach

Create a **controlled, limited API** for git operations. Instead of exposing raw git commands, provide specific endpoints for the operations Sipestro needs:

### Proposed Git API Endpoints:

1. **`GET /~/git/status`** - Get current branch and status
2. **`POST /~/git/switch-branch`** - Switch to a specified branch
3. **`POST /~/git/commit`** - Stage and commit changes with message
4. **`POST /~/git/merge`** - Merge specified branch into current
5. **`GET /~/git/conflicts`** - Check for merge conflicts
6. **`POST /~/git/resolve-conflict`** - Mark a conflict as resolved

### Implementation Strategy:

1. **Add git endpoints to `Server_HTTP_Routes.ts`** under `/~/git/` prefix
2. **Validate all inputs** - Sanitize branch names, commit messages
3. **Implement safe defaults** - No force operations, no destructive commands
4. **Add pre-flight checks** - Ensure workspace is in a safe state
5. **Integrate with resource locking** - Use the planned resource locking system

### Example Endpoint Structure:

```typescript
// In Server_HTTP_Routes.ts
if (routeName.startsWith('git/')) {
  const gitCommand = routeName.slice(4); // Remove 'git/'

  if (gitCommand === 'status' && request.method === 'GET') {
    // Return git status
  } else if (gitCommand === 'switch-branch' && request.method === 'POST') {
    // Validate branch exists, check for uncommitted changes, switch
  }
  // ... other git commands
}
```

## Why This Approach is Better:

1. **Controlled access** - Only allowed operations are exposed
2. **Input validation** - Can sanitize all inputs before execution
3. **Error handling** - Can provide meaningful error messages
4. **Integration** - Can coordinate with resource locking system
5. **Auditability** - Each operation is logged and traceable

## Next Steps:

1. **Add the git endpoints** to `Server_HTTP_Routes.ts`
2. **Implement basic git operations** using child processes with proper error handling
3. **Integrate with resource locking** (once implemented)
4. **Add validation** for all inputs
5. **Test with Sipestro agent** to ensure it can perform required operations