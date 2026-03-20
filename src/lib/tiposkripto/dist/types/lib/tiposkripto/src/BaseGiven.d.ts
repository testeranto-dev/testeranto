import { TestTypeParams_any } from "./CoreTypes.js";
import { ITestArtifactory, ITestResourceConfiguration } from "./types.js";
import { BaseSetup } from "./BaseSetup.js";
/**
 * Represents a collection of Given conditions keyed by their names.
 * Givens are typically organized as named collections because:
 * - They set up different initial states for tests
 * - Tests often need to reference specific Given conditions by name
 * - This allows for better organization and reuse of setup logic
 * - The BDD pattern often involves multiple named Given scenarios
 * @deprecated Use BaseSetup for unified terminology
 */
export type IGivens<I extends TestTypeParams_any> = Record<string, BaseGiven<I>>;
/**
 * BaseGiven extends BaseSetup for BDD pattern.
 * @deprecated Use BaseSetup for unified terminology
 */
export declare abstract class BaseGiven<I extends TestTypeParams_any> extends BaseSetup<I> {
    features: string[];
    whens: any[];
    thens: any[];
    error: Error;
    fail: any;
    store: I["istore"];
    recommendedFsPath: string;
    givenCB: I["given"];
    initialValues: any;
    key: string;
    failed: boolean;
    artifacts: string[];
    fails: number;
    status: boolean | undefined;
    addArtifact(path: string): void;
    constructor(features: string[], whens: any[], thens: any[], givenCB: I["given"], initialValues: any);
    beforeAll(store: I["istore"]): I["istore"];
    toObj(): {
        key: string;
        whens: any[];
        thens: any[];
        error: (string | Error | undefined)[] | null;
        failed: boolean;
        features: string[];
        artifacts: string[];
        status: boolean | undefined;
    };
    abstract givenThat(subject: I["isubject"], testResourceConfiguration: any, artifactory: ITestArtifactory, givenCB: I["given"], initialValues: any): Promise<I["istore"]>;
    setupThat(subject: I["isubject"], testResourceConfiguration: ITestResourceConfiguration, artifactory: ITestArtifactory, setupCB: I["given"], initialValues: any): Promise<I["istore"]>;
    afterEach(store: I["istore"], key: string, artifactory: ITestArtifactory): Promise<I["istore"]>;
    give(subject: I["isubject"], key: string, testResourceConfiguration: ITestResourceConfiguration, tester: (t: Awaited<I["then"]> | undefined) => boolean, artifactory?: ITestArtifactory, suiteNdx?: number): Promise<I["istore"]>;
}
