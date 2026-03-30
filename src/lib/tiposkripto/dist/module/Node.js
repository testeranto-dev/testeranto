// src/Node.ts
import fs from "fs";
import path from "path";

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
  addArtifact(path2) {
    if (typeof path2 !== "string") {
      throw new Error(
        `[ARTIFACT ERROR] Expected string, got ${typeof path2}: ${JSON.stringify(
          path2
        )}`
      );
    }
    const normalizedPath = path2.replace(/\\/g, "/");
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
        let path2 = "";
        if (suiteNdx !== void 0) {
          path2 += `suite-${suiteNdx}/`;
        }
        path2 += `setup-${key}/`;
        path2 += `action-${actionIndex} ${filename}`;
        console.log(`[Artifactory] Would write to: ${path2}`);
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
        let path2 = "";
        if (suiteNdx !== void 0) {
          path2 += `suite-${suiteNdx}/`;
        }
        path2 += `setup-${key}/`;
        path2 += `check-${checkIndex} ${filename}`;
        console.log(`[Artifactory] Would write to: ${path2}`);
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
  addArtifact(path2) {
    if (typeof path2 !== "string") {
      throw new Error(
        `[ARTIFACT ERROR] Expected string, got ${typeof path2}: ${JSON.stringify(
          path2
        )}`
      );
    }
    const normalizedPath = path2.replace(/\\/g, "/");
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
        let path2 = "";
        if (suiteNdx !== void 0) {
          path2 += `suite-${suiteNdx}/`;
        }
        path2 += `given-${givenKey}/`;
        path2 += filename;
        if (!path2.match(/\.[a-zA-Z0-9]+$/)) {
          path2 += ".txt";
        }
        const fullPath = `${basePath}/${path2}`;
        console.log(`[Artifactory] Writing to: ${fullPath}`);
        if (self._parent && typeof self._parent.writeFileSync === "function") {
          self._parent.writeFileSync(fullPath, payload);
        } else {
          console.log(`[Artifactory] Would write to: ${fullPath}`);
          console.log(`[Artifactory] Content: ${payload.substring(0, 100)}...`);
        }
      },
      screenshot: (filename, payload) => {
        let path2 = "";
        if (suiteNdx !== void 0) {
          path2 += `suite-${suiteNdx}/`;
        }
        path2 += `given-${givenKey}/`;
        path2 += filename;
        if (!path2.match(/\.[a-zA-Z0-9]+$/)) {
          path2 += ".png";
        }
        const fullPath = `${basePath}/${path2}`;
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
        let path2 = "";
        if (suiteNdx !== void 0) {
          path2 += `suite-${suiteNdx}/`;
        }
        path2 += `given-${givenKey}/`;
        path2 += `when-${whenIndex} ${filename}`;
        console.log(`[Artifactory] Would write to: ${path2}`);
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
        let path2 = "";
        if (suiteNdx !== void 0) {
          path2 += `suite-${suiteNdx}/`;
        }
        path2 += `given-${givenKey}/`;
        path2 += `then-${thenIndex} ${filename}`;
        console.log(`[Artifactory] Would write to: ${path2}`);
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
  addArtifact(path2) {
    if (typeof path2 !== "string") {
      throw new Error(
        `[ARTIFACT ERROR] Expected string, got ${typeof path2}: ${JSON.stringify(
          path2
        )}`
      );
    }
    const normalizedPath = path2.replace(/\\/g, "/");
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
  addArtifact(path2) {
    if (typeof path2 !== "string") {
      throw new Error(
        `[ARTIFACT ERROR] Expected string, got ${typeof path2}: ${JSON.stringify(
          path2
        )}`
      );
    }
    const normalizedPath = path2.replace(/\\/g, "/");
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

// src/BaseSuite.ts
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
    if (typeof path2 !== "string") {
      throw new Error(
        `[ARTIFACT ERROR] Expected string, got ${typeof path2}: ${JSON.stringify(
          path2
        )}`
      );
    }
    const normalizedPath = path2.replace(/\\/g, "/");
    this.artifacts.push(normalizedPath);
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
    const givens = Object.keys(this.givens).map((k) => {
      const givenObj = this.givens[k].toObj();
      return givenObj;
    });
    return {
      name: this.name,
      givens,
      fails: this.fails,
      failed: this.failed,
      features: this.features(),
      artifacts: this.artifacts ? this.artifacts.filter((art) => typeof art === "string") : []
    };
  }
  setup(s, artifactory, tr) {
    console.log("mark9");
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
    for (const [gKey, g] of Object.entries(this.givens)) {
      const giver = this.givens[gKey];
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
        this.store = await giver.give(
          subject,
          gKey,
          testResourceConfiguration,
          this.assertThat,
          givenArtifactory,
          sNdx
        );
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

// src/types.ts
var defaultTestResourceRequirement = {
  ports: 0
};

// src/BaseTiposkripto.ts
var BaseTiposkripto = class {
  constructor(webOrNode, input, testSpecification, testImplementation, testResourceRequirement = defaultTestResourceRequirement, testAdapter = {}, testResourceConfiguration, wsPort = "3456", wsHost = "localhost") {
    this.totalTests = 0;
    this.artifacts = [];
    this.assertThis = () => {
    };
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
      Object.entries(testImplementation.whens).forEach(([key, whEn]) => {
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
      });
    }
    const classyThens = {};
    if (testImplementation.thens) {
      Object.entries(testImplementation.thens).forEach(([key, thEn]) => {
        classyThens[key] = (...args) => {
          const capturedFullAdapter = fullAdapter;
          const thenInstance = new class extends BaseThen {
            verifyCheck(store, checkCB, testResourceConfiguration2, artifactory) {
              return capturedFullAdapter.verify(
                store,
                checkCB,
                testResourceConfiguration2,
                artifactory
              );
            }
          }(`${key}: ${args && args.toString()}`, thEn(...args));
          return thenInstance;
        };
      });
    }
    const classyConfirms = {};
    if (testImplementation.confirms) {
      Object.entries(testImplementation.confirms).forEach(([key, val]) => {
        classyConfirms[key] = (features, tableRows, confirmCB, initialValues) => {
          return new BaseValue(
            features,
            tableRows,
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
      Object.entries(testImplementation.shoulds).forEach(([key, shouldCB]) => {
        classyShoulds[key] = (...args) => {
          return new BaseShould(`${key}: ${args && args.toString()}`, shouldCB(...args));
        };
      });
    }
    const classyExpecteds = {};
    if (testImplementation.expecteds) {
      Object.entries(testImplementation.expecteds).forEach(([key, expectedCB]) => {
        classyExpecteds[key] = (...args) => {
          return new BaseExpected(`${key}: ${args && args.toString()}`, expectedCB(...args));
        };
      });
    }
    const classyDescribes = {};
    if (testImplementation.describes) {
      Object.entries(testImplementation.describes).forEach(([key, desc]) => {
        classyDescribes[key] = (features, its, describeCB, initialValues) => {
          return new BaseDescribe(
            features,
            its,
            describeCB,
            initialValues
          );
        };
      });
    }
    const classyIts = {};
    if (testImplementation.its) {
      Object.entries(testImplementation.its).forEach(([key, itCB]) => {
        classyIts[key] = (...args) => {
          return new BaseIt(`${key}: ${args && args.toString()}`, itCB(...args));
        };
      });
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
    this.testJobs[0].receiveTestResourceConfig(
      testResourceConfiguration
    ).then((results) => {
      console.log("testResourceConfiguration", testResourceConfiguration);
      const reportJson = `${testResourceConfiguration.fs}/tests.json`;
      this.writeFileSync(reportJson, JSON.stringify(results));
    });
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

// src/Node.ts
console.log(`[NodeTiposkripto] ${process.argv}`);
var config = JSON.parse(process.argv[2]);
var NodeTiposkripto = class extends BaseTiposkripto {
  constructor(input, testSpecification, testImplementation, testResourceRequirement, testAdapter) {
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
      testResourceRequirement,
      testAdapter
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
  Node_default as default
};
