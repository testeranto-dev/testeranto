---
status: in progress
---

Our data-slice system is in various states of broken-ness. We need a unified now approach. This will also help unify the chat, agents, views and data-slices.

# Old architecture 
we serve data over url endpoints

# How chat should work 
1) We are going to keep these endpoints for development and we will extend them with new functionality.
2) [x]Every time the graph updates, we send out subscription alerts. We also want to write down that data slice in a json file.
3) [x] There is a slice for every view and for every agent.
