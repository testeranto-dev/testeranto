return [
  Suite.Default("Testing the treeFilter()", {
    tdtAdditionTable: Confirm["addition"](
      [
        [Value.of([1, 1]), Should.beEqualTo(2)],
        [Value.of([2, 3]), Should.beGreaterThan(4)],
      ],
      [],
    ),
  })
];



aaaBasicOperations: Describe["another simple caclulator"](
  ["AAA basic operations"],
  [
    It["can save 1 memory"](),
    It["can save 2 memories"](),
  ],
),



  bddAddition: Given.Default(
    ["BDD addition"],
    [
      When.press("5"),
      When.press("+"),
      When.press("3"),
      When.enter(),
    ],
    [Then.result("8")],
  ),
