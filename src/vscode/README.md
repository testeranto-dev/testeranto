# VSCode Extension

This VSCode extension provides real-time interaction with the Testeranto server.

## Architecture

The VSCode extension operates differently from views and agents:

1. **VSCode Providers**: Always use the server API endpoints (e.g., `/~/files`, `/~/process`, `/~/aider`, `/~/runtime`, `/~/agents`)
   - Load initial data via HTTP GET requests to API endpoints
   - Receive real-time updates via WebSocket subscriptions to API resource changes
   - Never read from static JSON files directly
   - Require the server to be running (port 3000)

2. **Views**: Use static JSON files for data + WebSocket notifications
   - Load data from pre-generated slice files (e.g., `/testeranto/slices/views/*.json`)
   - Receive WebSocket notifications when slice files are updated
   - Can operate in static mode without WebSocket

3. **Agents**: Use static JSON files for data only (no WebSocket)
   - Load data from agent slice files (e.g., `/testeranto/slices/agents/*.json`)
   - Do not receive WebSocket notifications
   - Operate independently of real-time updates

## Data Flow

1. VSCode providers fetch initial data from server API endpoints
2. Providers subscribe to WebSocket updates for relevant slices
3. When server data changes, it broadcasts WebSocket messages
4. Providers refresh their data by fetching from API again
5. No file I/O is performed by VSCode providers

## API Endpoints Used

- `/~/files` - File and folder structure
- `/~/process` - Docker processes
- `/~/aider` - Aider processes and agents  
- `/~/runtime` - Runtime configurations and tests
- `/~/agents` - Agent configurations
- `/~/chat` - Chat messages

## WebSocket Subscriptions

VSCode providers subscribe to slices via WebSocket for real-time updates:
- `/files` - File changes
- `/process` - Process status changes
- `/aider` - Aider process updates
- `/runtime` - Runtime configuration changes
- `/graph` - General graph updates

## Note

The VSCode extension requires the Testeranto server to be running. Use `testeranto dev` or `testeranto once` to start the server.

