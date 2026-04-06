// src/lib/tiposkripto/src/Node.ts
import fs from "fs";
import path from "path";

// src/lib/tiposkripto/src/Adapters.ts
var BaseAdapter = () => ({
  prepareAll: async (input, testResource, artifactory) => {
    return input;
  },
  prepareEach: async function(subject, initializer, testResource, initialValues, artifactory) {
    return subject;
  },
  cleanupEach: async (store, key, artifactory) => Promise.resolve(store),
  cleanupAll: (store, artifactory) => void 0,
  verify: async (store, checkCb, testResource, artifactory) => {
    return checkCb(store);
  },
  execute: async (store, actionCB, testResource, artifactory) => {
    return actionCB(store);
  },
  assert: (x) => x
});
var DefaultAdapter = (p) => {
  const base = BaseAdapter();
  const adapter = {
    prepareAll: p.prepareAll || base.prepareAll,
    prepareEach: p.prepareEach || base.prepareEach,
    execute: p.execute || base.execute,
    verify: p.verify || base.verify,
    cleanupEach: p.cleanupEach || base.cleanupEach,
    cleanupAll: p.cleanupAll || base.cleanupAll,
    assert: p.assert || base.assert
  };
  return adapter;
};

// src/lib/tiposkripto/src/types.ts
var defaultTestResourceRequirement = {
  ports: 0
};

// src/lib/tiposkripto/src/verbs/internal/CommonUtils.ts
var CommonUtils = class {
  /**
   * Normalize a path string for consistent artifact storage
   */
  static normalizePath(path2) {
    if (typeof path2 !== "string") {
      throw new Error(
        `[ARTIFACT ERROR] Expected string, got ${typeof path2}: ${JSON.stringify(
          path2
        )}`
      );
    }
    return path2.replace(/\\/g, "/");
  }
  /**
   * Add an artifact with path normalization
   */
  static addArtifact(artifacts, path2) {
    artifacts.push(this.normalizePath(path2));
  }
  /**
   * Create a fallback artifactory for logging
   */
  static createFallbackArtifactory(context, basePath) {
    const { suiteIndex, givenKey, whenIndex, thenIndex, valueKey, rowIndex } = context;
    const actualBasePath = basePath || "testeranto";
    return {
      writeFileSync: (filename, payload) => {
        let path2 = "";
        if (suiteIndex !== void 0) {
          path2 += `suite-${suiteIndex}/`;
        }
        if (givenKey !== void 0) {
          path2 += `given-${givenKey}/`;
        }
        if (whenIndex !== void 0) {
          path2 += `when-${whenIndex}/`;
        }
        if (thenIndex !== void 0) {
          path2 += `then-${thenIndex}/`;
        }
        if (valueKey !== void 0) {
          path2 += `value-${valueKey}/`;
        }
        if (rowIndex !== void 0) {
          path2 += `row-${rowIndex}/`;
        }
        path2 += filename;
        const fullPath = `${actualBasePath}/${path2}`;
        console.log(`[Artifactory] Would write to ${fullPath}: ${payload.substring(0, 100)}...`);
      },
      screenshot: (filename, payload) => {
        console.log(`[Artifactory] Would take screenshot: ${filename}`);
      }
    };
  }
  /**
   * Standard error handling for test operations
   */
  static handleTestError(error, target) {
    target.failed = true;
    target.fails++;
    target.error = error;
  }
  /**
   * Standard method to create an object representation
   */
  static toObj(target, additionalProps = {}) {
    const baseObj = {
      key: target.key,
      name: target.name,
      error: target.error ? [target.error, target.error.stack] : null,
      failed: target.failed,
      features: target.features || [],
      artifacts: target.artifacts,
      status: target.status
    };
    if (target.fails !== void 0) {
      baseObj.fails = target.fails;
    }
    return { ...baseObj, ...additionalProps };
  }
};

// src/lib/tiposkripto/src/verbs/bdd/BaseGiven.ts
var BaseGiven = class {
  constructor(features, whens, thens, givenCB, initialValues) {
    this.error = null;
    this.store = null;
    this.key = "";
    this.failed = false;
    this.artifacts = [];
    this.fails = 0;
    this.testResourceConfiguration = null;
    this.features = features;
    this.whens = whens || [];
    this.thens = thens || [];
    this.givenCB = givenCB;
    this.initialValues = initialValues;
  }
  addArtifact(path2) {
    CommonUtils.addArtifact(this.artifacts, path2);
  }
  setParent(parent) {
    this._parent = parent;
  }
  toObj() {
    const whens = this.whens || [];
    const thens = this.thens || [];
    return CommonUtils.toObj(this, {
      whens: whens.map((w) => {
        if (w && w.toObj) return w.toObj();
        console.error("When step is not as expected!", JSON.stringify(w));
        return {};
      }),
      thens: thens.map((t) => t && t.toObj ? t.toObj() : {})
    });
  }
  async afterEach(store, key, artifactory) {
    return store;
  }
  async give(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx) {
    this.key = key;
    this.fails = 0;
    this.testResourceConfiguration = testResourceConfiguration;
    this._suiteIndex = suiteNdx;
    const actualArtifactory = artifactory;
    try {
      this.store = await this.givenThat(
        subject,
        testResourceConfiguration,
        actualArtifactory,
        this.givenCB,
        this.initialValues
      );
      this.status = true;
    } catch (e) {
      this.status = false;
      CommonUtils.handleTestError(e, this);
      return this.store;
    }
    try {
      const whens = this.whens || [];
      if (whens && Array.isArray(whens)) {
        for (const [whenNdx, whenStep] of whens.entries()) {
          try {
            const whenArtifactory = this.createArtifactoryForWhen(
              key,
              whenNdx,
              suiteNdx
            );
            this.store = await whenStep.test(
              this.store,
              testResourceConfiguration,
              whenArtifactory
            );
          } catch (e) {
            CommonUtils.handleTestError(e, this);
          }
        }
      } else {
        console.warn(`[BaseGiven.give] whens is not an array:`, whens);
      }
      const thens = this.thens || [];
      if (thens && Array.isArray(thens)) {
        for (const [thenNdx, thenStep] of thens.entries()) {
          try {
            const filepath = suiteNdx !== void 0 ? `suite-${suiteNdx}/given-${key}/then-${thenNdx}` : `given-${key}/then-${thenNdx}`;
            const thenArtifactory = this.createArtifactoryForThen(
              key,
              thenNdx,
              suiteNdx
            );
            const t = await thenStep.test(
              this.store,
              testResourceConfiguration,
              filepath,
              thenArtifactory
            );
            tester(t);
          } catch (e) {
            CommonUtils.handleTestError(e, this);
          }
        }
      } else {
        console.warn(`[BaseGiven.give] thens is not an array:`, thens);
      }
    } catch (e) {
      CommonUtils.handleTestError(e, this);
    } finally {
      try {
        await this.afterEach(this.store, this.key, actualArtifactory);
      } catch (e) {
        CommonUtils.handleTestError(e, this);
      }
    }
    return this.store;
  }
  createArtifactoryForWhen(givenKey, whenIndex, suiteNdx) {
    const self = this;
    if (self._parent && self._parent.createArtifactory) {
      return self._parent.createArtifactory({
        givenKey,
        whenIndex,
        suiteIndex: suiteNdx
      });
    }
    return CommonUtils.createFallbackArtifactory(
      { givenKey, whenIndex, suiteIndex: suiteNdx },
      this.testResourceConfiguration?.fs
    );
  }
  createArtifactoryForThen(givenKey, thenIndex, suiteNdx) {
    const self = this;
    if (self._parent && self._parent.createArtifactory) {
      return self._parent.createArtifactory({
        givenKey,
        thenIndex,
        suiteIndex: suiteNdx
      });
    }
    return CommonUtils.createFallbackArtifactory(
      { givenKey, thenIndex, suiteIndex: suiteNdx },
      this.testResourceConfiguration?.fs
    );
  }
};

