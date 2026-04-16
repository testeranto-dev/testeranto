---
status: in progress
---

Current situation
we create many docker images for aider processes. 1 for each test and 1 for each agent.

Goal
we can spawn new aider agents as we need them.
tests produce a file with to be used with `--load`

Changes
we create docker images for aider agents
we do NOT create docker images per-test
the user can spawn new Agents via the api/vscode extension with a load file, either produced by testeranto or provided by the user. the message will be the agent's profile.
these agents will be named prodirek-6, arko-9, etc where the suffix denotes an index.
When spawning an agent, user can choose agent profile and a load file.
You can spawn interactive or non-interactive agents.
The UI makes it easy to assign a failed test to an agent.

Future work
Agents that use the api to spawn new agents