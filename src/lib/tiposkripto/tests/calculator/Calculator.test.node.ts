
import NodeTiposkripto from "../../src/Node.js";
import { Calculator } from "./Calculator.js";
import { specification } from "./Calculator.test.specification.js";
import type { ICalculatorNode, O, M } from "./Calculator.test.types.js";
import type { ITestImplementation, ITestAdapter } from "../../src/CoreTypes.js";
import type { ITTestResourceRequest } from "../../src/types.js";
import { assert } from "chai";

class CalculatorNodeTest extends NodeTiposkripto<ICalculatorNode, O, M> {
  input() {
    return Calculator;
  }
  
  implementation(): ITestImplementation<ICalculatorNode, O, M> {
    return {
      // TDT style /////////////////////////
      confirms: {
        addition: () => {
          return (a: number, b: number) => a + b;
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
        "another simple calculator": (input: typeof Calculator) => new input(),
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
  }
  
  adapter(): Partial<ITestAdapter<ICalculatorNode>> {
    return {
      prepareAll: async (input, testResource, artifactory) => {
        console.log("[adapter] beforeAll called with input:", input);
        return input;
      },
      prepareEach: async (
        subject,
        initializer,
        testResource,
        initialValues,
        artifactory,
      ) => {
        console.log("[adapter] beforeEach called with subject:", subject);
        // Trust the type contract: initializer is a function that returns the store
        const calculator = initializer(subject);
        console.log("[adapter] beforeEach created calculator:", calculator);
        return calculator;
      },
      execute: async (store, whenCB, testResource, artifactory) => {
        console.log("[adapter] andWhen called with store:", store);
        // whenCB is (calculator: Calculator) => Calculator
        const result = whenCB(store);
        console.log("[adapter] andWhen result:", result);
        return result;
      },
      verify: async (store, verificationFn, testResource, artifactory) => {
        console.log("[adapter] verify called with store:", store);
        console.log("[adapter] verificationFn:", verificationFn);
        
        if (typeof verificationFn === 'function') {
          // Call verificationFn with store to perform assertion
          await verificationFn(store);
          // Return the store (truthy value) to indicate success
          return store;
        }
        return store;
      },
      cleanupEach: async (store, key, artifactory) => {
        console.log("[adapter] afterEach called with store:", store);
        return store;
      },
      cleanupAll: async (store, artifactory) => {
        console.log(
          "afterAll called, but skipping web-only storage operations in Node.js",
        );

        artifactory.writeFileSync("fizz", "buzz");

        return store;
      },
      assert: (actual: any) => {
        console.log("[adapter] assert called with actual:", actual);
        return actual;
      },
    };
  }
  
  testResourceRequirement(): ITTestResourceRequest {
    return { ports: 1000 };
  }

  constructor() {
    super(specification);
  }
}

export default new CalculatorNodeTest();
