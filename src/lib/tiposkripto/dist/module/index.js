// src/BaseSetup.ts
var BaseSetup = class {
  constructor(features, actions, checks, setupCB, initialValues) {
    this.artifacts = [];
    this.fails = 0;
    this.features = features;
    this.actions = actions;
    this.checks = checks;
    this.setupCB = setupCB;
    this.initialValues = initialValues;
    this.fails = 0;
    this.failed = false;
    this.error = null;
    this.store = null;
    this.key = "";
    this.status = void 0;
  }
  addArtifact(path) {
    if (typeof path !== "string") {
      throw new Error(
        `[ARTIFACT ERROR] Expected string, got ${typeof path}: ${JSON.stringify(
          path
        )}`
      );
    }
    const normalizedPath = path.replace(/\\/g, "/");
    this.artifacts.push(normalizedPath);
  }
  toObj() {
    return {
      key: this.key,
      actions: (this.actions || []).map((a) => {
        if (a && a.toObj) return a.toObj();
        console.error("Action step is not as expected!", JSON.stringify(a));
        return {};
      }),
      checks: (this.checks || []).map((c) => c && c.toObj ? c.toObj() : {}),
      error: this.error ? [this.error, this.error.stack] : null,
      failed: this.failed,
      features: this.features || [],
      artifacts: this.artifacts,
      status: this.status
    };
  }
  async afterEach(store, key, artifactory) {
    return store;
  }
  async setup(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx) {
    this.key = key;
    this.fails = 0;
    const actualArtifactory = artifactory || ((fPath, value) => {
    });
    const setupArtifactory = (fPath, value) => actualArtifactory(`setup-${key}/${fPath}`, value);
    try {
      this.store = await this.setupThat(
        subject,
        testResourceConfiguration,
        setupArtifactory,
        this.setupCB,
        this.initialValues
      );
      this.status = true;
    } catch (e) {
      this.status = false;
      this.failed = true;
      this.fails++;
      this.error = e;
      return this.store;
    }
    try {
      for (const [actionNdx, actionStep] of (this.actions || []).entries()) {
        try {
          this.store = await actionStep.test(
            this.store,
            testResourceConfiguration
          );
        } catch (e) {
          this.failed = true;
          this.fails++;
          this.error = e;
        }
      }
      for (const [checkNdx, checkStep] of this.checks.entries()) {
        try {
          const filepath = suiteNdx !== void 0 ? `suite-${suiteNdx}/setup-${key}/check-${checkNdx}` : `setup-${key}/check-${checkNdx}`;
          const t = await checkStep.test(
            this.store,
            testResourceConfiguration,
            filepath
          );
          tester(t);
        } catch (e) {
          this.failed = true;
          this.fails++;
          this.error = e;
        }
      }
    } catch (e) {
      this.error = e;
      this.failed = true;
      this.fails++;
    } finally {
      try {
        await this.afterEach(this.store, this.key, setupArtifactory);
      } catch (e) {
        this.failed = true;
        this.fails++;
        this.error = e;
      }
    }
    return this.store;
  }
};

// src/BaseAction.ts
var BaseAction = class {
  constructor(name, actionCB) {
    this.artifacts = [];
    this.name = name;
    this.actionCB = actionCB;
  }
  addArtifact(path) {
    if (typeof path !== "string") {
      throw new Error(
        `[ARTIFACT ERROR] Expected string, got ${typeof path}: ${JSON.stringify(
          path
        )}`
      );
    }
    const normalizedPath = path.replace(/\\/g, "/");
    this.artifacts.push(normalizedPath);
  }
  toObj() {
    const obj = {
      name: this.name,
      status: this.status,
      error: this.error ? `${this.error.name}: ${this.error.message}
${this.error.stack}` : null,
      artifacts: this.artifacts
    };
    return obj;
  }
  async test(store, testResourceConfiguration) {
    try {
      const result = await this.performAction(
        store,
        this.actionCB,
        testResourceConfiguration
      );
      this.status = true;
      return result;
    } catch (e) {
      this.status = false;
      this.error = e;
      throw e;
    }
  }
};

