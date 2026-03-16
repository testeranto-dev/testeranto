We need to get the web runtime working again.

The web runtime is unique in that it runs in the browser and thus needs a node "hoist" to stand between the test-in-the-browser and the filesytem. In the past we have use cucumber's exposed functions to all the page to write to the file systems. We should consider if this architecture is really congruent with the other builders. 

It's a long standing problem of bridging the chrome runtime and i am open to other solutions. An ideal solution would be to write the tests.json (and other files) to an in-browser and then download them after the test is done, to a particualr place. we can't let the browsers default download behvior takeover. 