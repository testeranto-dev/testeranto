import assert from "node:assert";
import type { ITestImplementation } from "../../src/CoreTypes";

import type { I, O } from "./types";

export const implementation: ITestImplementation<I, O> = {
  suites: {
    Default: "Abstract Base Test Suite",
  },

  givens: {
    Default: () => () => ({
      testStore: { value: "initial" },
      testSelection: { selected: true },
    }),
    WithError: () => () => ({
      testStore: { value: "error" },
      testSelection: { selected: false },
    }),
  },

  whens: {
    modifyStore: (newValue: string) => (store: any) => ({
      ...store,
      testStore: { value: newValue },
    }),
    throwError: () => (store: any) => {
      throw new Error("Test error");
    },
  },

  thens: {
    verifyStore: (expected: string) => (store: any) => {
      if (store.testStore.value !== expected) {
        throw new Error(`Expected ${expected}, got ${store.testStore.value}`);
      }
      return store;
    },
    verifyError: (expected: string) => (store: any) => {
      if (!store.error || !store.error.message.includes(expected)) {
        throw new Error(`Expected error "${expected}" not found`);
      }
      return store;
    },
  },



  describes: {
    Default: ({
      testStore: { value: "initial" },
      testSelection: { selected: true },
    }),
    WithError: ({
      testStore: { value: "error" },
      testSelection: { selected: false },
    }),
  },

  its: {
    ['modifies and verifies the store']: () => {
      // TODO
    }
  },


  confirms: {
    Default: () => ({
      testStore: { value: "initial" },
      testSelection: { selected: true },
    }),
  },

  values: {
    first: 1
  },

  shoulds: {
    equal: assert,
  },

  expecteds: {
    ['2']: 2
  }



};
