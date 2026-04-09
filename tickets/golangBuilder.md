The golang builder has problems. Like all the builders, the golang builders job is to create test and output artifacts. observe in src/server/runtimes/rust/docker.ts how the 
rust files are pulled from the bun binary. 

./go.mod                            - the testeranto library go module
./src/server/runtimes/golang/go.mod - this forms the basis of the dynamically generated rust projects
testeranto/runtimes/golang/golang.Dockerfile - the user defined dockerfile. A project which uses the testeranto library would define this.