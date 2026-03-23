import { assert } from "chai";

import { Calculator } from "./Calculator.js";
import type { ITestImplementation } from "../../src/CoreTypes.js";
import type { ICalculatorNode, O, M } from "./Calculator.test.types.js";

export const implementation: ITestImplementation<ICalculatorNode, O, M> = {
  suites: {
    Default: { description: "Default test suite for Calculator" },
  },

  // TDT style /////////////////////////
  confirms: {
    addition: () => {
      const calc = new Calculator();
      return calc.add;
    },
    "some simple caclulator": () => {
      const calc = new Calculator();
      return calc;
    },
  },

  values: {
    of: (...numbers: number[]) => {
      return numbers;
    },

    "one and two": () => {
      return [1, 2];
    },
  },

  expecteds: {
    three: () => {
      return 3;
    },
    'to be': (x: any) => {
      return x;
    },
  },

  shoulds: {
    equal: (a: number, b: number) => {
      assert.equal(a, b, `${a} did not equal ${b}`);
      return undefined;
    },

    'when multiplied, be at least': (...numbers: number[]) => {
      return (multiplied: number, threshold: number) => {
        assert.isAtLeast(multiplied, threshold);
        return undefined;
      };
    },
  },

  // AAA style /////////////////////////
  describes: {
    "another simple caclulator": () => {
      const calc = new Calculator();
      return calc;
    },
  },

  its: {
    "can save 1 memory": (calculator: Calculator) => {
      calculator.memoryStore();
      return calculator;
    },

    "can save 2 memories": (calculator: Calculator) => {
      calculator.memoryStore();
      calculator.memoryAdd();
      return calculator;
    },
  },

  // BDD style /////////////////////////
  givens: {
    Default: () => {
      const calc = new Calculator();
      return calc;
    },
  },

  whens: {
    press: (button: string) => (calculator: Calculator) => {
      const result = calculator.press(button);
      return result;
    },
    enter: () => (calculator: Calculator) => {
      calculator.enter();
      return calculator;
    },
    memoryStore: () => (calculator: Calculator) => {
      calculator.memoryStore();
      return calculator;
    },
    memoryRecall: () => (calculator: Calculator) => {
      calculator.memoryRecall();
      return calculator;
    },
    memoryClear: () => (calculator: Calculator) => {
      calculator.memoryClear();
      return calculator;
    },
    memoryAdd: () => (calculator: Calculator) => {
      calculator.memoryAdd();
      return calculator;
    },
  },

  thens: {
    result: (expected: string) => (calculator: Calculator) => {
      assert.equal(calculator.getDisplay(), expected);
      return undefined;
    },
  },
};
