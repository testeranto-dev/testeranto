import type { TestTypeParams_any } from "../../CoreTypes.js";
import { CommonUtils } from "../internal/CommonUtils.js";

/**
 * BaseIt for AAA (Describe-It) pattern.
 * It combines both Action and Check phases (Act + Assert).
 */
export class BaseIt<I extends TestTypeParams_any> {
  public name: string;
  itCB: (xyz: I["iselection"]) => I["check"];
  error: Error | null = null;
  artifacts: string[] = [];
  status: boolean | undefined;

  constructor(name: string, itCB: (xyz: I["iselection"]) => I["check"]) {
    this.name = name;
    this.itCB = itCB;
  }

  addArtifact(path: string) {
    CommonUtils.addArtifact(this.artifacts, path);
  }

  async test(store: I["istore"], testResourceConfiguration: any, artifactory?: any) {
    try {
      // Execute the It callback which performs both action and assertion
      const result = await this.itCB(store);
      this.status = true;
      return result;
    } catch (e: any) {
      this.status = false;
      this.error = e;
      throw e;
    }
  }

  toObj() {
    return {
      name: this.name,
      status: this.status,
      error: this.error ? `${this.error.name}: ${this.error.message}\n${this.error.stack}` : null,
      artifacts: this.artifacts,
    };
  }
}

export type IIts<I extends TestTypeParams_any> = Record<string, BaseIt<I>>;
