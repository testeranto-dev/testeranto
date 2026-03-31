import { Ibdd_in_any, Ibdd_out_any } from "./CoreTypes.js";
export { BaseValue } from "./verbs/tdt/BaseValue.js";
export { BaseShould } from "./verbs/tdt/BaseShould";
export { BaseExpected } from "./verbs/tdt/BaseExpected.js";
export { BaseDescribe } from "./verbs/aaa/BaseDescribe.js";
export { BaseIt } from "./verbs/aaa/BaseIt.js";
export declare function createDescribeItSpecification<I extends Ibdd_in_any, O extends Ibdd_out_any>(): {
    Suite: {
        Default: (Suite: any, Describe: any, It: any) => (name: string, descriptions: Record<string, any>) => any;
    };
    Describe: {
        Default: (features: string[], its: any[], describeCB: I["setup"], initialValues: any) => (Describe: any) => any;
    };
    It: {
        Default: (name: string, itCB: (x: I["iselection"]) => I["check"]) => (It: any) => any;
    };
};
export declare function createTDTSpecification<I extends Ibdd_in_any, O extends Ibdd_out_any>(): {
    Suite: {
        Default: (Suite: any, Value: any, Should: any, Expected: any) => (name: string, confirms: Record<string, any>) => any;
    };
    Value: {
        Default: (features: string[], tableRows: any[][], confirmCB: I["setup"], initialValues: any) => (Value: any) => any;
    };
    Should: {
        Default: (name: string, shouldCB: (x: I["iselection"]) => I["check"]) => (Should: any) => any;
    };
    Expected: {
        Default: (name: string, expectedCB: (val: I["iselection"]) => Promise<I["check"]>) => (Expected: any) => any;
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
        Default: (features: string[], its: any[], describeCB: I["setup"], initialValues: any) => {
            features: string[];
            its: any[];
            describeCB: I["setup"];
            initialValues: any;
        };
    };
    It: {
        Default: (name: string, itCB: (x: I["iselection"]) => I["check"]) => {
            name: string;
            itCB: (x: I["iselection"]) => I["check"];
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
        Default: (features: string[], tableRows: any[][], confirmCB: I["setup"], initialValues: any) => {
            features: string[];
            tableRows: any[][];
            confirmCB: I["setup"];
            initialValues: any;
        };
    };
    Should: {
        Default: (name: string, shouldCB: (x: I["iselection"]) => I["check"]) => {
            name: string;
            shouldCB: (x: I["iselection"]) => I["check"];
        };
    };
    Expected: {
        Default: (name: string, expectedCB: (val: I["iselection"]) => Promise<I["check"]>) => {
            name: string;
            expectedCB: (val: I["iselection"]) => Promise<I["check"]>;
        };
    };
};
