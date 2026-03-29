---
status: done
---

there are bugs across many libs that produce the test.json in the wrong place.

```sh
?   tree testeranto/reports             ~/Code/testeranto-example-project main -!

testeranto/reports
├── golang
├── golangtests
│   ├── golangtests-src_golang_cmd_calculator-test_main-go-bdd.log
│   ├── golangtests-src_golang_cmd_calculator-test_main-go-check-0.log
│   ├── src
│   │   └── golang
│   │       └── cmd
│   │           └── calculator-test
│   │               └── main.go
│   │                   └── tests.json
│   └── testeranto
│       └── runtimes
│           └── golang
├── java
├── node
├── nodetests
│   ├── build.log
│   ├── nodetests-src_ts_calculator-test-node-ts-bdd.log
│   ├── nodetests-src_ts_calculator-test-node-ts-check-0.log
│   ├── nodetests-src_ts_calculator-test-node-ts-check-1.log
│   └── test-logs
│       └── Calculator.test.node.build.log
├── python
│   └── Calculator.pitono.test
│       └── tests.json
├── pythontests
│   ├── pythontests-src_python_calculator-pitono-test-py-bdd.log
│   └── src
│       └── python
├── ruby
├── rubytests
│   ├── rubytests-src_ruby_calculator-test-rb-bdd.log
│   ├── rubytests-src_ruby_calculator-test-rb-check-0.log
│   └── src
│       └── ruby
│           └── Calculator-test.rb
│               └── tests.json
├── rust
└── web
```

ruby and golang are correct, the others are not

all the libraries need to folow this pattern

Note! we key things under the runtime config key (nodetests) not the runtime itself (node)

All the test.json files should follow the struture of the entrypoint, with the filename appended with `tests.json`
