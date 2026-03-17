---
statu: in progress
---

We need to get the web runtime working again.

The web runtime is unique in that it runs in the browser and thus needs a node "hoist" to stand between the test-in-the-browser and the filesytem. In the past we have use cucumber's exposed functions to all the page to write to the file systems. We should consider if this architecture is really congruent with the other builders.

It's a long standing problem of bridging the chrome runtime and i am open to other solutions. An ideal solution would be to write the tests.json (and other files) to an in-browser and then download them after the test is done, to a particualr place. we can't let the browsers default download behvior takeover.

Included in this problem is the need to connect to a runnning the chrome-service, not the native host chrome.

## WEe builder

```sh
Error importing config: /workspace/testeranto/runtimes/web/web.ts Error: listen tcp: lookup webtests on 127.0.0.11:53: no such host

    at /workspace/node_modules/esbuild/lib/main.js:1313:39

    at responseCallbacks.<computed> (/workspace/node_modules/esbuild/lib/main.js:884:9)

    at handleIncomingPacket (/workspace/node_modules/esbuild/lib/main.js:938:31)

    at Socket.readFromStdout (/workspace/node_modules/esbuild/lib/main.js:862:7)

    at Socket.emit (node:events:524:28)

    at addChunk (node:internal/streams/readable:561:12)

    at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)

    at Readable.push (node:internal/streams/readable:392:5)

    at Pipe.onStreamRead (node:internal/stream_base_commons:191:23)

Error: listen tcp: lookup webtests on 127.0.0.11:53: no such host

    at /workspace/node_modules/esbuild/lib/main.js:1313:39

    at responseCallbacks.<computed> (/workspace/node_modules/esbuild/lib/main.js:884:9)

    at handleIncomingPacket (/workspace/node_modules/esbuild/lib/main.js:938:31)

    at Socket.readFromStdout (/workspace/node_modules/esbuild/lib/main.js:862:7)

    at Socket.emit (node:events:524:28)

    at addChunk (node:internal/streams/readable:561:12)

    at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)

    at Readable.push (node:internal/streams/readable:392:5)

    at Pipe.onStreamRead (node:internal/stream_base_commons:191:23)
```
