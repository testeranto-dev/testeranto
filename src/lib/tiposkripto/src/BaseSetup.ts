import { TestTypeParams_any } from "./CoreTypes.js";
import { ITestArtifactory, ITestResourceConfiguration } from "./types.js";

/**
 * BaseSetup is the unified base class for all setup phases.
 * It covers BDD's Given, AAA's Arrange, and TDT's Map.
 * @deprecated Use BaseGiven, BaseArrange, or BaseMap for specific patterns
 */
export abstract class BaseSetup<I extends TestTypeParams_any> {
  features: string[];
  actions: any[];
  checks: any[];
  error: Error;
  fail: any;
  store: I["istore"];
  recommendedFsPath: string;
  setupCB: I["given"];
  initialValues: any;
  key: string;
  failed: boolean;
  artifacts: string[] = [];
  fails: number = 0;
  status: boolean | undefined;

  addArtifact(path: string) {
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

  constructor(
    features: string[],
    actions: any[],
    checks: any[],
    setupCB: I["given"],
    initialValues: any
  ) {
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
    this.status = undefined;
  }

  toObj() {
    return {
      key: this.key,
      actions: (this.actions || []).map((a) => {
        if (a && a.toObj) return a.toObj();
        console.error("Action step is not as expected!", JSON.stringify(a));
        return {};
      }),
      checks: (this.checks || []).map((c) => (c && c.toObj ? c.toObj() : {})),
      error: this.error ? [this.error, this.error.stack] : null,
      failed: this.failed,
      features: this.features || [],
      artifacts: this.artifacts,
      status: this.status,
    };
  }

  abstract setupThat(
    subject: I["isubject"],
    testResourceConfiguration: ITestResourceConfiguration,
    artifactory: ITestArtifactory,
    setupCB: I["given"],
    initialValues: any
  ): Promise<I["istore"]>;

  async afterEach(
    store: I["istore"],
    key: string,
    artifactory: ITestArtifactory
  ): Promise<I["istore"]> {
    return store;
  }

  async setup(
    subject: I["isubject"],
    key: string,
    testResourceConfiguration: ITestResourceConfiguration,
    tester: (t: Awaited<I["then"]> | undefined) => boolean,
    artifactory?: ITestArtifactory,
    suiteNdx?: number
  ) {
    this.key = key;
    this.fails = 0;

    const actualArtifactory = artifactory || ((fPath: string, value: unknown) => {});
    const setupArtifactory = (fPath: string, value: unknown) =>
      actualArtifactory(`setup-${key}/${fPath}`, value);

    try {
      this.store = await this.setupThat(
        subject,
        testResourceConfiguration,
        setupArtifactory,
        this.setupCB,
        this.initialValues
      );
      this.status = true;
    } catch (e: any) {
      this.status = false;
      this.failed = true;
      this.fails++;
      this.error = e;
      return this.store;
    }

    try {
      // Process actions
      for (const [actionNdx, actionStep] of (this.actions || []).entries()) {
        try {
          this.store = await actionStep.test(
            this.store,
            testResourceConfiguration,
          );
        } catch (e: any) {
          this.failed = true;
          this.fails++;
          this.error = e;
        }
      }
      
      // Process checks
      for (const [checkNdx, checkStep] of this.checks.entries()) {
        try {
          const filepath = suiteNdx !== undefined ? 
            `suite-${suiteNdx}/setup-${key}/check-${checkNdx}` : 
            `setup-${key}/check-${checkNdx}`;
          const t = await checkStep.test(
            this.store,
            testResourceConfiguration,
            filepath
          );
          tester(t);
        } catch (e: any) {
          this.failed = true;
          this.fails++;
          this.error = e;
        }
      }
    } catch (e: any) {
      this.error = e;
      this.failed = true;
      this.fails++;
    } finally {
      try {
        await this.afterEach(this.store, this.key, setupArtifactory);
      } catch (e: any) {
        this.failed = true;
        this.fails++;
        this.error = e;
      }
    }

    return this.store;
  }
}

export type ISetups<I extends TestTypeParams_any> = Record<string, BaseSetup<I>>;
