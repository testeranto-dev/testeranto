---
status: doing
---

We need to further harden the unification of 
1) the default views
2) the vscode provider
3) agents
4) the api
5) the graph

# views, providers and agents

These 3 concepts have a lot of common. They are all backed by a slice of graph data. For views, this slice is fetched by the parent view and passed to the react component as props. For each vscode provider, this slice is used to inform the ui. For agents, this slice data is their view into the graph. In all 3 cases, the data is not served over the api, but rather sourced from a from a file which the server writes to. The server will inform the view and the provider with an update that the file has changed (not necessary or possible to do for an agent) so that the UI can reload the file. 

# API

Our api is defined in one place. ATM there are many outdated hardcoded routes. Though we no longer need to support http routes, they can remain for now. More importantly, this api should be used to define how files are written. For all intents and purposes, treat the fs protocols similar to http and ws. Just as the websocket api is used to inform subscribes that a slice file has changed, we should be writing that slice file. More important than GETting over the API is POSTing. By posting data to endpoints, views, agents, and providers can make changes (like sending a chat message, updating the status of a ticket or launching a process)

# The graph

This forms the source of truth the server. It is exposed by being written to json files in slices. We don't server the graph over the API.

# Slice data
each agent, view and provider is supplied a custom slice of data. For views and for agents, this is configured in testeranto.ts. 

# server/vscode

Much of this can be deprecated. it existed before the unified graph. We should remove most of this, but maybe not all

# views

Each view is backed by a slice of data. They will be informed by the websocket notification system.

# providers

Each view is backed by a slice of data. They will be informed by the websocket notification system.

# agents

Each agent is backed by a slice of data. They will NOT be informed by the websocket notification system.src/server/vscode/buildUnifiedTestTree.ts



agents are backed by files, but do not get updates (not needed)
providers are backed by the api.  they don't need files and use the API entirely. They access a special set of routes that aren't the concern of views. They also get notifications by WS.
views are backed by files, and they get update notifications by ws