# Conversion Plans: Testeranto Framework Bridge

This document outlines the technical strategy for bi-directional compatibility between Testeranto and the JavaScript testing ecosystem.

## 1. External Frameworks → Testeranto (The Wrapper)
To consume existing tests, Testeranto treats external suites as "Black Box" executions within the `execute` hook.

| Framework | Integration Strategy | Programmatic Interface |
| :--- | :--- | :--- |
| **Vitest** | Use the `startVitest` Node API | `import { startVitest } from 'vitest/node'` |
| **Node Native** | Spawn via `child_process` | `node --test [file]` |
| **Jest** | Use the `runCLI` function | `import { runCLI } from 'jest'` |
| **Mocha** | Instantiate the Mocha class | `new Mocha().run()` |

**Implementation Logic:**
1. **prepareEach:** Initialize the external runner configuration.
2. **execute:** Await the external runner's completion.
3. **verify:** Inspect the runner's exit code or results object; throw if failures > 0.

## 2. Testeranto → External Frameworks (The Unroller)
To export Testeranto tests, the DSL is "unrolled" into the native lifecycle hooks of the target framework.

### Target: Vitest / Jest / Mocha (BDD Style)
The 6-hook adapter maps 1:1 to standard BDD globals:
* **prepareAll** → `beforeAll(async () => { ... })`
* **prepareEach** → `beforeEach(async () => { ... })`
* **execute / verify** → `it('test name', async () => { ... })`
* **cleanupEach** → `afterEach(async () => { ... })`
* **cleanupAll** → `afterAll(async () => { ... })`

### Target: Node.js Native (`node:test`)
The "Zero-Lock-in" strategy for dependency-free execution:
* **Hooks:** Uses `test`, `describe`, `before`, and `after` from the `node:test` module.
* **Assertions:** Uses the native `node:assert` module within the `verify` stage.

## 3. Conversion Effort & Tier Ranking


| Target | Inbound (Wrapper) | Outbound (Unroller) | Complexity |
| :--- | :--- | :--- | :--- |
| **Vitest** | **Excellent** | **Low** | **Tier 1 (Easy)** |
| **Node Native**| **Good** | **Low** | **Tier 1 (Easy)** |
| **Mocha** | **Fair** | **Medium** | **Tier 2 (Moderate)** |
| **Jest** | **Complex** | **High** | **Tier 3 (Hard)** |

## 4. Technical Constraints
* **Global Isolation:** To prevent external frameworks from polluting the Testeranto process, Inbound Wrappers should run via `Worker Threads`.
* **State Sync:** The Testeranto `Context` must be serialized if passed to an external process during the `execute` phase.
