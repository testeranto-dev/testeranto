import type { ITestSpecification } from "../../src/CoreTypes";
import type { ICalculatorNode, O } from "./Calculator.test.types";

export const specification: ITestSpecification<ICalculatorNode, O> = (
  // Suite,
  Given,
  When,
  Then,
  Describe,
  It,
  Confirm,
  Value,
  Should,
) => {
  return [

    // TDT pattern: Confirm creates a BaseConfirm instance
    Confirm["addition"](
      [
        [Value.of([1, 1]), Should.beEqualTo(2222)],
        [Value.of([2, 3]), Should.beGreaterThan(4)],
      ],
      ["./Readme.md3"],
    ),

    // AAA pattern: Describe creates a BaseDescribe instance
    Describe["another simple calculator"]("some input")(
      [
        It["can save 1 memory"](),
        It["can save 2 memories"](),
      ],
      ["./Readme.md"],
    ),

    // BDD pattern: Given creates a BaseGiven instance
    Given.Default("some input")(
      [
        When.press("5"),
        When.press("+"),
        When.press("3"),
        When.enter(),
      ],
      [Then.result("8")],
      ["./Readme.md"],
    ),


    Confirm["addition"](
      [
        [Value.of([3, 3]), Should.beEqualTo(3)],
      ],
      ["./Readme.md"],
    ),

    Confirm["addition"](
      [
        [Value.of([3, 32]), Should.beEqualTo(32)],
      ],
      ["./Readme.md"],
    ),

    Confirm["addition"](
      [
        [Value.of([3, 332]), Should.beEqualTo(332)],
      ],
      ["./Readme.md"],
    ),

  ];
}
