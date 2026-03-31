// src/verbs/internal/CommonUtils.ts
var CommonUtils = class {
  /**
   * Normalize a path string for consistent artifact storage
   */
  static normalizePath(path) {
    if (typeof path !== "string") {
      throw new Error(
        `[ARTIFACT ERROR] Expected string, got ${typeof path}: ${JSON.stringify(
          path
        )}`
      );
    }
    return path.replace(/\\/g, "/");
  }
  /**
   * Add an artifact with path normalization
   */
  static addArtifact(artifacts, path) {
    artifacts.push(this.normalizePath(path));
  }
  /**
   * Create a fallback artifactory for logging
   */
  static createFallbackArtifactory(context, basePath) {
    const { suiteIndex, givenKey, whenIndex, thenIndex, valueKey, rowIndex } = context;
    const actualBasePath = basePath || "testeranto";
    return {
      writeFileSync: (filename, payload) => {
        let path = "";
        if (suiteIndex !== void 0) {
          path += `suite-${suiteIndex}/`;
        }
        if (givenKey !== void 0) {
          path += `given-${givenKey}/`;
        }
        if (whenIndex !== void 0) {
          path += `when-${whenIndex}/`;
        }
        if (thenIndex !== void 0) {
          path += `then-${thenIndex}/`;
        }
        if (valueKey !== void 0) {
          path += `value-${valueKey}/`;
        }
        if (rowIndex !== void 0) {
          path += `row-${rowIndex}/`;
        }
        path += filename;
        const fullPath = `${actualBasePath}/${path}`;
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

// src/verbs/tdt/BaseValue.ts
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
  addArtifact(path) {
    CommonUtils.addArtifact(this.artifacts, path);
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
            const result = {};
            for (const [key, value] of Object.entries(item)) {
              if (key !== "_parent" && key !== "testResourceConfiguration") {
                result[key] = value;
              }
            }
            return result;
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

// src/verbs/tdt/BaseShould.ts
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
      currentRow: this.currentRow
    };
  }
};

// src/verbs/tdt/BaseExpected.ts
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

// src/verbs/aaa/BaseDescribe.ts
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
  addArtifact(path) {
    CommonUtils.addArtifact(this.artifacts, path);
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

// src/verbs/aaa/BaseIt.ts
var BaseIt = class {
  constructor(name, itCB) {
    this.error = null;
    this.artifacts = [];
    this.name = name;
    this.itCB = itCB;
  }
  addArtifact(path) {
    CommonUtils.addArtifact(this.artifacts, path);
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

// src/index.ts
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
        return (Describe) => Describe.Default(features, its, describeCB, initialValues);
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
        return (Value) => Value.Default(features, tableRows, confirmCB, initialValues);
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
        console.warn(
          "DescribeIt.Suite.Default: This helper function requires proper context from a test specification. Use createDescribeItSpecification() for full functionality."
        );
        return { name, descriptions };
      }
    },
    Describe: {
      Default: (features, its, describeCB, initialValues) => {
        console.warn(
          "DescribeIt.Describe.Default: This helper function requires proper context. Use createDescribeItSpecification() for full functionality."
        );
        return { features, its, describeCB, initialValues };
      }
    },
    It: {
      Default: (name, itCB) => {
        console.warn(
          "DescribeIt.It.Default: This helper function requires proper context. Use createDescribeItSpecification() for full functionality."
        );
        return { name, itCB };
      }
    }
  };
}
function Confirm() {
  return {
    Suite: {
      Default: (name, confirms) => {
        console.warn(
          "Confirm.Suite.Default: This helper function requires proper context from a test specification. Use createTDTSpecification() for full functionality."
        );
        return { name, confirms };
      }
    },
    Value: {
      Default: (features, tableRows, confirmCB, initialValues) => {
        console.warn(
          "Confirm.Value.Default: This helper function requires proper context. Use createTDTSpecification() for full functionality."
        );
        return { features, tableRows, confirmCB, initialValues };
      }
    },
    Should: {
      Default: (name, shouldCB) => {
        console.warn(
          "Confirm.Should.Default: This helper function requires proper context. Use createTDTSpecification() for full functionality."
        );
        return { name, shouldCB };
      }
    },
    Expected: {
      Default: (name, expectedCB) => {
        console.warn(
          "Confirm.Expected.Default: This helper function requires proper context. Use createTDTSpecification() for full functionality."
        );
        return { name, expectedCB };
      }
    }
  };
}
export {
  BaseDescribe,
  BaseExpected,
  BaseIt,
  BaseShould,
  BaseValue,
  Confirm,
  DescribeIt,
  createDescribeItSpecification,
  createTDTSpecification
};
