import { TestTypeParams_any } from "./CoreTypes.js";
/**
 * BaseAction is the unified base class for all action phases.
 * It covers BDD's When, AAA's Act, and TDT's Feed.
 * @deprecated Use BaseWhen, BaseAct, or BaseFeed for specific patterns
 */
export declare abstract class BaseAction<I extends TestTypeParams_any> {
    name: string;
    actionCB: (x: I["iselection"]) => I["then"];
    error: Error;
    artifacts: string[];
    status: boolean | undefined;
    addArtifact(path: string): void;
    constructor(name: string, actionCB: (xyz: I["iselection"]) => I["then"]);
    abstract performAction(store: I["istore"], actionCB: (x: I["iselection"]) => I["then"], testResource: any): Promise<any>;
    toObj(): {
        name: string;
        status: boolean | undefined;
        error: string | null;
        artifacts: string[];
    };
    test(store: I["istore"], testResourceConfiguration: any): Promise<any>;
}
export type IActions<I extends TestTypeParams_any> = Record<string, BaseAction<I>>;
