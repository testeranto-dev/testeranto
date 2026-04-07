import { ITestJob, ITestResourceConfiguration } from "./types";
export declare class TestRunner {
    static runAllTests(testJobs: ITestJob[], totalTests: number, testResourceConfiguration: ITestResourceConfiguration, writeFileSync: (filename: string, payload: string) => void): Promise<void>;
    static writeEmptyResults(testResourceConfiguration: ITestResourceConfiguration, writeFileSync: (filename: string, payload: string) => void): void;
    static runAllTestsAndReturnResults(testJobs: ITestJob[], totalTests: number, testResourceConfig: ITestResourceConfiguration): Promise<any>;
}
