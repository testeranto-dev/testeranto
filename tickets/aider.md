---
status: doing
title: aider
description: ''
priority: medium
---

For every test, there can be a docker service running aider. We need to be sure that we do not create more than 1 aider service per test. The user will launch through the vscode extension which opens a terminal to the aider docker image for that test.

goals by priority
[x] we just run aider processes run-off, non interactively
[ ] the aider process runs interactively. 
[ ] the aider process runs interactively and the server manages it's context.

we should include a dedicated vscode window.

future work
server queues aider calls such no two aider services with overlapping context files run at the same time.

Next steps:
add a dedicated section in vscode extension. It should list all the aider processes, and clicking  each should open and/or navigate the user to the terminal tab for that process. In this terminal tab, the user can interact with the aider process running in docker