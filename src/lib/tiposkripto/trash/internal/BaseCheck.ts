import type { TestTypeParams_any } from "../../CoreTypes.js";
import type { ITestResourceConfiguration } from "../types.js";

/**
 * BaseCheck is the internal unified base class for all verification phases.
 * It covers BDD's Then, AAA's Assert, and TDT's Validate.
 * This class is not exposed to users - use BaseThen, BaseExpected, or BaseAssert instead.
 */
export abstract class BaseCheck<I extends TestTypeParams_any> {
  public name: string;
  checkCB: (storeState: I["iselection"]) => Promise<I["then"]>;
  error: boolean;
  artifacts: string[] = [];
  status: boolean | undefined;

  constructor(
    name: string,
    checkCB: (val: I["iselection"]) => Promise<I["then"]>,
  ) {
    this.name = name;
    this.checkCB = checkCB;
    this.error = false;
    this.artifacts = [];
  }

  addArtifact(path: string) {
    if (typeof path !== "string") {
      throw new Error(
        `[ARTIFACT ERROR] Expected string, got ${typeof path}: ${JSON.stringify(
          path,
        )}`,
      );
    }
    const normalizedPath = path.replace(/\\/g, "/");
    this.artifacts.push(normalizedPath);
  }

  toObj() {
    // BaseCheck doesn't have its, key, failed, or features by default
    // But subclasses might add them
    const obj: any = {
      error: this.error ? [this.error, (this.error as any).stack] : null,
      artifacts: this.artifacts,
      status: this.status,
    };

    // Add optional properties if they exist
    if ('key' in this) obj.key = (this as any).key;
    if ('failed' in this) obj.failed = (this as any).failed;
    if ('features' in this) obj.features = (this as any).features;

    // Handle its if it exists
    if ('its' in this) {
      const its = (this as any).its;
      if (Array.isArray(its)) {
        obj.its = its.map((it: any) => {
          if (it && it.toObj) return it.toObj();
          console.error("It step is not as expected!", JSON.stringify(it));
          return {};
        });
      } else if (its) {
        console.warn("its is not an array:", its);
        // Check if it has a toObj method
        if (its.toObj) {
          obj.its = [its.toObj()];
        } else {
          obj.its = [its];
        }
      } else {
        obj.its = [];
      }
    }

    return obj;
  }

  abstract verifyCheck(
    store: I["istore"],
    checkCB: (s: I["iselection"]) => Promise<I["isubject"]>,
    testResourceConfiguration: ITestResourceConfiguration,
    artifactory?: any,
  ): Promise<I["iselection"]>;

  async test(
    store: I["istore"],
    testResourceConfiguration: any,
    filepath: string,
    artifactory?: any,
  ): Promise<I["then"] | undefined> {
    const addArtifact = this.addArtifact.bind(this);

    try {
      const x = await this.verifyCheck(
        store,
        async (s: I["iselection"]) => {
          try {
            if (typeof this.checkCB === "function") {
              const result = await this.checkCB(s);
              return result;
            } else {
              return this.checkCB;
            }
          } catch (e) {
            this.error = true;
            throw e;
          }
        },
        testResourceConfiguration,
        artifactory,
      );
      this.status = true;
      return x;
    } catch (e) {
      this.status = false;
      this.error = true;
      throw e;
    }
  }
}

export type IChecks<I extends TestTypeParams_any> = Record<
  string,
  BaseCheck<I>
>;
