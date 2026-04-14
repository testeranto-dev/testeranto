---
status: planning
---

"sidecars" is a type of secondary artifact accompanying a test. 

Consider a Ruby on Rails app which uses testeranto. You can use testeranto to test the ruby code, but what about integration tests? The solution is sidecars. In this case, you would create a web test with a ruby sidecar. You can standup the server but run tests against it with in a node test, or even a web test.

There will be significant overlap between the sidecars and the output artifacts. Where output artifacts are deployable, sidecars accompany tests, but are otherwise much alike.

1) we need to extend the config to allow each test to have a list of sides entrypoints.
2) For each test, for each sidecar, create a docker service and add it to the compose yml file
3) Make sure to add the sidecar to the graph and keep it updated with status
4) If a test has a sidecar, both should come online together with the necessary docker rigging to allow them to communicate.
5) 