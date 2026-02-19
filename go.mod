module github.com/adamwong246/testeranto

go 1.23

// The binary will be built to testeranto/bundles/golang/ using explicit build commands
// Note: golingvu is now a separate module and should be installed via:
// go get github.com/adamwong246/golingvu

require example v0.0.0

replace example => ./example
