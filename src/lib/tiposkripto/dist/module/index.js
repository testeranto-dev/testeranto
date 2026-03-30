// src/BaseSetup.ts
var BaseSetup = class {
  constructor(features, actions, checks, setupCB, initialValues) {
    this.recommendedFsPath = "";
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
          const actionArtifactory = this.createArtifactoryForAction(
            key,
            actionNdx,
            suiteNdx
          );
          this.store = await actionStep.test(
            this.store,
            testResourceConfiguration,
            actionArtifactory
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
          const checkArtifactory = this.createArtifactoryForCheck(
            key,
            checkNdx,
            suiteNdx
          );
          const t = await checkStep.test(
            this.store,
            testResourceConfiguration,
            filepath,
            checkArtifactory
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
  createArtifactoryForAction(key, actionIndex, suiteNdx) {
    const self = this;
    if (self._parent && self._parent.createArtifactory) {
      return self._parent.createArtifactory({
        givenKey: key,
        whenIndex: actionIndex,
        suiteIndex: suiteNdx
      });
    }
    return {
      writeFileSync: (filename, payload) => {
        let path = "";
        if (suiteNdx !== void 0) {
          path += `suite-${suiteNdx}/`;
        }
        path += `setup-${key}/`;
        path += `action-${actionIndex} ${filename}`;
        console.log(`[Artifactory] Would write to: ${path}`);
        console.log(`[Artifactory] Content: ${payload.substring(0, 100)}...`);
      },
      screenshot: (filename, payload) => {
        console.log(`[Artifactory] Would take screenshot: ${filename}`);
      }
    };
  }
  createArtifactoryForCheck(key, checkIndex, suiteNdx) {
    const self = this;
    if (self._parent && self._parent.createArtifactory) {
      return self._parent.createArtifactory({
        givenKey: key,
        thenIndex: checkIndex,
        suiteIndex: suiteNdx
      });
    }
    return {
      writeFileSync: (filename, payload) => {
        let path = "";
        if (suiteNdx !== void 0) {
          path += `suite-${suiteNdx}/`;
        }
        path += `setup-${key}/`;
        path += `check-${checkIndex} ${filename}`;
        console.log(`[Artifactory] Would write to: ${path}`);
        console.log(`[Artifactory] Content: ${payload.substring(0, 100)}...`);
      },
      screenshot: (filename, payload) => {
        console.log(`[Artifactory] Would take screenshot: ${filename}`);
      }
    };
  }
};

// src/BaseGiven.ts
var BaseGiven = class extends BaseSetup {
  constructor(features, whens, thens, givenCB, initialValues) {
    super(features, whens, thens, givenCB, initialValues);
    this.artifacts = [];
    this.fails = 0;
    this._parent = null;
    this.whens = whens || [];
    this.thens = thens || [];
    console.log(`[BaseGiven.constructor] _parent initialized to null`);
    console.log(`[BaseGiven.constructor] whens:`, this.whens.length);
    console.log(`[BaseGiven.constructor] thens:`, this.thens.length);
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
  // Set the parent explicitly
  setParent(parent) {
    this._parent = parent;
    console.log(`[BaseGiven.setParent] _parent set to:`, parent);
  }
  beforeAll(store) {
    return store;
  }
  toObj() {
    const whens = this.whens || [];
    const thens = this.thens || [];
    return {
      key: this.key,
      actions: whens.map((w) => {
        if (w && w.toObj) return w.toObj();
        console.error("When step is not as expected!", JSON.stringify(w));
        return {};
      }),
      checks: thens.map((t) => t && t.toObj ? t.toObj() : {}),
      error: this.error ? [this.error, this.error.stack] : null,
      failed: this.failed,
      features: this.features || [],
      artifacts: this.artifacts,
      status: this.status
    };
  }
  // Implement BaseSetup's abstract method
  async setupThat(subject, testResourceConfiguration, artifactory, setupCB, initialValues) {
    return this.givenThat(
      subject,
      testResourceConfiguration,
      artifactory,
      setupCB,
      initialValues
    );
  }
  async afterEach(store, key, artifactory) {
    return store;
  }
  async give(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx) {
    this.key = key;
    this.fails = 0;
    this._suiteIndex = suiteNdx;
    const actualArtifactory = artifactory || this.createDefaultArtifactory(key, suiteNdx);
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
      this.failed = true;
      this.fails++;
      this.error = e;
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
            this.failed = true;
            this.fails++;
            this.error = e;
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
            this.failed = true;
            this.fails++;
            this.error = e;
          }
        }
      } else {
        console.warn(`[BaseGiven.give] thens is not an array:`, thens);
      }
    } catch (e) {
      this.error = e;
      this.failed = true;
      this.fails++;
    } finally {
      try {
        await this.afterEach(this.store, this.key, actualArtifactory);
      } catch (e) {
        this.failed = true;
        this.fails++;
        this.error = e;
      }
    }
    return this.store;
  }
  createDefaultArtifactory(givenKey, suiteNdx) {
    const self = this;
    console.log(`[BaseGiven.createDefaultArtifactory] self._parent:`, self._parent);
    console.log(`[BaseGiven.createDefaultArtifactory] self._parent.createArtifactory:`, self._parent?.createArtifactory);
    if (self._parent && self._parent.createArtifactory) {
      const artifactory = self._parent.createArtifactory({
        givenKey,
        suiteIndex: suiteNdx
      });
      console.log(`[BaseGiven.createDefaultArtifactory] Created artifactory from parent:`, artifactory);
      return artifactory;
    }
    let basePath = "testeranto";
    if (self._parent && self._parent.testResourceConfiguration?.fs) {
      basePath = self._parent.testResourceConfiguration.fs;
      console.log(`[BaseGiven.createDefaultArtifactory] Using base path from parent: ${basePath}`);
    } else {
      console.log(`[BaseGiven.createDefaultArtifactory] Using default base path: ${basePath}`);
    }
    return {
      writeFileSync: (filename, payload) => {
        let path = "";
        if (suiteNdx !== void 0) {
          path += `suite-${suiteNdx}/`;
        }
        path += `given-${givenKey}/`;
        path += filename;
        if (!path.match(/\.[a-zA-Z0-9]+$/)) {
          path += ".txt";
        }
        const fullPath = `${basePath}/${path}`;
        console.log(`[Artifactory] Writing to: ${fullPath}`);
        if (self._parent && typeof self._parent.writeFileSync === "function") {
          self._parent.writeFileSync(fullPath, payload);
        } else {
          console.log(`[Artifactory] Would write to: ${fullPath}`);
          console.log(`[Artifactory] Content: ${payload.substring(0, 100)}...`);
        }
      },
      screenshot: (filename, payload) => {
        let path = "";
        if (suiteNdx !== void 0) {
          path += `suite-${suiteNdx}/`;
        }
        path += `given-${givenKey}/`;
        path += filename;
        if (!path.match(/\.[a-zA-Z0-9]+$/)) {
          path += ".png";
        }
        const fullPath = `${basePath}/${path}`;
        console.log(`[Artifactory] Would take screenshot: ${fullPath}`);
        if (self._parent && typeof self._parent.screenshot === "function") {
          self._parent.screenshot(fullPath, payload || "");
        }
      }
    };
  }
  createArtifactoryForWhen(givenKey, whenIndex, suiteNdx) {
    const self = this;
    console.log(`[BaseGiven.createArtifactoryForWhen] self._parent:`, self._parent);
    console.log(`[BaseGiven.createArtifactoryForWhen] self._parent.createArtifactory:`, self._parent?.createArtifactory);
    if (self._parent && self._parent.createArtifactory) {
      const artifactory = self._parent.createArtifactory({
        givenKey,
        whenIndex,
        suiteIndex: suiteNdx
      });
      console.log(`[BaseGiven.createArtifactoryForWhen] Created artifactory:`, artifactory);
      return artifactory;
    }
    console.log(`[BaseGiven.createArtifactoryForWhen] Using fallback artifactory`);
    return {
      writeFileSync: (filename, payload) => {
        let path = "";
        if (suiteNdx !== void 0) {
          path += `suite-${suiteNdx}/`;
        }
        path += `given-${givenKey}/`;
        path += `when-${whenIndex} ${filename}`;
        console.log(`[Artifactory] Would write to: ${path}`);
        console.log(`[Artifactory] Content: ${payload.substring(0, 100)}...`);
      },
      screenshot: (filename, payload) => {
        console.log(`[Artifactory] Would take screenshot: ${filename}`);
      }
    };
  }
  createArtifactoryForThen(givenKey, thenIndex, suiteNdx) {
    const self = this;
    console.log(`[BaseGiven.createArtifactoryForThen] self._parent:`, self._parent);
    console.log(`[BaseGiven.createArtifactoryForThen] self._parent.createArtifactory:`, self._parent?.createArtifactory);
    if (self._parent && self._parent.createArtifactory) {
      const artifactory = self._parent.createArtifactory({
        givenKey,
        thenIndex,
        suiteIndex: suiteNdx
      });
      console.log(`[BaseGiven.createArtifactoryForThen] Created artifactory:`, artifactory);
      return artifactory;
    }
    console.log(`[BaseGiven.createArtifactoryForThen] Using fallback artifactory`);
    return {
      writeFileSync: (filename, payload) => {
        let path = "";
        if (suiteNdx !== void 0) {
          path += `suite-${suiteNdx}/`;
        }
        path += `given-${givenKey}/`;
        path += `then-${thenIndex} ${filename}`;
        console.log(`[Artifactory] Would write to: ${path}`);
        console.log(`[Artifactory] Content: ${payload.substring(0, 100)}...`);
      },
      screenshot: (filename, payload) => {
        console.log(`[Artifactory] Would take screenshot: ${filename}`);
      }
    };
  }
};

