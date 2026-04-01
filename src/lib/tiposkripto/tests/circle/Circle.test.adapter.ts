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
    const circle = initializer();
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
      try {
        const actualVerificationFn = verificationFn();
        
        if (typeof actualVerificationFn === 'function') {
          return actualVerificationFn(store);
        } else {
          return verificationFn;
        }
      } catch (e) {
        console.log("[Circle adapter] Error in verify:", e);
        throw e;
      }
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
