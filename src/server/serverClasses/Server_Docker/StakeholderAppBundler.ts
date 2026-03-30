// import fs from "fs";
// import path, { join } from "path";
// import type { ITestconfigV2 } from "../../../Types";
// import esbuild from "esbuild";

// export class StakeholderAppBundler {
//   constructor(
//     private configs: ITestconfigV2,
//     private logWarning: (message: string) => void
//   ) { }

//   async bundleStakeholderApp(): Promise<void> {
//     const entryPoint = join(
//       process.cwd(),
//       "testeranto",
//       "reports",
//       "index.tsx",
//     );
//     const outfile = join(process.cwd(), "testeranto", "reports", "index.js");

//     // TODO fixme
//     // await esbuild.build({
//     //   entryPoints: [entryPoint],
//     //   metafile: false,
//     //   bundle: true,
//     //   format: "esm",
//     //   platform: "browser",
//     //   target: "es2020",
//     //   jsx: "automatic",
//     //   outfile: outfile,
//     // });
//   }
// }
