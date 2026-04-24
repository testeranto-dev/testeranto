---
status: 90% done
---

The vscode extension should provide live feedback. We will start with processes. 

The processes provider should use the api to get processes from the api. It should also subscribe to updates, updating the status flavor of the treeitem to match the current status of that respective process. 

The server needs to keep the graph up to date. It should use the events stream to update the graph. We need to make sure that this is consistent- the graph should ONLY update via the events stream. For example, when creating a process, it's tempting to create the node at the same time. However, the proper approach to to launch the process, and then wait for the event stream to reflect the events, and use that event to actually update the graph.y