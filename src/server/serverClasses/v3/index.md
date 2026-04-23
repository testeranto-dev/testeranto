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
11 Server extends Server_Runtime             // Business logic in start()
12 Server_FS extends Server
13 Server_CommandLine extends Server_FS
14 Server_STDIO extends Server_CommandLine
15 Server_HTTP extends Server_STDIO
16 Server_WS_HTTP extends Server_Api
17 Server_Api extends Server_WS_HTTP
18 Server_DockerCompose extends Server_Testeranto
19 Server_Testeranto   

Level 10 aka Server.ts is neither the base, nor the top of the stack. The top is Server_Api and Server_Base is the bottom. Server.ts marks the "middle" and it is here business logic lives in the start method. Server.ts is built upon a series of business concerns, and on top of the Server.ts is a series of technological concerns. 