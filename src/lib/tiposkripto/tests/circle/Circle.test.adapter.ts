import type { ITestAdapter } from "../../src/CoreTypes.js";
import type { ICircleNode } from "./Circle.test.types.js";

export const adapter: ITestAdapter<ICircleNode> = {
  prepareAll: async (input, testResource, artifactory) => {
    console.log("[Circle adapter] beforeAll called with input:", input);
    return input;
  },
  prepareEach: async (
    subject,
    initializer,
    testResource,
    initialValues,
    artifactory,
  ) => {
    console.log("[Circle adapter] beforeEach called with subject:", subject);
    // Call initializer with appropriate arguments
    let circle;
    if (initializer.length === 0) {
      circle = initializer();
    } else if (initializer.length === 1) {
      // Try subject first (for implementations like (input: typeof Circle) => new input())
      circle = initializer(subject);
    } else {
      // Default: call with no arguments
      circle = initializer();
    }
    console.log("[Circle adapter] beforeEach created circle:", circle);
    return circle;
  },
  execute: async (store, whenCB, testResource, artifactory) => {
    console.log("[Circle adapter] andWhen called with store:", store);
    const result = whenCB(store);
    console.log("[Circle adapter] andWhen result:", result);
    return result;
  },
  verify: async (store, verificationFn, testResource, artifactory) => {
    console.log("[Circle adapter] verify called with store:", store);
    console.log("[Circle adapter] verificationFn:", verificationFn);
    
    if (typeof verificationFn === 'function') {
      // Call verificationFn with store to perform assertion
      await verificationFn(store);
      // Return the store (truthy value) to indicate success
      return store;
    }
    return store;
  },
  cleanupEach: async (store, key, artifactory) => {
    console.log("[Circle adapter] afterEach called with store:", store);
    return store;
  },
  cleanupAll: async (store, artifactory) => {
    console.log("[Circle adapter] afterAll called");
    return store;
  },
  assert: (actual: any) => {
    console.log("[Circle adapter] assert called with actual:", actual);
    return actual;
  },
};
