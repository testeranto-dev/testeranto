import { DefaultAdapter } from "./Adapters";
import {
  Ibdd_in_any, Ibdd_out_any, ITestSpecification, ITestImplementation, ITestAdapter
} from "./CoreTypes";
import {
  ITestJob, ITTestResourceRequest, ITestResourceConfiguration, defaultTestResourceRequirement, IFinalResults
} from "./types";
import { BaseDescribe } from "./verbs/aaa/BaseDescribe";
import { BaseIt } from "./verbs/aaa/BaseIt";
import { BaseSuite } from "./verbs/BaseSuite";
import { BaseGiven } from "./verbs/bdd/BaseGiven";
import { BaseThen } from "./verbs/bdd/BaseThen";
import { BaseWhen } from "./verbs/bdd/BaseWhen";
import { BaseConfirm } from "./verbs/tdt/BaseConfirm";
import { BaseExpected } from "./verbs/tdt/BaseExpected";
import { BaseShould } from "./verbs/tdt/BaseShould";
import { BaseValue } from "./verbs/tdt/BaseValue";

type IExtenstions = Record<string, unknown>;

export default abstract class BaseTiposkripto<
  I extends Ibdd_in_any = Ibdd_in_any,
  O extends Ibdd_out_any = Ibdd_out_any,
  M = unknown,