// src/lib/tiposkripto/src/verbs/bdd/BaseWhen.ts
var BaseWhen = class {
  constructor(name, whenCB) {
    this.error = null;
    this.name = name;
    this.whenCB = whenCB;
  }
  async test(store, testResourceConfiguration, artifactory) {
    try {
      const result = await this.andWhen(
        store,
        this.whenCB,
        testResourceConfiguration,
        artifactory
      );
      this.status = true;
      return result;
    } catch (e) {
      this.status = false;
      this.error = e;
      throw e;
    }
  }
  toObj() {
    return {
      name: this.name,
      status: this.status,
      error: this.error ? `${this.error.name}: ${this.error.message}` : null
    };
  }
};

// src/lib/tiposkripto/src/verbs/bdd/BaseThen.ts
var BaseThen = class {
  constructor(name, thenCB) {
    this.error = null;
    this.name = name;
    this.thenCB = thenCB;
  }
  async test(store, testResourceConfiguration, filepath, artifactory) {
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
            this.error = e;
            throw e;
          }
        },
        testResourceConfiguration,
        artifactory
      );
      this.status = true;
      return x;
    } catch (e) {
      this.status = false;
      this.error = e;
      throw e;
    }
  }
  toObj() {
    return {
      name: this.name,
      status: this.status,
      error: this.error ? `${this.error.name}: ${this.error.message}` : null
    };
  }
};

