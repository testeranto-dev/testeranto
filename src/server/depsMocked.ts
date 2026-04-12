// This file encapsulate mocks of packages for tests

// TODO:replace with memFS
import fs from "fs";
import type { IDeps } from "./depsTypes";

export default {
  fs: fs
} as IDeps