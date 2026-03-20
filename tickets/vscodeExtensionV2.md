---
status: doing
files:
  - src/vscode/types.ts
  - src/vscode/TestTreeItem.ts
  - src/vscode/README.md
  - src/vscode/extension.ts
  - src/vscode/providers/FeaturesTreeDataProvider.ts
  - src/vscode/providers/FeaturesTreeDataProviderUtils.ts
  - src/vscode/providers/FileTreeDataProvider.ts
  - src/vscode/providers/ProcessesTreeDataProvider.ts
  - src/vscode/providers/TestTreeDataProvider.ts
  - src/vscode/TestTreeItem.ts
  - src/vscode/TerminalManager.ts
  - src/vscode/README.md
  - src/vscode/extension.ts
---

see [documentizer](./../../server/features/documentizer.md)

see [testJson.md](./../../features/testsJson.md) for an example of a test result file.

We had reduced scope to a single section. This view shows the tests broken down first by runtime, and then by test. We want this to all be relative to the original entrypoint of the test. So even though the reports are in another directory, we want to display them here

## status

The extension is roughed out but we have a problem colating the files.

"colated files" are a gathering of source code, logs, the test.json file, etc for a given test.

Goal:
[x] The extension first breaks down by runtime
[x] Under each runtime, the tests can be showing.
[ ] Under each test, the colated files can be found.

actual

