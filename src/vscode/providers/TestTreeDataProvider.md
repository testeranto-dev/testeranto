# TestTreeDataProvider

This section of the vscode extension should render a specific slice of the graph. Like all of the providers, it is populated by GETting an api endpoint and is notified of changes via websocket. The API endpoint is responsible for re-shaping the graph data into a tree shape, such that provider is a thin client.

The provider breaks the graph down in roughly the same logic of a config file. 

1) breakup by runtimes- node, web, python, etc
2) Break each runtime into it's tests.