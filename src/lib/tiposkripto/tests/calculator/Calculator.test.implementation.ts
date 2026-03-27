import { assert } from "chai";
import { Calculator } from "./Calculator.js";
import type { ICalculatorNode, O, M } from "./Calculator.test.types.js";
import type { ITestImplementation } from "../../src/CoreTypes.js";

const x = new Calculator()

export const implementation: ITestImplementation<ICalculatorNode, O, M> = {
  suites: {
    Default: { description: "Comprehensive test suite for Calculator" },
  },

  // TDT style /////////////////////////
  confirms: {
    addition: new Calculator().add,
  },

  values: {
    of: (...numbers: number[]) => {
      return numbers;
    },
    "one and two": () => {
      return [1, 2];
    },
  },

  shoulds: {
    beEqualTo: (expected: number) => {
      return (input: number[], confirmation: (a: number, b: number) => number) => {
        return assert.equal(expected, confirmation(input[0], input[1]))
      };
    },

    beGreaterThan: (expected: number) => {
      return (input: number[], confirmation: (a: number, b: number) => number) => {
        return assert.isAbove(expected, confirmation(input[0], input[1]))
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
      return (input: number[], calculator: Calculator) => {
        const [a, b] = input;
        const result = calculator.multiply(a, b);
        assert.isAtLeast(result, expected, `${a} * ${b} should be at least ${expected}`);
      };
    },
    equal: (expected: any) => {
      return (input: any, calculator: Calculator) => {
        assert.deepEqual(input, expected);
      };
    },
  },

  // AAA style /////////////////////////
  describes: {
    "another simple calculator": () => new Calculator(),
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
    Default: () => new Calculator(),
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