```

[collation] {
  "webtests": {
    "type": "directory",
    "children": {
      "src/ts/Calculator.test.web.ts": {
        "type": "directory",
        "children": {
          "source": {
            "type": "directory",
            "name": "Source Files",
            "children": {}
          },
          "input": {
            "type": "directory",
            "name": "Input Files",
            "children": {}
          },
          "output": {
            "type": "directory",
            "name": "Output Files",
            "children": {
              "webtests-src_ts_calculator-test-web-ts-check-1.exitcode": {
                "type": "file",
                "path": "testeranto/reports/webtests/webtests-src_ts_calculator-test-web-ts-check-1.exitcode",
                "runtime": "web",
                "runtimeKey": "webtests",
                "testName": "src/ts/Calculator.test.web.ts",
                "fileType": "report"
              },
              "webtests-src_ts_calculator-test-web-ts-check-0.exitcode": {
                "type": "file",
                "path": "testeranto/reports/webtests/webtests-src_ts_calculator-test-web-ts-check-0.exitcode",
                "runtime": "web",
                "runtimeKey": "webtests",
                "testName": "src/ts/Calculator.test.web.ts",
                "fileType": "report"
              },
              "webtests-src_ts_calculator-test-web-ts-check-0.container.exitcode": {
                "type": "file",
                "path": "testeranto/reports/webtests/webtests-src_ts_calculator-test-web-ts-check-0.container.exitcode",
                "runtime": "web",
                "runtimeKey": "webtests",
                "testName": "src/ts/Calculator.test.web.ts",
                "fileType": "report"
              },
              "webtests-src_ts_calculator-test-web-ts-check-0.container.status": {
                "type": "file",
                "path": "testeranto/reports/webtests/webtests-src_ts_calculator-test-web-ts-check-0.container.status",
                "runtime": "web",
                "runtimeKey": "webtests",
                "testName": "src/ts/Calculator.test.web.ts",
                "fileType": "report"
              },
              "webtests-src_ts_calculator-test-web-ts-bdd.log": {
                "type": "file",
                "path": "testeranto/reports/webtests/webtests-src_ts_calculator-test-web-ts-bdd.log",
                "runtime": "web",
                "runtimeKey": "webtests",
                "testName": "src/ts/Calculator.test.web.ts",
                "fileType": "log"
              },
              "webtests-src_ts_calculator-test-web-ts-check-1.container.status": {
                "type": "file",
                "path": "testeranto/reports/webtests/webtests-src_ts_calculator-test-web-ts-check-1.container.status",
                "runtime": "web",
                "runtimeKey": "webtests",
                "testName": "src/ts/Calculator.test.web.ts",
                "fileType": "report"
              },
              "webtests-src_ts_calculator-test-web-ts-check-0.log": {
                "type": "file",
                "path": "testeranto/reports/webtests/webtests-src_ts_calculator-test-web-ts-check-0.log",
                "runtime": "web",
                "runtimeKey": "webtests",
                "testName": "src/ts/Calculator.test.web.ts",
                "fileType": "log"
              },
              "webtests-src_ts_calculator-test-web-ts-check-1.log": {
                "type": "file",
                "path": "testeranto/reports/webtests/webtests-src_ts_calculator-test-web-ts-check-1.log",
                "runtime": "web",
                "runtimeKey": "webtests",
                "testName": "src/ts/Calculator.test.web.ts",
                "fileType": "log"
              },
              "webtests-src_ts_calculator-test-web-ts-bdd.container.exitcode": {
                "type": "file",
                "path": "testeranto/reports/webtests/webtests-src_ts_calculator-test-web-ts-bdd.container.exitcode",
                "runtime": "web",
                "runtimeKey": "webtests",
                "testName": "src/ts/Calculator.test.web.ts",
                "fileType": "report"
              },
              "webtests-src_ts_calculator-test-web-ts-bdd.container.status": {
                "type": "file",
                "path": "testeranto/reports/webtests/webtests-src_ts_calculator-test-web-ts-bdd.container.status",
                "runtime": "web",
                "runtimeKey": "webtests",
                "testName": "src/ts/Calculator.test.web.ts",
                "fileType": "report"
              },
              "webtests-src_ts_calculator-test-web-ts-check-1.container.exitcode": {
                "type": "file",
                "path": "testeranto/reports/webtests/webtests-src_ts_calculator-test-web-ts-check-1.container.exitcode",
                "runtime": "web",
                "runtimeKey": "webtests",
                "testName": "src/ts/Calculator.test.web.ts",
                "fileType": "report"
              },
              "chrome-service.log": {
                "type": "file",
                "path": "testeranto/reports/webtests/chrome-service.log",
                "runtime": "web",
                "runtimeKey": "webtests",
                "testName": "src/ts/Calculator.test.web.ts",
                "fileType": "log"
              },
              "build.log": {
                "type": "file",
                "path": "testeranto/reports/webtests/build.log",
                "runtime": "web",
                "runtimeKey": "webtests",
                "testName": "src/ts/Calculator.test.web.ts",
                "fileType": "log"
              },
              "tests.json": {
                "type": "file",
                "path": "testeranto/reports/webtests/src/ts/Calculator.test.web.ts/testeranto/reports/webtests/src/ts/Calculator.test.web.ts/tests.json",
                "runtime": "web",
                "runtimeKey": "webtests",
                "testName": "src/ts/Calculator.test.web.ts",
                "fileType": "test-results"
              },
              "inputFiles.json": {
                "type": "file",
                "path": "testeranto/bundles/webtests/inputFiles.json",
                "runtime": "web",
                "runtimeKey": "webtests",
                "testName": "src/ts/Calculator.test.web.ts",
                "fileType": "bundle"
              },
              "Calculator_test_web.html": {
                "type": "file",
                "path": "testeranto/bundles/webtests/Calculator_test_web.html",
                "runtime": "web",
                "runtimeKey": "webtests",
                "testName": "src/ts/Calculator.test.web.ts",
                "fileType": "bundle"
              },
              "Calculator.test.web.mjs": {
                "type": "file",
                "path": "testeranto/bundles/webtests/src/ts/Calculator.test.web.mjs",
                "runtime": "web",
                "runtimeKey": "webtests",
                "testName": "src/ts/Calculator.test.web.ts",
                "fileType": "bundle"
              }
            }
          }
        }
      }
    }
  }
}
```

desired

```
- nodetests
  - ...
- webtests
  - src/ts/Calculator.web.ts
    - tests.json
    - build.log
    - source
      - src
        - ts
          - Calculator.web.ts
          - Calculator.adapter.ts
          - ....

    - BDD - ${exitcode} (click to show webtests-src_ts_calculator-test-web-ts-bdd.log)
    - check0 - ${exitcode} (click to show webtests-src_ts_calculator-test-web-ts-check-0.log)
    - check1 - ${exitcode} (click to show webtests-src_ts_calculator-test-web-ts-check-1.log)
    - ...
    - bundle
      - ... bundled files here

```