// src/lib/tiposkripto/src/verbs/aaa/BaseDescribe.ts
var BaseDescribe = class {
  constructor(features, its, describeCB, initialValues) {
    this.error = null;
    this.store = null;
    this.key = "";
    this.failed = false;
    this.artifacts = [];
    this.fails = 0;
    this.features = features;
    this.its = its;
    this.describeCB = describeCB;
    this.initialValues = initialValues;
  }
  addArtifact(path2) {
    CommonUtils.addArtifact(this.artifacts, path2);
  }
  async describe(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx) {
    this.key = key;
    this.fails = 0;
    try {
      this.store = await this.describeCB("x");
      this.status = true;
    } catch (e) {
      this.status = false;
      this.failed = true;
      this.fails++;
      this.error = e;
      return this.store;
    }
    try {
      for (const [itNdx, it] of this.its.entries()) {
        try {
          const result = await it.test(
            this.store,
            testResourceConfiguration,
            artifactory
          );
          if (result !== void 0) {
            tester(result);
          }
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
    }
    return this.store;
  }
  toObj() {
    return {
      key: this.key,
      its: this.its.map((it) => it.toObj()),
      error: this.error ? [this.error.message, this.error.stack] : null,
      failed: this.failed,
      features: this.features || [],
      artifacts: this.artifacts,
      status: this.status,
      fails: this.fails
    };
  }
};

// src/lib/tiposkripto/src/verbs/aaa/BaseIt.ts
var BaseIt = class {
  constructor(name, itCB) {
    this.error = null;
    this.artifacts = [];
    this.name = name;
    this.itCB = itCB;
  }
  addArtifact(path2) {
    CommonUtils.addArtifact(this.artifacts, path2);
  }
  async test(store, testResourceConfiguration, artifactory) {
    try {
      const result = await this.itCB(store);
      this.status = true;
      return result;
    } catch (e) {
      this.status = false;
      this.error = e;
      throw e;
    }
  }
  toObj() {
    return {
      name: this.name,
      status: this.status,
      error: this.error ? `${this.error.name}: ${this.error.message}
${this.error.stack}` : null,
      artifacts: this.artifacts
    };
  }
};

// src/lib/tiposkripto/src/verbs/tdt/BaseConfirm.ts
var BaseConfirm = class {
  constructor(features, testCases, confirmCB, initialValues) {
    this.key = "";
    this.failed = false;
    this.artifacts = [];
    this.fails = 0;
    this.error = null;
    this.store = null;
    this.features = features;
    this.testCases = testCases || [];
    this.confirmCB = confirmCB;
    this.initialValues = initialValues;
  }
  addArtifact(path2) {
    CommonUtils.addArtifact(this.artifacts, path2);
  }
  setParent(parent) {
    this._parent = parent;
  }
  toObj() {
    const testCases = this.testCases || [];
    return CommonUtils.toObj(this, {
      confirms: testCases.map((testCase, index) => {
        if (Array.isArray(testCase) && testCase.length >= 2) {
          const [value, should] = testCase;
          let inputData = null;
          try {
            if (typeof value === "function") {
              inputData = value();
            } else if (value && typeof value.toObj === "function") {
              const obj = value.toObj();
              inputData = obj.features || obj;
            } else {
              inputData = value;
            }
          } catch (e) {
            inputData = `Error: ${e.message}`;
          }
          let testDescription = null;
          try {
            if (should) {
              if (typeof should === "function") {
                if (should.name && should.name !== "") {
                  testDescription = should.name;
                } else {
                  const funcStr = should.toString();
                  if (funcStr.includes("beEqualTo")) {
                    testDescription = "beEqualTo";
                  } else if (funcStr.includes("beGreaterThan")) {
                    testDescription = "beGreaterThan";
                  } else if (funcStr.includes("whenMultipliedAreAtLeast")) {
                    testDescription = "whenMultipliedAreAtLeast";
                  } else if (funcStr.includes("equal")) {
                    testDescription = "equal";
                  } else {
                    testDescription = "Test function";
                  }
                }
              } else if (should && typeof should.toObj === "function") {
                const obj = should.toObj();
                testDescription = obj.name || "Should";
              } else {
                testDescription = String(should);
              }
            }
          } catch (e) {
            testDescription = `Error: ${e.message}`;
          }
          return {
            index,
            input: inputData,
            test: testDescription
          };
        }
        return testCase;
      })
    });
  }
  async confirm(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx) {
    this.key = key;
    this.fails = 0;
    this.testResourceConfiguration = testResourceConfiguration;
    this._suiteIndex = suiteNdx;
    const actualArtifactory = artifactory;
    this.store = null;
    this.status = true;
    try {
      for (const [caseIndex, testCase] of this.testCases.entries()) {
        try {
          if (Array.isArray(testCase) && testCase.length >= 2) {
            const [value, should] = testCase;
            let input;
            if (typeof value === "function") {
              input = value();
            } else {
              input = value;
            }
            if (typeof should === "function") {
              let testFn;
              if (typeof this.confirmCB === "function") {
                const potentialTestFn = this.confirmCB();
                if (typeof potentialTestFn === "function") {
                  testFn = potentialTestFn;
                } else {
                  testFn = this.confirmCB;
                }
              } else {
                testFn = this.confirmCB;
              }
              const actualResult = Array.isArray(input) ? testFn(...input) : testFn(input);
              const passed = should(actualResult);
              tester(passed);
            } else if (should && typeof should.processRow === "function") {
              const actualResult = Array.isArray(input) ? this.confirmCB(...input) : this.confirmCB(input);
              const passed = await should.processRow(
                actualResult,
                testResourceConfiguration,
                artifactory
              );
              tester(passed);
            } else {
              tester(true);
            }
          }
        } catch (e) {
          CommonUtils.handleTestError(e, this);
        }
      }
    } catch (e) {
      CommonUtils.handleTestError(e, this);
    }
    return this.store;
  }
  async afterEach(store, key, artifactory) {
    return store;
  }
  // Alias for run to match BaseSuite expectations
  async run(subject, testResourceConfiguration, artifactory) {
    return this.confirm(
      subject,
      this.key || "confirm",
      testResourceConfiguration,
      (t) => !!t,
      artifactory
    );
  }
};

// src/lib/tiposkripto/src/verbs/tdt/BaseValue.ts
var BaseValue = class {
  constructor(features, tableRows, confirmCB, initialValues) {
    this.key = "";
    this.failed = false;
    this.artifacts = [];
    this.fails = 0;
    this.error = null;
    this.store = null;
    this.testResourceConfiguration = null;
    this.features = features;
    this.tableRows = tableRows;
    this.confirmCB = confirmCB;
    this.initialValues = initialValues;
  }
  setParent(parent) {
    this._parent = parent;
  }
  addArtifact(path2) {
    CommonUtils.addArtifact(this.artifacts, path2);
  }
  async value(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx) {
    this.key = key;
    this.fails = 0;
    this.testResourceConfiguration = testResourceConfiguration;
    const actualArtifactory = artifactory || ((fPath, value) => {
    });
    const valueArtifactory = (fPath, value) => actualArtifactory(`value-${key}/${fPath}`, value);
    try {
      const result = this.confirmCB();
      if (typeof result === "function") {
        this.store = await result();
      } else {
        this.store = await result;
      }
      this.status = true;
    } catch (e) {
      this.status = false;
      this.failed = true;
      this.fails++;
      this.error = e;
      return this.store;
    }
    try {
      for (const [rowIndex, row] of (this.tableRows || []).entries()) {
        try {
          const rowArtifactory = this.createArtifactoryForRow(
            key,
            rowIndex,
            suiteNdx
          );
          const rowResult = await this.processRow(
            row,
            rowIndex,
            rowArtifactory,
            testResourceConfiguration
          );
          if (rowResult !== void 0) {
            tester(rowResult);
          }
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
        await this.afterEach(this.store, this.key, valueArtifactory);
      } catch (e) {
        this.failed = true;
        this.fails++;
        this.error = e;
      }
    }
    return this.store;
  }
  async processRow(row, rowIndex, artifactory, testResourceConfiguration) {
    return row;
  }
  createArtifactoryForRow(key, rowIndex, suiteNdx) {
    const self = this;
    if (self._parent && self._parent.createArtifactory) {
      return self._parent.createArtifactory({
        valueKey: key,
        rowIndex,
        suiteIndex: suiteNdx
      });
    }
    return {
      writeFileSync: (filename, payload) => {
        let path2 = "";
        if (suiteNdx !== void 0) {
          path2 += `suite-${suiteNdx}/`;
        }
        path2 += `value-${key}/`;
        path2 += `row-${rowIndex} ${filename}`;
        console.log(`[Artifactory] Would write to: ${path2}`);
        console.log(`[Artifactory] Content: ${payload.substring(0, 100)}...`);
      },
      screenshot: (filename, payload) => {
        console.log(`[Artifactory] Would take screenshot: ${filename}`);
      }
    };
  }
  async afterEach(store, key, artifactory) {
    return store;
  }
  toObj() {
    const processedRows = (this.tableRows || []).map((row, index) => {
      if (Array.isArray(row)) {
        return {
          index,
          values: row.map((item) => {
            if (item && typeof item === "object") {
              if (item.toObj) {
                return item.toObj();
              }
              const result = {};
              for (const [key, value] of Object.entries(item)) {
                if (key !== "_parent" && key !== "testResourceConfiguration") {
                  result[key] = value;
                }
              }
              return result;
            }
            return item;
          })
        };
      }
      return { index, values: [row] };
    });
    return {
      key: this.key,
      values: processedRows,
      tableRows: this.tableRows || [],
      error: this.error ? [this.error, this.error.stack] : null,
      failed: this.failed,
      features: this.features || [],
      artifacts: this.artifacts,
      status: this.status
    };
  }
};

// src/lib/tiposkripto/src/verbs/tdt/BaseShould.ts
var BaseShould = class {
  constructor(name, shouldCB) {
    this.currentRow = [];
    this.rowIndex = -1;
    this.error = null;
    this.name = name;
    this.shouldCB = shouldCB;
  }
  // Set current row data
  setRowData(rowIndex, rowData) {
    this.rowIndex = rowIndex;
    this.currentRow = rowData;
  }
  // Process the current row
  async processRow(actualResult, testResourceConfiguration, artifactory) {
    try {
      let success = false;
      if (typeof this.shouldCB === "function") {
        const result = await this.shouldCB(actualResult);
        success = !!result;
      } else {
        success = actualResult === this.shouldCB;
      }
      this.status = success;
      return success;
    } catch (e) {
      this.status = false;
      this.error = e;
      throw e;
    }
  }
  toObj() {
    return {
      name: this.name,
      status: this.status,
      error: this.error ? `${this.error.name}: ${this.error.message}` : null,
      rowIndex: this.rowIndex,
      currentRow: this.currentRow,
      pattern: "tdt"
    };
  }
};

// src/lib/tiposkripto/src/verbs/tdt/BaseExpected.ts
var BaseExpected = class {
  constructor(name, expectedCB) {
    this.expectedValue = null;
    this.error = null;
    this.name = name;
    this.expectedCB = expectedCB;
  }
  // Set expected value for current row
  setExpectedValue(expected) {
    this.expectedValue = expected;
  }
  async test(store, testResourceConfiguration, filepath, artifactory) {
    try {
      const result = await this.expectedCB(store);
      this.status = true;
      return result;
    } catch (e) {
      this.status = false;
      this.error = e;
      throw e;
    }
  }
  toObj() {
    return {
      name: this.name,
      status: this.status,
      error: this.error ? `${this.error.name}: ${this.error.message}` : null,
      expectedValue: this.expectedValue
    };
  }
};

// src/lib/tiposkripto/src/VerbProxies.ts
var VerbProxies = class {
  constructor(givenOverrides, whenOverrides, thenOverrides, describesOverrides, itsOverrides, confirmsOverrides, valuesOverrides, shouldsOverrides, expectedsOverrides) {
    this.givenOverrides = givenOverrides;
    this.whenOverrides = whenOverrides;
    this.thenOverrides = thenOverrides;
    this.describesOverrides = describesOverrides;
    this.itsOverrides = itsOverrides;
    this.confirmsOverrides = confirmsOverrides;
    this.valuesOverrides = valuesOverrides;
    this.shouldsOverrides = shouldsOverrides;
    this.expectedsOverrides = expectedsOverrides;
  }
  Given() {
    return this.createVerbProxy("Given", this.givenOverrides, this.createMissingGivenHandler.bind(this));
  }
  createMissingGivenHandler(prop) {
    return (initialValues) => {
      console.error(`Given.${prop} is not defined in test implementation`);
      return (whens = [], thens = [], features = []) => {
        try {
          return new class extends BaseGiven {
            async givenThat(subject, testResource, artifactory, initializer, initialValues2) {
              throw new Error(`Given.${prop} is not implemented`);
            }
          }(
            features,
            whens,
            thens,
            () => {
              throw new Error(`Given.${prop} is not implemented`);
            },
            initialValues
          );
        } catch (e) {
          console.error(`Error creating Given.${prop}:`, e);
          return {
            features,
            whens,
            thens,
            givenCB: () => {
              throw new Error(`Given.${prop} creation failed: ${e.message}`);
            },
            initialValues,
            give: async () => {
              throw new Error(`Given.${prop} creation failed: ${e.message}`);
            },
            toObj: () => ({
              key: `Given_${prop}_error`,
              error: `Given.${prop} creation failed: ${e.message}`,
              failed: true,
              features
            })
          };
        }
      };
    };
  }
  createVerbProxy(verbName, overrides, missingHandler) {
    const actualOverrides = overrides || {};
    return new Proxy(actualOverrides, {
      get(target, prop) {
        if (typeof prop === "string") {
          if (prop in target) {
            return target[prop];
          } else {
            return missingHandler(prop);
          }
        }
        return target[prop];
      }
    });
  }
  When() {
    const overrides = this.whenOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === "string") {
          if (prop in target) {
            return target[prop];
          } else {
            return (...args) => {
              console.error(`When.${prop} is not defined in test implementation`);
              try {
                return new class extends BaseWhen {
                  async andWhen(store, whenCB, testResource, artifactory) {
                    throw new Error(`When.${prop} is not implemented`);
                  }
                }(`${prop}: ${args && args.toString()}`, () => {
                  throw new Error(`When.${prop} is not implemented`);
                });
              } catch (e) {
                console.error(`Error creating When.${prop}:`, e);
                return {
                  name: `${prop}_error`,
                  test: async () => {
                    throw new Error(`When.${prop} creation failed: ${e.message}`);
                  },
                  toObj: () => ({
                    name: `When_${prop}_error`,
                    error: `When.${prop} creation failed: ${e.message}`,
                    status: false
                  })
                };
              }
            };
          }
        }
        return target[prop];
      }
    });
  }
  Then() {
    const overrides = this.thenOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === "string") {
          if (prop in target) {
            return target[prop];
          } else {
            return (...args) => {
              console.error(`Then.${prop} is not defined in test implementation`);
              return new class extends BaseThen {
                async butThen(store, thenCB, testResourceConfiguration, artifactory) {
                  throw new Error(`Then.${prop} is not implemented`);
                }
              }(`${prop}: ${args && args.toString()}`, async () => {
                throw new Error(`Then.${prop} is not implemented`);
              });
            };
          }
        }
        return target[prop];
      }
    });
  }
  Describe() {
    const overrides = this.describesOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === "string") {
          if (prop in target) {
            return target[prop];
          } else {
            return (initialValues) => {
              console.error(`Describe.${prop} is not defined in test implementation`);
              return (its, features) => {
                return new BaseDescribe(
                  features,
                  its,
                  () => {
                    throw new Error(`Describe.${prop} is not implemented`);
                  },
                  initialValues
                );
              };
            };
          }
        }
        return target[prop];
      }
    });
  }
  It() {
    const overrides = this.itsOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === "string") {
          if (prop in target) {
            return target[prop];
          } else {
            return (...args) => {
              console.error(`It.${prop} is not defined in test implementation`);
              return new class extends BaseIt {
                constructor(name, itCB) {
                  super(name, itCB);
                }
              }(`${prop}: ${args && args.toString()}`, () => {
                throw new Error(`It.${prop} is not implemented`);
              });
            };
          }
        }
        return target[prop];
      }
    });
  }
  Confirm() {
    const overrides = this.confirmsOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === "string") {
          if (prop in target) {
            return target[prop];
          } else {
            return (...args) => {
              console.error(`Confirm.${prop} is not defined in test implementation`);
              return (testCases, features) => {
                return new class extends BaseConfirm {
                  constructor(features2, testCases2, confirmCB, initialValues) {
                    super(features2, testCases2, confirmCB, initialValues);
                  }
                }(
                  features,
                  testCases,
                  () => {
                    throw new Error(`Confirm.${prop} is not implemented`);
                  },
                  void 0
                );
              };
            };
          }
        }
        return target[prop];
      }
    });
  }
  Value() {
    const overrides = this.valuesOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === "string") {
          if (prop in target) {
            return target[prop];
          } else {
            return (...args) => {
              console.error(`Value.${prop} is not defined in test implementation`);
              return (features, tableRows, confirmCB, initialValues) => {
                return new class extends BaseValue {
                  constructor(features2, tableRows2, confirmCB2, initialValues2) {
                    super(features2, tableRows2, confirmCB2, initialValues2);
                  }
                }(
                  features,
                  tableRows,
                  () => {
                    throw new Error(`Value.${prop} is not implemented`);
                  },
                  initialValues
                );
              };
            };
          }
        }
        return target[prop];
      }
    });
  }
  Should() {
    const overrides = this.shouldsOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === "string") {
          if (prop in target) {
            return target[prop];
          } else {
            return (...args) => {
              console.error(`Should.${prop} is not defined in test implementation`);
              return new class extends BaseShould {
                constructor(name, shouldCB) {
                  super(name, shouldCB);
                }
              }(`${prop}: ${args && args.toString()}`, () => {
                throw new Error(`Should.${prop} is not implemented`);
              });
            };
          }
        }
        return target[prop];
      }
    });
  }
  Expect() {
    const overrides = this.expectedsOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === "string") {
          if (prop in target) {
            return target[prop];
          } else {
            return (...args) => {
              console.error(`Expect.${prop} is not defined in test implementation`);
              return new class extends BaseExpected {
                constructor(name, expectedCB) {
                  super(name, expectedCB);
                }
                async validateRow(store, testResourceConfiguration, filepath, expectedValue, artifactory) {
                  throw new Error(`Expect.${prop} is not implemented`);
                }
              }(`${prop}: ${args && args.toString()}`, async () => {
                throw new Error(`Expect.${prop} is not implemented`);
              });
            };
          }
        }
        return target[prop];
      }
    });
  }
  Expected() {
    const overrides = this.expectedsOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === "string") {
          if (prop in target) {
            return target[prop];
          } else {
            return (...args) => {
              console.error(`Expected.${prop} is not defined in test implementation`);
              return new class extends BaseExpected {
                constructor(name, expectedCB) {
                  super(name, expectedCB);
                }
                async validateRow(store, testResourceConfiguration, filepath, expectedValue, artifactory) {
                  throw new Error(`Expected.${prop} is not implemented`);
                }
              }(`${prop}: ${args && args.toString()}`, async () => {
                throw new Error(`Expected.${prop} is not implemented`);
              });
            };
          }
        }
        return target[prop];
      }
    });
  }
};

