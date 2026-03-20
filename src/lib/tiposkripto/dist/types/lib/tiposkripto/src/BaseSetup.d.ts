import { TestTypeParams_any } from "./CoreTypes.js";
import { ITestArtifactory, ITestResourceConfiguration } from "./types.js";
/**
 * BaseSetup is the unified base class for all setup phases.
 * It covers BDD's Given, AAA's Arrange, and TDT's Map.
 * @deprecated Use BaseGiven, BaseArrange, or BaseMap for specific patterns
 */
export declare abstract class BaseSetup<I extends TestTypeParams_any> {
    features: string[];
    actions: any[];
    checks: any[];
    error: Error;
    fail: any;
    store: I["istore"];
    recommendedFsPath: string;
    setupCB: I["given"];
    initialValues: any;
    key: string;
    failed: boolean;
    artifacts: string[];
    fails: number;
    status: boolean | undefined;
    addArtifact(path: string): void;
    constructor(features: string[], actions: any[], checks: any[], setupCB: I["given"], initialValues: any);
    toObj(): {
        key: string;
        actions: any[];
        checks: any[];
        error: (string | Error | undefined)[] | null;
        failed: boolean;
        features: string[];
        artifacts: string[];
        status: boolean | undefined;
    };
    abstract setupThat(subject: I["isubject"], testResourceConfiguration: ITestResourceConfiguration, artifactory: ITestArtifactory, setupCB: I["given"], initialValues: any): Promise<I["istore"]>;
    afterEach(store: I["istore"], key: string, artifactory: ITestArtifactory): Promise<I["istore"]>;
    setup(subject: I["isubject"], key: string, testResourceConfiguration: ITestResourceConfiguration, tester: (t: Awaited<I["then"]> | undefined) => boolean, artifactory?: ITestArtifactory, suiteNdx?: number): Promise<I["istore"]>;
}
export type ISetups<I extends TestTypeParams_any> = Record<string, BaseSetup<I>>;
