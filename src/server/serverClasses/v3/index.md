This folder contains the Server V3 work. The Server Class Stack (SCS) is the "spine" of the server. Unlike most of inheritance based architectures, the SCS promotes deep inheritance and avoids composition via single stack of inherited classes.

1 Server_Base
2 Server_Graph extends Server_Base
3 Server_VSCode extends Server_Graph
4 Server_Aider extends Server_VSCode
5 Server_Logs extends Server_Aider
6 Server_Lock extends Server_Logs
7 Server_ApiSpec extends Server_Lock
8 Server_Static extends Server_ApiSpec
9 Server_Polyglot extends Server_Static
10 Server_Runtime extends Server_Polyglot
11 Server_Docker extends Server_Runtime          // NEW - Docker business logic
12 Server_HTTP_Routing extends Server_Docker     // NEW - HTTP routing business logic
13 Server_WS extends Server_HTTP_Routing         // NEW - WebSocket business logic
14 Server_Api_Routing extends Server_WS          // NEW - API routing business logic
15 Server_Files extends Server_Api_Routing
16 Server extends Server_Files                   // Business logic in start()
17 Server_FS extends Server
18 Server_CommandLine extends Server_FS
19 Server_STDIO extends Server_CommandLine
20 Server_HTTP extends Server_STDIO
21 Server_WS_HTTP extends Server_HTTP
22 Server_Api extends Server_WS_HTTP
23 Server_DockerCompose extends Server_Api
24 Server_Testeranto extends Server_DockerCompose

Level 16 aka Server.ts is neither the base, nor the top of the stack. The top is Server_Testeranto and Server_Base is the bottom. Server.ts marks the "middle" and it is here business logic lives in the start method. Server.ts is built upon a series of business concerns, and on top of the Server.ts is a series of technological concerns. 

# Business vs technological classes

This are somewhat misnamed. "Business" refers the "business logic". It is testable code. "Technological" might better be named as "Mockable". These classes are the classes which will need to be mocked in testing. 
