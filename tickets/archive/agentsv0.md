---
status: defunct
---

Three agents are fully implemented and operational:

### Agents:

1. **prodirek** - Product Manager
   - Focus: Features and documentation
   - Slice: `feature` and `documentation` nodes
   - Markdown file: `prodirek.md`

2. **arko** - Architect
   - Focus: Architectural decisions and configurations
   - Slice: `config` and `entrypoint` nodes
   - Markdown file: `arko.md`

3. **juna** - Junior Engineer
   - Focus: Implementations and source code
   - Slice: `test` and `file` nodes
   - Markdown file: `juna.md`

### Configuration:
Each agent is configured in `ITesterantoConfig` with:
- `markdownFile`: Documentation file for the agent
- `sliceFunction`: Function that extracts the agent's specific slice from the graph

Example configuration:
```typescript
agents: {
  'prodirek': {
    markdownFile: 'prodirek.md',
    sliceFunction: (graphManager) => {
      // Returns feature and documentation nodes
    }
  },
  // ... other agents
}
```

### Dynamic Routes:
- `GET /~/agents/{agentName}` - Returns the agent's slice data
- `POST /~/agents/{agentName}` - Creates a new agent instance with unique suffix

### VS Code Integration:
- Agent tree provider shows all running agent instances
- Users can launch new agents via command palette or tree view
- Each agent instance can be opened in a webview

### WebSocket Updates:
- VS Code providers subscribe to agent slice updates
- When the graph changes, subscribed clients receive updates
- Agents maintain their own state and can be managed independently

### Usage:
1. Launch agents via VS Code command `testeranto.launchAgentSelection`
2. View running agents in the "Agents" tree view
3. Open agent webviews to interact with them
4. Agents process their specific slice of the graph and provide specialized functionality

The agent system provides a flexible way to extend Testeranto with specialized roles, each focusing on different aspects of the development workflow.
