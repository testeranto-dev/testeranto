---
status: doing
---

For every test, there can be a docker service running aider. We need to be sure that we do not create more than 1 aider service per test. The user will launch through the vscode extension which opens a terminal to the aider docker image for that test.

goals by priority
- we just run aider processes run-off, non interactively
- the aider process runs interactively. 
- the aider process runs interactively and the server manages it's context.
- server queues aider calls such no two aider services with overlapping context files run at the same time.