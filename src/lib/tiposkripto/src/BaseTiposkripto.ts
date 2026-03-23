import {
  BaseDescribe,
  BaseExpected,
  BaseIt,
  BaseShould,
  BaseValue,
  DefaultAdapter,
} from "./index.js";
import type { IGivens } from "./BaseGiven";
import { BaseGiven } from "./BaseGiven";
import { BaseSuite } from "./BaseSuite";
import { BaseThen } from "./BaseThen";
import { BaseWhen } from "./BaseWhen";
import type {
  Ibdd_in_any,
  Ibdd_out_any,
  ITestSpecification,
  ITestImplementation,
  ITestAdapter,
} from "./CoreTypes.js";
import type {
  ITestJob,
  ITTestResourceRequest,
  ITestResourceConfiguration,
  IFinalResults,
} from "./types.js";
import { defaultTestResourceRequirement } from "./types.js";

type IExtenstions = Record<string, unknown>;

export default abstract class BaseTiposkripto<
  I extends Ibdd_in_any = Ibdd_in_any,
  O extends Ibdd_out_any = Ibdd_out_any,
  M = unknown,
> {
  totalTests: number = 0;
  artifacts: Promise<unknown>[] = [];
  assertThis: (t: I["then"]) => any = () => { };
  givenOverrides: Record<string, any>;
  specs: any;
  suitesOverrides: Record<string, any>;
  testJobs: ITestJob[];
  testResourceRequirement: ITTestResourceRequest;
  testSpecification: ITestSpecification<I, O>;
  thenOverrides: Record<string, any>;
  whenOverrides: Record<string, any>;
  testResourceConfiguration: ITestResourceConfiguration;

  abstract writeFileSync(filename: string, payload: string): void;

  // Create an artifactory that tracks context
  createArtifactory(
    context: {
      givenKey?: string;
      whenIndex?: number;
      thenIndex?: number;
      suiteIndex?: number;
    } = {},
  ) {
    return {
      writeFileSync: (filename: string, payload: string) => {
        // Construct the path based on context
        let path = "";

        // Start with the test resource configuration fs path
        const basePath = this.testResourceConfiguration?.fs || "testeranto";

        // Log for debugging
        console.log("[Artifactory] Base path:", basePath);
        console.log("[Artifactory] Context:", context);

        // Add suite context if available
        if (context.suiteIndex !== undefined) {
          path += `suite-${context.suiteIndex}/`;
        }

        // Add given context if available
        if (context.givenKey) {
          path += `given-${context.givenKey}/`;
        }

        // Add when or then context
        if (context.whenIndex !== undefined) {
          path += `when-${context.whenIndex} `;
        } else if (context.thenIndex !== undefined) {
          path += `then-${context.thenIndex} `;
        }

        // Add the filename
        path += filename;

        // Ensure it has a .txt extension if not present
        if (!path.match(/\.[a-zA-Z0-9]+$/)) {
          path += ".txt";
        }

        // Prepend the base path, avoiding double slashes
        // Remove trailing slash from basePath if present
        const basePathClean = basePath.replace(/\/$/, "");
        // Remove leading slash from path if present
        const pathClean = path.replace(/^\//, "");
        const fullPath = `${basePathClean}/${pathClean}`;

        console.log("[Artifactory] Full path:", fullPath);

        // Call the abstract implementation
        this.writeFileSync(fullPath, payload);
      },
      // screenshot, openScreencast, and closeScreencast are only applicable to web runtime
      // They should be implemented in WebTiposkripto and will be added to the artifactory there
      // For non-web runtimes, these methods will not be available
    };
  }

  constructor(
    webOrNode: "web" | "node",
    input: I["iinput"],
    testSpecification: ITestSpecification<I, O>,
    testImplementation: ITestImplementation<I, O, M> & {
      suites: Record<string, object>;
      // BDD pattern
      givens?: Record<string, any>;
      whens?: Record<string, any>;
      thens?: Record<string, any>;
      // TDT pattern
      values?: Record<string, any>;
      shoulds?: Record<string, any>;
      expecteds?: Record<string, any>;
      // Describe-It pattern
      describes?: Record<string, any>;
      its?: Record<string, any>;
    },
    testResourceRequirement: ITTestResourceRequest = defaultTestResourceRequirement,
    testAdapter: Partial<ITestAdapter<I>> = {},
    testResourceConfiguration: ITestResourceConfiguration,
    wsPort: string = "3456",
    wsHost: string = "localhost",
  ) {
    this.testResourceConfiguration = testResourceConfiguration;

    const fullAdapter = DefaultAdapter<I>(testAdapter);
    // Capture this for use in inner functions
    const instance = this;

    if (
      !testImplementation.suites ||
      typeof testImplementation.suites !== "object"
    ) {
      throw new Error(
        `testImplementation.suites must be an object, got ${typeof testImplementation.suites}: ${JSON.stringify(
          testImplementation.suites,
        )}`,
      );
    }

    // Create classy implementations for all patterns
    const classySuites = Object.entries(testImplementation.suites).reduce(
      (a: Record<string, any>, [key], index) => {
        a[key] = (somestring: string, setups: any) => {
          const capturedFullAdapter = fullAdapter;

          return new (class extends BaseSuite<I, O> {
            afterAll(store: I["istore"], artifactory: any) {
              let suiteArtifactory = artifactory;
              if (!suiteArtifactory) {
                if (this.parent && this.parent.createArtifactory) {
                  suiteArtifactory = this.parent.createArtifactory({
                    suiteIndex: this.index,
                  });
                } else {
                  suiteArtifactory = instance.createArtifactory({
                    suiteIndex: this.index,
                  });
                }
              }
              return capturedFullAdapter.cleanupAll(store, suiteArtifactory);
            }

            assertThat(t: Awaited<I["then"]>): boolean {
              return capturedFullAdapter.assert(t);
            }

            async setup(
              s: I["iinput"],
              artifactory: any,
              tr: ITestResourceConfiguration,
            ): Promise<I["isubject"]> {
              return (
                capturedFullAdapter.prepareAll?.(s, tr, artifactory) ??
                (s as unknown as Promise<I["isubject"]>)
              );
            }
          })(somestring, index, setups, instance);
        };
        return a;
      },
      {},
    );

    // BDD Pattern: Givens
    const classyGivens: Record<string, any> = {};
    if (testImplementation.givens) {
      Object.entries(testImplementation.givens).forEach(([key, g]) => {
        classyGivens[key] = (
          features: string[],
          whens: BaseWhen<I>[],
          thens: BaseThen<I>[],
          gcb: I["given"],
          initialValues: any,
        ) => {
          const safeFeatures = Array.isArray(features) ? [...features] : [];
          const safeWhens = Array.isArray(whens) ? [...whens] : [];
          const safeThens = Array.isArray(thens) ? [...thens] : [];

          const capturedFullAdapter = fullAdapter;

          const givenInstance = new (class extends BaseGiven<I> {
            async givenThat(
              subject: any,
              testResource: any,
              artifactory: any,
              initializer: any,
              initialValues: any,
            ) {
              const givenArtifactory = instance.createArtifactory({
                givenKey: key,
                suiteIndex: (this as any)._suiteIndex,
              });
              return capturedFullAdapter.prepareEach(
                subject,
                initializer,
                testResource,
                initialValues,
                givenArtifactory,
              );
            }

            afterEach(
              store: I["istore"],
              key: string,
              artifactory: any,
            ): Promise<unknown> {
              return Promise.resolve(
                capturedFullAdapter.cleanupEach(store, key, artifactory),
              );
            }
          })(
            safeFeatures,
            safeWhens,
            safeThens,
            testImplementation.givens![key],
            initialValues,
          );

          (givenInstance as any)._parent = instance;
          if (givenInstance.setParent) {
            givenInstance.setParent(instance);
          }
          return givenInstance;
        };
      });
    }

    // BDD Pattern: Whens
    const classyWhens: Record<string, any> = {};
    if (testImplementation.whens) {
      Object.entries(testImplementation.whens).forEach(
        ([key, whEn]: [string, (...x: any[]) => any]) => {
          classyWhens[key] = (...payload: any[]) => {
            const capturedFullAdapter = fullAdapter;
            const whenInstance = new (class extends BaseWhen<I> {
              async andWhen(
                store: any,
                whenCB: any,
                testResource: any,
                artifactory: any,
              ) {
                return await capturedFullAdapter.execute(
                  store,
                  whenCB,
                  testResource,
                  artifactory,
                );
              }
            })(`${key}: ${payload && payload.toString()}`, whEn(...payload));
            return whenInstance;
          };
        },
      );
    }

    // BDD Pattern: Thens
    const classyThens: Record<string, any> = {};
    if (testImplementation.thens) {
      Object.entries(testImplementation.thens).forEach(
        ([key, thEn]: [string, (...x: any[]) => any]) => {
          classyThens[key] = (...args: any[]) => {
            const capturedFullAdapter = fullAdapter;
            const thenInstance = new (class extends BaseThen<I> {
              async butThen(
                store: any,
                thenCB: any,
                testResourceConfiguration: any,
                artifactory: any,
              ): Promise<I["iselection"]> {
                return capturedFullAdapter.verify(
                  store,
                  thenCB,
                  testResourceConfiguration,
                  artifactory,
                );
              }
            })(`${key}: ${args && args.toString()}`, thEn(...args));

            return thenInstance;
          };
        },
      );
    }

    // Confirm Pattern (similar to Values but for Confirm)
    const classyConfirms: Record<string, any> = {};
    if (testImplementation.confirms) {
      Object.entries(testImplementation.confirms).forEach(([key, val]) => {
        classyConfirms[key] = (
          features: string[],
          tableRows: any[][],
          confirmCB: I["given"],
          initialValues: any,
        ) => {
          // Use the implementation function as confirmCB
          return new BaseValue<I>(
            features,
            tableRows,
            val as I["given"],
            initialValues,
          );
        };
      });
    }

    // TDT Pattern: Values (3 verbs: Value, Should, Expected)
    const classyValues: Record<string, any> = {};
    if (testImplementation.values) {
      Object.entries(testImplementation.values).forEach(([key, val]) => {
        classyValues[key] = (
          features: string[],
          tableRows: any[][],
          confirmCB: I["given"],
          initialValues: any,
        ) => {
          return new BaseValue<I>(
            features,
            tableRows,
            confirmCB,
            initialValues,
          );
        };
      });
    }

    // TDT Pattern: Shoulds (part of 3-verb TDT pattern)
    const classyShoulds: Record<string, any> = {};
    if (testImplementation.shoulds) {
      Object.entries(testImplementation.shoulds).forEach(
        ([key, shouldCB]: [string, (...x: any[]) => any]) => {
          classyShoulds[key] = (...args: any[]) => {
            return new BaseShould<I>(
              `${key}: ${args && args.toString()}`,
              shouldCB(...args),
            );
          };
        },
      );
    }

    // TDT Pattern: Expecteds (part of 3-verb TDT pattern)
    const classyExpecteds: Record<string, any> = {};
    if (testImplementation.expecteds) {
      Object.entries(testImplementation.expecteds).forEach(
        ([key, expectedCB]: [string, (...x: any[]) => any]) => {
          classyExpecteds[key] = (...args: any[]) => {
            return new BaseExpected<I>(
              `${key}: ${args && args.toString()}`,
              expectedCB(...args),
            );
          };
        },
      );
    }

    // Describe-It Pattern: Describes (2-verb AAA pattern)
    const classyDescribes: Record<string, any> = {};
    if (testImplementation.describes) {
      Object.entries(testImplementation.describes).forEach(([key, desc]) => {
        classyDescribes[key] = (
          features: string[],
          its: any[],
          describeCB: I["given"],
          initialValues: any,
        ) => {
          return new BaseDescribe<I>(features, its, describeCB, initialValues);
        };
      });
    }

    // Describe-It Pattern: Its (2-verb AAA pattern)
    const classyIts: Record<string, any> = {};
    if (testImplementation.its) {
      Object.entries(testImplementation.its).forEach(
        ([key, itCB]: [string, (...x: any[]) => any]) => {
          classyIts[key] = (...args: any[]) => {
            return new BaseIt<I>(
              `${key}: ${args && args.toString()}`,
              itCB(...args),
            );
          };
        },
      );
    }

    this.suitesOverrides = classySuites;
    this.givenOverrides = classyGivens;
    this.whenOverrides = classyWhens;
    this.thenOverrides = classyThens;

    // Store TDT and Describe-It overrides for use in specifications
    (this as any).valuesOverrides = classyValues;
    (this as any).shouldsOverrides = classyShoulds;
    (this as any).expectedsOverrides = classyExpecteds;
    (this as any).describesOverrides = classyDescribes;
    (this as any).itsOverrides = classyIts;
    // For Confirm pattern
    (this as any).confirmsOverrides = classyConfirms;
    this.testResourceRequirement = testResourceRequirement;
    this.testSpecification = testSpecification;

    this.specs = testSpecification(
      this.Suites() as any,
      this.Given() as any,
      this.When() as any,
      this.Then() as any,
      this.Describe() as any,
      this.It() as any,
      this.Confirm() as any,
      this.Value() as any,
      this.Should() as any,
      this.Expected() as any,
    );

    this.totalTests = this.calculateTotalTests();

    this.testJobs = this.specs.map((suite: BaseSuite<I, O>) => {
      const suiteRunner =
        (suite: BaseSuite<I, O>) =>
          async (
            testResourceConfiguration: ITestResourceConfiguration,
          ): Promise<BaseSuite<I, O>> => {
            try {
              const x = await suite.run(input, testResourceConfiguration);

              return x;
            } catch (e) {
              console.error((e as Error).stack);
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

        receiveTestResourceConfig: async (
          testResourceConfiguration: ITestResourceConfiguration,
        ): Promise<IFinalResults> => {
          try {
            const suiteDone: BaseSuite<I, O> = await runner(
              testResourceConfiguration,
            );
            const fails = suiteDone.fails;
            return {
              failed: fails > 0,
              fails,
              artifacts: [], // this.artifacts is not accessible here
              features: suiteDone.features(),
              tests: 0,
              runTimeTests: totalTests,
              testJob: testJob.toObj(),
            };
          } catch (e) {
            console.error((e as Error).stack);
            return {
              failed: true,
              fails: -1,
              artifacts: [],
              features: [],
              tests: 0,
              runTimeTests: -1,
              testJob: testJob.toObj(),
            };
          }
        },
      };
      return testJob;
    });

    (
      this.testJobs[0].receiveTestResourceConfig(
        testResourceConfiguration,
      ) as unknown as Promise<IFinalResults>
    ).then((results) => {
      console.log("testResourceConfiguration", testResourceConfiguration);
      const reportJson = `${testResourceConfiguration.fs}/tests.json`;
      // console.log("writing results to: ", reportJson)
      this.writeFileSync(reportJson, JSON.stringify(results));
    });
  }

  async receiveTestResourceConfig(
    testResourceConfig: ITestResourceConfiguration,
  ): Promise<any> {
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
          Object.keys(this.suitesOverrides || {}),
        )}`,
      );
    }
    return this.suitesOverrides;
  }

  Given(): Record<
    keyof IExtenstions,
    (
      name: string,
      features: string[],
      whens: BaseWhen<I>[],
      thens: BaseThen<I>[],
      gcb: I["given"],
    ) => BaseGiven<I>
  > {
    return this.givenOverrides;
  }

  When(): Record<
    keyof IExtenstions,
    (arg0: I["istore"], ...arg1: any) => BaseWhen<I>
  > {
    return this.whenOverrides;
  }

  Then(): Record<
    keyof IExtenstions,
    (selection: I["iselection"], expectation: any) => BaseThen<I>
  > {
    return this.thenOverrides;
  }

  Describe(): Record<string, any> {
    return (this as any).describesOverrides || {};
  }

  It(): Record<string, any> {
    return (this as any).itsOverrides || {};
  }

  Confirm(): Record<string, any> {
    return (this as any).confirmsOverrides || {};
  }

  Value(): Record<string, any> {
    return (this as any).valuesOverrides || {};
  }

  Should(): Record<string, any> {
    return (this as any).shouldsOverrides || {};
  }

  Expect(): Record<string, any> {
    return (this as any).expectedsOverrides || {};
  }

  Expected(): Record<string, any> {
    return (this as any).expectedsOverrides || {};
  }

  // Add a method to access test jobs which can be used by receiveTestResourceConfig
  getTestJobs(): ITestJob[] {
    return this.testJobs;
  }

  private calculateTotalTests(): number {
    let total = 0;
    for (const suite of this.specs) {
      if (suite && typeof suite === "object") {
        // Access the givens property which should be a record of test names to BaseGiven instances
        // The givens property is typically on the suite instance
        if ("givens" in suite) {
          const givens = (suite as any).givens;
          if (givens && typeof givens === "object") {
            total += Object.keys(givens).length;
          }
        }
      }
    }
    return total;
  }
}
