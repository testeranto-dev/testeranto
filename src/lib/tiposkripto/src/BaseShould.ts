import { BaseAction } from "./BaseAction.js";
import type { TestTypeParams_any } from "./CoreTypes.js";

/**
 * BaseShould extends BaseAction for TDT pattern.
 * Processes each row in table-driven testing.
 */
export class BaseShould<I extends TestTypeParams_any> extends BaseAction<I> {
  /**
   * Processes each row in table-driven testing (TDT pattern).
   * 
   * @param store The test store
   * @param actionCB Action callback function
   * @param testResource Test resource configuration
   * @param artifactory Context-aware artifactory for file operations
   * @returns Promise resolving to the result of the action
   */
  async performAction(
    store: I["istore"],
    actionCB: (x: I["iselection"]) => I["then"],
    testResource: any,
    artifactory?: any,
  ): Promise<any> {
    // Default implementation: call actionCB and return the result
    return actionCB(store as any);
  }
  
  // Current row data
  currentRow: any[] = [];
  rowIndex: number = -1;
  
  constructor(name: string, shouldCB: (xyz: I["iselection"]) => I["then"]) {
    super(name, shouldCB);
  }

  // Set current row data
  setRowData(rowIndex: number, rowData: any[]) {
    this.rowIndex = rowIndex;
    this.currentRow = rowData;
  }

  // Process the current row
  async processRow(
    store: I["istore"],
    testResourceConfiguration: any,
    artifactory?: any,
  ) {
    try {
      const result = await this.performAction(
        store,
        this.actionCB,
        testResourceConfiguration,
        artifactory,
      );
      this.status = true;
      return result;
    } catch (e: any) {
      this.status = false;
      this.error = e;
      throw e;
    }
  }
}

export type IShoulds<I extends TestTypeParams_any> = Record<string, BaseShould<I>>;
