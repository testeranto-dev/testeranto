# project: syzygy

## Problems:

All of our agents work in 1 space, causing them to trip over each other.
aider get confused running in docker
We cannot apply any constraints on the user-supplied dockerfile
its unknown when an ai is working

## Solutions:

Isolation (Worktrees + Masking):
Each agent container creates a git worktree in a unique internal folder (e.g., /workspace/agent-1). This gives them their own branch and a clean slate. You still use gitignore masking here so that the agent's internal node_modules don't leak out.

Works with --no-auto-commit until a logical thought is done. Then it performs a local git commit on its Parallel Worktree branch. here we include metadata via git notes

server detects a new gitref and schedules it with the builders

via buildkit, builders come online, switch to branch, execute, then quit

via git notes and chat, agents can collaborate to merge branches