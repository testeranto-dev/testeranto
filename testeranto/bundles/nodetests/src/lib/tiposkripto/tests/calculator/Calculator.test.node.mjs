import {
  NodeTiposkripto
} from "../../../../../chunk-7TUUD5WL.mjs";

// src/lib/tiposkripto/tests/calculator/Calculator.ts
var Calculator = class {
  constructor() {
    this.display = "";
    this.values = {};
  }
  enter() {
    try {
      const result = eval(this.display);
      if (result === Infinity || result === -Infinity) {
        this.display = "Error";
      } else {
        this.display = result.toString();
      }
    } catch (error) {
      this.display = "Error";
    }
  }
  memoryStore() {
    this.setValue("memory", parseFloat(this.display) || 0);
    this.clear();
  }
  memoryRecall() {
    const memoryValue = this.getValue("memory") || 0;
    this.display = memoryValue.toString();
  }
  memoryClear() {
    this.setValue("memory", 0);
  }
  memoryAdd() {
    const currentValue = parseFloat(this.display) || 0;
    const memoryValue = this.getValue("memory") || 0;
    this.setValue("memory", memoryValue + currentValue);
    this.clear();
  }
  handleSpecialButton(button) {
    switch (button) {
      case "C":
        this.clear();
        return true;
      case "MS":
        this.memoryStore();
        return true;
      case "MR":
        this.memoryRecall();
        return true;
      case "MC":
        this.memoryClear();
        return true;
      case "M+":
        this.memoryAdd();
        return true;
      default:
        return false;
    }
  }
  press(button) {
    if (this.handleSpecialButton(button)) {
      return this;
    }
    this.display = this.display + button;
    return this;
  }
  getDisplay() {
    return this.display;
  }
  clear() {
    this.display = "";
  }
  // Keep these methods for backward compatibility if needed
  add(a, b) {
    return a + b;
  }
  subtract(a, b) {
    return a - b;
  }
  multiply(a, b) {
    return a * b;
  }
  divide(a, b) {
    if (b === 0) {
      throw new Error("Cannot divide by zero");
    }
    return a / b;
  }
  setValue(identifier, value) {
    this.values[identifier] = value;
  }
  getValue(identifier) {
    return this.values[identifier] ?? null;
  }
};

// src/lib/tiposkripto/tests/calculator/Calculator.test.adapter.ts
var adapter = {
  prepareAll: async (input, testResource, artifactory) => {
    console.log("[adapter] beforeAll called with input:", input);
    return input;
  },
  prepareEach: async (subject, initializer, testResource, initialValues, artifactory) => {
    console.log("[adapter] beforeEach called with subject:", subject);
    let calculator;
    if (initializer.length === 0) {
      calculator = initializer();
    } else if (initializer.length === 1) {
      calculator = initializer(subject);
    } else {
      calculator = initializer();
    }
    console.log("[adapter] beforeEach created calculator:", calculator);
    return calculator;
  },
  execute: async (store, whenCB, testResource, artifactory) => {
    console.log("[adapter] andWhen called with store:", store);
    const result2 = whenCB(store);
    console.log("[adapter] andWhen result:", result2);
    return result2;
  },
  verify: async (store, verificationFn, testResource, artifactory) => {
    console.log("[adapter] verify called with store:", store);
    console.log("[adapter] verificationFn:", verificationFn);
    if (typeof verificationFn === "function") {
      await verificationFn(store);
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
      "afterAll called, but skipping web-only storage operations in Node.js"
    );
    artifactory.writeFileSync("fizz", "buzz");
    return store;
  },
  assert: (actual) => {
    console.log("[adapter] assert called with actual:", actual);
    return actual;
  }
};

