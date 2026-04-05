// Server_Docker_Dependents
// this file contains the code which touches outside packages, including the built in node packes like fs and path.
// this file contains the code which touchs upon globals, like console and process
// this file should be very thin and arranged so that niether the Server_Docker_Utils nor the Server_Docker file must import outside pacakges.

import { exec, execSync, spawn } from "child_process";
import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import { promisify } from "util";

// File system operations
export const readFileSync = (
    filePath: string,
    encoding: BufferEncoding = "utf-8",
): string => {
    return fs.readFileSync(filePath, encoding);
};

export const writeFileSync = (filePath: string, data: string): void => {
    fs.writeFileSync(filePath, data);
};

export const existsSync = (path: string): boolean => {
    return fs.existsSync(path);
};

export const mkdirSync = (
    dirPath: string,
    options?: { recursive: boolean },
): void => {
    fs.mkdirSync(dirPath, options);
};

export const readdirSync = (dirPath: string): string[] => {
    return fs.readdirSync(dirPath);
};

export const unlinkSync = (filePath: string): void => {
    fs.unlinkSync(filePath);
};

export const watchFile = (
    filename: string,
    listener: (curr: fs.Stats, prev: fs.Stats) => void,
): void => {
    fs.watchFile(filename, listener);
};

export const unwatchFile = (
    filename: string,
    listener?: (curr: fs.Stats, prev: fs.Stats) => void,
): void => {
    fs.unwatchFile(filename, listener);
};

export const watch = (
    filename: string,
    listener: (eventType: string, filename: string | null) => void,
): fs.FSWatcher => {
    return fs.watch(filename, listener);
};

export const createWriteStream = (
    filePath: string,
    options?: { flags: string },
): fs.WriteStream => {
    return fs.createWriteStream(filePath, options);
};

// Path operations
export const join = (...paths: string[]): string => {
    return path.join(...paths);
};

export const relative = (from: string, to: string): string => {
    return path.relative(from, to);
};

export const sep = path.sep;

// Child process operations
export const execSyncWrapper = (
    command: string,
    options?: { cwd?: string; encoding?: BufferEncoding },
): string => {
    return execSync(command, options).toString();
};

export const spawnWrapper = (
    command: string,
    args: string[],
    options?: { stdio?: any; shell?: boolean; cwd?: string },
): any => {
    return spawn(command, args, options);
};

export const execAsync = promisify(exec);

// YAML operations
export const yamlDump = (data: any, options?: yaml.DumpOptions): string => {
    return yaml.dump(data, options);
};

// Console operations (globals)
export const consoleLog = (message: string): void => {
    console.log(message);
};

export const consoleError = (...message: string[]): void => {
    console.error(message);
};

export const consoleWarn = (message: string): void => {
    console.warn(message);
};

// Process operations (globals)
export const processCwd = (): string => {
    return process.cwd();
};

export const processExit = (code: number): never => {
    process.exit(code);
};
