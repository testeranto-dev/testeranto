import { TestTypeParams_any } from "./CoreTypes.js";

/**
 * BaseAction is the unified base class for all action phases.
 * It covers BDD's When, AAA's Act, and TDT's Feed.
 * @deprecated Use BaseWhen, BaseAct, or BaseFeed for specific patterns
 */
export abstract class BaseAction<I extends TestTypeParams_any> {
  public name: string;
  actionCB: (x: I["iselection"]) => I["then"];
  error: Error;
  artifacts: string[] = [];
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

  constructor(name: string, actionCB: (xyz: I["iselection"]) => I["then"]) {
    this.name = name;
    this.actionCB = actionCB;
  }

  abstract performAction(
    store: I["istore"],
    actionCB: (x: I["iselection"]) => I["then"],
    testResource
  ): Promise<any>;

  toObj() {
    const obj = {
      name: this.name,
      status: this.status,
      error: this.error
        ? `${this.error.name}: ${this.error.message}\n${this.error.stack}`
        : null,
      artifacts: this.artifacts,
    };
    return obj;
  }

  async test(store: I["istore"], testResourceConfiguration) {
    try {
      const result = await this.performAction(
        store,
        this.actionCB,
        testResourceConfiguration
      );
      this.status = true;
      return result;
    } catch (e: any) {
      this.status = false;
      this.error = e;
      throw e;
    }
  }
}

export type IActions<I extends TestTypeParams_any> = Record<string, BaseAction<I>>;
