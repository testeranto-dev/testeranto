We need a unified file watcher that can trigger deiffernt fucntions for different files.

# files to watch
## inputFiles.json
```
{
  "src/lib/tiposkripto/tests/abstractBase.test/index.ts": {
    "hash": "c3b70a5aa933f98db0bba708dbddc9d2",
    "files": [
      "/src/lib/tiposkripto/tests/abstractBase.test/index.ts"
    ]
  },
```
produced by builders. There is 1 for each runtime. when this file changes, use the hash to find changed tests and then to schedule them, finally to update the graph. the entrypoint and all the files should be present in the graph

## tests.json

```
{
  "failed": true,
  "fails": 1,
  "artifacts": [],
  "features": [],
  "tests": 1,
  "runTimeTests": 1,
  "testJob": {
    "name": "CombinedResults"
  },
  "timestamp": 1776972069568,
  "individualResults": [
    {
      "index": 0,
      "failed": true,
      "fails": 1,
      "features": ["src/lib/tiposkripto/tests/circle/README.md"],
      "error": {
        "message": "Confirm.circumferenceCalculation(...) is not a function",
        "stack": "TypeError: Confirm.circumferenceCalculation(...) is not a function\n    at CircleTest.specification [as testSpecification] (file:///workspace/testeranto/bundles/nodetests/src/lib/tiposkripto/tests/circle/Circle.test.mjs:34:42)\n    at CircleTest.initialize (file:///workspace/testeranto/bundles/nodetests/chunk-Y5UDLPAA.mjs:1637:28)\n    at new NodeTiposkripto (file:///workspace/testeranto/bundles/nodetests/chunk-Y5UDLPAA.mjs:1779:10)\n    at new CircleTest (file:///workspace/testeranto/bundles/nodetests/src/lib/tiposkripto/tests/circle/Circle.test.mjs:261:5)\n    at file:///workspace/testeranto/bundles/nodetests/src/lib/tiposkripto/tests/circle/Circle.test.mjs:264:27\n    at ModuleJob.run (node:internal/modules/esm/module_job:263:25)\n    at async ModuleLoader.import (node:internal/modules/esm/loader:540:24)\n    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)",
        "name": "TypeError"
      },
      "stepName": "Step_0",
      "stepType": "SpecificationError",
      "testJob": {
        "name": "Specification_Error",
        "type": "Error",
        "error": "Test specification failed: Confirm.circumferenceCalculation(...) is not a function"
      }
    }
  ],
  "summary": {
    "totalTests": 1,
    "passed": 0,
    "failed": 1,
    "successRate": "0.00%"
  }
}
```

produced by test services. There is 1 for each test. When this file changes, use this data to rebuild the graph. The results contain a list of features. Each of these features will be a file or a url. If it is a file, then it should be watched.

# features
features are strings, either URL or local file. From test.json, we should get a list of feature files. if these features are files and not URLS, we should watch this file for changes. features are markdown files with YML frontmatter. this frontmatter should applied to the feature node as metadata

# files NOT to watch
## source files
the builders watch the source files, we the server should not handle this