// src/lib/tiposkripto/tests/calculator/Calculator.test.implementation.ts
import { assert } from "chai";
var implementation = {
  // suites: {
  //   Default: { description: "Comprehensive test suite for Calculator" },
  // },
  // TDT style /////////////////////////
  confirms: {
    addition: () => {
      return () => {
        return (a, b) => a + b;
      };
    }
  },
  values: {
    of: (numbers) => {
      return numbers;
    },
    "one and two": () => {
      return [1, 2];
    }
  },
  shoulds: {
    beEqualTo: (expected) => {
      return (actualResult) => {
        return assert.equal(actualResult, expected);
      };
    },
    beGreaterThan: (expected) => {
      return (actualResult) => {
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
    whenMultipliedAreAtLeast: (expected) => {
      return (actualResult) => {
        return assert.isAtLeast(actualResult, expected, `${actualResult} should be at least ${expected}`);
      };
    },
    equal: (expected) => {
      return (actualResult) => {
        return assert.deepEqual(actualResult, expected);
      };
    }
  },
  // AAA style /////////////////////////
  describes: {
    "a simple calculator": (input) => new input()
  },
  its: {
    "can save 1 memory": () => {
      return (calculator) => {
        calculator.memoryStore();
        assert.equal(calculator.getValue("memory"), 0);
      };
    },
    "can save 2 memories": () => {
      return (calculator) => {
        calculator.memoryStore();
        calculator.memoryAdd();
        const memory = calculator.getValue("memory");
        assert.isNumber(memory);
      };
    }
  },
  // BDD style /////////////////////////
  givens: {
    Default: (input) => new input()
  },
  whens: {
    press: (button) => {
      return (calculator) => {
        return calculator.press(button);
      };
    },
    enter: () => {
      return (calculator) => {
        calculator.enter();
        return calculator;
      };
    },
    memoryStore: () => {
      return (calculator) => {
        calculator.memoryStore();
        return calculator;
      };
    },
    memoryRecall: () => {
      return (calculator) => {
        calculator.memoryRecall();
        return calculator;
      };
    },
    memoryClear: () => {
      return (calculator) => {
        calculator.memoryClear();
        return calculator;
      };
    },
    memoryAdd: () => {
      return (calculator) => {
        calculator.memoryAdd();
        return calculator;
      };
    }
  },
  thens: {
    result: (expected) => {
      return (calculator) => {
        const actual = calculator.getDisplay();
        const actualNum = parseFloat(actual);
        const expectedNum = parseFloat(expected);
        if (!isNaN(actualNum) && !isNaN(expectedNum)) {
          assert.closeTo(actualNum, expectedNum, 1e-7);
        } else {
          assert.equal(actual, expected);
        }
      };
    }
  }
};

// src/lib/tiposkripto/tests/calculator/Calculator.test.specification.ts
var specification = (Given, When, Then, Describe, It, Confirm, Value, Should) => {
  return [
    // TDT pattern: Confirm creates a BaseConfirm instance
    Confirm["addition"]()(
      [
        [Value.of([1, 1]), Should.beEqualTo(2222)],
        [Value.of([2, 3]), Should.beGreaterThan(4)]
      ],
      ["./Readme.md"]
    ),
    // AAA pattern: Describe creates a BaseDescribe instance
    Describe["another simple calculator"]("some input")(
      [
        It["can save 1 memory"](),
        It["can save 2 memories"]()
      ],
      ["./Readme.md"]
    ),
    // BDD pattern: Given creates a BaseGiven instance
    Given.Default("some input")(
      [
        When.press("5"),
        When.press("+"),
        When.press("3"),
        When.enter()
      ],
      [Then.result("8")],
      ["./Readme.md"]
    ),
    Confirm["addition"]()(
      [
        [Value.of([3, 3]), Should.beEqualTo(3)]
      ],
      ["./Readme.md"]
    ),
    Confirm["addition"]()(
      [
        [Value.of([3, 32]), Should.beEqualTo(32)]
      ],
      ["./Readme.md"]
    ),
    Confirm["addition"]()(
      [
        [Value.of([3, 332]), Should.beEqualTo(332)]
      ],
      ["./Readme.md"]
    )
  ];
};

// src/lib/tiposkripto/tests/calculator/Calculator.test.node.ts
var Calculator_test_node_default = new NodeTiposkripto(
  Calculator,
  specification,
  implementation,
  adapter,
  { ports: 1e3 }
);
export {
  Calculator_test_node_default as default
};
