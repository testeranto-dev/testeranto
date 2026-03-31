import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";

export abstract class Server_Base {
  mode: IMode;
  configs: ITesterantoConfig;

  constructor(configs: ITesterantoConfig, mode: IMode) {
    this.configs = configs;
    this.mode = mode;
  }

  async start() {
    // no-op
  }

  async stop() {
    console.log(`goodbye testeranto`)
    process.exit()
  }

}
