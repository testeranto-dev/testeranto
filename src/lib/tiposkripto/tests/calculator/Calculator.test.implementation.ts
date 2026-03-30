import { assert } from "chai";
import { Calculator } from "./Calculator.js";
import type { ICalculatorNode, O, M } from "./Calculator.test.types.js";
import type { ITestImplementation } from "../../src/CoreTypes.js";

export const implementation: ITestImplementation<ICalculatorNode, O, M> = {
  // suites: {
  //   Default: { description: "Comprehensive test suite for Calculator" },
  // },

  // TDT style /////////////////////////
  confirms: {
    addition: () => {
      return () => {
        return (a: number, b: number) => a + b;
      };
    },
  },

  values: {
    of: (numbers: number[]) => {
      return numbers;
    },
    "one and two": () => {
      return [1, 2];
    },
  },

  shoulds: {
    beEqualTo: (expected: number) => {
      return (actualResult: number) => {
        return assert.equal(actualResult, expected);
      };
    },

    beGreaterThan: (expected: number) => {
      return (actualResult: number) => {
        return assert.isAbove(actualResult, expected, `${actualResult} should be greater than ${expected}`);
      };
    },

    // whenAddedAreGreaterThan: (expected: number) => {
    //   return (input: number[], calculator: Calculator) => {
    //     const [a, b] = input;
    //     const result = calculator.add(a, b);
    //     assert.isAbove(result, expected, `${a} + ${b} should be greater than ${expected}`);
    //   };
    // },
    whenMultipliedAreAtLeast: (expected: number) => {
      return (actualResult: number) => {
        return assert.isAtLeast(actualResult, expected, `${actualResult} should be at least ${expected}`);
      };
    },
    equal: (expected: any) => {
      return (actualResult: any) => {
        return assert.deepEqual(actualResult, expected);
      };
    },
  },

  // AAA style /////////////////////////
  describes: {
    "a simple calculator": (input: typeof Calculator) => new input(),
  },

  its: {
    "can save 1 memory": () => {
      return (calculator: Calculator) => {
        calculator.memoryStore();
        assert.equal(calculator.getValue("memory"), 0);
      };
    },
    "can save 2 memories": () => {
      return (calculator: Calculator) => {
        calculator.memoryStore();
        calculator.memoryAdd();
        const memory = calculator.getValue("memory");
        assert.isNumber(memory);
      };
    },
  },

  // BDD style /////////////////////////
  givens: {
    Default: (input: typeof Calculator) => new input(),
  },

  whens: {
    press: (button: string) => {
      return (calculator: Calculator) => {
        return calculator.press(button);
      };
    },
    enter: () => {
      return (calculator: Calculator) => {
        calculator.enter();
        return calculator;
      };
    },
    memoryStore: () => {
      return (calculator: Calculator) => {
        calculator.memoryStore();
        return calculator;
      };
    },
    memoryRecall: () => {
      return (calculator: Calculator) => {
        calculator.memoryRecall();
        return calculator;
      };
    },
    memoryClear: () => {
      return (calculator: Calculator) => {
        calculator.memoryClear();
        return calculator;
      };
    },
    memoryAdd: () => {
      return (calculator: Calculator) => {
        calculator.memoryAdd();
        return calculator;
      };
    },
  },

  thens: {
    result: (expected: string) => {
      return (calculator: Calculator) => {
        const actual = calculator.getDisplay();
        const actualNum = parseFloat(actual);
        const expectedNum = parseFloat(expected);
        if (!isNaN(actualNum) && !isNaN(expectedNum)) {
          assert.closeTo(actualNum, expectedNum, 0.0000001);
        } else {
          assert.equal(actual, expected);
        }
      };
    },
  },
};
