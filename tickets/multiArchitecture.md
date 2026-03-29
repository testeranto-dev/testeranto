# Testeranto Multi-Strategy Testing Architecture


## Overview

Testeranto now supports three testing methodologies through a unified core architecture. All methodologies share the same underlying infrastructure while providing distinct high-level APIs.


## BDD (Behavior Driven Design)

Given, When, and Then

### AAA (Arrange-Act-Assert) - Implemented as Describe-It Pattern (2 Verbs)

**Note**: The AAA (Arrange-Act-Assert) pattern is implemented as the Describe-It pattern with 2 verbs: "Describe" and "It" . This differs from BDD which uses 3 separate verbs (Given, When, Then). The Describe-It pattern follows the same underlying architecture but uses terminology common in JavaScript testing frameworks like Jest and Mocha.

Describe and It

### TDT (Table Driven Testing)

This pattern is ideal for testing multiple input-output combinations with the same test logic.

ForTheInputOf, TheOutputShouldBe

---

### The Context Pipeline Mapping

| Adapter Hook | **BDD** (Behavioral) | **TDT** (Stateless) | **AAA** (Structural) |
| :--- | :--- | :--- | :--- |
| **1. prepareAll** | Feature/Suite Setup | *Identity (Pass-through)* | `Describe` Level Setup |
| **2. prepareEach** | **Given** (State Setup) | *Identity (Pass-through)* | `It` Setup (Arrange) |
| **3. execute** | **When** (The Event) | **ForTheInputOf** (Func Call) | `It` Execution (Act) |
| **4. verify** | **Then** (Assertions) | **TheOutputShouldBe** (Check) | `It` Assertions (Assert) |
| **5. cleanupEach** | Scenario Teardown | *Identity (Pass-through)* | `It` Teardown |
| **6. cleanupAll** | Feature/Suite Teardown | *Identity (Pass-through)* | `Describe` Teardown |

```ts
const x = [
    // features
  [
    "someMarkdownFile.md",
    "documentation.md"
  ], [


    // BDD
    Given.Default(
      [When.press("7")],
      [Then.result("7")],
    ),

    // TDT
    ForTheInputOf.oneAndOne([
      TheOutputShouldBe.beEqualTo(2),
      TheOutputShouldBe.beLessThan(3)
    ]),

    ForTheInputOf.values(1, 2)([
      TheOutputShouldBe.beEqualTo(3),
      TheOutputShouldBe.beGreaterThan(2)
    ])

    // AAA
    Describe["another simple caclulator"](
      [
        It["can save 1 memory"],
        It["can save 2 memories"],
      ],
    )
  ]
]
```