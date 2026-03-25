
import type { ITestAdapter } from "../../src/CoreTypes.js";
import type { I } from "./types.js";

export const testAdapter: ITestAdapter<I> = {
  // Universal adapter methods
  prepareAll: async (input, testResource, artifactory) => {
    return input as any;
  },
  prepareEach: async (subject, initializer, testResource, initialValues, artifactory) => {
    // initializer should be a function that returns I["given"]
    // I["given"] is () => () => { testStore: ... }
    if (typeof initializer !== 'function') {
      throw new Error(`initializer is not a function: ${typeof initializer}`);
    }
    // initializer doesn't take initialValues in this test implementation
    const givenFunc = initializer();
    if (typeof givenFunc === "function") {
      const storeFunc = givenFunc();
      if (typeof storeFunc === "function") {
        return storeFunc();
      }
      return storeFunc;
    }
    return givenFunc;
  },
  execute: async (store, actionCB, testResource, artifactory) => {
    return actionCB(store);
  },
  verify: async (store, checkCB, testResource, artifactory) => {
    return checkCB(store);
  },
  cleanupEach: async (store, key, artifactory) => Promise.resolve(store),
  cleanupAll: async (store, artifactory) => { },
  assert: (x) => !!x,
};
