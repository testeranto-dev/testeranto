// import type { ITestAdapter } from "../../src/public/CoreTypes.js";
import type { ITestAdapter } from "../../src/CoreTypes.js";
import type { ICalculatorNode } from "./treeFilter.test.types.js";

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
    // initializer is () => Calculator, so call it
    const calculator = initializer();
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

    // For TDT pattern, verificationFn might be wrapped differently
    // It should be a function that returns a verification function
    if (typeof verificationFn === 'function') {
      try {
        // Call verificationFn to get the actual verification function
        const actualVerificationFn = verificationFn();

        if (typeof actualVerificationFn === 'function') {
          // The verification function might expect (store) or (input, fn)
          // Try to call it with store
          try {
            return actualVerificationFn(store);
          } catch (e) {
            // If that fails, it might expect (input, fn)
            // For TDT, the input and fn should be provided by BaseConfirm
            // We'll let BaseConfirm handle this wrapping
            console.log("[adapter] verificationFn expects different signature:", e.message);
            throw e;
          }
        } else {
          // If verificationFn doesn't return a function, use it directly
          return verificationFn;
        }
      } catch (e) {
        console.log("[adapter] Error in verify:", e);
        throw e;
      }
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
