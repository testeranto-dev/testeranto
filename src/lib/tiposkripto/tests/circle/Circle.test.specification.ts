import type { ITestSpecification } from "../../src/CoreTypes";
import type { ICircleNode, O } from "./Circle.test.types";

export const specification: ITestSpecification<ICircleNode, O> = (
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
    // TDT pattern: Test circumference calculation
    Confirm["circumferenceCalculation"]()(
      [
        [Value.radius(0), Should.beEqualTo(0)],
        [Value.radius(1), Should.beCloseTo(2 * Math.PI)],
        [Value.radius(2), Should.beCloseTo(4 * Math.PI)],
        [Value.radius(5), Should.beCloseTo(10 * Math.PI)],
      ],
    ),

    // TDT pattern: Test area calculation
    Confirm["areaCalculation"]()(
      [
        [Value.radius(0), Should.beEqualTo(0)],
        [Value.radius(1), Should.beCloseTo(Math.PI)],
        [Value.radius(2), Should.beCloseTo(4 * Math.PI)],
        [Value.radius(5), Should.beCloseTo(25 * Math.PI)],
      ],
    ),

    // AAA pattern: Test circle properties
    Describe["a circle with radius"](5)(
      [
        It["has correct circumference"](),
        It["has correct area"](),
      ],
    ),

    // BDD pattern: Test radius operations
    Given.WithRadius(10)(
      [
        When.doubleRadius(),
        When.halveRadius(),
      ],
      [
        Then.radiusIs(10), // 10 * 2 / 2 = 10
        Then.circumferenceIs(2 * Math.PI * 10),
      ],
    ),

    // BDD pattern: Test setRadius
    Given.Default(
      [
        When.setRadius(7),
      ],
      [
        Then.radiusIs(7),
        Then.circumferenceIs(2 * Math.PI * 7),
        Then.areaIs(Math.PI * 49),
      ],
    ),
  ];
};
