
import type { ITestAdapter } from "../../src/CoreTypes.js";
import type { I } from "./types.js";

export const testAdapter: ITestAdapter<I> = {
  // Universal adapter methods
  prepareAll: async (input, testResource, artifactory) => {
    return input as any;
  },
  prepareEach: async (subject, initializer, testResource, initialValues, artifactory) => {
    // Trust the type contract: initializer is a function that returns the store
    const store = initializer(subject);
    return store;
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
