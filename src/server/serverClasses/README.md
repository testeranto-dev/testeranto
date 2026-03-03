The Server is a process run outside Docker. It's job is to docker-compose files and manage docker containers as procesess

Each docker-compose files is built with several images

these will always be present. Their job is to continuously create metafiles and bundles of tests

- builder-node
- builder-web
- builder-golang
- builder-python
- builder-rust
- builder-ruby
- builder-java

these are based on the tests runtime

- zero or more static analysis
- BDD test 

As the builder services produce bundles and set of input files, the server watches for those changes. When a bundle changes, a static analysis and BDD test should be scheduled. 