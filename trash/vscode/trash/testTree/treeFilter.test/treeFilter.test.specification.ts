

import type { ITestSpecification } from "../../../../lib/tiposkripto/src/CoreTypes";
import type { ICalculatorNode, O } from "./treeFilter.test.types";

export const specification: ITestSpecification<ICalculatorNode, O> = (
  Suite,
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
    Suite.Default("Testing the treeFilter()", {
      tdtAdditionTable: Confirm["addition"](
        [],
        [
          [Value.of([1, 1]), Should.beEqualTo(2)],
          [Value.of([2, 3]), Should.beGreaterThan(4)],
        ],
      ),
    })
  ];
};
