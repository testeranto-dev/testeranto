import { TestTypeParams_any } from "./CoreTypes.js";
import { ITestResourceConfiguration } from "./types.js";

/**
 * BaseCheck is the unified base class for all verification phases.
 * It covers BDD's Then, AAA's Assert, and TDT's Validate.
 * @deprecated Use BaseThen, BaseAssert, or BaseValidate for specific patterns
 */
export abstract class BaseCheck<I extends TestTypeParams_any> {
  public name: string;
  checkCB: (
    storeState: I["iselection"]
  ) => Promise<I["then"]>;
  error: boolean;
  artifacts: string[] = [];
  status: boolean | undefined;

  constructor(
    name: string,
    checkCB: (val: I["iselection"]) => Promise<I["then"]>
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
          path
        )}`
      );
    }
    const normalizedPath = path.replace(/\\/g, "/");
    this.artifacts.push(normalizedPath);
  }

  toObj() {
    const obj = {
      name: this.name,
      error: this.error,
      artifacts: this.artifacts,
      status: this.status,
    };
    return obj;
  }

  abstract verifyCheck(
    store: I["istore"],
    checkCB: (s: I["iselection"]) => Promise<I["isubject"]>,
    testResourceConfiguration: ITestResourceConfiguration
  ): Promise<I["iselection"]>;

  async test(
    store: I["istore"],
    testResourceConfiguration,
    filepath: string
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
        testResourceConfiguration
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

export type IChecks<I extends TestTypeParams_any> = Record<string, BaseCheck<I>>;
