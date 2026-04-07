import { TestTypeParams_any } from "../../CoreTypes.js";
/**
 * BaseShould for TDT pattern - independent implementation
 * Processes each row in table-driven testing.
 */
export declare class BaseShould<I extends TestTypeParams_any> {
    name: string;
    shouldCB: (xyz: I["iselection"]) => I["action"];
    currentRow: any[];
    rowIndex: number;
    error: Error | null;
    status: boolean | undefined;
    constructor(name: string, shouldCB: (xyz: I["iselection"]) => I["action"]);
    setRowData(rowIndex: number, rowData: any[]): void;
    processRow(actualResult: any, testResourceConfiguration: any, artifactory?: any): Promise<boolean>;
    toObj(): {
        name: string;
        status: boolean | undefined;
        error: string | null;
        rowIndex: number;
        currentRow: any[];
        pattern: string;
    };
}
export type IShoulds<I extends TestTypeParams_any> = Record<string, BaseShould<I>>;
