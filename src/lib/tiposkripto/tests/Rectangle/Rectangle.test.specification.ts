import type { Ibdd_out, ITestSpecification } from "../../src/CoreTypes";

export type O = Ibdd_out<
  // Givens
  {
    Default: [];
  },
  // Whens
  {
    setWidth: [number];
    setHeight: [number];
  },
  // Thens
  {
    getWidth: [number];
    getHeight: [number];
    area: [number];
    AreaPlusCircumference: [number];
  },
  // Describes (empty)
  {},
  // Its (empty)
  {},
  // Confirms (empty)
  {},
  // Values (empty)
  {},
  // Shoulds (empty)
  {}
>;

// We also need to define I type
export type I = any; // Simplified for now

export const RectangleTesterantoBaseTestSpecification: ITestSpecification<
  I,
  O
> = (Given, When, Then, Describe, It, Confirm, Value, Should) => {
  return [
    Given.Default(undefined)(
      [When.setWidth(4), When.setHeight(19)],
      [Then.getWidth(4), Then.getHeight(1529)],
      ["https://api.github.com/repos/adamwong246/testeranto/issues/88"],
    ),
    Given.Default(undefined)(
      [When.setWidth(24), When.setHeight(45)],
      [
        Then.getWidth(4),
        Then.getHeight(5),
        Then.area(20),
        Then.AreaPlusCircumference(328),
      ],
      [
        "src/lib/tiposkripto/tests/Rectangle/README.md"
      ],
    ),
    Given.Default(undefined)(
      [When.setHeight(4), When.setWidth(33)],
      [Then.area(132)],
      ["https://api.github.com/repos/adamwong246/testeranto/issues/8",
        "src/lib/tiposkripto/README.md"
      ],
    ),
    Given.Default(undefined)(
      [],
      [Then.getWidth(2), Then.getHeight(2)],
      ["https://api.github.com/repos/adamwong246/testeranto/issues/8",
        "src/lib/tiposkripto/README.md"
      ],
    ),
    Given.Default(undefined)(
      [When.setHeight(5), When.setWidth(5)],
      [Then.area(25)],
      ["https://api.github.com/repos/adamwong246/testeranto/issues/8"],
    ),
    Given.Default(undefined)(
      [When.setHeight(6), When.setWidth(6)],
      [Then.area(36)],
      ["https://api.github.com/repos/adamwong246/testeranto/issues/8"],
    ),
    Given.Default(undefined)(
      [],
      [Then.getWidth(2), Then.getHeight(2)],
      ["https://api.github.com/repos/adamwong246/testeranto/issues/8"],
    )
  ];
};
