export interface TestResultFile {
    file: string;
    filePath: string;
    relativePath: string;
    result: any | null;
    content: string | null;
    configKey: string;
    testName: string;
}
export interface IndividualTestResult {
    stepName: string;
    failed: boolean;
    features: string[];
    inputFiles?: string[];
    [key: string]: any;
}
export interface TestResult {
    configKey?: string;
    runtime?: string;
    testName: string;
    individualResults?: IndividualTestResult[];
    failed?: boolean;
    metadata?: Record<string, any>;
    inputFiles?: string[];
    [key: string]: any;
}
export interface RuntimeTestResults {
    [testName: string]: TestResult;
}
export interface AllTestResults {
    [configKey: string]: RuntimeTestResults;
}
export declare function isTestResult(obj: any): obj is TestResult;
export declare function isRuntimeTestResults(obj: any): obj is RuntimeTestResults;
export declare function isAllTestResults(obj: any): obj is AllTestResults;
