Refactor the following:

src/server/serverClasses/Server_Base.ts
src/server/serverClasses/Server_Docker_Base.ts
src/server/serverClasses/Server_Docker_Compose.ts
src/server/serverClasses/Server_Docker.ts
src/server/serverClasses/Server_GraphManager.ts
src/server/serverClasses/Server_GraphManagerCore.ts
src/server/serverClasses/Server_HTTP_Base.ts
src/server/serverClasses/Server_HTTP.ts
src/server/serverClasses/Server_TestManager.ts
src/server/serverClasses/Server_WS.ts
src/server/serverClasses/Server.ts


Our architecture of the server is a series of nested classes. The boiler plate is pushed down the stack, then fundamental technologies, then state-full logic. all classes should delegate out utility functions.

Problems
1) src/server/serverClasses/Server_TestManager.ts, src/server/serverClasses/ and Server_GraphManagerCore.ts, src/server/serverClasses/Server_GraphManager.ts are not properly integrated into the class stack
2) Many utility functions can be turns into utilities.

Updates
- src/server/serverClasses/Server_GraphManagerCore.ts has been factored out
- class inheritance has been corrected
- TODO classes are stateful business logic that should delegate to utility functions. 
- Continue to move code into utiltiies

TODO later
- refactor classes into more sensible domains