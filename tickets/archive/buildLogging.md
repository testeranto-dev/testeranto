---
owner: adam
status: done-ish
title: buildLogging
description: ''
priority: medium
---

# Better build logs

ATM, we have a builder process for each runtime. It captures the logs but does not distinguish between tests within the runtime. So the build logs for all tests in a runtime are mixed. We need to capture these logs to the reports folder.

## Implementation Status

### Done

NONE

### Working

- Node: Builder logs now written to `testeranto/reports/{configKey}/build.log` with proper esbuild watch mode
- Web: Builder logs now written to `testeranto/reports/{configKey}/build.log` with proper esbuild watch mode

We need to create the esbuild plugins necessary to untangle the logs per-test

### Pending

- Python
- Golang
- Ruby
- Rust
- Java

## Implementation Details

For Node and Web runtimes:

- Console output (log, error, warn) is captured and written to a timestamped log file
- Logs are appended to the file on each builder run
- Original console output is preserved for Docker logging
- Log files are stored in the reports directory for easy access
- Fixed esbuild context API usage: using `build.onEnd` plugin instead of deprecated `ctx.on('rebuild')`
- Watch mode properly triggers metafile updates and test re-runs
