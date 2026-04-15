// import type { ITestAdapter } from "../../src/public/CoreTypes.js";
import type { ITestAdapter } from "../../src/CoreTypes.js";
import type { ICalculatorNode } from "./Calculator.test.types.js";

export const adapter: ITestAdapter<ICalculatorNode> = {
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
