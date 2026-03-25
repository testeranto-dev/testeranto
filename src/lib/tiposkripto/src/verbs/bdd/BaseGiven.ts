import type { TestTypeParams_any } from "../../CoreTypes.js";
import type { ITestArtifactory, ITestResourceConfiguration } from "../../types.js";
import { CommonUtils } from "../internal/CommonUtils.js";

/**
 * Represents a collection of Given conditions keyed by their names.
 * Givens are typically organized as named collections because:
 * - They set up different initial states for tests
 * - Tests often need to reference specific Given conditions by name
 * - This allows for better organization and reuse of setup logic
 * - The BDD pattern often involves multiple named Given scenarios
 */
export type IGivens<I extends TestTypeParams_any> = Record<
  string,
  BaseGiven<I>
>;

/**
 * BaseGiven for BDD pattern - independent implementation
 */
export abstract class BaseGiven<
  I extends TestTypeParams_any,
> {
  features: string[];
  whens: any[];
  thens: any[];
  error: Error | null = null;
  store: I["istore"] = null as any;
  givenCB: I["given"];
  initialValues: any;
  key: string = "";
  failed: boolean = false;
  artifacts: string[] = [];
  fails: number = 0;
  status: boolean | undefined;
  testResourceConfiguration: ITestResourceConfiguration | null = null;

  constructor(
    features: string[],
    whens: any[],
    thens: any[],
    givenCB: I["given"],
    initialValues: any,
  ) {
    this.features = features;
    this.whens = whens || [];
    this.thens = thens || [];
    this.givenCB = givenCB;
    this.initialValues = initialValues;
  }

  addArtifact(path: string) {
    CommonUtils.addArtifact(this.artifacts, path);
  }

  setParent(parent: any) {
    (this as any)._parent = parent;
  }

  toObj() {
    const whens = this.whens || [];
    const thens = this.thens || [];
    return CommonUtils.toObj(this, {
      whens: whens.map((w) => {
        if (w && w.toObj) return w.toObj();
        console.error("When step is not as expected!", JSON.stringify(w));
        return {};
      }),
      thens: thens.map((t) => (t && t.toObj ? t.toObj() : {})),
    });
  }

  /**
   * Abstract method to be implemented by concrete Given classes.
   * Sets up the initial state for the BDD Given phase.
   *
   * @param subject The test subject
   * @param testResourceConfiguration Test resource configuration
   * @param artifactory Context-aware artifactory for file operations
   * @param givenCB Given callback function
   * @param initialValues Initial values for setup
   * @returns Promise resolving to the test store
   */
  abstract givenThat(
    subject: I["isubject"],
    testResourceConfiguration: ITestResourceConfiguration,
    artifactory: ITestArtifactory,
    givenCB: I["given"],
    initialValues: any,
  ): Promise<I["istore"]>;

  async afterEach(
    store: I["istore"],
    key: string,
    artifactory: ITestArtifactory,
  ): Promise<I["istore"]> {
    return store;
  }

  async give(
    subject: I["isubject"],
    key: string,
    testResourceConfiguration: ITestResourceConfiguration,
    tester: (t: Awaited<I["then"]> | undefined) => boolean,
    artifactory?: any,
    suiteNdx?: number,
  ) {
    this.key = key;
    this.fails = 0;
    this.testResourceConfiguration = testResourceConfiguration;

    // Store suite index for use in artifactory creation
    (this as any)._suiteIndex = suiteNdx;

    // Create a proper artifactory if one isn't provided
    const actualArtifactory = artifactory;

    try {
      this.store = await this.givenThat(
        subject,
        testResourceConfiguration,
        actualArtifactory,
        this.givenCB,
        this.initialValues,
      );
      this.status = true;
    } catch (e: any) {
      this.status = false;
      CommonUtils.handleTestError(e, this);
      return this.store;
    }

    try {
      // Process whens
      const whens = this.whens || [];
      if (whens && Array.isArray(whens)) {
        for (const [whenNdx, whenStep] of whens.entries()) {
          try {
            // Create artifactory for when context
            const whenArtifactory = this.createArtifactoryForWhen(
              key,
              whenNdx,
              suiteNdx,
            );
            this.store = await whenStep.test(
              this.store,
              testResourceConfiguration,
              whenArtifactory,
            );
          } catch (e: any) {
            CommonUtils.handleTestError(e, this);
          }
        }
      } else {
        console.warn(`[BaseGiven.give] whens is not an array:`, whens);
      }

      // Process thens
      const thens = this.thens || [];
      if (thens && Array.isArray(thens)) {
        for (const [thenNdx, thenStep] of thens.entries()) {
          try {
            const filepath =
              suiteNdx !== undefined
                ? `suite-${suiteNdx}/given-${key}/then-${thenNdx}`
                : `given-${key}/then-${thenNdx}`;
            // Create artifactory for then context
            const thenArtifactory = this.createArtifactoryForThen(
              key,
              thenNdx,
              suiteNdx,
            );
            const t = await thenStep.test(
              this.store,
              testResourceConfiguration,
              filepath,
              thenArtifactory,
            );
            tester(t);
          } catch (e: any) {
            CommonUtils.handleTestError(e, this);
          }
        }
      } else {
        console.warn(`[BaseGiven.give] thens is not an array:`, thens);
      }
    } catch (e: any) {
      CommonUtils.handleTestError(e, this);
    } finally {
      try {
        await this.afterEach(this.store, this.key, actualArtifactory);
      } catch (e: any) {
        CommonUtils.handleTestError(e, this);
      }
    }

    return this.store;
  }

  private createArtifactoryForWhen(
    givenKey: string,
    whenIndex: number,
    suiteNdx?: number,
  ) {
    const self = this as any;
    if (self._parent && self._parent.createArtifactory) {
      return self._parent.createArtifactory({
        givenKey,
        whenIndex,
        suiteIndex: suiteNdx,
      });
    }
    return CommonUtils.createFallbackArtifactory(
      { givenKey, whenIndex, suiteIndex: suiteNdx },
      this.testResourceConfiguration?.fs,
    );
  }

  private createArtifactoryForThen(
    givenKey: string,
    thenIndex: number,
    suiteNdx?: number,
  ) {
    const self = this as any;
    if (self._parent && self._parent.createArtifactory) {
      return self._parent.createArtifactory({
        givenKey,
        thenIndex,
        suiteIndex: suiteNdx,
      });
    }
    return CommonUtils.createFallbackArtifactory(
      { givenKey, thenIndex, suiteIndex: suiteNdx },
      this.testResourceConfiguration?.fs,
    );
  }
}
