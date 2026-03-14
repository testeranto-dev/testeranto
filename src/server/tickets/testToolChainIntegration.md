---
status: planning
---

# integration with language specific tool chains.

## Problem - many languages have their own way of running test. we should try to integrate

### The "Standard Library" Runners

These languages include a test runner or framework directly in their core distribution, similar to Go.Python (unittest): Python comes with the unittest module in its standard library. You can run tests from the command line using python -m unittest. While official, many developers prefer pytest because it’s less verbose, though unittest remains the "official" baseline.Rust (cargo test): This is the closest experience to Go. Testing is a core feature of cargo, the official package manager. You simply write #[test] above a function and run cargo test. It handles unit tests, integration tests, and even documentation tests (doctests) out of the box.Ruby (minitest): Ruby includes minitest in its standard library (as of Ruby 1.9). While RSpec is arguably more famous in the Ruby community for its "behavior-driven" style, minitest is what you get by default and is used heavily by the Ruby on Rails core team.

### The "Community-Standard" Runners

In these ecosystems, the "official" toolchain usually doesn't include a runner. Instead, one or two third-party tools have become the industry standard.Java (JUnit): Java has no "official" runner built into the java command. However, JUnit is the de facto standard. Almost every build tool (Maven, Gradle) and IDE (IntelliJ, Eclipse) treats JUnit as the primary way to execute tests.TypeScript (Varies): Since TypeScript is a superset of JavaScript, it inherits the JS "fragmented" ecosystem. There is no "official" runner. Historically, Jest was the king, but Vitest is currently the favorite for modern TS projects due to its native support for ESM and TS files without complex transpilation.Note: Node.js (v20+) recently introduced a native test runner (node --test), which is a step toward a Go-like "official" experience, but you still need a loader like tsx or ts-node to run TypeScript files directly.

### Comparison Summary

| Language       | Official Runner | CLI Command           | Notes                                                       |
| :------------- | :-------------- | :-------------------- | :---------------------------------------------------------- |
| **Go**         | **Yes**         | `go test`             | Built directly into the core toolchain.                     |
| **Rust**       | **Yes**         | `cargo test`          | Managed by Cargo; very robust and deeply integrated.        |
| **Python**     | **Yes**         | `python -m unittest`  | Part of the standard library; many prefer `pytest`.         |
| **Ruby**       | **Yes**         | `ruby -Ilib:test ...` | `minitest` is built-in; `RSpec` is a popular alternative.   |
| **Java**       | **No**          | N/A                   | Dependent on **JUnit** via Maven or Gradle.                 |
| **TypeScript** | **No**          | N/A                   | Dependent on **Vitest**, **Jest**, or modern Node `--test`. |

## Solution

TBD
