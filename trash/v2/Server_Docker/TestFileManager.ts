import fs from "fs";
import path from "path";
import type { IRunTime, ITesterantoConfig } from "../../../src/server/Types";
import type { IMode } from "../../types";
import { watchInputFilePure, watchOutputFilePure } from "./utils/watch";
import { updateOutputFilesList } from "./utils/updateOutputFilesList";
import { loadInputFileOnce } from "./utils/loadInputFileOnce";

export class TestFileManager {
  inputFiles: any = {};
  outputFiles: any = {};
  hashs: Record<string, Record<string, string>> = {};

  constructor(
    private configs: ITesterantoConfig,
    private mode: IMode,
    private resourceChanged: (path: string) => void
  ) { }

  async watchOutputFile(
    runtime: IRunTime,
    testName: string,
    configKey: string
  ) {
    this.outputFiles = watchOutputFilePure(
      configKey,
      testName,
      runtime,
      this.mode,
      this.outputFiles,
      (path) => this.resourceChanged(path),
      updateOutputFilesList,
    );
  }

  loadInputFileOnce(
    runtime: IRunTime,
    testName: string,
    configKey: string
  ): void {
    const result = loadInputFileOnce(
      this.inputFiles,
      this.hashs,
      configKey,
      testName,
      runtime,
      configKey,
    );
    this.inputFiles = result.inputFiles;
    this.hashs = result.hashs;
  }

  async watchInputFile(
    runtime: IRunTime,
    testsName: string,
    onBddTest: (runtime: IRunTime, testName: string, configKey: string, configValue: any) => Promise<void>,
    onChecks: (runtime: IRunTime, testName: string, configKey: string, configValue: any) => Promise<void>,
    onAider: (runtime: IRunTime, testName: string, configKey: string, configValue: any, files?: any) => Promise<void>,
    onLoadInput: (runtime: IRunTime, testName: string, configKey: string) => void,
    onUpdateGraph?: (runtime: IRunTime, testName: string, configKey: string, inputFiles: string[]) => Promise<void>
  ) {
    const result = await watchInputFilePure(
      runtime,
      testsName,
      this.configs,
      this.mode,
      this.inputFiles,
      this.hashs,
      (inputFiles, hashs) => {
        this.inputFiles = inputFiles;
        this.hashs = hashs;
      },
      onBddTest,
      onChecks,
      onAider,
      // TODO This should be defined in API 
      () => this.resourceChanged("/~/inputfiles"),
      onLoadInput,
      onUpdateGraph,
    );
    this.inputFiles = result.inputFiles;
    this.hashs = result.hashs;
  }

  getInputFilesForTest(configKey: string, testName: string): string[] {
    if (!this.inputFiles[configKey]) {
      return [];
    }
    if (!this.inputFiles[configKey][testName]) {
      return [];
    }
    const files = this.inputFiles[configKey][testName];
    return Array.isArray(files) ? files : [];
  }

  getOutputFilesForTest(configKey: string, testName: string): string[] {
    const files: string[] = [];
    const cwd = process.cwd();

    if (this.outputFiles[configKey] && this.outputFiles[configKey][testName]) {
      const outputFiles = this.outputFiles[configKey][testName];
      if (Array.isArray(outputFiles)) {
        files.push(...outputFiles);
      }
    }

    const baseReportDir = path.join(cwd, "testeranto", "reports", configKey);

    const scanAllFiles = (dir: string): void => {
      if (!fs.existsSync(dir)) {
        return;
      }

      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          scanAllFiles(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    };

    if (fs.existsSync(baseReportDir)) {
      scanAllFiles(baseReportDir);
    }

    const parentDir = path.join(cwd, "testeranto", "reports");
    if (fs.existsSync(parentDir)) {
      const parentItems = fs.readdirSync(parentDir, { withFileTypes: true });
      for (const item of parentItems) {
        const fullPath = path.join(parentDir, item.name);
        if (item.isFile()) {
          files.push(fullPath);
        }
      }
    }

    return [...new Set(files)].sort();
  }
}