// src/BaseAction.ts
var BaseAction = class {
  constructor(name, actionCB) {
    this.error = null;
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
  async test(store, testResourceConfiguration, artifactory) {
    try {
      const result = await this.performAction(
        store,
        this.actionCB,
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
  async test(store, testResourceConfiguration, filepath, artifactory) {
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
        testResourceConfiguration,
        artifactory
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

// src/BaseThen.ts
var BaseThen = class extends BaseCheck {
  constructor(name, thenCB) {
    super(name, thenCB);
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
            this.error = true;
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
      this.error = true;
      throw e;
    }
  }
};

// src/BaseValue.ts
var BaseValue = class extends BaseSetup {
  constructor(features, tableRows, confirmCB, initialValues) {
    super(features, [], [], confirmCB, initialValues);
    this.tableRows = tableRows;
  }
  // Override setup to process table rows
  async setup(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx) {
    this.key = key;
    this.fails = 0;
    const actualArtifactory = artifactory || ((fPath, value) => {
    });
    const valueArtifactory = (fPath, value) => actualArtifactory(`value-${key}/${fPath}`, value);
    try {
      this.store = await this.setupThat(
        subject,
        testResourceConfiguration,
        valueArtifactory,
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
      for (const [rowIndex, row] of (this.tableRows || []).entries()) {
        try {
          const rowArtifactory = this.createArtifactoryForRow(
            key,
            rowIndex,
            suiteNdx
          );
          const rowResult = await this.processRow(row, rowIndex, rowArtifactory, testResourceConfiguration);
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
        let path = "";
        if (suiteNdx !== void 0) {
          path += `suite-${suiteNdx}/`;
        }
        path += `value-${key}/`;
        path += `row-${rowIndex} ${filename}`;
        console.log(`[Artifactory] Would write to: ${path}`);
        console.log(`[Artifactory] Content: ${payload.substring(0, 100)}...`);
      },
      screenshot: (filename, payload) => {
        console.log(`[Artifactory] Would take screenshot: ${filename}`);
      }
    };
  }
};

// src/BaseShould.ts
var BaseShould = class extends BaseAction {
  constructor(name, shouldCB) {
    super(name, shouldCB);
    // Current row data
    this.currentRow = [];
    this.rowIndex = -1;
  }
  // Set current row data
  setRowData(rowIndex, rowData) {
    this.rowIndex = rowIndex;
    this.currentRow = rowData;
  }
  // Process the current row
  async processRow(store, testResourceConfiguration, artifactory) {
    try {
      const result = await this.performAction(
        store,
        this.actionCB,
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
};

// src/BaseExpected.ts
var BaseExpected = class extends BaseCheck {
  constructor(name, expectedCB) {
    super(name, expectedCB);
    // Expected value for current row
    this.expectedValue = null;
  }
  // Set expected value for current row
  setExpectedValue(expected) {
    this.expectedValue = expected;
  }
  // Validate current row
  async validateRow(store, testResourceConfiguration, filepath, expectedValue, artifactory) {
    this.setExpectedValue(expectedValue);
    return this.test(store, testResourceConfiguration, filepath, artifactory);
  }
};

// src/BaseDescribe.ts
var BaseDescribe = class _BaseDescribe extends BaseSetup {
  constructor(features, its, describeCB, initialValues) {
    super(features, its, [], describeCB, initialValues);
    this.its = its;
  }
  // Override setup to handle Its differently
  async setup(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx) {
    this.key = key;
    this.fails = 0;
    const actualArtifactory = artifactory || ((fPath, value) => {
    });
    const describeArtifactory = (fPath, value) => actualArtifactory(`describe-${key}/${fPath}`, value);
    try {
      this.store = await this.setupThat(
        subject,
        testResourceConfiguration,
        describeArtifactory,
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
      for (const [itNdx, itStep] of (this.its || []).entries()) {
        try {
          const itArtifactory = this.createArtifactoryForIt(
            key,
            itNdx,
            suiteNdx
          );
          if (itStep && itStep instanceof _BaseDescribe) {
            const nestedResult = await itStep.setup(
              this.store,
              `${key}.nested${itNdx}`,
              testResourceConfiguration,
              tester,
              itArtifactory,
              suiteNdx
            );
            this.store = nestedResult;
          } else {
            const result = await itStep.test(
              this.store,
              testResourceConfiguration,
              itArtifactory
            );
            if (result !== void 0) {
              if (typeof result === "boolean" || result === null || result === void 0) {
                tester(result);
              } else {
                this.store = result;
              }
            }
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
        await this.afterEach(this.store, this.key, describeArtifactory);
      } catch (e) {
        this.failed = true;
        this.fails++;
        this.error = e;
      }
    }
    return this.store;
  }
  createArtifactoryForIt(key, itIndex, suiteNdx) {
    const self = this;
    if (self._parent && self._parent.createArtifactory) {
      return self._parent.createArtifactory({
        describeKey: key,
        itIndex,
        suiteIndex: suiteNdx
      });
    }
    return {
      writeFileSync: (filename, payload) => {
        let path = "";
        if (suiteNdx !== void 0) {
          path += `suite-${suiteNdx}/`;
        }
        path += `describe-${key}/`;
        path += `it-${itIndex} ${filename}`;
        console.log(`[Artifactory] Would write to: ${path}`);
        console.log(`[Artifactory] Content: ${payload.substring(0, 100)}...`);
      },
      screenshot: (filename, payload) => {
        console.log(`[Artifactory] Would take screenshot: ${filename}`);
      }
    };
  }
};

// src/BaseIt.ts
var BaseIt = class extends BaseAction {
  // It can perform both actions and assertions
  constructor(name, itCB) {
    super(name, itCB);
  }
  // Override test to handle both mutations and assertions
  async test(store, testResourceConfiguration, artifactory) {
    try {
      const result = await this.performAction(
        store,
        this.actionCB,
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
  // Alias performAction to performIt
  async performIt(store, itCB, testResource, artifactory) {
    return this.performAction(store, itCB, testResource, artifactory);
  }
};

// src/index.ts
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
  const mapped = { ...p };
  if (p.beforeAll && !p.prepareAll) {
    mapped.prepareAll = async (input, testResource, artifactory) => {
      if (p.beforeAll.length >= 3) {
        return await p.beforeAll(input, testResource, artifactory);
      } else if (p.beforeAll.length >= 2) {
        return await p.beforeAll(input, testResource);
      } else {
        return await p.beforeAll(input);
      }
    };
  }
  if (p.beforeEach && !p.prepareEach) {
    mapped.prepareEach = async (subject, initializer, testResource, initialValues, artifactory) => {
      if (p.beforeEach.length >= 5) {
        return await p.beforeEach(subject, initializer, testResource, initialValues, artifactory);
      } else if (p.beforeEach.length >= 4) {
        return await p.beforeEach(subject, initializer, testResource, initialValues);
      } else if (p.beforeEach.length >= 3) {
        return await p.beforeEach(subject, initializer, testResource);
      } else if (p.beforeEach.length >= 2) {
        return await p.beforeEach(subject, initializer);
      } else {
        return await p.beforeEach(subject);
      }
    };
  }
  if (p.afterEach && !p.cleanupEach) {
    mapped.cleanupEach = async (store, key, artifactory) => {
      if (p.afterEach.length >= 3) {
        return await p.afterEach(store, key, artifactory);
      } else if (p.afterEach.length >= 2) {
        return await p.afterEach(store, key);
      } else {
        return await p.afterEach(store);
      }
    };
  }
  if (p.afterAll && !p.cleanupAll) {
    mapped.cleanupAll = (store, artifactory) => {
      if (p.afterAll.length >= 2) {
        return p.afterAll(store, artifactory);
      } else {
        return p.afterAll(store);
      }
    };
  }
  if (p.andWhen && !p.execute) {
    mapped.execute = async (store, actionCB, testResource, artifactory) => {
      if (p.andWhen.length >= 4) {
        return await p.andWhen(store, actionCB, testResource, artifactory);
      } else if (p.andWhen.length >= 3) {
        return await p.andWhen(store, actionCB, testResource);
      } else if (p.andWhen.length >= 2) {
        return await p.andWhen(store, actionCB);
      } else {
        return await p.andWhen(store);
      }
    };
  }
  if (p.butThen && !p.verify) {
    mapped.verify = async (store, checkCB, testResource, artifactory) => {
      if (p.butThen.length >= 4) {
        return await p.butThen(store, checkCB, testResource, artifactory);
      } else if (p.butThen.length >= 3) {
        return await p.butThen(store, checkCB, testResource);
      } else if (p.butThen.length >= 2) {
        return await p.butThen(store, checkCB);
      } else {
        return await p.butThen(store);
      }
    };
  }
  if (p.assertThis && !p.assert) {
    mapped.assert = (x) => {
      if (p.assertThis.length >= 1) {
        return p.assertThis(x);
      } else {
        return p.assertThis();
      }
    };
  }
  return {
    ...base,
    ...mapped
  };
};
function createDescribeItSpecification() {
  return {
    // Create a suite with Describe-It pattern
    Suite: {
      Default: (Suite, Describe, It) => (name, descriptions) => {
        const setups = {};
        for (const [key, description] of Object.entries(descriptions)) {
          const { features, its, describeCB, initialValues } = description;
          setups[key] = Describe.Default(
            features,
            its,
            describeCB,
            initialValues
          );
        }
        return Suite.Default(name, setups);
      }
    },
    // Describe maps to Setup
    Describe: {
      Default: (features, its, describeCB, initialValues) => {
        return (Describe) => Describe.Default(
          features,
          its,
          describeCB,
          initialValues
        );
      }
    },
    // It can mix mutations and assertions
    It: {
      Default: (name, itCB) => {
        return (It) => It.Default(name, itCB);
      }
    }
  };
}
function createTDTSpecification() {
  return {
    // Create a suite with TDT pattern
    Suite: {
      Default: (Suite, Value, Should, Expected) => (name, confirms) => {
        const setups = {};
        for (const [key, confirm] of Object.entries(confirms)) {
          const { features, tableRows, confirmCB, initialValues } = confirm;
          setups[key] = Value.Default(
            features,
            tableRows,
            confirmCB,
            initialValues
          );
        }
        return Suite.Default(name, setups);
      }
    },
    // Value maps to Setup (sets up table data)
    Value: {
      Default: (features, tableRows, confirmCB, initialValues) => {
        return (Value) => Value.Default(
          features,
          tableRows,
          confirmCB,
          initialValues
        );
      }
    },
    // Should processes each row (like Action)
    Should: {
      Default: (name, shouldCB) => {
        return (Should) => Should.Default(name, shouldCB);
      }
    },
    // Expected validates each row (like Check)
    Expected: {
      Default: (name, expectedCB) => {
        return (Expected) => Expected.Default(name, expectedCB);
      }
    }
  };
}
function DescribeIt() {
  return {
    Suite: {
      Default: (name, descriptions) => {
        console.warn("DescribeIt.Suite.Default: This helper function requires proper context from a test specification. Use createDescribeItSpecification() for full functionality.");
        return { name, descriptions };
      }
    },
    Describe: {
      Default: (features, its, describeCB, initialValues) => {
        console.warn("DescribeIt.Describe.Default: This helper function requires proper context. Use createDescribeItSpecification() for full functionality.");
        return { features, its, describeCB, initialValues };
      }
    },
    It: {
      Default: (name, itCB) => {
        console.warn("DescribeIt.It.Default: This helper function requires proper context. Use createDescribeItSpecification() for full functionality.");
        return { name, itCB };
      }
    }
  };
}
function Confirm() {
  return {
    Suite: {
      Default: (name, confirms) => {
        console.warn("Confirm.Suite.Default: This helper function requires proper context from a test specification. Use createTDTSpecification() for full functionality.");
        return { name, confirms };
      }
    },
    Value: {
      Default: (features, tableRows, confirmCB, initialValues) => {
        console.warn("Confirm.Value.Default: This helper function requires proper context. Use createTDTSpecification() for full functionality.");
        return { features, tableRows, confirmCB, initialValues };
      }
    },
    Should: {
      Default: (name, shouldCB) => {
        console.warn("Confirm.Should.Default: This helper function requires proper context. Use createTDTSpecification() for full functionality.");
        return { name, shouldCB };
      }
    },
    Expected: {
      Default: (name, expectedCB) => {
        console.warn("Confirm.Expected.Default: This helper function requires proper context. Use createTDTSpecification() for full functionality.");
        return { name, expectedCB };
      }
    }
  };
}
export {
  BaseAction,
  BaseAdapter,
  BaseCheck,
  BaseDescribe,
  BaseExpected,
  BaseGiven,
  BaseIt,
  BaseSetup,
  BaseShould,
  BaseThen,
  BaseValue,
  BaseWhen,
  Confirm,
  DefaultAdapter,
  DescribeIt,
  createDescribeItSpecification,
  createTDTSpecification
};
