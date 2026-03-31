import type { TestTypeParams_any } from "../../CoreTypes.js";
/**
 * BaseIt for AAA (Describe-It) pattern.
 * It combines both Action and Check phases (Act + Assert).
 */
export declare class BaseIt<I extends TestTypeParams_any> {
    name: string;
    itCB: (xyz: I["iselection"]) => I["check"];
    error: Error | null;
    artifacts: string[];
    status: boolean | undefined;
    constructor(name: string, itCB: (xyz: I["iselection"]) => I["check"]);
    addArtifact(path: string): void;
    test(store: I["istore"], testResourceConfiguration: any, artifactory?: any): Promise<I["check"]>;
    toObj(): {
        name: string;
        status: boolean | undefined;
        error: string | null;
        artifacts: string[];
    };
}
export type IIts<I extends TestTypeParams_any> = Record<string, BaseIt<I>>;
