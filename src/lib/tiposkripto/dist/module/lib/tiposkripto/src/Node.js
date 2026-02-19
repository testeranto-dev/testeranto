import fs from "fs";
import BaseTiposkripto from "./BaseTiposkripto";
import { defaultTestResourceRequirement } from "./types";
console.log(`[NodeTiposkripto] ${process.argv}`);
const config = process.argv0[2];
export class NodeTiposkripto extends BaseTiposkripto {
    constructor(input, testSpecification, testImplementation, testResourceRequirement, testAdapter) {
        super("node", input, testSpecification, testImplementation, testResourceRequirement, testAdapter, config);
    }
    writeFileSync(filename, payload) {
        // console.log('writeFileSync', filename)
        // const dir = `testeranto/reports/${this.testResourceConfiguration.fs}`;
        // if (!fs.existsSync(dir)) {
        //   fs.mkdirSync(dir, { recursive: true });
        // }
        fs.writeFileSync(filename, payload);
    }
}
const tiposkripto = async (input, testSpecification, testImplementation, testAdapter, testResourceRequirement = defaultTestResourceRequirement) => {
    try {
        const t = new NodeTiposkripto(input, testSpecification, testImplementation, testResourceRequirement, testAdapter);
        return t;
    }
    catch (e) {
        console.error(`[Node] Error creating Tiposkripto:`, e);
        console.error(e.stack);
        process.exit(-1);
    }
};
export default tiposkripto;
