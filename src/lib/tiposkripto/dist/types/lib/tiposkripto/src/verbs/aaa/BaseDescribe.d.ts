import type { TestTypeParams_any } from "../../CoreTypes.js";
import { BaseIt } from "./BaseIt.js";
import { ITestResourceConfiguration, ITestArtifactory } from "../../types.js";
/**
 * BaseDescribe for AAA (Describe-It) pattern.
 * Handles the Arrange/Setup phase.
 */
export declare class BaseDescribe<I extends TestTypeParams_any> {
    features: string[];
    its: BaseIt<I>[];
    describeCB: I["given"];
    initialValues: any;
    error: Error | null;
    store: I["istore"];
    key: string;
    failed: boolean;
    artifacts: string[];
    fails: number;
    status: boolean | undefined;
    constructor(features: string[], its: BaseIt<I>[], describeCB: I["given"], initialValues: any);
    addArtifact(path: string): void;
    describe(subject: I["isubject"], key: string, testResourceConfiguration: ITestResourceConfiguration, tester: (t: Awaited<I["then"]> | undefined) => boolean, artifactory?: ITestArtifactory, suiteNdx?: number): Promise<I["istore"]>;
    toObj(): {
        key: string;
        its: {
            name: string;
            status: boolean | undefined;
            error: string | null;
            artifacts: string[];
        }[];
        error: (string | undefined)[] | null;
        failed: boolean;
        features: string[];
        artifacts: string[];
        status: boolean | undefined;
        fails: number;
    };
}
export type IDescribes<I extends TestTypeParams_any> = Record<string, BaseDescribe<I>>;
