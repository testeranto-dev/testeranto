import type { TestTypeParams_any } from "../../CoreTypes.js";
import { BaseIt } from "./BaseIt.js";
import { CommonUtils } from "../internal/CommonUtils.js";
import { ITestResourceConfiguration, ITestArtifactory } from "../../types.js";

/**
 * BaseDescribe for AAA (Describe-It) pattern.
 * Handles the Arrange/Setup phase.
 */
export class BaseDescribe<I extends TestTypeParams_any> {
  features: string[];
  its: BaseIt<I>[];
  describeCB: I["given"];
  initialValues: any;
  error: Error | null = null;
  store: I["istore"] = null as any;
  key: string = "";
  failed: boolean = false;
  artifacts: string[] = [];
  fails: number = 0;
  status: boolean | undefined;

  constructor(
    features: string[],
    its: BaseIt<I>[],
    describeCB: I["given"],
    initialValues: any,
  ) {
    this.features = features;
    this.its = its;
    this.describeCB = describeCB;
    this.initialValues = initialValues;
  }

  addArtifact(path: string) {
    CommonUtils.addArtifact(this.artifacts, path);
  }

  async describe(
    subject: I["isubject"],
    key: string,
    testResourceConfiguration: ITestResourceConfiguration,
    tester: (t: Awaited<I["then"]> | undefined) => boolean,
    artifactory?: ITestArtifactory,
    suiteNdx?: number,
  ) {
    this.key = key;
    this.fails = 0;

    try {
      // Setup phase (Arrange)
      // describeCB is I["given"] which is () => Calculator
      this.store = await this.describeCB();
      this.status = true;
    } catch (e: any) {
      this.status = false;
      this.failed = true;
      this.fails++;
      this.error = e;
      return this.store;
    }

    try {
      // Process each It (Act + Assert)
      for (const [itNdx, it] of this.its.entries()) {
        try {
          const result = await it.test(
            this.store,
            testResourceConfiguration,
            artifactory,
          );
          // Check the result
          if (result !== undefined) {
            tester(result);
          }
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
    }

    return this.store;
  }

  toObj() {
    return {
      key: this.key,
      its: this.its.map(it => it.toObj()),
      error: this.error ? [this.error.message, this.error.stack] : null,
      failed: this.failed,
      features: this.features || [],
      artifacts: this.artifacts,
      status: this.status,
      fails: this.fails,
    };
  }
}

export type IDescribes<I extends TestTypeParams_any> = Record<
  string,
  BaseDescribe<I>
>;