// src/lib/tiposkripto/src/TestJobCreator.ts
var TestJobCreator = class {
  constructor(createArtifactory, totalTests) {
    this.createArtifactory = createArtifactory;
    this.totalTests = totalTests;
  }
  createTestJobForStep(step, index, input) {
    const stepRunner = async (testResourceConfiguration) => {
      try {
        let result;
        const constructorName = step.constructor?.name || "Unknown";
        const stepArtifactory = this.createArtifactory({
          stepIndex: index,
          stepType: constructorName.toLowerCase().replace("base", "")
        });
        if (constructorName === "BaseGiven") {
          result = await step.give(
            input,
            `step_${index}`,
            testResourceConfiguration,
            (t) => !!t,
            stepArtifactory,
            index
          );
        } else if (constructorName === "BaseDescribe") {
          result = await step.describe(
            input,
            `step_${index}`,
            testResourceConfiguration,
            (t) => !!t,
            stepArtifactory,
            index
          );
        } else if (constructorName === "BaseConfirm" || constructorName === "BaseValue") {
          if (typeof step.run === "function") {
            result = await step.run(
              input,
              testResourceConfiguration,
              stepArtifactory
            );
          } else if (typeof step.confirm === "function") {
            result = await step.confirm(
              input,
              `step_${index}`,
              testResourceConfiguration,
              (t) => !!t,
              stepArtifactory,
              index
            );
          } else if (typeof step.value === "function") {
            result = await step.value(
              input,
              `step_${index}`,
              testResourceConfiguration,
              (t) => !!t,
              stepArtifactory,
              index
            );
          } else {
            throw new Error(`TDT step has no runnable method (run, confirm, or value)`);
          }
        } else if (constructorName === "SpecificationError") {
          throw step.error || new Error("Test specification failed");
        } else {
          if (typeof step.run === "function") {
            result = await step.run(
              input,
              testResourceConfiguration,
              stepArtifactory
            );
          } else if (typeof step.test === "function") {
            result = await step.test(
              input,
              testResourceConfiguration,
              stepArtifactory
            );
          } else if (typeof step.give === "function") {
            result = await step.give(
              input,
              `step_${index}`,
              testResourceConfiguration,
              (t) => !!t,
              stepArtifactory,
              index
            );
          } else if (typeof step.describe === "function") {
            result = await step.describe(
              input,
              `step_${index}`,
              testResourceConfiguration,
              (t) => !!t,
              stepArtifactory,
              index
            );
          } else {
            throw new Error(`Step type ${constructorName} has no runnable method`);
          }
        }
        return { step, result, fails: step.fails || 0, failed: step.failed || false };
      } catch (e) {
        console.error(e.stack);
        throw e;
      }
    };
    const runner = stepRunner;
    const totalTests = this.totalTests;
    const testJob = {
      test: step,
      toObj: () => {
        return step.toObj ? step.toObj() : {
          name: `Step_${index}`,
          type: step.constructor?.name || "Unknown",
          key: step.key || `step_${index}`
        };
      },
      runner,
      receiveTestResourceConfig: async (testResourceConfiguration) => {
        try {
          const stepResult = await runner(testResourceConfiguration);
          const fails = stepResult.fails;
          const stepObj = stepResult.step;
          let features = [];
          if (stepObj.features && Array.isArray(stepObj.features)) {
            features = stepObj.features;
          }
          let artifacts = [];
          if (stepObj.artifacts && Array.isArray(stepObj.artifacts)) {
            artifacts = stepObj.artifacts;
          }
          let errorDetails = null;
          if (stepObj.error) {
            errorDetails = {
              message: stepObj.error.message,
              stack: stepObj.error.stack,
              name: stepObj.error.name
            };
          } else if (stepResult.error) {
            errorDetails = {
              message: stepResult.error.message,
              stack: stepResult.error.stack,
              name: stepResult.error.name
            };
          }
          return {
            failed: stepResult.failed || fails > 0,
            fails,
            artifacts,
            features,
            tests: 1,
            runTimeTests: totalTests,
            testJob: testJob.toObj(),
            error: errorDetails,
            stepName: stepObj.key || stepObj.name || `Step_${index}`,
            stepType: stepObj.constructor?.name || "Unknown"
          };
        } catch (e) {
          console.error(e.stack);
          return {
            failed: true,
            fails: 1,
            artifacts: [],
            features: [],
            tests: 1,
            runTimeTests: totalTests,
            testJob: testJob.toObj(),
            error: {
              message: e.message,
              stack: e.stack,
              name: e.name
            },
            stepName: step.key || `Step_${index}`,
            stepType: step.constructor?.name || "Error"
          };
        }
      }
    };
    return testJob;
  }
  createErrorTestJob(errorStep, index, error) {
    const totalTests = this.totalTests;
    const uniqueError = new Error(error.message);
    uniqueError.stack = error.stack;
    uniqueError.name = error.name;
    return {
      test: errorStep,
      toObj: () => {
        return errorStep.toObj();
      },
      runner: async () => {
        throw uniqueError;
      },
      receiveTestResourceConfig: async (testResourceConfiguration) => {
        return {
          failed: true,
          fails: 1,
          artifacts: [],
          features: [],
          tests: 1,
          runTimeTests: totalTests,
          testJob: errorStep.toObj(),
          error: {
            message: uniqueError.message,
            stack: uniqueError.stack,
            name: uniqueError.name
          },
          stepName: errorStep.toObj().name || `ErrorStep_${index}`,
          stepType: "Error"
        };
      }
    };
  }
  calculateTotalTestsDirectly(specs) {
    return specs ? specs.length : 0;
  }
};

