import { TestTypeParams_any } from "./CoreTypes.js";
import { ITestResourceConfiguration } from "./types.js";
/**
 * BaseCheck is the unified base class for all verification phases.
 * It covers BDD's Then, AAA's Assert, and TDT's Validate.
 * @deprecated Use BaseThen, BaseAssert, or BaseValidate for specific patterns
 */
export declare abstract class BaseCheck<I extends TestTypeParams_any> {
    name: string;
    checkCB: (storeState: I["iselection"]) => Promise<I["then"]>;
    error: boolean;
    artifacts: string[];
    status: boolean | undefined;
    constructor(name: string, checkCB: (val: I["iselection"]) => Promise<I["then"]>);
    addArtifact(path: string): void;
    toObj(): {
        name: string;
        error: boolean;
        artifacts: string[];
        status: boolean | undefined;
    };
    abstract verifyCheck(store: I["istore"], checkCB: (s: I["iselection"]) => Promise<I["isubject"]>, testResourceConfiguration: ITestResourceConfiguration): Promise<I["iselection"]>;
    test(store: I["istore"], testResourceConfiguration: any, filepath: string): Promise<I["then"] | undefined>;
}
export type IChecks<I extends TestTypeParams_any> = Record<string, BaseCheck<I>>;
