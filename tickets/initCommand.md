we need to add a new command `init` to complement `dev` and `once`. This command sets up the `testeranto` folder.


const nativeDetectionPath = join(process.cwd(), "testeranto", "runtimes", "golang", "native_detection.go");
await Bun.write(nativeDetectionPath, nativeDetectionContent);


const nativeDetectionPath = join(process.cwd(), "testeranto", "runtimes", "golang", "native_detection.go");
await Bun.write(nativeDetectionPath, nativeDetectionContent);