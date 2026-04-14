---
status: probably done
error description: changes to source code do not cause the tests to be re-scheduled.
title: devVsOnce
description: ''
priority: medium
---

The server runs in 2 modes, dev and once.  

"once" will run all the builders, then execute all tests and checks 1, then shutdown
"dev" will run continuously. when an inputFiles.json file changes, the correct tests should be rescheduled.
