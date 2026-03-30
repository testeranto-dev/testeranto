import type { Ibdd_in_any, Ibdd_out_any, IUniversalTestAdapter, ITestAdapter, TestTypeParams_any } from "./CoreTypes";
export declare const BaseAdapter: <T extends TestTypeParams_any>() => IUniversalTestAdapter<T>;
export declare const DefaultAdapter: <T extends TestTypeParams_any>(p: Partial<ITestAdapter<T>>) => IUniversalTestAdapter<T>;
export { BaseGiven } from "./BaseGiven.js";
export { BaseWhen } from "./BaseWhen.js";
export { BaseThen } from "./BaseThen.js";
export { BaseValue } from "./BaseValue.js";
export { BaseShould } from "./BaseShould.js";
export { BaseExpected } from "./BaseExpected.js";
export { BaseDescribe } from "./BaseDescribe.js";
export { BaseIt } from "./BaseIt.js";
export { BaseSetup } from "./BaseSetup.js";
export { BaseAction } from "./BaseAction.js";
export { BaseCheck } from "./BaseCheck.js";
export declare function createDescribeItSpecification<I extends Ibdd_in_any, O extends Ibdd_out_any>(): {
    Suite: {
        Default: (Suite: any, Describe: any, It: any) => (name: string, descriptions: Record<string, any>) => any;
    };
    Describe: {
        Default: (features: string[], its: any[], describeCB: I["given"], initialValues: any) => (Describe: any) => any;
    };
    It: {
        Default: (name: string, itCB: (x: I["iselection"]) => I["then"]) => (It: any) => any;
    };
};
export declare function createTDTSpecification<I extends Ibdd_in_any, O extends Ibdd_out_any>(): {
    Suite: {
        Default: (Suite: any, Value: any, Should: any, Expected: any) => (name: string, confirms: Record<string, any>) => any;
    };
    Value: {
        Default: (features: string[], tableRows: any[][], confirmCB: I["given"], initialValues: any) => (Value: any) => any;
    };
    Should: {
        Default: (name: string, shouldCB: (x: I["iselection"]) => I["then"]) => (Should: any) => any;
    };
    Expected: {
        Default: (name: string, expectedCB: (val: I["iselection"]) => Promise<I["then"]>) => (Expected: any) => any;
    };
};
export declare function DescribeIt<I extends Ibdd_in_any, O extends Ibdd_out_any>(): {
    Suite: {
        Default: (name: string, descriptions: Record<string, any>) => {
            name: string;
            descriptions: Record<string, any>;
        };
    };
    Describe: {
        Default: (features: string[], its: any[], describeCB: I["given"], initialValues: any) => {
            features: string[];
            its: any[];
            describeCB: I["given"];
            initialValues: any;
        };
    };
    It: {
        Default: (name: string, itCB: (x: I["iselection"]) => I["then"]) => {
            name: string;
            itCB: (x: I["iselection"]) => I["then"];
        };
    };
};
export declare function Confirm<I extends Ibdd_in_any, O extends Ibdd_out_any>(): {
    Suite: {
        Default: (name: string, confirms: Record<string, any>) => {
            name: string;
            confirms: Record<string, any>;
        };
    };
    Value: {
        Default: (features: string[], tableRows: any[][], confirmCB: I["given"], initialValues: any) => {
            features: string[];
            tableRows: any[][];
            confirmCB: I["given"];
            initialValues: any;
        };
    };
    Should: {
        Default: (name: string, shouldCB: (x: I["iselection"]) => I["then"]) => {
            name: string;
            shouldCB: (x: I["iselection"]) => I["then"];
        };
    };
    Expected: {
        Default: (name: string, expectedCB: (val: I["iselection"]) => Promise<I["then"]>) => {
            name: string;
            expectedCB: (val: I["iselection"]) => Promise<I["then"]>;
        };
    };
};
