import { BaseAction } from "./BaseAction.js";
import type { TestTypeParams_any } from "./CoreTypes.js";
/**
 * BaseShould extends BaseAction for TDT pattern.
 * Processes each row in table-driven testing.
 */
export declare class BaseShould<I extends TestTypeParams_any> extends BaseAction<I> {
    /**
     * Abstract method to be implemented by concrete Should classes.
     * Processes each row in table-driven testing (TDT pattern).
     *
     * @param store The test store
     * @param actionCB Action callback function
     * @param testResource Test resource configuration
     * @param artifactory Context-aware artifactory for file operations
     * @returns Promise resolving to the result of the action
     */
    abstract performAction(store: I["istore"], actionCB: (x: I["iselection"]) => I["then"], testResource: any, artifactory?: any): Promise<any>;
    currentRow: any[];
    rowIndex: number;
    constructor(name: string, shouldCB: (xyz: I["iselection"]) => I["then"]);
    setRowData(rowIndex: number, rowData: any[]): void;
    processRow(store: I["istore"], testResourceConfiguration: any, artifactory?: any): Promise<any>;
}
export type IShoulds<I extends TestTypeParams_any> = Record<string, BaseShould<I>>;
