// This file encapsulate packages which would otherwise block tests

import fs from "fs";
import http from "http";
import https from "https";
import child_process from "child_process";
import process from "process";
import type { IDeps } from "./depsTypes";

export default {
  fs: fs,
  http: http,
  https: https,
  child_process: child_process,
  process: process
} as IDeps
