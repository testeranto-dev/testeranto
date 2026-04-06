Endpoints serve slices of the graph. Clients register for updates when they call an endpoint.

0) `/graph` - Dumps the entire graph. Legacy route, doesn't register for updates.

1) `/files` - Files and folders slice.

2) `/process` - Docker processes slice.

3) `/aider` - Aider processes slice.

4) `/runtime` - Runtimes slice.

5) `/agents/*` - Agent-specific slices. Dynamic routes based on config.

