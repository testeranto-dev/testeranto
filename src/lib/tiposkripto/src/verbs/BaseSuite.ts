import type { TestTypeParams_any, TestSpecShape_any } from "../CoreTypes.js";
import type { ITestResourceConfiguration, ITestArtifactory, IGivens, IDescribes, IIts } from "../types.js";
import { CommonUtils } from "./internal/CommonUtils.js";

/**
 * Represents a collection of test suites keyed by their names.
 * Suites are organized as named collections because:
 * - Tests are typically grouped into logical suites (e.g., by feature, component)
 * - Suites may have different configurations or setup requirements
 * - Named suites allow for selective test execution and better reporting
 * - This supports the hierarchical structure of test organization
 */
export type ISuites<
  I extends TestTypeParams_any,
  O extends TestSpecShape_any,
> = Record<string, BaseSuite<I, O>>;

export abstract class BaseSuite<
  I extends TestTypeParams_any,
  O extends TestSpecShape_any,
> {
  name: string;
  givens: IGivens<I>;
  describes: IDescribes<I>;
  its: IIts<I>;
  store: I["istore"] = null as any;
  testResourceConfiguration: ITestResourceConfiguration = null as any;
  index: number = 0;
  failed: boolean = false;
  fails: number = 0;
  parent: any = null; // Reference to parent BaseTiposkripto instance

  artifacts: string[] = [];

  addArtifact(path: string) {
    CommonUtils.addArtifact(this.artifacts, path);
  }

  constructor(
    name: string,
    index: number,
    givens: IGivens<I> = {},
    parent?: any,
  ) {
    const suiteName = name || "testSuite"; // Ensure name is never undefined
    if (!suiteName) {
      throw new Error("BaseSuite requires a non-empty name");
    }

    this.name = suiteName;
    this.index = index;
    this.givens = givens;
    this.fails = 0;
    this.parent = parent;
  }

  public features() {
    try {
      const features = Object.keys(this.givens)
        .map((k) => this.givens[k].features)
        .flat()
        .filter((value, index, array) => {
          return array.indexOf(value) === index;
        });
      // Convert all features to strings
      const stringFeatures = features.map((feature) => {
        if (typeof feature === "string") {
          return feature;
        } else if (feature && typeof feature === "object") {
          return (feature as any).name || JSON.stringify(feature);
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

  public toObj() {
    // We need to organize by pattern type
    const bddGivens: any[] = [];
    const aaaDescribes: any[] = [];
    const tdtConfirms: any[] = [];

    for (const [k, giver] of Object.entries(this.givens)) {
      const obj = giver.toObj();

      // Check the constructor name to determine the type
      // This is more reliable than checking properties
      const constructorName = giver.constructor.name;

      if (constructorName === 'BaseConfirm') {
        // TDT pattern - Confirm organizes the tests
        tdtConfirms.push({
          key: obj.key || giver.name,
          values: obj.values || [],
          error: obj.error,
          failed: obj.failed,
          features: obj.features || [],
          artifacts: obj.artifacts,
          status: obj.status
        });
      } else if (constructorName === 'BaseValue') {
        // TDT pattern - individual Value (legacy, might not be used)
        tdtConfirms.push({
          key: obj.key,
          values: obj.values || [],
          error: obj.error,
          failed: obj.failed,
          features: obj.features || [],
          artifacts: obj.artifacts,
          status: obj.status
        });
      } else if (constructorName === 'BaseDescribe') {
        // AAA pattern
        aaaDescribes.push({
          key: obj.key,
          describes: obj.describes || [],
          its: obj.its || [],
          error: obj.error,
          failed: obj.failed,
          features: obj.features || [],
          artifacts: obj.artifacts,
          status: obj.status
        });
      } else if (constructorName === 'BaseGiven') {
        // BDD pattern
        bddGivens.push({
          key: obj.key,
          whens: obj.whens || [],
          thens: obj.thens || [],
          error: obj.error,
          failed: obj.failed,
          features: obj.features || [],
          artifacts: obj.artifacts,
          status: obj.status
        });
      } else {
        // Fallback: check properties
        if (obj.values !== undefined || constructorName.includes('Confirm') || constructorName.includes('Value')) {
          // TDT pattern
          tdtConfirms.push({
            key: obj.key || k,
            values: obj.values || [],
            error: obj.error,
            failed: obj.failed,
            features: obj.features || [],
            artifacts: obj.artifacts,
            status: obj.status
          });
        } else if (obj.describes !== undefined || obj.its !== undefined || constructorName.includes('Describe')) {
          // AAA pattern
          aaaDescribes.push({
            key: obj.key,
            describes: obj.describes || [],
            its: obj.its || [],
            error: obj.error,
            failed: obj.failed,
            features: obj.features || [],
            artifacts: obj.artifacts,
            status: obj.status
          });
        } else if (obj.whens !== undefined || obj.thens !== undefined || constructorName.includes('Given')) {
          // BDD pattern
          bddGivens.push({
            key: obj.key,
            whens: obj.whens || [],
            thens: obj.thens || [],
            error: obj.error,
            failed: obj.failed,
            features: obj.features || [],
            artifacts: obj.artifacts,
            status: obj.status
          });
        } else {
          // Default to BDD
          bddGivens.push(obj);
        }
      }
    }

    const result: any = {
      name: this.name,
      fails: this.fails,
      failed: this.failed,
      features: this.features(),
      artifacts: this.artifacts
        ? this.artifacts.filter((art) => typeof art === "string")
        : [],
    };

    // Add pattern-specific arrays only if they have content
    if (bddGivens.length > 0) {
      result.givens = bddGivens;
    }
    if (aaaDescribes.length > 0) {
      result.describes = aaaDescribes;
    }
    if (tdtConfirms.length > 0) {
      result.confirms = tdtConfirms;
    }

    return result;
  }

  setup(
    s: I["iinput"],
    artifactory: ITestArtifactory,
    tr: ITestResourceConfiguration,
  ): Promise<I["isubject"]> {
    return new Promise((res) => res(s as unknown as I["isubject"]));
  }

  assertThat(t: Awaited<I["check"]> | undefined): boolean {
    return !!t;
  }

  afterAll(store: I["istore"], artifactory: ITestArtifactory) {
    return store;
  }

  async run(
    input: I["iinput"],
    testResourceConfiguration: ITestResourceConfiguration,
  ): Promise<BaseSuite<I, O>> {
    this.testResourceConfiguration = testResourceConfiguration;
    const sNdx = this.index;

    // Create an artifactory for the suite setup
    let suiteArtifactory;
    if (this.parent && this.parent.createArtifactory) {
      suiteArtifactory = this.parent.createArtifactory({
        suiteIndex: sNdx,
      });
    } else {
      // Fallback artifactory
      const basePath = this.testResourceConfiguration?.fs || "testeranto";
      suiteArtifactory = {
        writeFileSync: (filename: string, payload: string) => {
          console.log(
            `[BaseSuite] Would write to ${basePath}/suite-${sNdx}/${filename}: ${payload.substring(0, 100)}...`,
          );
        },
        screenshot: (filename: string, payload?: string) => {
          console.log(`[BaseSuite] Would take screenshot: ${filename}`);
        },
      };
    }

    const subject = await this.setup(input, suiteArtifactory, testResourceConfiguration);

    for (const [gKey, g] of Object.entries(this.givens)) {
      const giver = this.givens[gKey];
      try {
        // Create artifactory for the given
        let givenArtifactory;
        if (this.parent && this.parent.createArtifactory) {
          givenArtifactory = this.parent.createArtifactory({
            givenKey: gKey,
            suiteIndex: sNdx,
          });
        } else {
          // Fallback artifactory
          const basePath = this.testResourceConfiguration?.fs || "testeranto";
          givenArtifactory = {
            writeFileSync: (filename: string, payload: string) => {
              const path = `suite-${sNdx}/given-${gKey}/${filename}`;
              const fullPath = `${basePath}/${path}`;
              console.log(`[BaseSuite] Would write to ${fullPath}: ${payload.substring(0, 100)}...`);
            },
            screenshot: (filename: string, payload?: string) => {
              console.log(`[BaseSuite] Would take screenshot: ${filename}`);
            },
          };
        }

        // Call the appropriate method based on the type of giver
        const constructorName = giver.constructor.name;

        if (constructorName === 'BaseGiven' || typeof giver.give === 'function') {
          // BaseGiven instance (BDD)
          this.store = await giver.give(
            subject,
            gKey,
            testResourceConfiguration,
            this.assertThat,
            givenArtifactory,
            sNdx,
          );
        } else if (constructorName === 'BaseDescribe' || typeof giver.describe === 'function') {
          // BaseDescribe instance (AAA)
          this.store = await giver.describe(
            subject,
            gKey,
            testResourceConfiguration,
            this.assertThat,
            givenArtifactory,
            sNdx,
          );
        } else if (constructorName === 'BaseConfirm' || typeof giver.run === 'function') {
          // BaseConfirm instance (TDT)
          this.store = await giver.run(
            subject,
            testResourceConfiguration,
            givenArtifactory,
          );
        } else if (constructorName === 'BaseValue' || typeof giver.value === 'function') {
          // BaseValue instance (TDT - legacy)
          this.store = await giver.value(
            subject,
            gKey,
            testResourceConfiguration,
            this.assertThat,
            givenArtifactory,
            sNdx,
          );
        } else {
          // Try to detect based on available methods
          if (typeof giver.give === 'function') {
            this.store = await giver.give(
              subject,
              gKey,
              testResourceConfiguration,
              this.assertThat,
              givenArtifactory,
              sNdx,
            );
          } else if (typeof giver.describe === 'function') {
            this.store = await giver.describe(
              subject,
              gKey,
              testResourceConfiguration,
              this.assertThat,
              givenArtifactory,
              sNdx,
            );
          } else if (typeof giver.run === 'function') {
            // TDT Confirm
            this.store = await giver.run(
              subject,
              testResourceConfiguration,
              givenArtifactory,
            );
          } else if (typeof giver.value === 'function') {
            this.store = await giver.value(
              subject,
              gKey,
              testResourceConfiguration,
              this.assertThat,
              givenArtifactory,
              sNdx,
            );
          } else {
            throw new Error(`Giver ${gKey} has no valid method (give, describe, run, or value). Type: ${giver.constructor.name}`);
          }
        }
        // Add the number of failures from this given to the suite's total
        this.fails += giver.fails || 0;
      } catch (e) {
        this.failed = true;
        // Add 1 to fails for the caught error
        this.fails += 1;
        // Also add any failures from the given itself
        if (giver.fails) {
          this.fails += giver.fails;
        }
        console.error(`Error in given ${gKey}:`, e);
        // Don't re-throw to continue with other givens
      }
    }

    // Mark the suite as failed if there are any failures
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
}
