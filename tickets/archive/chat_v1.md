---
status: defunct
apiBreaking: true
---

Our chat system is in various states of broken-ness. We need a unified now approach. This will also help unify the chat, agents, views and data-slices.

# Old architecture 
a mix of api calls and std parsing.

# How chat should work 
1) agents now longer chat endpoint.
2) The server should parse the input, looking aider blocks.
3) When I block completes, a chat message is added to the graph
4) Each agent reads from a json files of that slice data.
5) Agent can see the output of other agents through this graph as message nodes.
6) Each agents data slice includes the other agents messages
