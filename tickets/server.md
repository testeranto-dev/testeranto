 1 [x] Create new business classes at positions 11-14 in the stack
 2 [x] Extract functions to individual files in src/server/serverClasses/v3/utils/
 3 [x] Move methods from technological classes to the appropriate business classes
 4 [x] Update imports in all affected files
 5 [ ] Update the stack in index.md
 6 [x] Update Server_Testeranto.ts to extend the correct class

6. Key Principles to Follow

 • Each extracted function file should export a single function
 • Business classes should only call extracted utility functions
 • Technological classes should only contain actual I/O operations
 • No try/catch for logging purposes
 • No fallback/default values
 • No guessing behavior
 • Functions should collect actual data, not accept empty placeholders
