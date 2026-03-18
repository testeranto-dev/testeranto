---
status: in progress
source:
  - src/Types.ts
  - src/server/serverClasses/Server.ts
  - src/vscode/providers
  - src/vscode/extension.ts
  - src/vscode/README.md
  - src/vscode/TestTreeItem.ts
  - src/vscode/types.ts
  - FeaturesTreeDataProvider
  - src/vscode/providers/FeaturesTreeDataProviderUtils.ts
  - src/vscode/providers/FeaturesTreeDataProvider.ts
---

We want to enhance the project wide configs with a new field, which glob pattern to find all the documentation pages for a project. For instance, a very common pattern would be a glob patten to find all the markdown documents in a project.

[ ] We need to update the type `ITestconfigV2`
[ ] enhance `src/server/serverClasses/Server.ts` with an way to store all the found documentation files. We are going to add more entries to this store later, but for now, we just need to watch for changes made to files that match the glob pattern. Note: we need to watch for new files that match this pattern, and remove the entry when a file is deleted that matches the pattern.
[ ] expose the document-ized data to the vs code extension, probably with websockets

see [testsJson.md](./../../features/testsJson.md)
