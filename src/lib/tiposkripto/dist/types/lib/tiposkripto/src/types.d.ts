import type { BaseGiven } from "./BaseGiven";
import type { BaseSuite } from "./BaseSuite";
import type { BaseThen } from "./BaseThen";
import type { BaseWhen } from "./BaseWhen";
import type { Ibdd_in_any, Ibdd_out_any, TestTypeParams_any } from "./CoreTypes";
export type ISuiteKlasser<I extends Ibdd_in_any, O extends Ibdd_out_any> = (name: string, index: number, givens: IGivens<I>) => BaseSuite<I, O>;
export type IGivenKlasser<I extends Ibdd_in_any> = (name: string, features: string[], whens: BaseWhen<I>[], thens: BaseThen<I>[], givenCB: I["given"]) => BaseGiven<I>;
export type IWhenKlasser<I extends Ibdd_in_any> = (s: I["istore"], o: any) => BaseWhen<I>;
export type IThenKlasser<I extends Ibdd_in_any> = (s: I["iselection"], o: any) => BaseThen<I>;
export type ITestResourceConfiguration = {
    name: string;
    fs: string;
    ports: number[];
    files: string[];
    timeout?: number;
    retries?: number;
    environment?: Record<string, any>;
};
export type ITTestResourceRequirement = {
    name: string;
    ports: number;
    fs: string;
};
export type ISetups<I extends TestTypeParams_any> = Record<string, import("./BaseSetup").BaseSetup<I>>;
export type IActions<I extends TestTypeParams_any> = Record<string, import("./BaseAction").BaseAction<I>>;
export type IChecks<I extends TestTypeParams_any> = Record<string, import("./BaseCheck").BaseCheck<I>>;
export type IValues<I extends TestTypeParams_any> = Record<string, import("./BaseValue").BaseValue<I>>;
export type IShoulds<I extends TestTypeParams_any> = Record<string, import("./BaseShould").BaseShould<I>>;
export type IExpecteds<I extends TestTypeParams_any> = Record<string, import("./BaseExpected").BaseExpected<I>>;
export type IDescribes<I extends TestTypeParams_any> = Record<string, import("./BaseDescribe").BaseDescribe<I>>;
export type IIts<I extends TestTypeParams_any> = Record<string, import("./BaseIt").BaseIt<I>>;
export type IGivens<I extends TestTypeParams_any> = Record<string, import("./BaseGiven").BaseGiven<I>>;
export type IWhens<I extends TestTypeParams_any> = Record<string, import("./BaseWhen").BaseWhen<I>>;
export type IThens<I extends TestTypeParams_any> = Record<string, import("./BaseThen").BaseThen<I>>;
export type ITTestResourceRequest = {
    ports: number;
};
type ITest = {
    toObj(): object;
    name: string;
    givens: IGivens<Ibdd_in_any>;
    testResourceConfiguration: ITestResourceConfiguration;
};
export type ITestJob = {
    toObj(): object;
    test: ITest;
    runner: (x: ITestResourceConfiguration) => Promise<BaseSuite<Ibdd_in_any, Ibdd_out_any>>;
    testResourceRequirement: ITTestResourceRequirement;
    receiveTestResourceConfig: (x: ITestResourceConfiguration) => IFinalResults;
};
export type ITestResults = Promise<{
    test: ITest;
}>[];
export declare const defaultTestResourceRequirement: ITTestResourceRequest;
export type ITestArtifactory = (key: string, value: unknown) => unknown;
export type IRunnables = {
    golangEntryPoints: Record<string, string>;
    nodeEntryPoints: Record<string, string>;
    pythonEntryPoints: Record<string, string>;
    webEntryPoints: Record<string, string>;
};
export type IFinalResults = {
    features: string[];
    failed: boolean;
    fails: number;
    artifacts: Promise<unknown>[];
    tests: number;
    runTimeTests: number;
    testJob: object;
};
export {};
