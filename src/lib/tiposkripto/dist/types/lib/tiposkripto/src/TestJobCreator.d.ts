import { Ibdd_in_any } from "./CoreTypes";
export declare class TestJobCreator<I extends Ibdd_in_any> {
    private createArtifactory;
    private totalTests;
    constructor(createArtifactory: (context: any) => any, totalTests: number);
    createTestJobForStep(step: any, index: number, input: I["iinput"]): any;
    createErrorTestJob(errorStep: any, index: number, error: Error): any;
    calculateTotalTestsDirectly(specs: any[]): number;
}
