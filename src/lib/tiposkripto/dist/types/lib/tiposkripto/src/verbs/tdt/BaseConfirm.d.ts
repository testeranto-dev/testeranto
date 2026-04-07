import type { TestTypeParams_any } from "../../CoreTypes.js";
import type { ITestArtifactory, ITestResourceConfiguration } from "../../types.js";
/**
 * BaseConfirm for TDT (Table-Driven Testing) pattern.
 * Standalone class similar to BaseGiven but for table-driven testing.
 */
export declare class BaseConfirm<I extends TestTypeParams_any> {
    features: string[];
    testCases: any[][];
    confirmCB: I["given"];
    initialValues: any;
    key: string;
    failed: boolean;
    artifacts: string[];
    fails: number;
    status: boolean | undefined;
    error: Error | null;
    store: I["istore"];
    constructor(features: string[], testCases: any[][], confirmCB: I["given"], initialValues: any);
    addArtifact(path: string): void;
    setParent(parent: any): void;
    toObj(): any;
    confirm(subject: I["isubject"], key: string, testResourceConfiguration: ITestResourceConfiguration, tester: (t: Awaited<I["then"]> | undefined) => boolean, artifactory?: any, suiteNdx?: number): Promise<I["istore"]>;
    afterEach(store: I["istore"], key: string, artifactory?: any): Promise<I["istore"]>;
    run(subject: I["isubject"], testResourceConfiguration: ITestResourceConfiguration, artifactory?: ITestArtifactory): Promise<I["istore"]>;
}
export type IConfirms<I extends TestTypeParams_any> = Record<string, BaseConfirm<I>>;
