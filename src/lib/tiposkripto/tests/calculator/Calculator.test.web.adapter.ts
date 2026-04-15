import type { ITestAdapter } from "../../src/CoreTypes";
import type { I } from "../Rectangle/Rectangle.test.adapter";

export const adapter: ITestAdapter<I, "web"> = {
  prepareAll: async (input, testResource, artifactory) => {
    console.log("[adapter] beforeAll called with input:", input);
    return input;
  },
  prepareEach: async (subject, initializer, testResource, initialValues, artifactory) => {
    console.log("[adapter] beforeEach called with subject:", subject);
    // Trust the type contract: initializer is a function that returns the store
    const calculator = initializer(subject);
    console.log("[adapter] beforeEach created calculator:", calculator);
    return calculator;
  },
  execute: async (store, whenCB, testResource, artifactory) => {
    console.log("[adapter] andWhen called with store:", store);
    if (!store) {
      throw new Error("Store is undefined in andWhen");
    }
    const updatedStore = whenCB(store);
    console.log("[adapter] andWhen updated store:", updatedStore);
    // Ensure we always return a valid store
    return updatedStore || store;
  },
  verify: async (store, thenCB, testResource, artifactory) => {
    console.log("[adapter] butThen called with store:", store);
    if (!store) {
      throw new Error("Store is undefined in butThen");
    }
    // Call the assertion function with the store
    // This will perform the assertion (e.g., assert.equal)
    console.log("[adapter] butThen calling thenCB with store");
    thenCB(store);

    // Return the store itself
    return store;
  },
  cleanupEach: async (store, key, artifactory) => {
    console.log("[adapter] afterEach called with store:", store);
    return store;
  },
  cleanupAll: async (store, artifactory) => {
    console.log("afterAll called, but skipping web-only storage operations in Node.js");
    artifactory.writeFileSync("foo", "bar")
    artifactory.screenshot("screenshot")
    return store;
  },
  assert: (actual: string) => {
    console.log("[adapter] assertThis called with actual:", actual);
    return actual;
  },
};
