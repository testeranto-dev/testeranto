import { DefaultAdapter } from "./Adapters";
import {
  Ibdd_in_any, Ibdd_out_any, ITestSpecification, ITestImplementation, ITestAdapter
} from "./CoreTypes";
import {
  ITestJob, ITTestResourceRequest, ITestResourceConfiguration, defaultTestResourceRequirement, IFinalResults
} from "./types";
import { VerbProxies } from "./VerbProxies";
import { TestJobCreator } from "./TestJobCreator";
import { ClassyImplementations } from "./ClassyImplementations";
import { TestRunner } from "./TestRunner";

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
  describesOverrides: Record<string, any>;
  itsOverrides: Record<string, any>;
  confirmsOverrides: Record<string, any>;
  valuesOverrides: Record<string, any>;
  shouldsOverrides: Record<string, any>;
  expectedsOverrides: Record<string, any>;
  private verbProxies: VerbProxies<I>;
  private testJobCreator: TestJobCreator<I>;

  abstract writeFileSync(filename: string, payload: string): void;
  
  // Abstract methods to be implemented by subclasses
  abstract input(): I["iinput"];
  abstract implementation(): ITestImplementation<I, O, M> & {
    givens?: Record<string, any>;
    whens?: Record<string, any>;
    thens?: Record<string, any>;
    describes?: Record<string, any>;
    its?: Record<string, any>;
    confirms?: Record<string, any>;
    values?: Record<string, any>;
    shoulds?: Record<string, any>;
  };
  abstract adapter(): Partial<ITestAdapter<I>>;
  abstract testResourceRequirement(): ITTestResourceRequest;

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
        let path = "";
        const basePath = this.testResourceConfiguration?.fs || "testeranto";

        console.log("[Artifactory] Base path:", basePath);
        console.log("[Artifactory] Context:", context);

        if (context.stepIndex !== undefined) {
          path += `step-${context.stepIndex}/`;
          if (context.stepType) {
            path += `${context.stepType}/`;
          }
        }
        else if (context.suiteIndex !== undefined) {
          path += `suite-${context.suiteIndex}/`;
        }

        if (context.givenKey) {
          path += `given-${context.givenKey}/`;
        }

        if (context.whenIndex !== undefined) {
          path += `when-${context.whenIndex} `;
        } else if (context.thenIndex !== undefined) {
          path += `then-${context.thenIndex} `;
        }

        path += filename;

        if (!path.match(/\.[a-zA-Z0-9]+$/)) {
          path += ".txt";
        }

        const basePathClean = basePath.replace(/\/$/, "");
        const pathClean = path.replace(/^\//, "");
        const fullPath = `${basePathClean}/${pathClean}`;

        console.log("[Artifactory] Full path:", fullPath);
        this.writeFileSync(fullPath, payload);
      },
    };
  }

  constructor(
    testSpecification: ITestSpecification<I, O>,
    testResourceConfiguration: ITestResourceConfiguration,
  ) {
    this.testResourceConfiguration = testResourceConfiguration;
    this.testSpecification = testSpecification;

    // Initialize with default values that will be set in initialize()
    this.givenOverrides = {};
    this.whenOverrides = {};
    this.thenOverrides = {};
    this.describesOverrides = {};
    this.itsOverrides = {};
    this.confirmsOverrides = {};
    this.valuesOverrides = {};
    this.shouldsOverrides = {};
    this.expectedsOverrides = {};
    this.suitesOverrides = {};
    this.specs = [];
    this.testJobs = [];
    
    // Initialize test job creator early
    this.testJobCreator = new TestJobCreator<I>(
      this.createArtifactory.bind(this),
      0 // totalTests will be set later
    );
  }

  // Method to initialize the test (to be called after constructor)
  protected initialize() {
    const implementation = this.implementation();
    const adapter = this.adapter();
    const fullAdapter = DefaultAdapter<I>(adapter);
    const instance = this;

    // Initialize overrides using ClassyImplementations
    const classySuites = {};
    const classyGivens = ClassyImplementations.createClassyGivens(implementation, fullAdapter, instance);
    const classyWhens = ClassyImplementations.createClassyWhens(implementation, fullAdapter);
    const classyThens = ClassyImplementations.createClassyThens(implementation, fullAdapter);
    const classyConfirms = ClassyImplementations.createClassyConfirms(implementation);
    const classyValues = ClassyImplementations.createClassyValues(implementation);
    const classyShoulds = ClassyImplementations.createClassyShoulds(implementation);
    const classyExpecteds = ClassyImplementations.createClassyExpecteds(implementation);
    const classyDescribes = ClassyImplementations.createClassyDescribes(implementation);
    const classyIts = ClassyImplementations.createClassyIts(implementation);

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

    // Create VerbProxies after overrides are set
    this.verbProxies = new VerbProxies<I>(
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

    let topLevelVerbs: any[] = [];
    let specError: Error | null = null;

    try {
      topLevelVerbs = this.testSpecification(
        this.verbProxies.Given() as any,
        this.verbProxies.When() as any,
        this.verbProxies.Then() as any,
        this.verbProxies.Describe() as any,
        this.verbProxies.It() as any,
        this.verbProxies.Confirm() as any,
        this.verbProxies.Value() as any,
        this.verbProxies.Should() as any,
      );
    } catch (error) {
      console.error("Error during test specification:", error);
      specError = error as Error;
      topLevelVerbs = [];
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

    this.specs = topLevelVerbs;
    this.totalTests = this.testJobCreator.calculateTotalTestsDirectly(this.specs);

    this.testJobs = [];

    for (let index = 0; index < this.specs.length; index++) {
      const step = this.specs[index];
      try {
        const testJob = this.testJobCreator.createTestJobForStep(step, index, this.input());
        this.testJobs.push(testJob);
      } catch (stepError) {
        console.error(`Error creating test job for step ${index}:`, stepError);
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
        const errorTestJob = this.testJobCreator.createErrorTestJob(errorStep, index, new Error(errorMessage));
        this.testJobs.push(errorTestJob);
      }
    }

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
      const errorTestJob = this.testJobCreator.createErrorTestJob(errorStep, 0, new Error(errorMessage));
      this.testJobs.push(errorTestJob);
    }

    // Run tests using TestRunner
    if (this.testJobs.length > 0) {
      TestRunner.runAllTests(this.testJobs, this.totalTests, this.testResourceConfiguration, this.writeFileSync.bind(this));
    } else {
      TestRunner.writeEmptyResults(this.testResourceConfiguration, this.writeFileSync.bind(this));
    }
  }

  async receiveTestResourceConfig(
    testResourceConfig: ITestResourceConfiguration,
  ): Promise<any> {
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

  Given(): Record<string, any> {
    return this.verbProxies.Given();
  }

  When(): Record<string, any> {
    return this.verbProxies.When();
  }

  Then(): Record<string, any> {
    return this.verbProxies.Then();
  }

  Describe(): Record<string, any> {
    return this.verbProxies.Describe();
  }

  It(): Record<string, any> {
    return this.verbProxies.It();
  }

  Confirm(): Record<string, any> {
    return this.verbProxies.Confirm();
  }

  Value(): Record<string, any> {
    return this.verbProxies.Value();
  }

  Should(): Record<string, any> {
    return this.verbProxies.Should();
  }

  Expect(): Record<string, any> {
    return this.verbProxies.Expect();
  }

  Expected(): Record<string, any> {
    return this.verbProxies.Expected();
  }

  getTestJobs(): ITestJob[] {
    return this.testJobs;
  }

}
