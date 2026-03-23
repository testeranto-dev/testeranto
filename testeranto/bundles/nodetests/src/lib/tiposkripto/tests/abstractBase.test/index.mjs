import {
  BaseGiven,
  BaseThen,
  BaseWhen,
  NodeTiposkripto,
  defaultTestResourceRequirement
} from "../../../../../chunk-PN7EUBDN.mjs";

// src/lib/tiposkripto/tests/abstractBase.test/adapter.ts
var testAdapter = {
  // Universal adapter methods
  prepareAll: async (input, testResource, artifactory) => {
    return input;
  },
  prepareEach: async (subject, initializer, testResource, initialValues, artifactory) => {
    if (typeof initializer !== "function") {
      throw new Error(`initializer is not a function: ${typeof initializer}`);
    }
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
  cleanupAll: async (store, artifactory) => {
  },
  assert: (x) => !!x
};

// src/lib/tiposkripto/tests/abstractBase.test/implementation.ts
var implementation = {
  suites: {
    Default: "Abstract Base Test Suite"
  },
  givens: {
    Default: () => () => ({
      testStore: { value: "initial" },
      testSelection: { selected: true }
    }),
    WithError: () => () => ({
      testStore: { value: "error" },
      testSelection: { selected: false }
    })
  },
  whens: {
    modifyStore: (newValue) => (store) => ({
      ...store,
      testStore: { value: newValue }
    }),
    throwError: () => (store) => {
      throw new Error("Test error");
    }
  },
  thens: {
    verifyStore: (expected) => (store) => {
      if (store.testStore.value !== expected) {
        throw new Error(`Expected ${expected}, got ${store.testStore.value}`);
      }
      return store;
    },
    verifyError: (expected) => (store) => {
      if (!store.error || !store.error.message.includes(expected)) {
        throw new Error(`Expected error "${expected}" not found`);
      }
      return store;
    }
  },
  describes: {
    Default: () => () => ({
      testStore: { value: "initial" },
      testSelection: { selected: true }
    }),
    WithError: () => () => ({
      testStore: { value: "error" },
      testSelection: { selected: false }
    })
  },
  its: {
    ["modifies and verifies the store"]: () => (selection) => {
      return true;
    }
  },
  confirms: {
    Default: () => () => ({
      testStore: { value: "initial" },
      testSelection: { selected: true }
    })
  },
  values: {
    first: () => () => ({
      testStore: { value: "initial" },
      testSelection: { selected: true }
    })
  },
  shoulds: {
    equal: () => (selection) => {
      return true;
    }
  },
  expecteds: {
    ["2"]: () => async (selection) => {
      return true;
    }
  }
};

// src/lib/tiposkripto/tests/abstractBase.test/MockGiven.ts
var MockGiven = class extends BaseGiven {
  constructor(name, features, whens, thens, givenCB, initialValues) {
    super(name, features, whens, thens, givenCB, initialValues);
  }
  async givenThat(subject, testResourceConfiguration, artifactory, givenCB, initialValues) {
    const result = givenCB();
    if (typeof result === "function") {
      return result();
    }
    return result;
  }
  uberCatcher(e) {
    console.error("MockGiven error:", e);
    this.error = e;
  }
};

// src/lib/tiposkripto/tests/abstractBase.test/MockThen.ts
var MockThen = class extends BaseThen {
  constructor(name, thenCB) {
    super(name, thenCB);
  }
  async butThen(store, thenCB, testResourceConfiguration, artifactory) {
    const selection = { testSelection: store.testSelection };
    return thenCB(selection);
  }
};

// src/lib/tiposkripto/tests/abstractBase.test/MockWhen.ts
var MockWhen = class extends BaseWhen {
  constructor(name, whenCB) {
    super(name, whenCB);
  }
  async andWhen(store, whenCB, testResource, artifactory) {
    const result = whenCB(store);
    if (typeof result === "function") {
      return result(store);
    }
    return result;
  }
};

// src/lib/tiposkripto/tests/abstractBase.test/specification.ts
var specification = (Suite, Given, When, Then, Describe, It, Confirm, Value, Should, Expect) => [
  Suite.Default("BaseGiven Tests", {
    aaa_style: Describe.Default(
      ["someFEatures"],
      It["modifies and verifies the store"]()
    ),
    tdt_style: Confirm.Default(
      ["someFEatures"],
      [Value.first, Should.equal, Expect["2"]]
    ),
    initialization: Given.Default(
      ["Should initialize with default values"],
      [],
      [Then.verifyStore("initial")]
    ),
    errorHandling: Given.WithError(
      ["Should handle errors properly"],
      [When.throwError()],
      [Then.verifyError("Test error")]
    )
  }),
  Suite.Default("BaseWhen Test", {
    stateModification: Given.Default(
      ["Should modify state correctly"],
      [When.modifyStore("modified")],
      [Then.verifyStore("modified")]
    ),
    errorPropagation: Given.Default(
      ["Should propagate errors"],
      [When.throwError()],
      [Then.verifyError("Test error")]
    )
  }),
  Suite.Default("BaseThen Tests", {
    assertionPassing: Given.Default(
      ["Should pass valid assertions"],
      [When.modifyStore("asserted")],
      [Then.verifyStore("asserted")]
    ),
    assertionFailing: Given.Default(
      ["Should fail invalid assertions"],
      [When.modifyStore("wrong")],
      [Then.verifyStore("right")]
      // This should fail
    )
  })
];

// src/lib/tiposkripto/tests/abstractBase.test/index.ts
var abstractBase_default = new NodeTiposkripto(
  {
    MockGiven,
    MockWhen,
    MockThen
  },
  specification,
  implementation,
  defaultTestResourceRequirement,
  testAdapter
);
export {
  abstractBase_default as default
};
