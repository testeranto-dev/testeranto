import { BaseAction } from "./BaseAction.js";
import type { TestTypeParams_any } from "./CoreTypes.js";
/**
 * BaseFeed extends BaseAction to support TDT (Table Driven Testing) pattern.
 * It processes each row from the table.
 */
export declare class BaseFeed<I extends TestTypeParams_any> extends BaseAction<I> {
    performAction(store: I["istore"], actionCB: (x: I["iselection"]) => I["then"], testResource: any, artifactory?: any): Promise<any>;
    rowIndex: number;
    rowData: any;
    constructor(name: string, feedCB: (xyz: I["iselection"]) => I["then"]);
    setRowData(index: number, data: any): void;
    feed(store: I["istore"], feedCB: (x: I["iselection"]) => I["then"], testResource: any): Promise<any>;
    processRow(store: I["istore"], testResourceConfiguration: any, rowIndex: number, rowData: any): Promise<any>;
}
export type IFeeds<I extends TestTypeParams_any> = Record<string, BaseFeed<I>>;
