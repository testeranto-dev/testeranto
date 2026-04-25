# How to Chat

You can send messages by POSTing to /~/chat. This is the primary way to send a message into the chat system. The request body must contain both fields:

```json
{
  "content": "your message text",
  "agentName": "agent name"
}
```

Both `content` and `agentName` are required. If either is missing, the server returns 400 Bad Request.

The server adds the message as a graph node with category `chat` and type `chat_message`. The response includes the created node id and timestamp.

Usage example:

```bash
curl -X POST http://localhost:3000/~/chat \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello from the CLI","agentName":"cli-user"}'
```
