treegraph shows the graph structured as it's original file tree. Once all the feature files have been built into a tree, each file is further broken down into the tests (not "Test suites" but the individual tests within those suites.)

## example

project/
  aFolder
    "some great feature"
      - ❌ The border is red 
      - ✅ The border is not blue 
  anotherFolder
    yetAnotherFolder
      "calculator"
        - ✅ It can add
        - ✅ It can subtract
