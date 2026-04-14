---
status: maybe working?
----

we need a nice way to separate our code from external packages like 'fs'. We will need to mock the filesystem for tests, so we will have 2 sets of deps- 1 for real life, another for tests. They have the same type.

/add 
src/server/deps.ts
src/server/depsMocked.ts
src/server/depsTypes.ts
src/server/serverClasses/README.md
src/server/serverClasses/Server_Base.ts
src/server/serverClasses/Server_Docker_Compose.ts
src/server/serverClasses/Server_Docker_Test.ts
src/server/serverClasses/Server_Docker.ts
src/server/serverClasses/Server_Graph.ts
src/server/serverClasses/Server_GraphManagerCoreBase.ts
src/server/serverClasses/Server_HTTP_Graph.ts
src/server/serverClasses/Server_HTTP.ts
src/server/serverClasses/Server_Test_WS.ts
src/server/serverClasses/Server_WS_HTTP.ts
src/server/serverClasses/Server.ts
src/server/runtimes/node/docker.ts
src/server/runtimes/node/esbuild.ts
src/server/runtimes/node/esbuildLoggingPlugin.ts
src/server/runtimes/node/node.ts
src/server/runtimes/node/README.md
src/server/runtimes/common.ts
src/server/runtimes/README.md
src/server/runtimes/web/README.md
src/server/runtimes/web/esbuild.ts
src/server/runtimes/web/docker.ts
src/server/runtimes/web/web.ts

the dangerous imports are:

 1 fs - filesystem operations
 2 child_process - spawning processes
 3 http/https - network access
 4 process - global process object (for process.cwd(), process.exit())

we will need to pass the mocks apparatus through testeranto/runtimes/node/node.mjs.