// src/BaseCheck.ts
var BaseCheck = class {
  constructor(name, checkCB) {
    this.artifacts = [];
    this.name = name;
    this.checkCB = checkCB;
    this.error = false;
    this.artifacts = [];
  }
  addArtifact(path) {
    if (typeof path !== "string") {
      throw new Error(
        `[ARTIFACT ERROR] Expected string, got ${typeof path}: ${JSON.stringify(
          path
        )}`
      );
    }
    const normalizedPath = path.replace(/\\/g, "/");
    this.artifacts.push(normalizedPath);
  }
  toObj() {
    const obj = {
      name: this.name,
      error: this.error,
      artifacts: this.artifacts,
      status: this.status
    };
    return obj;
  }
  async test(store, testResourceConfiguration, filepath) {
    const addArtifact = this.addArtifact.bind(this);
    try {
      const x = await this.verifyCheck(
        store,
        async (s) => {
          try {
            if (typeof this.checkCB === "function") {
              const result = await this.checkCB(s);
              return result;
            } else {
              return this.checkCB;
            }
          } catch (e) {
            this.error = true;
            throw e;
          }
        },
        testResourceConfiguration
      );
      this.status = true;
      return x;
    } catch (e) {
      this.status = false;
      this.error = true;
      throw e;
    }
  }
};

// src/BaseArrange.ts
var BaseArrange = class extends BaseSetup {
  constructor(features, acts, asserts, arrangeCB, initialValues) {
    super(features, acts, asserts, arrangeCB, initialValues);
  }
  // Alias setup to arrange for AAA pattern
  async arrange(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx) {
    return super.setup(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx);
  }
};

// src/BaseAct.ts
var BaseAct = class extends BaseAction {
  constructor(name, actCB) {
    super(name, actCB);
  }
  // Alias performAction to performAct for AAA pattern
  async performAct(store, actCB, testResource) {
    return super.performAction(store, actCB, testResource);
  }
  // Alias test to act for AAA pattern
  async act(store, testResourceConfiguration) {
    return super.test(store, testResourceConfiguration);
  }
};

// src/BaseAssert.ts
var BaseAssert = class extends BaseCheck {
  constructor(name, assertCB) {
    super(name, assertCB);
  }
  // Alias verifyCheck to verifyAssert for AAA pattern
  async verifyAssert(store, assertCB, testResourceConfiguration) {
    return super.verifyCheck(store, assertCB, testResourceConfiguration);
  }
  // Alias test to verify for AAA pattern
  async verify(store, testResourceConfiguration, filepath) {
    return super.test(store, testResourceConfiguration, filepath);
  }
};

// src/BaseMap.ts
var BaseMap = class extends BaseSetup {
  constructor(features, feeds, validates, mapCB, initialValues, tableData = []) {
    super(features, feeds, validates, mapCB, initialValues);
    this.tableData = tableData;
  }
  // Alias setup to map for TDT pattern
  async map(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx) {
    return super.setup(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx);
  }
  // Method to get table data
  getTableData() {
    return this.tableData || [];
  }
};

// src/BaseFeed.ts
var BaseFeed = class extends BaseAction {
  constructor(name, feedCB) {
    super(name, feedCB);
    // Row index being processed
    this.rowIndex = -1;
    this.rowData = null;
  }
  // Set the current row data before processing
  setRowData(index, data) {
    this.rowIndex = index;
    this.rowData = data;
  }
  // Alias performAction to feed for TDT pattern
  async feed(store, feedCB, testResource) {
    return super.performAction(store, feedCB, testResource);
  }
  // Alias test to processRow for TDT pattern
  async processRow(store, testResourceConfiguration, rowIndex, rowData) {
    this.setRowData(rowIndex, rowData);
    return super.test(store, testResourceConfiguration);
  }
};

