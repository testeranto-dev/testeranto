import tiposkripto from "../src/Node.js";
import { AAA } from "../src/index.js";
import { TestTypeParams, TestSpecShape, ITestImplementation, ITestAdapter } from "../src/CoreTypes.js";

// Test subject
class Counter {
  private count: number = 0;
  
  increment(by: number = 1) {
    this.count += by;
  }
  
  decrement(by: number = 1) {
    this.count -= by;
  }
  
  getCount(): number {
    return this.count;
  }
}

// Define types for our test
type I = TestTypeParams<
  null,
  Counter,
  Counter,
  Counter,
  () => Counter,
  (counter: Counter) => Counter,
  (counter: Counter) => Counter
>;

type O = TestSpecShape<
  { Default: [string] },
  { Default: [] },
  { increment: [number]; decrement: [number] },
  { countIs: [number] }
>;

type M = {
  givens: {
    Default: () => Counter;
  };
  whens: {
    increment: (by: number) => (counter: Counter) => Counter;
    decrement: (by: number) => (counter: Counter) => Counter;
  };
  thens: {
    countIs: (expected: number) => (counter: Counter) => Counter;
  };
};

// Implementation using AAA pattern
const implementation: ITestImplementation<I, O, M> = {
  suites: {
    Default: "Counter test suite"
  },
  givens: {
    Default: () => new Counter()
  },
  whens: {
    increment: (by: number) => (counter) => {
      counter.increment(by);
      return counter;
    },
    decrement: (by: number) => (counter) => {
      counter.decrement(by);
      return counter;
    }
  },
  thens: {
    countIs: (expected: number) => (counter) => {
      if (counter.getCount() !== expected) {
        throw new Error(`Expected count ${expected}, got ${counter.getCount()}`);
      }
      return counter;
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

// Specification using AAA helpers
const { Suite, Arrange, Act, Assert } = AAA<I, O>();

const specification = (Suite: any, Arrange: any, Act: any, Assert: any) => [
  Suite.Default("Counter AAA Tests", {
    testIncrement: Arrange.Default(
      ["Counter should increment correctly"],
      [Act.Default("increment by 5", (counter) => {
        counter.increment(5);
        return counter;
      })],
      [Assert.Default("count should be 5", async (counter) => {
        if (counter.getCount() !== 5) throw new Error("Expected 5");
        return counter;
      })]
    ),
    testDecrement: Arrange.Default(
      ["Counter should decrement correctly"],
      [Act.Default("decrement by 3", (counter) => {
        counter.decrement(3);
        return counter;
      })],
      [Assert.Default("count should be -3", async (counter) => {
        if (counter.getCount() !== -3) throw new Error("Expected -3");
        return counter;
      })]
    )
  })
];

// Run the test
export default tiposkripto<I, O, M>(
  new Counter(),
  specification,
  implementation,
  adapter
);
