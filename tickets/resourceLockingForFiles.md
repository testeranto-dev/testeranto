---
status: backlog
dependsUpon: tickets/resourceLocking.md
---

We need to extend the resource locking to include specific file. For instance, we don't want an aider agent to try to edit a file while a test is running. These are/were implement as "test resource configurations" but these really no longer have bearing. The goal is that only 1 agent or test runs any file at any time

### **Dependencies:**
- **Depends on**: Resource locking system (`tickets/resourceLocking.md`)
- **Required for**: Safe concurrent operations across agents and tests

### **Implementation Notes:**
- Extends the resource locking concept to individual files
- Prevents conflicts between aider agents and running tests
- Will replace the old "test resource configurations" system


Make sure you are leaning on the graph to do the locking. You can apply the locks on the file nodes in the graph