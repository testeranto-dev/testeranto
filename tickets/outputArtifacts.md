---
status: in progress
---
we have an outputs field in the config. When the app is shutting down, the builders should produce the given output artifacts, where the outputs are a list of entrypoints. The actual outputs will be a a docker image. After a shutdown has been initiated, but before the program exits, we should built the output artifact in a docker image 