---
status: critical
---

The ruby pseudo-bundler is not reporting the correct inputFiles.json

```sh
?   tree ruby                                                   ~/Code/testeranto-example-project/src main -!
ruby
├── Calculator-test.rb
└── Calculator.rb

1 directory, 2 files

?   head ruby/Calculator-test.rb                                ~/Code/testeranto-example-project/src main -!
require 'json'
require 'rubeno'
require_relative './Calculator'
```

```ts
{
  "src/ruby/Calculator-test.rb": {
    "hash": "1bba1e3b3698b0a0b9c3b8703d5bdf59",
    "files": [
      // Note that Calculator.rb out to be present but it is missing
      "/src/ruby/Calculator-test.rb"
    ]
  }
}
```

Note that Calculator.rb out to be present but it is missing
