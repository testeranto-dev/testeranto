---
status; done
---

We were bundling files into the extension that should not

before

```sh
testeranto-0.226.0.vsix
├─ [Content_Types].xml
├─ extension.vsixmanifest
└─ extension/
   ├─ LICENSE.txt [1.06 KB]
   ├─ package.json [10.53 KB]
   ├─ readme.md [4.88 KB]
   ├─ .aider.tags.cache.v4/
   │  ├─ cache.db [1.32 MB]
   │  ├─ cache.db-shm [32 KB]
   │  ├─ cache.db-wal [3.95 MB]
   │  ├─ 08/ (1 file) [38.97 KB]
   │  ├─ 8e/ (1 file) [57.49 KB]
   │  ├─ f2/ (1 file) [34.96 KB]
   │  └─ fd/ (1 file) [65.93 KB]
   ├─ .vscode/
   │  ├─ launch.json [0.6 KB]
   │  ├─ settings.json [0.52 KB]
   │  └─ tasks.json [0.27 KB]
   ├─ dist/
   │  └─ vscode/ (1 file) [81.96 KB]
   ├─ exampleProject/
   │  ├─ README.md [1.62 KB]
   │  ├─ testeranto.ts [3.16 KB]
   │  └─ runtimes/ (21 files) [11.83 KB]
   ├─ examples/
   │  └─ flavored_example.py [1.68 KB]
   └─ src/
      ├─ Types.ts [4.43 KB]
      ├─ index.ts [2.03 KB]
      ├─ runtimes.ts [0.14 KB]
      ├─ esbuildConfigs/ (8 files) [7.17 KB]
      ├─ lib/ (5503 files) [1201.13 MB]
      ├─ server/ (64 files) [301.84 KB]
      └─ vscode/ (11 files) [115.73 KB]

=> Run vsce ls --tree to see all included files.
```

After

```sh
testeranto-0.226.0.vsix
├─ [Content_Types].xml
├─ extension.vsixmanifest
└─ extension/
   ├─ LICENSE.txt [1.06 KB]
   ├─ package.json [10.53 KB]
   ├─ readme.md [4.96 KB]
   ├─ dist/
   │  └─ vscode/
   │     └─ extension.mjs [81.96 KB]
   └─ src/
      └─ vscode/
         ├─ README.md [0.71 KB]
         ├─ TerminalManager.ts [6.23 KB]
         ├─ TestTreeItem.ts [1.52 KB]
         ├─ extension.ts [22.21 KB]
         ├─ types.ts [0.47 KB]
         ├─ providers/
         │  ├─ FeaturesTreeDataProvider.ts [24.72 KB]
         │  ├─ FeaturesTreeDataProviderUtils.ts [0.08 KB]
         │  ├─ FileTreeDataProvider.ts [6.59 KB]
         │  ├─ ProcessesTreeDataProvider.ts [11.37 KB]
         │  ├─ ResultsTreeDataProvider.ts [2.03 KB]
         │  └─ TestTreeDataProvider.ts [39.81 KB]
         └─ tickets/
            └─ prunevsCodeincludedFiles.md [1.33 KB]
```