// src/BaseValidate.ts
var BaseValidate = class extends BaseCheck {
  constructor(name, validateCB) {
    super(name, validateCB);
    // Expected result for the current row
    this.expectedResult = null;
  }
  // Set expected result before validation
  setExpectedResult(expected) {
    this.expectedResult = expected;
  }
  // Alias verifyCheck to validate for TDT pattern
  async validate(store, validateCB, testResourceConfiguration) {
    return super.verifyCheck(store, validateCB, testResourceConfiguration);
  }
  // Alias test to check for TDT pattern
  async check(store, testResourceConfiguration, filepath, expectedResult) {
    this.setExpectedResult(expectedResult);
    return super.test(store, testResourceConfiguration, filepath);
  }
};

// src/BaseGiven.ts
var BaseGiven = class extends BaseSetup {
  constructor(features, whens, thens, givenCB, initialValues) {
    super(features, whens, thens, givenCB, initialValues);
    this.artifacts = [];
    this.fails = 0;
  }
  addArtifact(path) {
    if (typeof path !== "string") {
      throw new Error(
        `[ARTIFACT ERROR] Expected string, got ${typeof path}: ${JSON.stringify(
          path
        )}`
      );
    }
    const normalizedPath = path.replace(/\\/g, "/");
    this.artifacts.push(normalizedPath);
  }
  beforeAll(store) {
    return store;
  }
  toObj() {
    return {
      key: this.key,
      whens: (this.whens || []).map((w) => {
        if (w && w.toObj) return w.toObj();
        console.error("When step is not as expected!", JSON.stringify(w));
        return {};
      }),
      thens: (this.thens || []).map((t) => t && t.toObj ? t.toObj() : {}),
      error: this.error ? [this.error, this.error.stack] : null,
      failed: this.failed,
      features: this.features || [],
      artifacts: this.artifacts,
      status: this.status
    };
  }
  // Implement BaseSetup's abstract method
  async setupThat(subject, testResourceConfiguration, artifactory, setupCB, initialValues) {
    return this.givenThat(subject, testResourceConfiguration, artifactory, setupCB, initialValues);
  }
  async afterEach(store, key, artifactory) {
    return store;
  }
  async give(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx) {
    this.key = key;
    this.fails = 0;
    const actualArtifactory = artifactory || ((fPath, value) => {
    });
    const givenArtifactory = (fPath, value) => actualArtifactory(`given-${key}/${fPath}`, value);
    try {
      this.store = await this.givenThat(
        subject,
        testResourceConfiguration,
        givenArtifactory,
        this.givenCB,
        this.initialValues
      );
      this.status = true;
    } catch (e) {
      this.status = false;
      this.failed = true;
      this.fails++;
      this.error = e;
      return this.store;
    }
    try {
      const whens = this.whens || [];
      for (const [whenNdx, whenStep] of whens.entries()) {
        try {
          this.store = await whenStep.test(
            this.store,
            testResourceConfiguration
          );
        } catch (e) {
          this.failed = true;
          this.fails++;
          this.error = e;
        }
      }
      for (const [thenNdx, thenStep] of this.thens.entries()) {
        try {
          const filepath = suiteNdx !== void 0 ? `suite-${suiteNdx}/given-${key}/then-${thenNdx}` : `given-${key}/then-${thenNdx}`;
          const t = await thenStep.test(
            this.store,
            testResourceConfiguration,
            filepath
          );
          tester(t);
        } catch (e) {
          this.failed = true;
          this.fails++;
          this.error = e;
        }
      }
    } catch (e) {
      this.error = e;
      this.failed = true;
      this.fails++;
    } finally {
      try {
        await this.afterEach(this.store, this.key, givenArtifactory);
      } catch (e) {
        this.failed = true;
        this.fails++;
        this.error = e;
      }
    }
    return this.store;
  }
};

// src/BaseWhen.ts
var BaseWhen = class extends BaseAction {
  constructor(name, whenCB) {
    super(name, whenCB);
    this.whenCB = whenCB;
  }
  // Implement BaseAction's abstract method
  async performAction(store, actionCB, testResource) {
    return this.andWhen(store, actionCB, testResource);
  }
  async test(store, testResourceConfiguration) {
    try {
      const result = await this.andWhen(
        store,
        this.whenCB,
        testResourceConfiguration
        // proxiedPm
      );
      this.status = true;
      return result;
    } catch (e) {
      this.status = false;
      this.error = e;
      throw e;
    }
  }
};