// src/lib/tiposkripto/src/ClassyImplementations.ts
var ClassyImplementations = class {
  static createClassyGivens(testImplementation, fullAdapter, instance) {
    const classyGivens = {};
    if (testImplementation.givens) {
      Object.entries(testImplementation.givens).forEach(([key, g]) => {
        classyGivens[key] = (initialValues) => {
          return (whens, thens, features) => {
            const safeFeatures = Array.isArray(features) ? [...features] : [];
            const safeWhens = Array.isArray(whens) ? [...whens] : [];
            const safeThens = Array.isArray(thens) ? [...thens] : [];
            const capturedFullAdapter = fullAdapter;
            const givenInstance = new class extends BaseGiven {
              async givenThat(subject, testResource, artifactory, initializer, initialValues2) {
                const givenArtifactory = instance.createArtifactory({
                  givenKey: key,
                  suiteIndex: this._suiteIndex
                });
                return capturedFullAdapter.prepareEach(
                  subject,
                  initializer,
                  testResource,
                  initialValues2,
                  givenArtifactory
                );
              }
              afterEach(store, key2, artifactory) {
                return Promise.resolve(
                  capturedFullAdapter.cleanupEach(store, key2, artifactory)
                );
              }
            }(
              safeFeatures,
              safeWhens,
              safeThens,
              testImplementation.givens[key],
              initialValues
            );
            givenInstance._parent = instance;
            if (givenInstance.setParent) {
              givenInstance.setParent(instance);
            }
            return givenInstance;
          };
        };
      });
    }
    return classyGivens;
  }
  static createClassyWhens(testImplementation, fullAdapter) {
    const classyWhens = {};
    if (testImplementation.whens) {
      Object.entries(testImplementation.whens).forEach(
        ([key, whEn]) => {
          classyWhens[key] = (...payload) => {
            const capturedFullAdapter = fullAdapter;
            const whenInstance = new class extends BaseWhen {
              async andWhen(store, whenCB, testResource, artifactory) {
                return await capturedFullAdapter.execute(
                  store,
                  whenCB,
                  testResource,
                  artifactory
                );
              }
            }(`${key}: ${payload && payload.toString()}`, whEn(...payload));
            return whenInstance;
          };
        }
      );
    }
    return classyWhens;
  }
  static createClassyThens(testImplementation, fullAdapter) {
    const classyThens = {};
    if (testImplementation.thens) {
      Object.entries(testImplementation.thens).forEach(
        ([key, thEn]) => {
          classyThens[key] = (...args) => {
            const capturedFullAdapter = fullAdapter;
            const thenInstance = new class extends BaseThen {
              async butThen(store, thenCB, testResourceConfiguration, artifactory) {
                return capturedFullAdapter.verify(
                  store,
                  thenCB,
                  testResourceConfiguration,
                  artifactory
                );
              }
            }(`${key}: ${args && args.toString()}`, thEn(...args));
            return thenInstance;
          };
        }
      );
    }
    return classyThens;
  }
  static createClassyConfirms(testImplementation) {
    const classyConfirms = {};
    if (testImplementation.confirms) {
      Object.entries(testImplementation.confirms).forEach(([key, val]) => {
        classyConfirms[key] = () => {
          return (testCases, features) => {
            let actualConfirmCB;
            if (typeof val === "function") {
              actualConfirmCB = val();
            } else {
              actualConfirmCB = val;
            }
            return new BaseConfirm(
              features,
              testCases,
              actualConfirmCB,
              void 0
            );
          };
        };
      });
    }
    return classyConfirms;
  }
  static createClassyValues(testImplementation) {
    const classyValues = {};
    if (testImplementation.values) {
      Object.entries(testImplementation.values).forEach(([key, val]) => {
        classyValues[key] = (features, tableRows, confirmCB, initialValues) => {
          return new BaseValue(
            features,
            tableRows,
            confirmCB,
            initialValues
          );
        };
      });
    }
    return classyValues;
  }
  static createClassyShoulds(testImplementation) {
    const classyShoulds = {};
    if (testImplementation.shoulds) {
      Object.entries(testImplementation.shoulds).forEach(
        ([key, shouldCB]) => {
          classyShoulds[key] = (...args) => {
            return new BaseShould(
              `${key}: ${args && args.toString()}`,
              shouldCB(...args)
            );
          };
        }
      );
    }
    return classyShoulds;
  }
  static createClassyExpecteds(testImplementation) {
    const classyExpecteds = {};
    if (testImplementation.expecteds) {
      Object.entries(testImplementation.expecteds).forEach(
        ([key, expectedCB]) => {
          classyExpecteds[key] = (...args) => {
            return new BaseExpected(
              `${key}: ${args && args.toString()}`,
              expectedCB(...args)
            );
          };
        }
      );
    }
    return classyExpecteds;
  }
  static createClassyDescribes(testImplementation) {
    const classyDescribes = {};
    if (testImplementation.describes && typeof testImplementation.describes === "object") {
      Object.entries(testImplementation.describes).forEach(([key, desc]) => {
        classyDescribes[key] = (initialValues) => {
          return (its, features) => {
            try {
              let actualDescribeCB;
              if (typeof desc === "function") {
                actualDescribeCB = desc(initialValues);
              } else {
                actualDescribeCB = desc;
              }
              if (typeof actualDescribeCB !== "function") {
                console.warn(`Describe implementation for "${key}" is not a function, got:`, typeof actualDescribeCB);
                actualDescribeCB = () => {
                  throw new Error(`Describe implementation for "${key}" is not a valid function`);
                };
              }
              return new BaseDescribe(
                features,
                its,
                actualDescribeCB,
                initialValues
              );
            } catch (error) {
              console.error(`Error creating Describe for "${key}":`, error);
              return new BaseDescribe(
                features,
                its,
                () => {
                  throw new Error(`Describe implementation for "${key}" failed: ${error.message}`);
                },
                initialValues
              );
            }
          };
        };
      });
    } else {
      console.warn("testImplementation.describes is not defined or not an object");
    }
    return classyDescribes;
  }
  static createClassyIts(testImplementation) {
    const classyIts = {};
    if (testImplementation.its) {
      Object.entries(testImplementation.its).forEach(
        ([key, itCB]) => {
          classyIts[key] = (...args) => {
            return new BaseIt(
              `${key}: ${args && args.toString()}`,
              itCB(...args)
            );
          };
        }
      );
    }
    return classyIts;
  }
};

