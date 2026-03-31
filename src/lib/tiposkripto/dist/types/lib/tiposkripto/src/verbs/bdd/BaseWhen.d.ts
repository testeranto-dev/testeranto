import { TestTypeParams_any } from "../../CoreTypes.js";
/**
 * BaseWhen for BDD pattern - independent implementation
 */
export declare abstract class BaseWhen<I extends TestTypeParams_any> {
    name: string;
    whenCB: (x: I["iselection"]) => I["then"];
    error: Error | null;
    status: boolean | undefined;
    constructor(name: string, whenCB: (xyz: I["iselection"]) => I["then"]);
    /**
     * Abstract method to be implemented by concrete When classes.
     * Performs the action for the BDD When phase.
     *
     * @param store The test store
     * @param whenCB When callback function
     * @param testResource Test resource configuration
     * @param artifactory Context-aware artifactory for file operations
     * @returns Promise resolving to the result of the action
     */
    abstract andWhen(store: I["istore"], whenCB: (x: I["iselection"]) => I["then"], testResource: any, artifactory?: any): Promise<any>;
    test(store: I["istore"], testResourceConfiguration: any, artifactory?: any): Promise<any>;
    toObj(): {
        name: string;
        status: boolean | undefined;
        error: string | null;
    };
}
/**
 * Represents a collection of When actions keyed by their names.
 * Whens are typically part of Given definitions rather than standalone collections,
 * but this type exists for consistency and potential future use cases where:
 * - When actions might need to be reused across multiple Given conditions
 * - Dynamic composition of test steps is required
 * - Advanced test patterns need to reference When actions by name
 */
export type IWhens<I extends TestTypeParams_any> = Record<string, BaseWhen<I>>;
