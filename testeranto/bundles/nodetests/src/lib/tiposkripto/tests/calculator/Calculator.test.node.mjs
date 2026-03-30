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
  const adapter2 = {
    prepareAll: p.prepareAll || base.prepareAll,
    prepareEach: p.prepareEach || base.prepareEach,
    execute: p.execute || base.execute,
    verify: p.verify || base.verify,
    cleanupEach: p.cleanupEach || base.cleanupEach,
    cleanupAll: p.cleanupAll || base.cleanupAll,
    assert: p.assert || base.assert
  };
  return adapter2;
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
      this.store = await this.describeCB();
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
          const result2 = await it.test(
            this.store,
            testResourceConfiguration,
            artifactory
          );
          if (result2 !== void 0) {
            tester(result2);
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
      const result2 = await this.itCB(store);
      this.status = true;
      return result2;
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

// src/lib/tiposkripto/src/verbs/BaseSuite.ts
var BaseSuite = class {
  constructor(name, index, givens = {}, parent) {
    this.store = null;
    this.testResourceConfiguration = null;
    this.index = 0;
    this.failed = false;
    this.fails = 0;
    this.parent = null;
    // Reference to parent BaseTiposkripto instance
    this.artifacts = [];
    const suiteName = name || "testSuite";
    if (!suiteName) {
      throw new Error("BaseSuite requires a non-empty name");
    }
    this.name = suiteName;
    this.index = index;
    this.givens = givens;
    this.fails = 0;
    this.parent = parent;
  }
  addArtifact(path2) {
    CommonUtils.addArtifact(this.artifacts, path2);
  }
  features() {
    try {
      const features = Object.keys(this.givens).map((k) => this.givens[k].features).flat().filter((value, index, array) => {
        return array.indexOf(value) === index;
      });
      const stringFeatures = features.map((feature) => {
        if (typeof feature === "string") {
          return feature;
        } else if (feature && typeof feature === "object") {
          return feature.name || JSON.stringify(feature);
        } else {
          return String(feature);
        }
      });
      return stringFeatures || [];
    } catch (e) {
      console.error("[ERROR] Failed to extract features:", JSON.stringify(e));
      return [];
    }
  }
  toObj() {
    const bddGivens = [];
    const aaaDescribes = [];
    const tdtConfirms = [];
    for (const [k, giver] of Object.entries(this.givens)) {
      const obj = giver.toObj ? giver.toObj() : {};
      const constructorName = giver.constructor.name;
      if (constructorName === "BaseConfirm") {
        tdtConfirms.push({
          key: obj.key || k,
          values: obj.testCases || obj.values || [],
          error: obj.error,
          failed: obj.failed,
          features: obj.features || [],
          artifacts: obj.artifacts || [],
          status: obj.status
        });
      } else if (constructorName === "BaseValue") {
        tdtConfirms.push({
          key: obj.key || k,
          values: obj.values || obj.tableRows || [],
          error: obj.error,
          failed: obj.failed,
          features: obj.features || [],
          artifacts: obj.artifacts || [],
          status: obj.status
        });
      } else if (constructorName === "BaseDescribe") {
        aaaDescribes.push({
          key: obj.key || k,
          describes: obj.describes || [],
          its: obj.its || [],
          error: obj.error,
          failed: obj.failed,
          features: obj.features || [],
          artifacts: obj.artifacts || [],
          status: obj.status
        });
      } else if (constructorName === "BaseGiven") {
        bddGivens.push({
          key: obj.key || k,
          whens: obj.whens || [],
          thens: obj.thens || [],
          error: obj.error,
          failed: obj.failed,
          features: obj.features || [],
          artifacts: obj.artifacts || [],
          status: obj.status
        });
      } else {
        if (obj.values !== void 0 || obj.tableRows !== void 0 || obj.testCases !== void 0 || constructorName.includes("Confirm") || constructorName.includes("Value")) {
          tdtConfirms.push({
            key: obj.key || k,
            values: obj.values || obj.tableRows || obj.testCases || [],
            error: obj.error,
            failed: obj.failed,
            features: obj.features || [],
            artifacts: obj.artifacts || [],
            status: obj.status
          });
        } else if (obj.describes !== void 0 || obj.its !== void 0 || constructorName.includes("Describe")) {
          aaaDescribes.push({
            key: obj.key || k,
            describes: obj.describes || [],
            its: obj.its || [],
            error: obj.error,
            failed: obj.failed,
            features: obj.features || [],
            artifacts: obj.artifacts || [],
            status: obj.status
          });
        } else if (obj.whens !== void 0 || obj.thens !== void 0 || constructorName.includes("Given")) {
          bddGivens.push({
            key: obj.key || k,
            whens: obj.whens || [],
            thens: obj.thens || [],
            error: obj.error,
            failed: obj.failed,
            features: obj.features || [],
            artifacts: obj.artifacts || [],
            status: obj.status
          });
        } else {
          bddGivens.push({
            key: k,
            ...obj
          });
        }
      }
    }
    const result2 = {
      name: this.name,
      fails: this.fails,
      failed: this.failed,
      features: this.features(),
      artifacts: this.artifacts ? this.artifacts.filter((art) => typeof art === "string") : []
    };
    if (bddGivens.length > 0) {
      result2.givens = bddGivens;
    }
    if (aaaDescribes.length > 0) {
      result2.describes = aaaDescribes;
    }
    if (tdtConfirms.length > 0) {
      result2.confirms = tdtConfirms;
    }
    return result2;
  }
  setup(s, artifactory, tr) {
    return new Promise((res) => res(s));
  }
  assertThat(t) {
    return !!t;
  }
  afterAll(store, artifactory) {
    return store;
  }
  async run(input, testResourceConfiguration) {
    this.testResourceConfiguration = testResourceConfiguration;
    const sNdx = this.index;
    let suiteArtifactory;
    if (this.parent && this.parent.createArtifactory) {
      suiteArtifactory = this.parent.createArtifactory({
        suiteIndex: sNdx
      });
    } else {
      const basePath = this.testResourceConfiguration?.fs || "testeranto";
      suiteArtifactory = {
        writeFileSync: (filename, payload) => {
          console.log(
            `[BaseSuite] Would write to ${basePath}/suite-${sNdx}/${filename}: ${payload.substring(0, 100)}...`
          );
        },
        screenshot: (filename, payload) => {
          console.log(`[BaseSuite] Would take screenshot: ${filename}`);
        }
      };
    }
    const subject = await this.setup(input, suiteArtifactory, testResourceConfiguration);
    for (const [gKey, giver] of Object.entries(this.givens)) {
      try {
        let givenArtifactory;
        if (this.parent && this.parent.createArtifactory) {
          givenArtifactory = this.parent.createArtifactory({
            givenKey: gKey,
            suiteIndex: sNdx
          });
        } else {
          const basePath = this.testResourceConfiguration?.fs || "testeranto";
          givenArtifactory = {
            writeFileSync: (filename, payload) => {
              const path2 = `suite-${sNdx}/given-${gKey}/${filename}`;
              const fullPath = `${basePath}/${path2}`;
              console.log(`[BaseSuite] Would write to ${fullPath}: ${payload.substring(0, 100)}...`);
            },
            screenshot: (filename, payload) => {
              console.log(`[BaseSuite] Would take screenshot: ${filename}`);
            }
          };
        }
        if (typeof giver.give === "function") {
          this.store = await giver.give(
            subject,
            gKey,
            testResourceConfiguration,
            this.assertThat,
            givenArtifactory,
            sNdx
          );
        } else if (typeof giver.describe === "function") {
          this.store = await giver.describe(
            subject,
            gKey,
            testResourceConfiguration,
            this.assertThat,
            givenArtifactory,
            sNdx
          );
        } else if (typeof giver.run === "function") {
          this.store = await giver.run(
            subject,
            testResourceConfiguration,
            givenArtifactory
          );
        } else if (typeof giver.confirm === "function") {
          this.store = await giver.confirm(
            subject,
            gKey,
            testResourceConfiguration,
            this.assertThat,
            givenArtifactory,
            sNdx
          );
        } else if (typeof giver.value === "function") {
          this.store = await giver.value(
            subject,
            gKey,
            testResourceConfiguration,
            this.assertThat,
            givenArtifactory,
            sNdx
          );
        } else {
          throw new Error(`Giver ${gKey} has no valid method (give, describe, run, or value)`);
        }
        this.fails += giver.fails || 0;
      } catch (e) {
        this.failed = true;
        this.fails += 1;
        if (giver.fails) {
          this.fails += giver.fails;
        }
        console.error(`Error in given ${gKey}:`, e);
      }
    }
    if (this.fails > 0) {
      this.failed = true;
    }
    try {
      this.afterAll(this.store, suiteArtifactory);
    } catch (e) {
      console.error(JSON.stringify(e));
    }
    return this;
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
              const result2 = await this.thenCB(s);
              return result2;
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

// src/lib/tiposkripto/src/verbs/bdd/BaseWhen.ts
var BaseWhen = class {
  constructor(name, whenCB) {
    this.error = null;
    this.name = name;
    this.whenCB = whenCB;
  }
  async test(store, testResourceConfiguration, artifactory) {
    try {
      const result2 = await this.andWhen(
        store,
        this.whenCB,
        testResourceConfiguration,
        artifactory
      );
      this.status = true;
      return result2;
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
      testCases: testCases.map((testCase) => {
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
            } else if (value && typeof value.toObj === "function") {
              const obj = value.toObj();
              input = obj.features || obj;
            } else {
              input = value;
            }
            if (typeof should === "function") {
              should(input, this.confirmCB);
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
      const result2 = await this.expectedCB(store);
      this.status = true;
      return result2;
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
  async processRow(store, testResourceConfiguration, artifactory) {
    try {
      const result2 = await this.shouldCB(store);
      this.status = true;
      return result2;
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
      currentRow: this.currentRow
    };
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
      const result2 = this.confirmCB();
      if (typeof result2 === "function") {
        this.store = await result2();
      } else {
        this.store = await result2;
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
    const processedRows = (this.tableRows || []).map((row) => {
      if (Array.isArray(row)) {
        return row.map((item) => {
          if (item && typeof item === "object") {
            if (item.toObj) {
              return item.toObj();
            }
            const result2 = {};
            for (const [key, value] of Object.entries(item)) {
              if (key !== "_parent" && key !== "testResourceConfiguration") {
                result2[key] = value;
              }
            }
            return result2;
          }
          return item;
        });
      }
      return row;
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

// src/lib/tiposkripto/src/BaseTiposkripto.ts
var BaseTiposkripto = class {
  constructor(webOrNode, input, testSpecification, testImplementation, testResourceRequirement = defaultTestResourceRequirement, testAdapter = {}, testResourceConfiguration) {
    this.totalTests = 0;
    this.artifacts = [];
    this.testResourceConfiguration = testResourceConfiguration;
    const fullAdapter = DefaultAdapter(testAdapter);
    const instance = this;
    if (!testImplementation.suites || typeof testImplementation.suites !== "object") {
      throw new Error(
        `testImplementation.suites must be an object, got ${typeof testImplementation.suites}: ${JSON.stringify(
          testImplementation.suites
        )}`
      );
    }
    const classySuites = Object.entries(testImplementation.suites).reduce(
      (a, [key], index) => {
        a[key] = (somestring, setups) => {
          const capturedFullAdapter = fullAdapter;
          return new class extends BaseSuite {
            afterAll(store, artifactory) {
              let suiteArtifactory = artifactory;
              if (!suiteArtifactory) {
                if (this.parent && this.parent.createArtifactory) {
                  suiteArtifactory = this.parent.createArtifactory({
                    suiteIndex: this.index
                  });
                } else {
                  suiteArtifactory = instance.createArtifactory({
                    suiteIndex: this.index
                  });
                }
              }
              return capturedFullAdapter.cleanupAll(store, suiteArtifactory);
            }
            assertThat(t) {
              return capturedFullAdapter.assert(t);
            }
            async setup(s, artifactory, tr) {
              return capturedFullAdapter.prepareAll?.(s, tr, artifactory) ?? s;
            }
          }(somestring, index, setups, instance);
        };
        return a;
      },
      {}
    );
    const classyGivens = {};
    if (testImplementation.givens) {
      Object.entries(testImplementation.givens).forEach(([key, g]) => {
        classyGivens[key] = (features, whens, thens, gcb, initialValues) => {
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
      });
    }
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
    const classyThens = {};
    if (testImplementation.thens) {
      Object.entries(testImplementation.thens).forEach(
        ([key, thEn]) => {
          classyThens[key] = (...args) => {
            const capturedFullAdapter = fullAdapter;
            const thenInstance = new class extends BaseThen {
              async butThen(store, thenCB, testResourceConfiguration2, artifactory) {
                return capturedFullAdapter.verify(
                  store,
                  thenCB,
                  testResourceConfiguration2,
                  artifactory
                );
              }
            }(`${key}: ${args && args.toString()}`, thEn(...args));
            return thenInstance;
          };
        }
      );
    }
    const classyConfirms = {};
    if (testImplementation.confirms) {
      Object.entries(testImplementation.confirms).forEach(([key, val]) => {
        classyConfirms[key] = (features, testCases, confirmCB, initialValues) => {
          return new BaseConfirm(
            features,
            testCases,
            val,
            initialValues
          );
        };
      });
    }
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
    const classyDescribes = {};
    if (testImplementation.describes) {
      Object.entries(testImplementation.describes).forEach(([key, desc]) => {
        classyDescribes[key] = (features, its, describeCB, initialValues) => {
          const actualDescribeCB = describeCB || desc;
          return new BaseDescribe(
            features,
            its,
            actualDescribeCB,
            initialValues
          );
        };
      });
    }
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
    try {
      this.specs = testSpecification(
        this.Suites(),
        this.Given(),
        this.When(),
        this.Then(),
        this.Describe(),
        this.It(),
        this.Confirm(),
        this.Value(),
        this.Should(),
        this.Expected()
      );
      this.totalTests = this.calculateTotalTests();
      this.testJobs = this.specs.map((suite) => {
        const suiteRunner = (suite2) => async (testResourceConfiguration2) => {
          try {
            const x = await suite2.run(input, testResourceConfiguration2);
            return x;
          } catch (e) {
            console.error(e.stack);
            throw e;
          }
        };
        const runner = suiteRunner(suite);
        const totalTests = this.totalTests;
        const testJob = {
          test: suite,
          toObj: () => {
            return suite.toObj();
          },
          runner,
          receiveTestResourceConfig: async (testResourceConfiguration2) => {
            try {
              const suiteDone = await runner(
                testResourceConfiguration2
              );
              const fails = suiteDone.fails;
              return {
                failed: fails > 0,
                fails,
                artifacts: [],
                // this.artifacts is not accessible here
                features: suiteDone.features(),
                tests: 0,
                runTimeTests: totalTests,
                testJob: testJob.toObj()
              };
            } catch (e) {
              console.error(e.stack);
              return {
                failed: true,
                fails: -1,
                artifacts: [],
                features: [],
                tests: 0,
                runTimeTests: -1,
                testJob: testJob.toObj()
              };
            }
          }
        };
        return testJob;
      });
      if (this.testJobs.length > 0) {
        this.testJobs[0].receiveTestResourceConfig(
          testResourceConfiguration
        ).then((results) => {
          results.timestamp = Date.now();
          console.log("testResourceConfiguration", testResourceConfiguration);
          const reportJson = `${testResourceConfiguration.fs}/tests.json`;
          this.writeFileSync(reportJson, JSON.stringify(results, null, 2));
        }).catch((error) => {
          console.error("Error running test job:", error);
          const errorResults = {
            failed: true,
            fails: -1,
            artifacts: [],
            features: [],
            tests: 0,
            runTimeTests: -1,
            testJob: {},
            timestamp: Date.now(),
            error: error.message,
            stack: error.stack
          };
          const reportJson = `${testResourceConfiguration.fs}/tests.json`;
          this.writeFileSync(reportJson, JSON.stringify(errorResults, null, 2));
        });
      } else {
        const emptyResults = {
          failed: true,
          fails: -1,
          artifacts: [],
          features: [],
          tests: 0,
          runTimeTests: -1,
          testJob: {},
          timestamp: Date.now(),
          error: "No test jobs were created"
        };
        const reportJson = `${testResourceConfiguration.fs}/tests.json`;
        this.writeFileSync(reportJson, JSON.stringify(emptyResults, null, 2));
      }
    } catch (error) {
      console.error("Error during test specification:", error);
      const errorResults = {
        failed: true,
        fails: -1,
        artifacts: [],
        features: [],
        tests: 0,
        runTimeTests: -1,
        testJob: {},
        timestamp: Date.now(),
        error: error.message,
        stack: error.stack
      };
      const reportJson = `${testResourceConfiguration.fs}/tests.json`;
      this.writeFileSync(reportJson, JSON.stringify(errorResults, null, 2));
      throw error;
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
        if (context.suiteIndex !== void 0) {
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
      // screenshot, openScreencast, and closeScreencast are only applicable to web runtime
      // They should be implemented in WebTiposkripto and will be added to the artifactory there
      // For non-web runtimes, these methods will not be available
    };
  }
  async receiveTestResourceConfig(testResourceConfig) {
    if (this.testJobs && this.testJobs.length > 0) {
      return this.testJobs[0].receiveTestResourceConfig(testResourceConfig);
    } else {
      throw new Error("No test jobs available");
    }
  }
  Specs() {
    return this.specs;
  }
  Suites() {
    if (!this.suitesOverrides) {
      throw new Error(
        `suitesOverrides is undefined. classySuites: ${JSON.stringify(
          Object.keys(this.suitesOverrides || {})
        )}`
      );
    }
    return this.suitesOverrides;
  }
  Given() {
    return this.givenOverrides;
  }
  When() {
    return this.whenOverrides;
  }
  Then() {
    return this.thenOverrides;
  }
  Describe() {
    return this.describesOverrides || {};
  }
  It() {
    return this.itsOverrides || {};
  }
  Confirm() {
    return this.confirmsOverrides || {};
  }
  Value() {
    return this.valuesOverrides || {};
  }
  Should() {
    return this.shouldsOverrides || {};
  }
  Expect() {
    return this.expectedsOverrides || {};
  }
  Expected() {
    return this.expectedsOverrides || {};
  }
  // Add a method to access test jobs which can be used by receiveTestResourceConfig
  getTestJobs() {
    return this.testJobs;
  }
  calculateTotalTests() {
    let total = 0;
    for (const suite of this.specs) {
      if (suite && typeof suite === "object") {
        if ("givens" in suite) {
          const givens = suite.givens;
          if (givens && typeof givens === "object") {
            total += Object.keys(givens).length;
          }
        }
      }
    }
    return total;
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

// src/lib/tiposkripto/tests/calculator/Calculator.ts
var Calculator = class {
  constructor() {
    this.display = "";
    this.values = {};
  }
  enter() {
    try {
      const result = eval(this.display);
      if (result === Infinity || result === -Infinity) {
        this.display = "Error";
      } else {
        this.display = result.toString();
      }
    } catch (error) {
      this.display = "Error";
    }
  }
  memoryStore() {
    this.setValue("memory", parseFloat(this.display) || 0);
    this.clear();
  }
  memoryRecall() {
    const memoryValue = this.getValue("memory") || 0;
    this.display = memoryValue.toString();
  }
  memoryClear() {
    this.setValue("memory", 0);
  }
  memoryAdd() {
    const currentValue = parseFloat(this.display) || 0;
    const memoryValue = this.getValue("memory") || 0;
    this.setValue("memory", memoryValue + currentValue);
    this.clear();
  }
  handleSpecialButton(button) {
    switch (button) {
      case "C":
        this.clear();
        return true;
      case "MS":
        this.memoryStore();
        return true;
      case "MR":
        this.memoryRecall();
        return true;
      case "MC":
        this.memoryClear();
        return true;
      case "M+":
        this.memoryAdd();
        return true;
      default:
        return false;
    }
  }
  press(button) {
    if (this.handleSpecialButton(button)) {
      return this;
    }
    this.display = this.display + button;
    return this;
  }
  getDisplay() {
    return this.display;
  }
  clear() {
    this.display = "";
  }
  // Keep these methods for backward compatibility if needed
  add(a, b) {
    return a + b;
  }
  subtract(a, b) {
    return a - b;
  }
  multiply(a, b) {
    return a * b;
  }
  divide(a, b) {
    if (b === 0) {
      throw new Error("Cannot divide by zero");
    }
    return a / b;
  }
  setValue(identifier, value) {
    this.values[identifier] = value;
  }
  getValue(identifier) {
    return this.values[identifier] ?? null;
  }
};

// src/lib/tiposkripto/tests/calculator/Calculator.test.adapter.ts
var adapter = {
  prepareAll: async (input, testResource, artifactory) => {
    console.log("[adapter] beforeAll called with input:", input);
    return input;
  },
  prepareEach: async (subject, initializer, testResource, initialValues, artifactory) => {
    console.log("[adapter] beforeEach called with subject:", subject);
    const calculator = initializer();
    console.log("[adapter] beforeEach created calculator:", calculator);
    return calculator;
  },
  execute: async (store, whenCB, testResource, artifactory) => {
    console.log("[adapter] andWhen called with store:", store);
    const result2 = whenCB(store);
    console.log("[adapter] andWhen result:", result2);
    return result2;
  },
  verify: async (store, verificationFn, testResource, artifactory) => {
    console.log("[adapter] verify called with store:", store);
    console.log("[adapter] verificationFn:", verificationFn);
    if (typeof verificationFn === "function") {
      try {
        const actualVerificationFn = verificationFn();
        if (typeof actualVerificationFn === "function") {
          try {
            return actualVerificationFn(store);
          } catch (e) {
            console.log("[adapter] verificationFn expects different signature:", e.message);
            throw e;
          }
        } else {
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
      "afterAll called, but skipping web-only storage operations in Node.js"
    );
    artifactory.writeFileSync("fizz", "buzz");
    return store;
  },
  assert: (actual) => {
    console.log("[adapter] assert called with actual:", actual);
    return actual;
  }
};

// src/lib/tiposkripto/tests/calculator/Calculator.test.implementation.ts
import { assert } from "chai";
var implementation = {
  suites: {
    Default: { description: "Comprehensive test suite for Calculator" }
  },
  // TDT style /////////////////////////
  confirms: {
    addition: new Calculator().add
  },
  values: {
    of: (...numbers) => {
      return numbers;
    },
    "one and two": () => {
      return [1, 2];
    }
  },
  shoulds: {
    beEqualTo: (expected) => {
      return (input, confirmation) => {
        return assert.equal(expected, confirmation(input[0], input[1]));
      };
    },
    beGreaterThan: (expected) => {
      return (input, confirmation) => {
        const result2 = confirmation(input[0], input[1]);
        return assert.isAbove(result2, expected, `${result2} should be greater than ${expected}`);
      };
    },
    // whenAddedAreGreaterThan: (expected: number) => {
    //   return (input: number[], calculator: Calculator) => {
    //     const [a, b] = input;
    //     const result = calculator.add(a, b);
    //     assert.isAbove(result, expected, `${a} + ${b} should be greater than ${expected}`);
    //   };
    // },
    whenMultipliedAreAtLeast: (expected) => {
      return (input, calculator) => {
        const [a, b] = input;
        const result2 = calculator.multiply(a, b);
        assert.isAtLeast(result2, expected, `${a} * ${b} should be at least ${expected}`);
      };
    },
    equal: (expected) => {
      return (input, calculator) => {
        assert.deepEqual(input, expected);
      };
    }
  },
  // AAA style /////////////////////////
  describes: {
    "another simple calculator": () => new Calculator()
  },
  its: {
    "can save 1 memory": () => {
      return (calculator) => {
        calculator.memoryStore();
        assert.equal(calculator.getValue("memory"), 0);
      };
    },
    "can save 2 memories": () => {
      return (calculator) => {
        calculator.memoryStore();
        calculator.memoryAdd();
        const memory = calculator.getValue("memory");
        assert.isNumber(memory);
      };
    }
  },
  // BDD style /////////////////////////
  givens: {
    Default: () => new Calculator()
  },
  whens: {
    press: (button) => {
      return (calculator) => {
        return calculator.press(button);
      };
    },
    enter: () => {
      return (calculator) => {
        calculator.enter();
        return calculator;
      };
    },
    memoryStore: () => {
      return (calculator) => {
        calculator.memoryStore();
        return calculator;
      };
    },
    memoryRecall: () => {
      return (calculator) => {
        calculator.memoryRecall();
        return calculator;
      };
    },
    memoryClear: () => {
      return (calculator) => {
        calculator.memoryClear();
        return calculator;
      };
    },
    memoryAdd: () => {
      return (calculator) => {
        calculator.memoryAdd();
        return calculator;
      };
    }
  },
  thens: {
    result: (expected) => {
      return (calculator) => {
        const actual = calculator.getDisplay();
        const actualNum = parseFloat(actual);
        const expectedNum = parseFloat(expected);
        if (!isNaN(actualNum) && !isNaN(expectedNum)) {
          assert.closeTo(actualNum, expectedNum, 1e-7);
        } else {
          assert.equal(actual, expected);
        }
      };
    }
  }
};

// src/lib/tiposkripto/tests/calculator/Calculator.test.specification.ts
var specification = (Suite, Given, When, Then, Describe, It, Confirm, Value, Should) => {
  return [
    Suite.Default("Comprehensive Calculator Test", {
      // ========== TDT (Table-Driven Testing) Tests ==========
      tdtAdditionTable: Confirm["addition"](
        ["TDT addition table"],
        [
          [Value.of([1, 1]), Should.beEqualTo(2)],
          [Value.of([2, 3]), Should.beGreaterThan(4)]
        ]
      ),
      // ========== AAA (Describe-It) Tests ==========
      aaaBasicOperations: Describe["another simple calculator"](
        ["AAA basic operations"],
        [
          It["can save 1 memory"](),
          It["can save 2 memories"]()
        ]
      ),
      aaaDisplayTests: Describe["another simple calculator"](
        ["AAA display functionality"],
        [
          // We'll need to add more its in the implementation
          // For now, reuse existing ones
          It["can save 1 memory"](),
          It["can save 2 memories"]()
        ]
      ),
      aaaNestedDescribes: Describe["another simple calculator"](
        ["AAA nested structure"],
        [
          It["can save 1 memory"](),
          It["can save 2 memories"]()
        ]
      ),
      // ========== BDD (Given-When-Then) Tests ==========
      // Basic display tests
      bddEmptyDisplay: Given.Default(
        ["BDD empty display"],
        [],
        [Then.result("")]
      ),
      bddSingleDigit: Given.Default(
        ["BDD single digit"],
        [When.press("7")],
        [Then.result("7")]
      ),
      bddMultipleDigits: Given.Default(
        ["BDD multiple digits"],
        [When.press("1"), When.press("2"), When.press("3")],
        [Then.result("123")]
      ),
      // Arithmetic operations
      bddAddition: Given.Default(
        ["BDD addition"],
        [
          When.press("5"),
          When.press("+"),
          When.press("3"),
          When.enter()
        ],
        [Then.result("8")]
      ),
      bddSubtraction: Given.Default(
        ["BDD subtraction"],
        [
          When.press("9"),
          When.press("-"),
          When.press("4"),
          When.enter()
        ],
        [Then.result("5")]
      ),
      bddMultiplication: Given.Default(
        ["BDD multiplication"],
        [
          When.press("6"),
          When.press("*"),
          When.press("7"),
          When.enter()
        ],
        [Then.result("42")]
      ),
      bddDivision: Given.Default(
        ["BDD division"],
        [
          When.press("8"),
          When.press("/"),
          When.press("2"),
          When.enter()
        ],
        [Then.result("4")]
      ),
      // Complex expressions
      bddChainedOperations: Given.Default(
        ["BDD chained operations"],
        [
          When.press("2"),
          When.press("+"),
          When.press("3"),
          When.press("*"),
          When.press("4"),
          When.enter()
        ],
        [Then.result("14")]
      ),
      bddDecimalOperations: Given.Default(
        ["BDD decimal operations"],
        [
          When.press("3"),
          When.press("."),
          When.press("1"),
          When.press("4"),
          When.press("+"),
          When.press("1"),
          When.press("."),
          When.press("5"),
          When.enter()
        ],
        [Then.result("4.64")]
      ),
      // Clear functionality
      bddClearDisplay: Given.Default(
        ["BDD clear display"],
        [
          When.press("9"),
          When.press("9"),
          When.press("C"),
          When.press("5")
        ],
        [Then.result("5")]
      ),
      // Memory operations
      bddMemoryStoreRecall: Given.Default(
        ["BDD memory store and recall"],
        [
          When.press("4"),
          When.press("2"),
          When.memoryStore(),
          When.press("C"),
          When.memoryRecall()
        ],
        [Then.result("42")]
      ),
      bddMemoryAdd: Given.Default(
        ["BDD memory add"],
        [
          When.press("1"),
          When.press("0"),
          When.memoryStore(),
          When.press("C"),
          When.press("2"),
          When.press("0"),
          When.memoryAdd(),
          When.memoryRecall()
        ],
        [Then.result("30")]
      ),
      bddMemoryClear: Given.Default(
        ["BDD memory clear"],
        [
          When.press("7"),
          When.press("7"),
          When.memoryStore(),
          When.memoryClear(),
          When.memoryRecall()
        ],
        [Then.result("0")]
      ),
      // Error cases
      bddDivisionByZero: Given.Default(
        ["BDD division by zero"],
        [
          When.press("5"),
          When.press("/"),
          When.press("0"),
          When.enter()
        ],
        [Then.result("Error")]
      ),
      bddInvalidExpression: Given.Default(
        ["BDD invalid expression"],
        [
          When.press("2"),
          When.press("+"),
          When.press("+"),
          When.press("3"),
          When.enter()
        ],
        [Then.result("Error")]
      ),
      // Multiple whens and thens
      bddMultipleActions: Given.Default(
        ["BDD multiple actions and assertions"],
        [
          When.press("1"),
          When.press("+"),
          When.press("2"),
          When.enter(),
          When.press("*"),
          When.press("3"),
          When.enter()
        ],
        [
          Then.result("9")
        ]
      ),
      // Edge cases
      bddStartingWithOperator: Given.Default(
        ["BDD starting with operator"],
        [When.press("+"), When.press("5")],
        [Then.result("+5")]
      ),
      bddMultipleOperators: Given.Default(
        ["BDD multiple operators"],
        [When.press("5"), When.press("+"), When.press("-"), When.press("3")],
        [Then.result("5+-3")]
      ),
      bddLargeNumber: Given.Default(
        ["BDD large number"],
        [
          When.press("1"),
          When.press("2"),
          When.press("3"),
          When.press("4"),
          When.press("5"),
          When.press("6"),
          When.press("7"),
          When.press("8"),
          When.press("9")
        ],
        [Then.result("123456789")]
      ),
      // Mixed operations with memory
      bddComplexMemoryScenario: Given.Default(
        ["BDD complex memory scenario"],
        [
          When.press("1"),
          When.press("0"),
          When.memoryStore(),
          When.press("C"),
          When.press("2"),
          When.press("0"),
          When.memoryAdd(),
          When.press("C"),
          When.press("5"),
          When.memoryAdd(),
          When.memoryRecall(),
          When.press("*"),
          When.press("2"),
          When.enter()
        ],
        [Then.result("70")]
      ),
      // Parentheses operations
      bddParentheses: Given.Default(
        ["BDD parentheses"],
        [
          When.press("("),
          When.press("2"),
          When.press("+"),
          When.press("3"),
          When.press(")"),
          When.press("*"),
          When.press("4"),
          When.enter()
        ],
        [Then.result("20")]
      ),
      // Zero handling
      bddZeroOperations: Given.Default(
        ["BDD zero operations"],
        [
          When.press("0"),
          When.press("+"),
          When.press("0"),
          When.enter()
        ],
        [Then.result("0")]
      ),
      bddMultiplyByZero: Given.Default(
        ["BDD multiply by zero"],
        [
          When.press("5"),
          When.press("*"),
          When.press("0"),
          When.enter()
        ],
        [Then.result("0")]
      )
    })
  ];
};

// src/lib/tiposkripto/tests/calculator/Calculator.test.node.ts
var Calculator_test_node_default = new NodeTiposkripto(
  Calculator,
  specification,
  implementation,
  adapter,
  { ports: 1e3 }
);
export {
  Calculator_test_node_default as default
};
