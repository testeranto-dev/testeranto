---
status: in progress
---

agents need to be able to collaborate. we need to create the endpoints to handle this. We probably don't need to over-complicate this, unless there is a good reason make this a single new endpoint.

`localhost:3000/~/chat?agent=...&message=...`

this should be broadcast back to all agents 
`${AGENT} said: 'something to say'`

## Implementation Details:
- Endpoint: `GET /~/chat?agent=...&message=...`
- Validates agent and message parameters
- Broadcasts to all WebSocket clients with type 'chat'
- Returns JSON response with success/error status
- Implemented in `Server_HTTP_Routes.ts` (lines 130-165)

## Vscode

We need to add a provider/section for the chat thread between the user and agents. This will be a standard chat thread with multiple participants.

# Chat System

## Problem
Agents need to send/receive chat messages but aren't HTTP servers.

## Solution
1. **Single file**: `testeranto/agents/chat_slice.json`
2. **All agents watch** this file
3. **Post messages** via `/~/chat?agent=NAME&message=TEXT`
4. **Server writes** all messages to the file
5. **Agents see** file change, read full history
6. **Agents respond** by posting to `/~/chat`

## Flow
User/Agent → POST /~/chat → Graph node → Write file → All agents watch → All agents are informed -> Read → Respond

## Files
- `chat_slice.json`: All messages
- Chat nodes in graph: `type: 'chat_message'`

Note: we need 
1) a url for getting messages out of the agent
2) a history file for getting messages into the agent
3) A way for the server to alert the agent that the message file has been updated. it will need to hijack the input.