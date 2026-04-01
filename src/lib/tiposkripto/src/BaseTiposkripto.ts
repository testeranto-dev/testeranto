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
    if (testImplementation.describes && typeof testImplementation.describes === 'object') {
      Object.entries(testImplementation.describes).forEach(([key, desc]) => {
        // Ensure each key is a function that returns a function that creates BaseDescribe
        classyDescribes[key] = (
          features: string[],
          its: any[],
          describeCB: I["setup"],
          initialValues: any,
        ) => {
          try {
            // Use the implementation function as describeCB if not provided
            let actualDescribeCB;
            if (describeCB) {
              actualDescribeCB = describeCB;
            } else if (typeof desc === 'function') {
              // If desc is a function, it should return the describeCB
              actualDescribeCB = desc();
            } else {
              // If desc is not a function, use it directly
              actualDescribeCB = desc;
            }
            
            // Ensure actualDescribeCB is a function
            if (typeof actualDescribeCB !== 'function') {
              console.warn(`Describe implementation for "${key}" is not a function, got:`, typeof actualDescribeCB);
              actualDescribeCB = () => {
                throw new Error(`Describe implementation for "${key}" is not a valid function`);
              };
            }
            
            return new BaseDescribe<I>(
              features,
              its,
              actualDescribeCB,
              initialValues,
            );
          } catch (error) {
            console.error(`Error creating Describe for "${key}":`, error);
            // Return a BaseDescribe that will fail gracefully
            return new BaseDescribe<I>(
              features,
              its,
              () => {
                throw new Error(`Describe implementation for "${key}" failed: ${error.message}`);
              },
              initialValues,
            );
          }
        };
      });
    } else {
      console.warn('testImplementation.describes is not defined or not an object');
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

    let topLevelVerbs: any[] = [];
    let specError: Error | null = null;
    
    try {
      // Call the specification with the verb implementations
      topLevelVerbs = testSpecification(
        this.Given() as any,
        this.When() as any,
        this.Then() as any,
        this.Describe() as any,
        this.It() as any,
        this.Confirm() as any,
        this.Value() as any,
        this.Should() as any,
      );
    } catch (error) {
      console.error("Error during test specification:", error);
      specError = error as Error;
      // Continue with empty specs - we'll create error test jobs
      topLevelVerbs = [];
      // Create an error step for the specification failure
      const errorStep = {
        constructor: { name: 'SpecificationError' },
        features: [],
        artifacts: [],
        fails: 1,
        failed: true,
        error: specError,
        toObj: () => ({
          name: 'Specification_Error',
          type: 'Error',
          error: `Test specification failed: ${specError?.message}`
        })
      };
      topLevelVerbs.push(errorStep);
    }

    // The specification returns an array of top-level verb instances
    // We'll handle them directly without BaseSuite
    this.specs = topLevelVerbs;

    // Calculate total tests
    this.totalTests = this.calculateTotalTestsDirectly();

    // Create test jobs for each step
    this.testJobs = [];
    
    // Create test jobs for each spec that was created
    // With our fixed proxies, the specification should create all steps even if they fail
    for (let index = 0; index < this.specs.length; index++) {
      const step = this.specs[index];
      try {
        const testJob = this.createTestJobForStep(step, index, input);
        this.testJobs.push(testJob);
      } catch (stepError) {
        console.error(`Error creating test job for step ${index}:`, stepError);
        // Create an error test job for this step
        const errorMessage = `Step ${index} failed to create test job: ${(stepError as Error).message}`;
        const errorStep = {
          constructor: { name: 'ErrorStep' },
          features: [],
          artifacts: [],
          fails: 1,
          failed: true,
          error: new Error(errorMessage),
          toObj: () => ({
            name: `Step_${index}_Error`,
            type: 'Error',
            error: errorMessage
          })
        };
        const errorTestJob = this.createErrorTestJob(errorStep, index, new Error(errorMessage));
        this.testJobs.push(errorTestJob);
      }
    }
    
    // If no specs were created (shouldn't happen with our proxies), create a single error test job
    if (this.testJobs.length === 0) {
      const errorMessage = specError ? 
        `Test specification failed: ${specError.message}` : 
        'No test steps were created by the specification';
      const errorStep = {
        constructor: { name: 'ErrorStep' },
        features: [],
        artifacts: [],
        fails: 1,
        failed: true,
        error: new Error(errorMessage),
        toObj: () => ({
          name: 'Specification_Error',
          type: 'Error',
          error: errorMessage
        })
      };
      const errorTestJob = this.createErrorTestJob(errorStep, 0, new Error(errorMessage));
      this.testJobs.push(errorTestJob);
    }

    // Only try to run tests if we have test jobs
    if (this.testJobs.length > 0) {
      // Run all test jobs, not just the first one
      const runAllTests = async () => {
        const allResults = [];
        let totalFails = 0;
        let anyFailed = false;
        const allFeatures: string[] = [];
        const allArtifacts: any[] = [];
        
        for (let i = 0; i < this.testJobs.length; i++) {
          try {
            const result = await this.testJobs[i].receiveTestResourceConfig(testResourceConfiguration);
            allResults.push(result);
            totalFails += result.fails;
            anyFailed = anyFailed || result.failed;
            
            // Collect features and artifacts
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
            // Create an error result for this failed job
            allResults.push({
              failed: true,
              fails: 1,
              features: [],
              artifacts: [],
              error: {
                message: (e as Error).message,
                stack: (e as Error).stack,
                name: (e as Error).name
              },
              stepName: `Job_${i}`,
              stepType: 'Error',
              testJob: { name: `Job_${i}_Error` }
            });
          }
        }
        
        // Create combined results with individual test details
        const combinedResults: any = {
          failed: anyFailed,
          fails: totalFails,
          artifacts: allArtifacts,
          features: [...new Set(allFeatures)], // Remove duplicates
          tests: this.testJobs.length,
          runTimeTests: this.totalTests,
          testJob: { name: 'CombinedResults' },
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
        
        // Add summary
        combinedResults.summary = {
          totalTests: this.testJobs.length,
          passed: this.testJobs.length - totalFails,
          failed: totalFails,
          successRate: totalFails === this.testJobs.length ? '0%' : 
            ((this.testJobs.length - totalFails) / this.testJobs.length * 100).toFixed(2) + '%'
        };
        
        console.log("testResourceConfiguration", testResourceConfiguration);
        const reportJson = `${testResourceConfiguration.fs}/tests.json`;
        this.writeFileSync(reportJson, JSON.stringify(combinedResults, null, 2));
      };
      
      runAllTests().catch((error) => {
        console.error("Error running all test jobs:", error);
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
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          individualResults: [],
          summary: {
            totalTests: 0,
            passed: 0,
            failed: 1,
            successRate: '0%'
          }
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
        error: {
          message: "No test jobs were created",
          name: "ConfigurationError"
        },
        individualResults: [],
        summary: {
          totalTests: 0,
          passed: 0,
          failed: 1,
          successRate: '0%'
        }
      };
      const reportJson = `${testResourceConfiguration.fs}/tests.json`;
      this.writeFileSync(reportJson, JSON.stringify(emptyResults, null, 2));
    }
  }

  async receiveTestResourceConfig(
    testResourceConfig: ITestResourceConfiguration,
  ): Promise<any> {
    if (this.testJobs && this.testJobs.length > 0) {
      // Run all test jobs and combine results
      const allResults = [];
      let totalFails = 0;
      let anyFailed = false;
      const allFeatures: string[] = [];
      const allArtifacts: any[] = [];
      
      for (let i = 0; i < this.testJobs.length; i++) {
        try {
          const result = await this.testJobs[i].receiveTestResourceConfig(testResourceConfig);
          allResults.push(result);
          totalFails += result.fails;
          anyFailed = anyFailed || result.failed;
          
          // Collect features and artifacts
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
        features: [...new Set(allFeatures)], // Remove duplicates
        tests: this.testJobs.length,
        runTimeTests: this.totalTests,
        testJob: { name: 'CombinedResults' },
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
          totalTests: this.testJobs.length,
          passed: this.testJobs.length - totalFails,
          failed: totalFails,
          successRate: totalFails === 0 ? '100%' : 
            ((this.testJobs.length - totalFails) / this.testJobs.length * 100).toFixed(2) + '%'
        }
      };
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

  Given(): Record<string, any> {
    const overrides = this.givenOverrides || {};
    // Return a proxy that handles missing keys
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            // Return a function that can be called with arguments, which returns a function that creates BaseGiven
            return (...args: any[]) => {
              console.error(`Given.${prop} is not defined in test implementation`);
              // This function should return another function that creates the BaseGiven
              return (
                features: string[] = [],
                whens: any[] = [],
                thens: any[] = [],
                givenCB: any = () => {},
                initialValues: any = undefined,
              ) => {
                try {
                  return new (class extends BaseGiven<I> {
                    async givenThat(
                      subject: any,
                      testResource: any,
                      artifactory: any,
                      initializer: any,
                      initialValues: any,
                    ) {
                      throw new Error(`Given.${prop} is not implemented`);
                    }
                  })(
                    features,
                    whens,
                    thens,
                    givenCB,
                    initialValues,
                  );
                } catch (e) {
                  console.error(`Error creating Given.${prop}:`, e);
                  // Return a minimal BaseGiven that will fail when run
                  return {
                    features: features,
                    whens: whens,
                    thens: thens,
                    givenCB: givenCB,
                    initialValues: initialValues,
                    give: async () => {
                      throw new Error(`Given.${prop} creation failed: ${e.message}`);
                    },
                    toObj: () => ({
                      key: `Given_${prop}_error`,
                      error: `Given.${prop} creation failed: ${e.message}`,
                      failed: true,
                      features: features,
                    })
                  };
                }
              };
            };
          }
        }
        return target[prop];
      }
    });
  }

  When(): Record<string, any> {
    const overrides = this.whenOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            // Return a function that creates a failing BaseWhen
            return (...args: any[]) => {
              console.error(`When.${prop} is not defined in test implementation`);
              try {
                return new (class extends BaseWhen<I> {
                  async andWhen(
                    store: any,
                    whenCB: any,
                    testResource: any,
                    artifactory: any,
                  ) {
                    throw new Error(`When.${prop} is not implemented`);
                  }
                })(`${prop}: ${args && args.toString()}`, () => {
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
                    status: false,
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

  Then(): Record<string, any> {
    const overrides = this.thenOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            // Return a function that creates a failing BaseThen
            return (...args: any[]) => {
              console.error(`Then.${prop} is not defined in test implementation`);
              return new (class extends BaseThen<I> {
                async butThen(
                  store: any,
                  thenCB: any,
                  testResourceConfiguration: any,
                  artifactory: any,
                ) {
                  throw new Error(`Then.${prop} is not implemented`);
                }
              })(`${prop}: ${args && args.toString()}`, async () => {
                throw new Error(`Then.${prop} is not implemented`);
              });
            };
          }
        }
        return target[prop];
      }
    });
  }

  Describe(): Record<string, any> {
    const overrides = this.describesOverrides || {};
    // Return a proxy that handles missing keys
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            // Return a function that can be called with arguments, which returns a function that creates BaseDescribe
            return (...args: any[]) => {
              console.error(`Describe.${prop} is not defined in test implementation`);
              // This function should return another function that creates the BaseDescribe
              return (features: string[], its: any[], describeCB: any, initialValues: any) => {
                return new BaseDescribe<any>(
                  features,
                  its,
                  () => {
                    throw new Error(`Describe.${prop} is not implemented`);
                  },
                  initialValues,
                );
              };
            };
          }
        }
        return target[prop];
      }
    });
  }

  It(): Record<string, any> {
    const overrides = this.itsOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            // Return a function that creates a failing BaseIt
            return (...args: any[]) => {
              console.error(`It.${prop} is not defined in test implementation`);
              return new (class extends BaseIt<I> {
                constructor(name: string, itCB: any) {
                  super(name, itCB);
                }
              })(`${prop}: ${args && args.toString()}`, () => {
                throw new Error(`It.${prop} is not implemented`);
              });
            };
          }
        }
        return target[prop];
      }
    });
  }

  Confirm(): Record<string, any> {
    const overrides = this.confirmsOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            // Return a function that can be called with arguments, which returns a function that creates BaseConfirm
            return (...args: any[]) => {
              console.error(`Confirm.${prop} is not defined in test implementation`);
              // This function should return another function that creates the BaseConfirm
              return (testCases: any[][], features: string[]) => {
                return new (class extends BaseConfirm<I> {
                  constructor(
                    features: string[],
                    testCases: any[][],
                    confirmCB: any,
                    initialValues: any,
                  ) {
                    super(features, testCases, confirmCB, initialValues);
                  }
                })(
                  features,
                  testCases,
                  () => {
                    throw new Error(`Confirm.${prop} is not implemented`);
                  },
                  undefined,
                );
              };
            };
          }
        }
        return target[prop];
      }
    });
  }

  Value(): Record<string, any> {
    const overrides = this.valuesOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            // Return a function that can be called with arguments, which returns a function that creates BaseValue
            return (...args: any[]) => {
              console.error(`Value.${prop} is not defined in test implementation`);
              // This function should return another function that creates the BaseValue
              return (features: string[], tableRows: any[][], confirmCB: any, initialValues: any) => {
                return new (class extends BaseValue<I> {
                  constructor(
                    features: string[],
                    tableRows: any[][],
                    confirmCB: any,
                    initialValues: any,
                  ) {
                    super(features, tableRows, confirmCB, initialValues);
                  }
                })(
                  features,
                  tableRows,
                  () => {
                    throw new Error(`Value.${prop} is not implemented`);
                  },
                  initialValues,
                );
              };
            };
          }
        }
        return target[prop];
      }
    });
  }

  Should(): Record<string, any> {
    const overrides = this.shouldsOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            // Return a function that creates a failing BaseShould
            return (...args: any[]) => {
              console.error(`Should.${prop} is not defined in test implementation`);
              return new (class extends BaseShould<I> {
                constructor(name: string, shouldCB: any) {
                  super(name, shouldCB);
                }
              })(`${prop}: ${args && args.toString()}`, () => {
                throw new Error(`Should.${prop} is not implemented`);
              });
            };
          }
        }
        return target[prop];
      }
    });
  }

  Expect(): Record<string, any> {
    const overrides = this.expectedsOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            // Return a function that creates a failing BaseExpected
            return (...args: any[]) => {
              console.error(`Expect.${prop} is not defined in test implementation`);
              return new (class extends BaseExpected<I> {
                constructor(name: string, expectedCB: any) {
                  super(name, expectedCB);
                }
                async validateRow(
                  store: any,
                  testResourceConfiguration: any,
                  filepath: string,
                  expectedValue: any,
                  artifactory?: any,
                ) {
                  throw new Error(`Expect.${prop} is not implemented`);
                }
              })(`${prop}: ${args && args.toString()}`, async () => {
                throw new Error(`Expect.${prop} is not implemented`);
              });
            };
          }
        }
        return target[prop];
      }
    });
  }

  Expected(): Record<string, any> {
    const overrides = this.expectedsOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            // Return a function that creates a failing BaseExpected
            return (...args: any[]) => {
              console.error(`Expected.${prop} is not defined in test implementation`);
              return new (class extends BaseExpected<I> {
                constructor(name: string, expectedCB: any) {
                  super(name, expectedCB);
                }
                async validateRow(
                  store: any,
                  testResourceConfiguration: any,
                  filepath: string,
                  expectedValue: any,
                  artifactory?: any,
                ) {
                  throw new Error(`Expected.${prop} is not implemented`);
                }
              })(`${prop}: ${args && args.toString()}`, async () => {
                throw new Error(`Expected.${prop} is not implemented`);
              });
            };
          }
        }
        return target[prop];
      }
    });
  }

  // Add a method to access test jobs which can be used by receiveTestResourceConfig
  getTestJobs(): ITestJob[] {
    return this.testJobs;
  }

  private createTestJobForStep(step: any, index: number, input: I["iinput"]): any {
    const stepRunner = async (
      testResourceConfiguration: ITestResourceConfiguration,
    ): Promise<any> => {
      try {
        // Determine the step type and run it appropriately
        let result;
        const constructorName = step.constructor?.name || 'Unknown';
        
        // Create artifactory for the step
        const stepArtifactory = this.createArtifactory({
          stepIndex: index,
          stepType: constructorName.toLowerCase().replace('base', ''),
        });
        
        if (constructorName === 'BaseGiven') {
          // Run the given step (BDD)
          result = await step.give(
            input,
            `step_${index}`,
            testResourceConfiguration,
            (t: any) => !!t, // Simple tester function
            stepArtifactory,
            index,
          );
        } else if (constructorName === 'BaseDescribe') {
          // Run the describe step (AAA)
          result = await step.describe(
            input,
            `step_${index}`,
            testResourceConfiguration,
            (t: any) => !!t, // Simple tester function
            stepArtifactory,
            index,
          );
        } else if (constructorName === 'BaseConfirm' || constructorName === 'BaseValue') {
          // Run the confirm/value step (TDT)
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
          } else {
            throw new Error(`TDT step has no runnable method (run, confirm, or value)`);
          }
        } else if (constructorName === 'SpecificationError') {
          // This is a specification error step
          throw step.error || new Error('Test specification failed');
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
          } else if (typeof step.give === 'function') {
            // Try give method
            result = await step.give(
              input,
              `step_${index}`,
              testResourceConfiguration,
              (t: any) => !!t,
              stepArtifactory,
              index,
            );
          } else if (typeof step.describe === 'function') {
            // Try describe method
            result = await step.describe(
              input,
              `step_${index}`,
              testResourceConfiguration,
              (t: any) => !!t,
              stepArtifactory,
              index,
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
        return step.toObj ? step.toObj() : { 
          name: `Step_${index}`, 
          type: step.constructor?.name || 'Unknown',
          key: step.key || `step_${index}`
        };
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
          
          // Extract error information
          let errorDetails: any = null;
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
            stepType: stepObj.constructor?.name || 'Unknown'
          };
        } catch (e) {
          console.error((e as Error).stack);
          return {
            failed: true,
            fails: 1,
            artifacts: [],
            features: [],
            tests: 1,
            runTimeTests: totalTests,
            testJob: testJob.toObj(),
            error: {
              message: (e as Error).message,
              stack: (e as Error).stack,
              name: (e as Error).name
            },
            stepName: step.key || `Step_${index}`,
            stepType: step.constructor?.name || 'Error'
          };
        }
      },
    };
    return testJob;
  }

  private createErrorTestJob(errorStep: any, index: number, error: Error): any {
    const totalTests = this.totalTests;
    // Create a unique error that includes the step index in the message
    // The error message already contains step-specific information from our updates above
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

      receiveTestResourceConfig: async (
        testResourceConfiguration: ITestResourceConfiguration,
      ): Promise<IFinalResults> => {
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
          stepType: 'Error'
        };
      },
    };
  }

  private calculateTotalTestsDirectly(): number {
    // Each step in specs is a test
    return this.specs ? this.specs.length : 0;
  }
}
