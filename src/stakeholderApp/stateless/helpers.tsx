import React from "react";
import { renderFileContentFile } from "./renderFileContentFile";

export interface TestGiven {
  key?: string;
  failed?: boolean;
  features?: string[];
  whens?: Array<{
    name: string;
    status?: boolean;
    error?: any;
  }>;
  thens?: Array<{
    name: string;
    status?: boolean;
    error?: any;
  }>;
  error?: any;
}

export interface TestData {
  failed?: boolean;
  runTimeTests?: number;
  fails?: number;
  features?: string[];
  testJob?: {
    givens: TestGiven[];
  };
}

export interface FileContentData {
  type: "file" | "documentation";
  path: string;
  name: string;
  content?: string;
  language?: string;
  size?: number;
  message?: string;
  fileType?: string;
}

export { renderFileContentFile };
export { renderTestDetails } from "./renderTestDetails";