// src/lib/tiposkripto/src/TestRunner.ts
var TestRunner = class {
  static async runAllTests(testJobs, totalTests, testResourceConfiguration, writeFileSync) {
    const allResults = [];
    let totalFails = 0;
    let anyFailed = false;
    const allFeatures = [];
    const allArtifacts = [];
    for (let i = 0; i < testJobs.length; i++) {
      try {
        const result = await testJobs[i].receiveTestResourceConfig(testResourceConfiguration);
        allResults.push(result);
        totalFails += result.fails;
        anyFailed = anyFailed || result.failed;
        if (result.features && Array.isArray(result.features)) {
          allFeatures.push(...result.features);
        }
        if (result.artifacts && Array.isArray(result.artifacts)) {
          allArtifacts.push(...result.artifacts);
        }
      } catch (e) {
        console.error(`Error running test job ${i}:`, e);
        totalFails++;
        anyFailed = true;
        allResults.push({
          failed: true,
          fails: 1,
          features: [],
          artifacts: [],
          error: {
            message: e.message,
            stack: e.stack,
            name: e.name
          },
          stepName: `Job_${i}`,
          stepType: "Error",
          testJob: { name: `Job_${i}_Error` }
        });
      }
    }
    const combinedResults = {
      failed: anyFailed,
      fails: totalFails,
      artifacts: allArtifacts,
      features: [...new Set(allFeatures)],
      tests: testJobs.length,
      runTimeTests: totalTests,
      testJob: { name: "CombinedResults" },
      timestamp: Date.now(),
      individualResults: allResults.map((result, idx) => ({
        index: idx,
        failed: result.failed,
        fails: result.fails,
        features: result.features || [],
        error: result.error,
        stepName: result.stepName,
        stepType: result.stepType,
        testJob: result.testJob
      }))
    };
    combinedResults.summary = {
      totalTests: testJobs.length,
      passed: testJobs.length - totalFails,
      failed: totalFails,
      successRate: totalFails === 0 ? "100%" : ((testJobs.length - totalFails) / testJobs.length * 100).toFixed(2) + "%"
    };
    console.log("testResourceConfiguration", testResourceConfiguration);
    const reportJson = `${testResourceConfiguration.fs}/tests.json`;
    writeFileSync(reportJson, JSON.stringify(combinedResults, null, 2));
  }
  static writeEmptyResults(testResourceConfiguration, writeFileSync) {
    const emptyResults = {
      failed: true,
      fails: -1,
      artifacts: [],
      features: [],
      tests: 0,
      runTimeTests: -1,
      testJob: {},
      timestamp: Date.now(),
      error: {
        message: "No test jobs were created",
        name: "ConfigurationError"
      },
      individualResults: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 1,
        successRate: "0%"
      }
    };
    const reportJson = `${testResourceConfiguration.fs}/tests.json`;
    writeFileSync(reportJson, JSON.stringify(emptyResults, null, 2));
  }
  static async runAllTestsAndReturnResults(testJobs, totalTests, testResourceConfig) {
    const allResults = [];
    let totalFails = 0;
    let anyFailed = false;
    const allFeatures = [];
    const allArtifacts = [];
    for (let i = 0; i < testJobs.length; i++) {
      try {
        const result = await testJobs[i].receiveTestResourceConfig(testResourceConfig);
        allResults.push(result);
        totalFails += result.fails;
        anyFailed = anyFailed || result.failed;
        if (result.features && Array.isArray(result.features)) {
          allFeatures.push(...result.features);
        }
        if (result.artifacts && Array.isArray(result.artifacts)) {
          allArtifacts.push(...result.artifacts);
        }
      } catch (e) {
        console.error(`Error running test job ${i}:`, e);
        totalFails++;
        anyFailed = true;
      }
    }
    return {
      failed: anyFailed,
      fails: totalFails,
      artifacts: allArtifacts,
      features: [...new Set(allFeatures)],
      tests: testJobs.length,
      runTimeTests: totalTests,
      testJob: { name: "CombinedResults" },
      timestamp: Date.now(),
      individualResults: allResults.map((result, idx) => ({
        index: idx,
        failed: result.failed,
        fails: result.fails,
        features: result.features || [],
        error: result.error,
        stepName: result.stepName,
        stepType: result.stepType,
        testJob: result.testJob
      })),
      summary: {
        totalTests: testJobs.length,
        passed: testJobs.length - totalFails,
        failed: totalFails,
        successRate: totalFails === 0 ? "100%" : ((testJobs.length - totalFails) / testJobs.length * 100).toFixed(2) + "%"
      }
    };
  }
};

