import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { normalizeConfigsUtil } from "./utils/configNormalizationUtils";

export abstract class Server_Base {
  mode: IMode;
  configs: ITesterantoConfig;

  constructor(configs: ITesterantoConfig, mode: IMode) {
    this.configs = normalizeConfigsUtil(configs);
    this.mode = mode;
  }

  async start() {
    // no-op
  }

  async stop() {
    // Base class does nothing - derived classes should override
    // to perform proper cleanup
  }

}
