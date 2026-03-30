import { BaseGiven } from "./BaseGiven";
import { BaseThen } from "./BaseThen";
import { BaseWhen } from "./BaseWhen";
import type { Ibdd_in_any, Ibdd_out_any, ITestSpecification, ITestImplementation, ITestAdapter } from "./CoreTypes.js";
import type { ITestJob, ITTestResourceRequest, ITestResourceConfiguration } from "./types.js";
type IExtenstions = Record<string, unknown>;
export default abstract class BaseTiposkripto<I extends Ibdd_in_any = Ibdd_in_any, O extends Ibdd_out_any = Ibdd_out_any, M = unknown> {
    totalTests: number;
    artifacts: Promise<unknown>[];
    assertThis: (t: I["then"]) => any;
    givenOverrides: Record<string, any>;
    specs: any;
    suitesOverrides: Record<string, any>;
    testJobs: ITestJob[];
    testResourceRequirement: ITTestResourceRequest;
    testSpecification: ITestSpecification<I, O>;
    thenOverrides: Record<string, any>;
    whenOverrides: Record<string, any>;
    testResourceConfiguration: ITestResourceConfiguration;
    abstract writeFileSync(filename: string, payload: string): void;
    createArtifactory(context?: {
        givenKey?: string;
        whenIndex?: number;
        thenIndex?: number;
        suiteIndex?: number;
    }): {
        writeFileSync: (filename: string, payload: string) => void;
    };
    constructor(webOrNode: "web" | "node", input: I["iinput"], testSpecification: ITestSpecification<I, O>, testImplementation: ITestImplementation<I, O, M> & {
        suites: Record<string, object>;
        givens?: Record<string, any>;
        whens?: Record<string, any>;
        thens?: Record<string, any>;
        values?: Record<string, any>;
        shoulds?: Record<string, any>;
        expecteds?: Record<string, any>;
        describes?: Record<string, any>;
        its?: Record<string, any>;
    }, testResourceRequirement: ITTestResourceRequest | undefined, testAdapter: Partial<ITestAdapter<I>> | undefined, testResourceConfiguration: ITestResourceConfiguration, wsPort?: string, wsHost?: string);
    receiveTestResourceConfig(testResourceConfig: ITestResourceConfiguration): Promise<any>;
    Specs(): any;
    Suites(): Record<string, any>;
    Given(): Record<keyof IExtenstions, (name: string, features: string[], whens: BaseWhen<I>[], thens: BaseThen<I>[], gcb: I["given"]) => BaseGiven<I>>;
    When(): Record<keyof IExtenstions, (arg0: I["istore"], ...arg1: any) => BaseWhen<I>>;
    Then(): Record<keyof IExtenstions, (selection: I["iselection"], expectation: any) => BaseThen<I>>;
    Describe(): Record<string, any>;
    It(): Record<string, any>;
    Confirm(): Record<string, any>;
    Value(): Record<string, any>;
    Should(): Record<string, any>;
    Expect(): Record<string, any>;
    Expected(): Record<string, any>;
    getTestJobs(): ITestJob[];
    private calculateTotalTests;
}
export {};
