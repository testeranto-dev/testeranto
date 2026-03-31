import esbuild from 'esbuild';
import { join } from "path";
import { Server_Docker } from "./Server_Docker";
import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";

export class Server extends Server_Docker {

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
  }

  async start(): Promise<void> {
    const entryPoint = join(
      process.cwd(),
      "testeranto",
      "reports",
      "index.tsx",
    );
    const outfile = join(process.cwd(), "testeranto", "reports", "index.js");

    esbuild.buildSync({
      entryPoints: [entryPoint],
      metafile: false,
      bundle: true,
      format: "esm",
      platform: "browser",
      target: "es2020",
      jsx: "automatic",
      outfile: outfile,
    });

    await super.start();
  }

  async stop(): Promise<void> {
    await super.stop();
  }

}
