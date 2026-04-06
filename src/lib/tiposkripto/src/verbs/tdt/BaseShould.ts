import { TestTypeParams_any } from "../../CoreTypes.js";

/**
 * BaseShould for TDT pattern - independent implementation
 * Processes each row in table-driven testing.
 */
export class BaseShould<I extends TestTypeParams_any> {
  name: string;
  shouldCB: (xyz: I["iselection"]) => I["action"];
  currentRow: any[] = [];
  rowIndex: number = -1;
  error: Error | null = null;
  status: boolean | undefined;

  constructor(name: string, shouldCB: (xyz: I["iselection"]) => I["action"]) {
    this.name = name;
    this.shouldCB = shouldCB;
  }

  // Set current row data
  setRowData(rowIndex: number, rowData: any[]) {
    this.rowIndex = rowIndex;
    this.currentRow = rowData;
  }

  // Process the current row
  async processRow(
    actualResult: any,
    testResourceConfiguration: any,
    artifactory?: any,
  ) {
    try {
      let success = false;
      if (typeof this.shouldCB === 'function') {
        // The shouldCB expects a store, but we pass actualResult as store
        const result = await this.shouldCB(actualResult);
        success = !!result;
      } else {
        // shouldCB is the expected value
        success = actualResult === this.shouldCB;
      }
      this.status = success;
      return success;
    } catch (e: any) {
      this.status = false;
      this.error = e;
      throw e;
    }
  }

  toObj() {
    return {
      name: this.name,
      status: this.status,
      error: this.error ? `${this.error.name}: ${this.error.message}` : null,
      rowIndex: this.rowIndex,
      currentRow: this.currentRow,
      pattern: 'tdt'
    };
  }
}

export type IShoulds<I extends TestTypeParams_any> = Record<string, BaseShould<I>>;

// Export the BaseShould class as named export
// export { BaseShould };