// src/lib/tiposkripto/src/BaseTiposkripto.ts
var BaseTiposkripto = class {
  constructor(webOrNode, input, testSpecification, testImplementation, testResourceRequirement = defaultTestResourceRequirement, testAdapter = {}, testResourceConfiguration) {
    this.totalTests = 0;
    this.artifacts = [];
    this.testResourceConfiguration = testResourceConfiguration;
    const fullAdapter = DefaultAdapter(testAdapter);
    const instance = this;
    const classySuites = {};
    const classyGivens = ClassyImplementations.createClassyGivens(testImplementation, fullAdapter, instance);
    const classyWhens = ClassyImplementations.createClassyWhens(testImplementation, fullAdapter);
    const classyThens = ClassyImplementations.createClassyThens(testImplementation, fullAdapter);
    const classyConfirms = ClassyImplementations.createClassyConfirms(testImplementation);
    const classyValues = ClassyImplementations.createClassyValues(testImplementation);
    const classyShoulds = ClassyImplementations.createClassyShoulds(testImplementation);
    const classyExpecteds = ClassyImplementations.createClassyExpecteds(testImplementation);
    const classyDescribes = ClassyImplementations.createClassyDescribes(testImplementation);
    const classyIts = ClassyImplementations.createClassyIts(testImplementation);
    this.suitesOverrides = classySuites;
    this.givenOverrides = classyGivens;
    this.whenOverrides = classyWhens;
    this.thenOverrides = classyThens;
    this.valuesOverrides = classyValues;
    this.shouldsOverrides = classyShoulds;
    this.expectedsOverrides = classyExpecteds;
    this.describesOverrides = classyDescribes;
    this.itsOverrides = classyIts;
    this.confirmsOverrides = classyConfirms;
    this.testResourceRequirement = testResourceRequirement;
    this.testSpecification = testSpecification;
    this.verbProxies = new VerbProxies(
      this.givenOverrides,
      this.whenOverrides,
      this.thenOverrides,
      this.describesOverrides,
      this.itsOverrides,
      this.confirmsOverrides,
      this.valuesOverrides,
      this.shouldsOverrides,
      this.expectedsOverrides
    );
    this.testJobCreator = new TestJobCreator(
      this.createArtifactory.bind(this),
      0
      // totalTests will be set later
    );
    let topLevelVerbs = [];
    let specError = null;
    try {
      topLevelVerbs = testSpecification(
        this.verbProxies.Given(),
        this.verbProxies.When(),
        this.verbProxies.Then(),
        this.verbProxies.Describe(),
        this.verbProxies.It(),
        this.verbProxies.Confirm(),
        this.verbProxies.Value(),
        this.verbProxies.Should()
      );
    } catch (error) {
      console.error("Error during test specification:", error);
      specError = error;
      topLevelVerbs = [];
      const errorStep = {
        constructor: { name: "SpecificationError" },
        features: [],
        artifacts: [],
        fails: 1,
        failed: true,
        error: specError,
        toObj: () => ({
          name: "Specification_Error",
          type: "Error",
          error: `Test specification failed: ${specError?.message}`
        })
      };
      topLevelVerbs.push(errorStep);
    }
    this.specs = topLevelVerbs;
    this.totalTests = this.testJobCreator.calculateTotalTestsDirectly(this.specs);
    this.testJobs = [];
    for (let index = 0; index < this.specs.length; index++) {
      const step = this.specs[index];
      try {
        const testJob = this.testJobCreator.createTestJobForStep(step, index, input);
        this.testJobs.push(testJob);
      } catch (stepError) {
        console.error(`Error creating test job for step ${index}:`, stepError);
        const errorMessage = `Step ${index} failed to create test job: ${stepError.message}`;
        const errorStep = {
          constructor: { name: "ErrorStep" },
          features: [],
          artifacts: [],
          fails: 1,
          failed: true,
          error: new Error(errorMessage),
          toObj: () => ({
            name: `Step_${index}_Error`,
            type: "Error",
            error: errorMessage
          })
        };
        const errorTestJob = this.testJobCreator.createErrorTestJob(errorStep, index, new Error(errorMessage));
        this.testJobs.push(errorTestJob);
      }
    }
    if (this.testJobs.length === 0) {
      const errorMessage = specError ? `Test specification failed: ${specError.message}` : "No test steps were created by the specification";
      const errorStep = {
        constructor: { name: "ErrorStep" },
        features: [],
        artifacts: [],
        fails: 1,
        failed: true,
        error: new Error(errorMessage),
        toObj: () => ({
          name: "Specification_Error",
          type: "Error",
          error: errorMessage
        })
      };
      const errorTestJob = this.testJobCreator.createErrorTestJob(errorStep, 0, new Error(errorMessage));
      this.testJobs.push(errorTestJob);
    }
    if (this.testJobs.length > 0) {
      TestRunner.runAllTests(this.testJobs, this.totalTests, testResourceConfiguration, this.writeFileSync.bind(this));
    } else {
      TestRunner.writeEmptyResults(testResourceConfiguration, this.writeFileSync.bind(this));
    }
  }
  // Create an artifactory that tracks context
  createArtifactory(context = {}) {
    return {
      writeFileSync: (filename, payload) => {
        let path2 = "";
        const basePath = this.testResourceConfiguration?.fs || "testeranto";
        console.log("[Artifactory] Base path:", basePath);
        console.log("[Artifactory] Context:", context);
        if (context.stepIndex !== void 0) {
          path2 += `step-${context.stepIndex}/`;
          if (context.stepType) {
            path2 += `${context.stepType}/`;
          }
        } else if (context.suiteIndex !== void 0) {
          path2 += `suite-${context.suiteIndex}/`;
        }
        if (context.givenKey) {
          path2 += `given-${context.givenKey}/`;
        }
        if (context.whenIndex !== void 0) {
          path2 += `when-${context.whenIndex} `;
        } else if (context.thenIndex !== void 0) {
          path2 += `then-${context.thenIndex} `;
        }
        path2 += filename;
        if (!path2.match(/\.[a-zA-Z0-9]+$/)) {
          path2 += ".txt";
        }
        const basePathClean = basePath.replace(/\/$/, "");
        const pathClean = path2.replace(/^\//, "");
        const fullPath = `${basePathClean}/${pathClean}`;
        console.log("[Artifactory] Full path:", fullPath);
        this.writeFileSync(fullPath, payload);
      }
    };
  }
  async receiveTestResourceConfig(testResourceConfig) {
    return TestRunner.runAllTestsAndReturnResults(
      this.testJobs,
      this.totalTests,
      testResourceConfig
    );
  }
  Specs() {
    return this.specs;
  }
  Suites() {
    console.warn("Suites() is deprecated and returns an empty object");
    return {};
  }
  Given() {
    return this.verbProxies.Given();
  }
  When() {
    return this.verbProxies.When();
  }
  Then() {
    return this.verbProxies.Then();
  }
  Describe() {
    return this.verbProxies.Describe();
  }
  It() {
    return this.verbProxies.It();
  }
  Confirm() {
    return this.verbProxies.Confirm();
  }
  Value() {
    return this.verbProxies.Value();
  }
  Should() {
    return this.verbProxies.Should();
  }
  Expect() {
    return this.verbProxies.Expect();
  }
  Expected() {
    return this.verbProxies.Expected();
  }
  getTestJobs() {
    return this.testJobs;
  }
};

// src/lib/tiposkripto/src/Node.ts
console.log(`[NodeTiposkripto] ${process.argv}`);
var config = JSON.parse(process.argv[2]);
var NodeTiposkripto = class extends BaseTiposkripto {
  constructor(input, testSpecification, testImplementation, testAdapter, testResourceRequirement = defaultTestResourceRequirement) {
    super(
      "node",
      input,
      testSpecification,
      testImplementation,
      testResourceRequirement,
      testAdapter,
      config
    );
  }
  writeFileSync(filename, payload) {
    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filename, payload);
  }
  // screenshot, openScreencast, and closeScreencast are not applicable to Node runtime
  // These methods are only for web runtime to capture visual artifacts in browser environments
};
var tiposkripto = async (input, testSpecification, testImplementation, testAdapter, testResourceRequirement = defaultTestResourceRequirement) => {
  try {
    const t = new NodeTiposkripto(
      input,
      testSpecification,
      testImplementation,
      testAdapter,
      testResourceRequirement
    );
    return t;
  } catch (e) {
    console.error(`[Node] Error creating Tiposkripto:`, e);
    console.error(e.stack);
    process.exit(-1);
  }
};
var Node_default = tiposkripto;

export {
  NodeTiposkripto,
  Node_default
};
