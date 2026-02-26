Each builder is a docker image that does 3 things
1) imports a config file in the respective languuage
2) creates bundles
  - node - esbuild
  - web - esbuild
  - python - shv ar zipapp
  - golang - TBD
  - ruby - NA
  - java - TBD
  - rust - cargo
3) creates the inputFiles.json file
  - a list of all the files that were used to create the bundle

Every builder needs to create executable test artifacts. 
- Node and Web both produce esbuild bundles
- python and ruby produce a "dummy file"
- rust, golang, and java must be compiled, so their artifacts is a built executable. 