// src/BaseThen.ts
var BaseThen = class extends BaseCheck {
  constructor(name, thenCB) {
    super(name, thenCB);
    this.thenCB = thenCB;
  }
  async test(store, testResourceConfiguration, filepath) {
    const addArtifact = this.addArtifact.bind(this);
    try {
      const x = await this.butThen(
        store,
        async (s) => {
          try {
            if (typeof this.thenCB === "function") {
              const result = await this.thenCB(s);
              return result;
            } else {
              return this.thenCB;
            }
          } catch (e) {
            this.error = true;
            throw e;
          }
        },
        testResourceConfiguration
        // proxiedPm
      );
      this.status = true;
      return x;
    } catch (e) {
      this.status = false;
      this.error = true;
      throw e;
    }
  }
};

// src/index.ts
var BaseAdapter = () => ({
  prepareAll: async (input, testResource) => {
    return input;
  },
  prepareEach: async function(subject, initializer, testResource, initialValues) {
    return subject;
  },
  cleanupEach: async (store, key) => Promise.resolve(store),
  cleanupAll: (store) => void 0,
  verify: async (store, checkCb, testResource) => {
    return checkCb(store);
  },
  execute: async (store, actionCB, testResource) => {
    return actionCB(store);
  },
  assert: (x) => x
});
var DefaultAdapter = (p) => {
  const base = BaseAdapter();
  return {
    ...base,
    ...p
  };
};
function createAAASpecification(Suite, Arrange, Act, Assert) {
  return {
    // Create a suite with AAA pattern
    Suite: {
      Default: (name, arrangements) => {
        const givens = {};
        for (const [key, arrangement] of Object.entries(arrangements)) {
          const { features, acts, asserts, arrangeCB, initialValues } = arrangement;
          givens[key] = Arrange.Default(features, acts, asserts, arrangeCB, initialValues);
        }
        return Suite.Default(name, givens);
      }
    },
    // Arrange maps to Given
    Arrange: {
      Default: (features, acts, asserts, arrangeCB, initialValues) => {
        return Arrange.Default(features, acts, asserts, arrangeCB, initialValues);
      }
    },
    // Act maps to When
    Act: {
      Default: (name, actCB) => {
        return Act.Default(name, actCB);
      }
    },
    // Assert maps to Then
    Assert: {
      Default: (name, assertCB) => {
        return Assert.Default(name, assertCB);
      }
    }
  };
}
function createTDTSpecification(Suite, Map, Feed, Validate) {
  return {
    // Create a suite with TDT pattern
    Suite: {
      Default: (name, maps) => {
        const givens = {};
        for (const [key, map] of Object.entries(maps)) {
          const { features, feeds, validates, mapCB, initialValues, tableData } = map;
          givens[key] = Map.Default(features, feeds, validates, mapCB, initialValues, tableData);
        }
        return Suite.Default(name, givens);
      }
    },
    // Map maps to Given
    Map: {
      Default: (features, feeds, validates, mapCB, initialValues, tableData = []) => {
        return Map.Default(features, feeds, validates, mapCB, initialValues, tableData);
      }
    },
    // Feed maps to When
    Feed: {
      Default: (name, feedCB) => {
        return Feed.Default(name, feedCB);
      }
    },
    // Validate maps to Then
    Validate: {
      Default: (name, validateCB) => {
        return Validate.Default(name, validateCB);
      }
    }
  };
}
var AAA = createAAASpecification;
var TDT = createTDTSpecification;
export {
  AAA,
  BaseAct,
  BaseAction,
  BaseAdapter,
  BaseArrange,
  BaseAssert,
  BaseCheck,
  BaseFeed,
  BaseGiven,
  BaseMap,
  BaseSetup,
  BaseThen,
  BaseValidate,
  BaseWhen,
  DefaultAdapter,
  TDT,
  createAAASpecification,
  createTDTSpecification
};
