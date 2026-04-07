---
status: planning
blocks: tickets/resourceLockingForFiles.md
---

we need the means of locking resources. Our first goal is to allow the app to safely switch branches. when the restart entrypoint is hit, we need to go into an "restart mode" similar to "shutodwn mode". This indicates that all files are now locked, and hence no new tests will run. As processes complete, they do NOT restart as usual. The builders be shut down. Once all the docker processes have settled, the we can switch branches, unlock the files, and the restart all the services.

### **Dependencies:**
- **Depends on**: Branch switching implementation (`tickets/switchBranches.md`)
- **Required for**: File-level resource locking (`tickets/resourceLockingForFiles.md`)

### **Implementation Notes:**
- Resource locking is a prerequisite for safe branch switching
- Need to implement "restart mode" that prevents new tests from starting
- Must coordinate with Docker Compose manager to stop services gracefully


Make sure you are leaning on the graph to do the locking. You can apply the locks on the file nodes in the graph