---
status: doing
apiBreaking: true
---

our previous attempts to make a chat system are now (mostly) deprecated. 

Our new strategy: 
the server reads the output from the aider processes and streams that to the chat UI. It breaks each message up by line of '─' chars which denote blocks in aider. The server will need to actively filter the output of each aider process to form these blocks. Make this generic because we'll need to add user interactivity too. Aider sometimes asks for user input so ( for instance, if the llm runs out of context, it needs a way to be reset, approve of urls, etc) Once a message is received, it needs to be sent to the other agents via the stdin. As the LLM send output, the server should transmit the live changes to the chat app (not the other agents)

We no longer need the POST endpoint for chat. We no longer need to store chat in the graph. The server is responsible for capturing these logs and transmitting them to the other agents and the chat app. 