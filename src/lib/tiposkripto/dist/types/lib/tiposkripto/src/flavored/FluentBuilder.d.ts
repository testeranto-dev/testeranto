export declare class FluentTestBuilder<T = any> {
    private givenDesc;
    private setup;
    private whenSteps;
    private thenSteps;
    constructor(givenDesc: string, setup: () => T | Promise<T>);
    when<A extends any[]>(description: string, action: (store: T, ...args: A) => T | Promise<T>, ...args: A): this;
    then<A extends any[]>(description: string, assertion: (store: T, ...args: A) => void | Promise<void>, ...args: A): this;
    run(): Promise<{
        success: boolean;
        store?: T;
        error?: any;
    }>;
    toBaseline(): {
        specification: (Suite: any, Given: any, When: any, Then: any) => any[];
        implementation: {
            suites: {
                Default: string;
            };
            givens: {
                Default: () => () => T | Promise<T>;
            };
            whens: Record<string, Function>;
            thens: Record<string, Function>;
        };
    };
}
export declare function given<T>(description: string, setup: () => T | Promise<T>): FluentTestBuilder<T>;
export declare const flavored: {
    given: typeof given;
};
