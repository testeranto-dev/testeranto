// This file encapsulate packages which would otherwise block tests

import fs from "fs";
import type { IDeps } from "./depsTypes";

export default {
  fs: fs
} as IDeps