import { Ibdd_in_any, Ibdd_out_any, ITestSpecification, ITestImplementation, ITestAdapter } from "./CoreTypes";
import { ITestJob, ITTestResourceRequest, ITestResourceConfiguration } from "./types";
export default abstract class BaseTiposkripto<I extends Ibdd_in_any = Ibdd_in_any, O extends Ibdd_out_any = Ibdd_out_any, M = unknown> {
    totalTests: number;
    artifacts: Promise<unknown>[];
    givenOverrides: Record<string, any>;
    specs: any;
    suitesOverrides: Record<string, any>;
    testJobs: ITestJob[];
    testResourceRequirement: ITTestResourceRequest;
    testSpecification: ITestSpecification<I, O>;
    thenOverrides: Record<string, any>;
    whenOverrides: Record<string, any>;
    testResourceConfiguration: ITestResourceConfiguration;
    describeOverrides: Record<string, any>;
    itOverrides: Record<string, any>;
    confirmOverrides: Record<string, any>;
    valuesOverrides: Record<string, any>;
    shouldsOverrides: Record<string, any>;
    expectedsOverrides: Record<string, any>;
    abstract writeFileSync(filename: string, payload: string): void;
    createArtifactory(context?: {
        givenKey?: string;
        whenIndex?: number;
        thenIndex?: number;
        suiteIndex?: number;
        stepIndex?: number;
        stepType?: string;
    }): {
        writeFileSync: (filename: string, payload: string) => void;
    };
    constructor(webOrNode: "web" | "node", input: I["iinput"], testSpecification: ITestSpecification<I, O>, testImplementation: ITestImplementation<I, O, M> & {
        givens?: Record<string, any>;
        whens?: Record<string, any>;
        thens?: Record<string, any>;
        describes?: Record<string, any>;
        its?: Record<string, any>;
        confirms?: Record<string, any>;
        values?: Record<string, any>;
        shoulds?: Record<string, any>;
    }, testResourceRequirement: ITTestResourceRequest | undefined, testAdapter: Partial<ITestAdapter<I>> | undefined, testResourceConfiguration: ITestResourceConfiguration);
    receiveTestResourceConfig(testResourceConfig: ITestResourceConfiguration): Promise<any>;
    Specs(): any;
    Suites(): {};
    Given(): Record<string, any>;
    When(): Record<string, any>;
    Then(): Record<string, any>;
    Describe(): Record<string, any>;
    It(): Record<string, any>;
    Confirm(): Record<string, any>;
    Value(): Record<string, any>;
    Should(): Record<string, any>;
    Expect(): Record<string, any>;
    Expected(): Record<string, any>;
    getTestJobs(): ITestJob[];
    private createTestJobForStep;
    private createErrorTestJob;
    private calculateTotalTestsDirectly;
}
