import { TestTypeParams_any } from "./CoreTypes.js";
import { ITestArtifactory, ITestResourceConfiguration } from "./types.js";
import { BaseSetup } from "./BaseSetup.js";

/**
 * Represents a collection of Given conditions keyed by their names.
 * Givens are typically organized as named collections because:
 * - They set up different initial states for tests
 * - Tests often need to reference specific Given conditions by name
 * - This allows for better organization and reuse of setup logic
 * - The BDD pattern often involves multiple named Given scenarios
 * @deprecated Use BaseSetup for unified terminology
 */
export type IGivens<I extends TestTypeParams_any> = Record<string, BaseGiven<I>>;

/**
 * BaseGiven extends BaseSetup for BDD pattern.
 * @deprecated Use BaseSetup for unified terminology
 */
export abstract class BaseGiven<I extends TestTypeParams_any> extends BaseSetup<I> {
  features: string[];
  whens: any[];
  thens: any[];
  error: Error;
  fail: any;
  store: I["istore"];
  recommendedFsPath: string;
  givenCB: I["given"];
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
    const normalizedPath = path.replace(/\\/g, "/"); // Normalize path separators
    this.artifacts.push(normalizedPath);
  }

  constructor(
    features: string[],
    whens: any[],
    thens: any[],
    givenCB: I["given"],
    initialValues: any
  ) {
    // Map whens to actions, thens to checks
    super(features, whens, thens, givenCB, initialValues);
  }

  beforeAll(store: I["istore"]) {
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
      thens: (this.thens || []).map((t) => (t && t.toObj ? t.toObj() : {})),
      error: this.error ? [this.error, this.error.stack] : null,
      failed: this.failed,
      features: this.features || [],
      artifacts: this.artifacts,
      status: this.status,
    };
  }

  abstract givenThat(
    subject: I["isubject"],
    testResourceConfiguration,
    artifactory: ITestArtifactory,
    givenCB: I["given"],
    initialValues: any
  ): Promise<I["istore"]>;

  // Implement BaseSetup's abstract method
  async setupThat(
    subject: I["isubject"],
    testResourceConfiguration: ITestResourceConfiguration,
    artifactory: ITestArtifactory,
    setupCB: I["given"],
    initialValues: any
  ): Promise<I["istore"]> {
    return this.givenThat(subject, testResourceConfiguration, artifactory, setupCB, initialValues);
  }

  async afterEach(
    store: I["istore"],
    key: string,
    artifactory: ITestArtifactory
  ): Promise<I["istore"]> {
    return store;
  }

  async give(
    subject: I["isubject"],
    key: string,
    testResourceConfiguration: ITestResourceConfiguration,
    tester: (t: Awaited<I["then"]> | undefined) => boolean,
    artifactory?: ITestArtifactory,
    suiteNdx?: number
  ) {
    this.key = key;
    this.fails = 0; // Initialize fail count for this given

    // Handle missing artifactory
    const actualArtifactory = artifactory || ((fPath: string, value: unknown) => {});
    const givenArtifactory = (fPath: string, value: unknown) =>
      actualArtifactory(`given-${key}/${fPath}`, value);

    try {
      this.store = await this.givenThat(
        subject,
        testResourceConfiguration,
        givenArtifactory,
        this.givenCB,
        this.initialValues
      );
      this.status = true;
    } catch (e: any) {
      this.status = false;
      this.failed = true;
      this.fails++; // Increment fail count
      this.error = e;
      // Don't re-raise to allow processing of other givens
      return this.store;
    }

    try {
      // Process whens
      const whens = this.whens || [];
      for (const [whenNdx, whenStep] of whens.entries()) {
        try {
          this.store = await whenStep.test(
            this.store,
            testResourceConfiguration,
          );
        } catch (e: any) {
          this.failed = true;
          this.fails++; // Increment fail count
          this.error = e;
          // Continue to process thens even if whens fail
        }
      }
      
      // Process thens
      for (const [thenNdx, thenStep] of this.thens.entries()) {
        try {
          const filepath = suiteNdx !== undefined ? 
            `suite-${suiteNdx}/given-${key}/then-${thenNdx}` : 
            `given-${key}/then-${thenNdx}`;
          const t = await thenStep.test(
            this.store,
            testResourceConfiguration,
            filepath
          );
          // If the test doesn't throw, it passed
          tester(t);
        } catch (e: any) {
          // Mark the given as failed if any then step fails
          this.failed = true;
          this.fails++; // Increment fail count
          this.error = e;
          // Continue processing other thens
        }
      }
    } catch (e: any) {
      this.error = e;
      this.failed = true;
      this.fails++; // Increment fail count
    } finally {
      try {
        await this.afterEach(this.store, this.key, givenArtifactory);
      } catch (e: any) {
        this.failed = true;
        this.fails++; // Increment fail count
        this.error = e;
      }
    }

    return this.store;
  }
}
