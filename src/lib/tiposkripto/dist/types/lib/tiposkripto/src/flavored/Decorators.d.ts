export declare function suite(name: string): <T extends {
    new (...args: any[]): {};
}>(constructor: T) => {
    new (...args: any[]): {};
    suiteName: string;
    isTestSuite: boolean;
    tests: Array<{
        given: string;
        when?: string;
        then?: string;
        method: string;
        args?: any[];
    }>;
} & T;
export declare function given(description: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function when(description: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function then(description: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function runSuite(testClass: any): Promise<{
    suiteName: any;
    tests: never[];
    passed: boolean;
}>;