> {
  totalTests: number = 0;
  artifacts: Promise<unknown>[] = [];
  givenOverrides: Record<string, any>;
  specs: any;
  suitesOverrides: Record<string, any>;
  testJobs: ITestJob[];
  testResourceRequirement: ITTestResourceRequest;
  testSpecification: ITestSpecification<I, O>;
  thenOverrides: Record<string, any>;
  whenOverrides: Record<string, any>;
  testResourceConfiguration: ITestResourceConfiguration;
  describeOverrides: Record<string, any>;
  itOverrides: Record<string, any>;
  confirmOverrides: Record<string, any>;
  valuesOverrides: Record<string, any>;
  shouldsOverrides: Record<string, any>;
  expectedsOverrides: Record<string, any>;

  abstract writeFileSync(filename: string, payload: string): void;

  // Create an artifactory that tracks context
  createArtifactory(
    context: {
      givenKey?: string;
      whenIndex?: number;
      thenIndex?: number;
      suiteIndex?: number;
      stepIndex?: number;
      stepType?: string;
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

        // Use step context if available (new approach)
        if (context.stepIndex !== undefined) {
          path += `step-${context.stepIndex}/`;
          if (context.stepType) {
            path += `${context.stepType}/`;
          }
        }
        // Fallback to suite context for backward compatibility
        else if (context.suiteIndex !== undefined) {
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

      // BDD pattern
      givens?: Record<string, any>;
      whens?: Record<string, any>;
      thens?: Record<string, any>;

      // Describe-It pattern
      describes?: Record<string, any>;
      its?: Record<string, any>;

      // TDT pattern
      confirms?: Record<string, any>;
      values?: Record<string, any>;
      shoulds?: Record<string, any>;


    },
    testResourceRequirement: ITTestResourceRequest = defaultTestResourceRequirement,
    testAdapter: Partial<ITestAdapter<I>> = {},
    testResourceConfiguration: ITestResourceConfiguration,
  ) {
    this.testResourceConfiguration = testResourceConfiguration;

    const fullAdapter = DefaultAdapter<I>(testAdapter);
    // Capture this for use in inner functions
    const instance = this;

    // if (
    //   !testImplementation.suites ||
    //   typeof testImplementation.suites !== "object"
    // ) {
    //   throw new Error(
    //     `testImplementation.suites must be an object, got ${typeof testImplementation.suites}: ${JSON.stringify(
    //       testImplementation.suites,
    //     )}`,
    //   );
    // }

    // Suites are deprecated, so we don't create classySuites anymore
    const classySuites = {};

    // BDD Pattern: Givens
    const classyGivens: Record<string, any> = {};
    if (testImplementation.givens) {
      Object.entries(testImplementation.givens).forEach(([key, g]) => {
        classyGivens[key] = (
          features: string[],
          whens: BaseWhen<I>[],
          thens: BaseThen<I>[],
          gcb: I["action"],
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
        // Create a function that matches the specification pattern:
        // Confirm["addition"]() returns a function that takes (testCases, features)
        // and creates a BaseConfirm instance
        classyConfirms[key] = () => {
          return (testCases: any[][], features: string[]) => {
            // val should be a function that creates the confirmCB
            // If val is a function, call it to get the confirmCB
            let actualConfirmCB;
            if (typeof val === 'function') {
              // The implementation function might return the confirmCB
              actualConfirmCB = val();
            } else {
              actualConfirmCB = val;
            }
            return new BaseConfirm<I>(
              features,
              testCases,
              actualConfirmCB,
              undefined, // initialValues
            );
          };
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
          confirmCB: I["setup"],
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
          describeCB: I["setup"],
          initialValues: any,
        ) => {
          // Use the implementation function as describeCB if not provided
          const actualDescribeCB = describeCB || (desc as I["setup"]);
          return new BaseDescribe<I>(
            features,
            its,
            actualDescribeCB,
            initialValues,
          );
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
    this.valuesOverrides = classyValues;
    this.shouldsOverrides = classyShoulds;
    this.expectedsOverrides = classyExpecteds;
    this.describesOverrides = classyDescribes;
    this.itsOverrides = classyIts;
    // For Confirm pattern
    this.confirmsOverrides = classyConfirms;
    this.testResourceRequirement = testResourceRequirement;
    this.testSpecification = testSpecification;

    try {
      // Call the specification with the verb implementations
      const topLevelVerbs = testSpecification(
        this.Given() as any,
        this.When() as any,
        this.Then() as any,
        this.Describe() as any,
        this.It() as any,
        this.Confirm() as any,
        this.Value() as any,
        this.Should() as any,
      );

      // The specification returns an array of top-level verb instances
      // We'll handle them directly without BaseSuite
      this.specs = topLevelVerbs;

      // Calculate total tests
      this.totalTests = this.calculateTotalTestsDirectly();

      // Create test jobs for each step
      this.testJobs = this.specs.map((step: any, index: number) => {
        const stepRunner = async (
          testResourceConfiguration: ITestResourceConfiguration,
        ): Promise<any> => {
          try {
            // Determine the step type and run it appropriately
            let result;
            const constructorName = step.constructor.name;
            
            // Create artifactory for the step
            const stepArtifactory = this.createArtifactory({
              stepIndex: index,
              stepType: constructorName.toLowerCase().replace('base', ''),
            });
            
            if (constructorName === 'BaseGiven') {
              // Run the given step
              result = await step.give(
                input,
                `step_${index}`,
                testResourceConfiguration,
                (t: any) => !!t, // Simple tester function
                stepArtifactory,
                index,
              );
            } else if (constructorName === 'BaseDescribe') {
              // Run the describe step
              result = await step.describe(
                input,
                `step_${index}`,
                testResourceConfiguration,
                (t: any) => !!t, // Simple tester function
                stepArtifactory,
                index,
              );
            } else if (constructorName === 'BaseConfirm' || constructorName === 'BaseValue') {
              // Run the confirm/value step
              if (typeof step.run === 'function') {
                result = await step.run(
                  input,
                  testResourceConfiguration,
                  stepArtifactory,
                );
              } else if (typeof step.confirm === 'function') {
                result = await step.confirm(
                  input,
                  `step_${index}`,
                  testResourceConfiguration,
                  (t: any) => !!t, // Simple tester function
                  stepArtifactory,
                  index,
                );
              } else if (typeof step.value === 'function') {
                result = await step.value(
                  input,
                  `step_${index}`,
                  testResourceConfiguration,
                  (t: any) => !!t, // Simple tester function
                  stepArtifactory,
                  index,
                );
              }
            } else {
              // Try to run using common method names
              if (typeof step.run === 'function') {
                result = await step.run(
                  input,
                  testResourceConfiguration,
                  stepArtifactory,
                );
              } else if (typeof step.test === 'function') {
                result = await step.test(
                  input,
                  testResourceConfiguration,
                  stepArtifactory,
                );
              } else {
                throw new Error(`Step type ${constructorName} has no runnable method`);
              }
            }
            return { step, result, fails: step.fails || 0, failed: step.failed || false };
          } catch (e) {
            console.error((e as Error).stack);
            throw e;
          }
        };

        const runner = stepRunner;

        const totalTests = this.totalTests;
        const testJob = {
          test: step,

          toObj: () => {
            return step.toObj ? step.toObj() : { name: `Step_${index}`, type: step.constructor.name };
          },

          runner,

          receiveTestResourceConfig: async (
            testResourceConfiguration: ITestResourceConfiguration,
          ): Promise<IFinalResults> => {
            try {
              const stepResult = await runner(testResourceConfiguration);
              const fails = stepResult.fails;
              const stepObj = stepResult.step;
              
              // Extract features from the step
              let features: string[] = [];
              if (stepObj.features && Array.isArray(stepObj.features)) {
                features = stepObj.features;
              }
              
              // Extract artifacts from the step
              let artifacts: any[] = [];
              if (stepObj.artifacts && Array.isArray(stepObj.artifacts)) {
                artifacts = stepObj.artifacts;
              }
              
              return {
                failed: stepResult.failed || fails > 0,
                fails,
                artifacts,
                features,
                tests: 1,
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

      // Only try to run tests if we have test jobs
      if (this.testJobs.length > 0) {
        (
          this.testJobs[0].receiveTestResourceConfig(
            testResourceConfiguration,
          ) as unknown as Promise<IFinalResults>
        ).then((results) => {
          results.timestamp = Date.now();
          console.log("testResourceConfiguration", testResourceConfiguration);
          const reportJson = `${testResourceConfiguration.fs}/tests.json`;
          this.writeFileSync(reportJson, JSON.stringify(results, null, 2));
        }).catch((error) => {
          console.error("Error running test job:", error);
          // Write error results
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
        // No test jobs - write empty results
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
      // Write error results immediately
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
      // Re-throw to maintain existing behavior
      throw error;
    }
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
    // Suites are deprecated
    console.warn("Suites() is deprecated and returns an empty object");
    return {};
  }

  Given(): Record<
    keyof IExtenstions,
    (
      name: string,
      features: string[],
      whens: BaseWhen<I>[],
      thens: BaseThen<I>[],
      gcb: I["setup"],
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
    return this.describesOverrides || {};
  }

  It(): Record<string, any> {
    return this.itsOverrides || {};
  }

  Confirm(): Record<string, any> {
    return this.confirmsOverrides || {};
  }

  Value(): Record<string, any> {
    return this.valuesOverrides || {};
  }

  Should(): Record<string, any> {
    return this.shouldsOverrides || {};
  }

  Expect(): Record<string, any> {
    return this.expectedsOverrides || {};
  }

  Expected(): Record<string, any> {
    return this.expectedsOverrides || {};
  }

  // Add a method to access test jobs which can be used by receiveTestResourceConfig
  getTestJobs(): ITestJob[] {
    return this.testJobs;
  }

  private calculateTotalTestsDirectly(): number {
    // Each step in specs is a test
    return this.specs ? this.specs.length : 0;
  }
}
