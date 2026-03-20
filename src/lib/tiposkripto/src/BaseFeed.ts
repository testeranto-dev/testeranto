import { BaseAction } from "./BaseAction.js";
import { TestTypeParams_any } from "./CoreTypes.js";

/**
 * BaseFeed extends BaseAction to support TDT (Table Driven Testing) pattern.
 * It processes each row from the table.
 */
export class BaseFeed<I extends TestTypeParams_any> extends BaseAction<I> {
  // Row index being processed
  rowIndex: number = -1;
  rowData: any = null;

  constructor(name: string, feedCB: (xyz: I["iselection"]) => I["then"]) {
    super(name, feedCB);
  }

  // Set the current row data before processing
  setRowData(index: number, data: any) {
    this.rowIndex = index;
    this.rowData = data;
  }

  // Alias performAction to feed for TDT pattern
  async feed(
    store: I["istore"],
    feedCB: (x: I["iselection"]) => I["then"],
    testResource
  ) {
    // Pass row data to the callback if needed
    // We can modify the store to include row data
    return super.performAction(store, feedCB, testResource);
  }

  // Alias test to processRow for TDT pattern
  async processRow(
    store: I["istore"],
    testResourceConfiguration,
    rowIndex: number,
    rowData: any
  ) {
    this.setRowData(rowIndex, rowData);
    return super.test(store, testResourceConfiguration);
  }
}

export type IFeeds<I extends TestTypeParams_any> = Record<string, BaseFeed<I>>;
