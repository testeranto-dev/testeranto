import fs, { existsSync } from "fs";
import path, { join } from "path";
import type { ITestconfigV2 } from "../../../Types";
import { entryContent } from "./Server_Docker_Constants";

export class StakeholderAppBundler {
  constructor(
    private configs: ITestconfigV2,
    private logWarning: (message: string) => void
  ) {}

  async bundleStakeholderApp(): Promise<void> {
    try {
      const entryPoint = join(
        process.cwd(),
        "testeranto",
        "reports",
        "index.tsx",
      );
      const outfile = join(process.cwd(), "testeranto", "reports", "index.js");

      // Check if there's a custom React component specified
      let customComponentPath = this.configs.stakeholderReactModule;

      if (customComponentPath) {
        // Read the custom component path and create an entry point that uses it
        const absolutePath = join(process.cwd(), customComponentPath);

        await fs.promises.writeFile(entryPoint, entryContent(absolutePath));
      } else {
        // Use the default entry point
        // Copy the default index.tsx if it doesn't exist
        if (!existsSync(entryPoint)) {
          const defaultEntry = join(__dirname, "index.tsx");
          if (existsSync(defaultEntry)) {
            await fs.promises.copyFile(defaultEntry, entryPoint);
          }
        }
      }

      // Dynamically import esbuild
      const esbuild = await import('esbuild');
      await esbuild.build({
        entryPoints: [entryPoint],
        bundle: true,
        format: "esm",
        platform: "browser",
        target: "es2020",
        jsx: "automatic",
        outfile: outfile,
      });
    } catch (error: any) {
      this.logWarning(`Failed to bundle stakeholder app: ${error.message}`);
    }
  }
}
