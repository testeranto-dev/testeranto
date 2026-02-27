var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/lib/tiposkripto/src/types.ts
var defaultTestResourceRequirement;
var init_types = __esm({
  "src/lib/tiposkripto/src/types.ts"() {
    "use strict";
    defaultTestResourceRequirement = {
      ports: 0
    };
  }
});

// src/lib/tiposkripto/src/BaseGiven.ts
var BaseGiven;
var init_BaseGiven = __esm({
  "src/lib/tiposkripto/src/BaseGiven.ts"() {
    "use strict";
    BaseGiven = class {
      constructor(features, whens, thens, givenCB, initialValues) {
        this.artifacts = [];
        this.features = features;
        this.whens = whens;
        this.thens = thens;
        this.givenCB = givenCB;
        this.initialValues = initialValues;
        this.fails = 0;
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
      async afterEach(store, key, artifactory) {
        return store;
      }
      async give(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx) {
        this.key = key;
        this.fails = 0;
        const givenArtifactory = (fPath, value) => artifactory(`given-${key}/${fPath}`, value);
        try {
          const addArtifact = this.addArtifact.bind(this);
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
          this.error = e.stack;
        }
        try {
          const whens = this.whens || [];
          for (const [thenNdx, thenStep] of this.thens.entries()) {
            try {
              const t = await thenStep.test(
                this.store,
                testResourceConfiguration,
                `suite-${suiteNdx}/given-${key}/then-${thenNdx}`
              );
              tester(t);
            } catch (e) {
              this.failed = true;
              this.fails++;
              throw e;
            }
          }
        } catch (e) {
          this.error = e.stack;
          this.failed = true;
        } finally {
          try {
            const addArtifact = this.addArtifact.bind(this);
            await this.afterEach(this.store, this.key);
          } catch (e) {
            this.failed = true;
            this.fails++;
            throw e;
          }
        }
        return this.store;
      }
    };
  }
});

// src/lib/tiposkripto/src/BaseSuite.ts
var BaseSuite;
var init_BaseSuite = __esm({
  "src/lib/tiposkripto/src/BaseSuite.ts"() {
    "use strict";
    BaseSuite = class {
      constructor(name, index, givens = {}) {
        this.artifacts = [];
        const suiteName = name || "testSuite";
        if (!suiteName) {
          throw new Error("BaseSuite requires a non-empty name");
        }
        this.name = suiteName;
        this.index = index;
        this.givens = givens;
        this.fails = 0;
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
        const subject = await this.setup(
          input,
          // suiteArtifactory,
          testResourceConfiguration
          // proxiedPm
        );
        for (const [gKey, g] of Object.entries(this.givens)) {
          const giver = this.givens[gKey];
          try {
            this.store = await giver.give(
              subject,
              gKey,
              testResourceConfiguration,
              this.assertThat,
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
          this.afterAll(this.store);
        } catch (e) {
          console.error(JSON.stringify(e));
        }
        return this;
      }
    };
  }
});

// src/lib/tiposkripto/src/BaseThen.ts
var BaseThen;
var init_BaseThen = __esm({
  "src/lib/tiposkripto/src/BaseThen.ts"() {
    "use strict";
    BaseThen = class {
      constructor(name, thenCB) {
        this.artifacts = [];
        this.name = name;
        this.thenCB = thenCB;
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
  }
});

// src/lib/tiposkripto/src/BaseWhen.ts
var BaseWhen;
var init_BaseWhen = __esm({
  "src/lib/tiposkripto/src/BaseWhen.ts"() {
    "use strict";
    BaseWhen = class {
      constructor(name, whenCB) {
        this.artifacts = [];
        this.name = name;
        this.whenCB = whenCB;
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
  }
});

// src/lib/tiposkripto/src/BaseTiposkripto.ts
var BaseTiposkripto;
var init_BaseTiposkripto = __esm({
  async "src/lib/tiposkripto/src/BaseTiposkripto.ts"() {
    "use strict";
    await init_src();
    init_BaseGiven();
    init_BaseSuite();
    init_BaseThen();
    init_BaseWhen();
    init_types();
    BaseTiposkripto = class {
      constructor(webOrNode, input, testSpecification, testImplementation, testResourceRequirement = defaultTestResourceRequirement, testAdapter = {}, testResourceConfiguration, wsPort = "3456", wsHost = "localhost") {
        this.totalTests = 0;
        this.artifacts = [];
        this.testResourceConfiguration = testResourceConfiguration;
        const fullAdapter = DefaultAdapter(testAdapter);
        if (!testImplementation.suites || typeof testImplementation.suites !== "object") {
          throw new Error(
            `testImplementation.suites must be an object, got ${typeof testImplementation.suites}: ${JSON.stringify(
              testImplementation.suites
            )}`
          );
        }
        const classySuites = Object.entries(testImplementation.suites).reduce(
          (a, [key], index) => {
            a[key] = (somestring, givens) => {
              return new class extends BaseSuite {
                afterAll(store) {
                  return fullAdapter.afterAll(store);
                }
                assertThat(t) {
                  return fullAdapter.assertThis(t);
                }
                async setup(s, tr) {
                  return fullAdapter.beforeAll?.(s, tr) ?? s;
                }
              }(somestring, index, givens);
            };
            return a;
          },
          {}
        );
        const classyGivens = Object.entries(testImplementation.givens).reduce(
          (a, [key, g]) => {
            a[key] = (features, whens, thens, gcb, initialValues) => {
              const safeFeatures = Array.isArray(features) ? [...features] : [];
              const safeWhens = Array.isArray(whens) ? [...whens] : [];
              const safeThens = Array.isArray(thens) ? [...thens] : [];
              return new class extends BaseGiven {
                async givenThat(subject, testResource, initializer, initialValues2) {
                  return fullAdapter.beforeEach(
                    subject,
                    initializer,
                    testResource,
                    initialValues2
                  );
                }
                afterEach(store, key2) {
                  return Promise.resolve(fullAdapter.afterEach(store, key2));
                }
              }(
                safeFeatures,
                safeWhens,
                safeThens,
                testImplementation.givens[key],
                initialValues
              );
            };
            return a;
          },
          {}
        );
        const classyWhens = Object.entries(testImplementation.whens).reduce(
          (a, [key, whEn]) => {
            a[key] = (...payload) => {
              const whenInstance = new class extends BaseWhen {
                async andWhen(store, whenCB, testResource) {
                  return await fullAdapter.andWhen(store, whenCB, testResource);
                }
              }(`${key}: ${payload && payload.toString()}`, whEn(...payload));
              return whenInstance;
            };
            return a;
          },
          {}
        );
        const classyThens = Object.entries(testImplementation.thens).reduce(
          (a, [key, thEn]) => {
            a[key] = (...args) => {
              const thenInstance = new class extends BaseThen {
                async butThen(store, thenCB, testResource) {
                  return await fullAdapter.butThen(store, thenCB, testResource);
                }
              }(`${key}: ${args && args.toString()}`, thEn(...args));
              return thenInstance;
            };
            return a;
          },
          {}
        );
        this.suitesOverrides = classySuites;
        this.givenOverrides = classyGivens;
        this.whenOverrides = classyWhens;
        this.thenOverrides = classyThens;
        this.testResourceRequirement = testResourceRequirement;
        this.testSpecification = testSpecification;
        this.specs = testSpecification(
          this.Suites(),
          this.Given(),
          this.When(),
          this.Then()
        );
        this.totalTests = this.calculateTotalTests();
        this.testJobs = this.specs.map((suite) => {
          const suiteRunner = (suite2) => async (testResourceConfiguration2) => {
            try {
              const x = await suite2.run(
                input,
                testResourceConfiguration2 || {
                  name: suite2.name,
                  fs: process.cwd(),
                  ports: [],
                  timeout: 3e4,
                  retries: 3,
                  environment: {},
                  files: []
                }
              );
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
      async receiveTestResourceConfig(testResourceConfig2) {
        if (this.testJobs && this.testJobs.length > 0) {
          return this.testJobs[0].receiveTestResourceConfig(testResourceConfig2);
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
  }
});

// src/lib/tiposkripto/src/Node.ts
var Node_exports = {};
__export(Node_exports, {
  NodeTiposkripto: () => NodeTiposkripto,
  default: () => Node_default
});
import fs from "fs";
var config, NodeTiposkripto, tiposkripto, Node_default;
var init_Node = __esm({
  async "src/lib/tiposkripto/src/Node.ts"() {
    "use strict";
    await init_BaseTiposkripto();
    init_types();
    console.log(`[NodeTiposkripto] ${process.argv}`);
    config = JSON.parse(process.argv[2]);
    NodeTiposkripto = class extends BaseTiposkripto {
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
        fs.writeFileSync(filename, payload);
      }
    };
    tiposkripto = async (input, testSpecification, testImplementation, testAdapter, testResourceRequirement = defaultTestResourceRequirement) => {
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
    Node_default = tiposkripto;
  }
});

// src/lib/tiposkripto/src/Web.ts
var Web_exports = {};
__export(Web_exports, {
  WebTiposkripto: () => WebTiposkripto,
  default: () => Web_default
});
var config2, WebTiposkripto, tiposkripto2, Web_default;
var init_Web = __esm({
  async "src/lib/tiposkripto/src/Web.ts"() {
    "use strict";
    await init_BaseTiposkripto();
    init_types();
    config2 = process.argv0[2];
    WebTiposkripto = class extends BaseTiposkripto {
      constructor(input, testSpecification, testImplementation, testResourceRequirement, testAdapter) {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedConfig = urlParams.get("config");
        const testResourceConfig2 = encodedConfig ? decodeURIComponent(encodedConfig) : "{}";
        super(
          "web",
          input,
          testSpecification,
          testImplementation,
          testResourceRequirement,
          testAdapter,
          // JSON.parse(testResourceConfig)
          config2
        );
      }
      writeFileSync(filename, payload) {
        if (!window.__testeranto_files__) {
          window.__testeranto_files__ = {};
        }
        window.__testeranto_files__[filename] = payload;
        if (navigator.storage && navigator.storage.getDirectory) {
          (async () => {
            try {
              const root = await navigator.storage.getDirectory();
              const fileHandle = await root.getFileHandle(filename, { create: true });
              const writable = await fileHandle.createWritable();
              await writable.write(payload);
              await writable.close();
            } catch (e) {
              console.warn("Could not write to browser storage:", e);
            }
          })();
        }
      }
    };
    tiposkripto2 = async (input, testSpecification, testImplementation, testAdapter, testResourceRequirement = defaultTestResourceRequirement) => {
      try {
        const t = new WebTiposkripto(
          input,
          testSpecification,
          testImplementation,
          testResourceRequirement,
          testAdapter
        );
        const root = await navigator.storage.getDirectory();
        const fileHandle = await root.getFileHandle(`${config2.fs}/tests.json`);
        return t;
      } catch (e) {
        console.error(e);
        const errorEvent = new CustomEvent("test-error", { detail: e });
        window.dispatchEvent(errorEvent);
        throw e;
      }
    };
    Web_default = tiposkripto2;
  }
});

// src/lib/tiposkripto/src/index.ts
var tpskrt, tpskrtNode, tpskrtWeb, src_default, BaseAdapter, DefaultAdapter;
var init_src = __esm({
  async "src/lib/tiposkripto/src/index.ts"() {
    "use strict";
    init_types();
    tpskrtNode = await init_Node().then(() => Node_exports);
    tpskrtWeb = await init_Web().then(() => Web_exports);
    tpskrt = tpskrtNode;
    console.log("ENV", ENV);
    console.log(process.argv);
    if (ENV === "node") {
      tpskrt = tpskrtNode;
    } else if (ENV === "web") {
      tpskrt = tpskrtWeb;
    } else {
      throw `Unknown ENV ${ENV} ?`;
    }
    src_default = async (input, testSpecification, testImplementation, testAdapter, testResourceRequirement = defaultTestResourceRequirement, testResourceConfiguration) => {
      return (await tpskrt.default)(
        input,
        testSpecification,
        testImplementation,
        testResourceRequirement,
        testAdapter,
        testResourceConfiguration
      );
    };
    BaseAdapter = () => ({
      beforeAll: async (input, testResource) => {
        return input;
      },
      beforeEach: async function(subject, initializer, testResource, initialValues) {
        return subject;
      },
      afterEach: async (store, key) => Promise.resolve(store),
      afterAll: (store) => void 0,
      butThen: async (store, thenCb, testResource) => {
        return thenCb(store);
      },
      andWhen: async (store, whenCB, testResource) => {
        return whenCB(store);
      },
      assertThis: (x) => x
    });
    DefaultAdapter = (p) => {
      const base = BaseAdapter();
      return {
        ...base,
        ...p
      };
    };
  }
});

// src/server/runtimes/web/hoist.ts
import puppeteer from "puppeteer-core";
import http from "http";
import dns from "dns";
import "ansi-colors";
await init_src();
import path from "path";
console.log("mark2", process.argv);
var relativePath = process.argv[2];
var projectConfigPath = process.argv[3];
var nodeConfigPath = process.argv[4];
var testName = process.argv[5];
var testResourceConfig = process.argv[6];
var webEvaluator = (d, webArgz) => {
  return `
import('${d}').then(async (x) => {
  try {
    return await (await x.default).receiveTestResourceConfig(${webArgz})
  } catch (e) {
    console.log("web run failure", e.toString())
  }
})
`;
};
async function launchPuppeteer(browserWSEndpoint) {
  const browser = await puppeteer.connect({
    browserWSEndpoint
  });
  const page = await browser.newPage();
  try {
    page.on("console", (log) => {
      const msg = `${log.text()}
`;
      switch (log.type()) {
        case "info":
          break;
        case "warn":
          break;
        case "error":
          break;
        case "debug":
          break;
        default:
          break;
      }
    });
    page.on("close", () => {
    });
    const close = () => {
    };
    page.on("pageerror", (err) => {
      console.error("Page error in web test:", err);
      close();
      throw err;
    });
    page.on("console", (msg) => {
      const text = msg.text();
      console.log(`Browser console [${msg.type()}]: ${text}`);
    });
    const url = `http://localhost:9223/bundles/web/${relativePath}?config=${testResourceConfig}`;
    await page.goto(url, { waitUntil: "networkidle0" });
    const jsPath = "testeranto/bundles/webtests/src/ts/Calculator.test.mjs";
    let jsRelativePath;
    const jsMatch = jsPath.match(/testeranto\/bundles\/web\/(.*)/);
    if (jsMatch) {
      jsRelativePath = jsMatch[1];
    } else {
      const jsAbsMatch = jsPath.match(/\/bundles\/web\/(.*)/);
      if (jsAbsMatch) {
        jsRelativePath = jsAbsMatch[1];
      } else {
        jsRelativePath = path.basename(jsPath);
      }
    }
    const jsUrl = `/bundles/web/${jsRelativePath}?cacheBust=${Date.now()}`;
    const evaluation = webEvaluator(jsUrl, testResourceConfig);
    console.log("Evaluating web test with URL:", jsUrl);
    try {
      const results = await page.evaluate(evaluation);
      const { fails, failed, features } = results;
    } catch (error) {
      console.error("Error evaluating web test:", error);
    }
    await page.close();
    close();
  } catch (error) {
    console.error(`Error in web test ${src_default}:`, error);
    throw error;
  }
}
async function connect() {
  const { address } = await dns.promises.lookup("webtests");
  const url = `http://${address}:9223/json/version`;
  const host = address;
  console.log(`[CLIENT] Attempting to reach ${url}...`);
  dns.lookup(host, (err, address2) => {
    console.log(`[CLIENT] DNS Lookup for "${host}": ${address2 || "FAILED"} (${err ? err.message : "OK"})`);
  });
  http.get(url, (res) => {
    let data = "";
    console.log(`[CLIENT] HTTP Status: ${res.statusCode}`);
    res.on("data", (chunk) => data += chunk);
    res.on("end", async () => {
      try {
        const json = JSON.parse(data);
        console.log(`[CLIENT] Successfully fetched WS URL: ${json.webSocketDebuggerUrl}`);
        launchPuppeteer(json.webSocketDebuggerUrl);
      } catch (e) {
        console.error("[CLIENT] Failed to parse JSON or connect:", e.message);
        console.log("[CLIENT] Raw Data received:", data);
      }
    });
  }).on("error", (err) => {
    console.error("[CLIENT] HTTP Request Failed:", err.message);
    if (err.code === "ECONNREFUSED") {
      console.error("[CLIENT] HINT: The port is closed or Chromium isn't binding to 0.0.0.0");
    } else if (err.code === "ENOTFOUND") {
      console.error('[CLIENT] HINT: Docker cannot find the service name "web-builder"');
    }
  });
}
connect();
