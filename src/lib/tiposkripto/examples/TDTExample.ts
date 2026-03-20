import tiposkripto from "../src/Node.js";
import { TDT } from "../src/index.js";
import { TestTypeParams, TestSpecShape, ITestImplementation, ITestAdapter } from "../src/CoreTypes.js";

// Test subject
class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
  
  multiply(a: number, b: number): number {
    return a * b;
  }
}

// Define types for our test
type I = TestTypeParams<
  null,
  Calculator,
  Calculator,
  Calculator,
  () => Calculator,
  (calc: Calculator) => Calculator,
  (calc: Calculator) => Calculator
>;

type O = TestSpecShape<
  { Default: [string] },
  { Default: [] },
  { add: [number, number]; multiply: [number, number] },
  { resultIs: [number] }
>;

type M = {
  givens: {
    Default: () => Calculator;
  };
  whens: {
    add: (a: number, b: number) => (calc: Calculator) => Calculator;
    multiply: (a: number, b: number) => (calc: Calculator) => Calculator;
  };
  thens: {
    resultIs: (expected: number) => (calc: Calculator) => Calculator;
  };
};

// Implementation using TDT pattern
const implementation: ITestImplementation<I, O, M> = {
  suites: {
    Default: "Calculator TDT test suite"
  },
  givens: {
    Default: () => new Calculator()
  },
  whens: {
    add: (a: number, b: number) => (calc) => {
      // Store the result in the calculator or somewhere accessible
      (calc as any).lastResult = calc.add(a, b);
      return calc;
    },
    multiply: (a: number, b: number) => (calc) => {
      (calc as any).lastResult = calc.multiply(a, b);
      return calc;
    }
  },
  thens: {
    resultIs: (expected: number) => (calc) => {
      if ((calc as any).lastResult !== expected) {
        throw new Error(`Expected ${expected}, got ${(calc as any).lastResult}`);
      }
      return calc;
    }
  }
};

// Adapter (same as BDD)
const adapter: Partial<ITestAdapter<I>> = {
  beforeEach: async (subject, initializer) => {
    return initializer();
  },
  andWhen: async (store, whenCB) => {
    return whenCB(store);
  },
  butThen: async (store, thenCB) => {
    return thenCB(store);
  }
};

// Specification using TDT helpers
const { Suite, Map, Feed, Validate } = TDT<I, O>();

// Define test table data
const additionTable = [
  { a: 1, b: 2, expected: 3 },
  { a: 5, b: 3, expected: 8 },
  { a: -1, b: 1, expected: 0 }
];

const multiplicationTable = [
  { a: 2, b: 3, expected: 6 },
  { a: 4, b: 5, expected: 20 },
  { a: -2, b: 3, expected: -6 }
];

const specification = (Suite: any, Map: any, Feed: any, Validate: any) => [
  Suite.Default("Calculator TDT Tests", {
    testAddition: Map.Default(
      ["Table-driven addition tests"],
      [
        Feed.Default("add row", (calc: Calculator, row: any) => {
          (calc as any).lastResult = calc.add(row.a, row.b);
          return calc;
        })
      ],
      [
        Validate.Default("result matches expected", async (calc: Calculator, row: any) => {
          if ((calc as any).lastResult !== row.expected) {
            throw new Error(`Expected ${row.expected}, got ${(calc as any).lastResult}`);
          }
          return calc;
        })
      ],
      () => new Calculator(),
      null,
      additionTable
    ),
    testMultiplication: Map.Default(
      ["Table-driven multiplication tests"],
      [
        Feed.Default("multiply row", (calc: Calculator, row: any) => {
          (calc as any).lastResult = calc.multiply(row.a, row.b);
          return calc;
        })
      ],
      [
        Validate.Default("result matches expected", async (calc: Calculator, row: any) => {
          if ((calc as any).lastResult !== row.expected) {
            throw new Error(`Expected ${row.expected}, got ${(calc as any).lastResult}`);
          }
          return calc;
        })
      ],
      () => new Calculator(),
      null,
      multiplicationTable
    )
  })
];

// Run the test
export default tiposkripto<I, O, M>(
  new Calculator(),
  specification,
  implementation,
  adapter
);
