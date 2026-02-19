"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeTiposkripto = void 0;
const fs_1 = __importDefault(require("fs"));
const BaseTiposkripto_1 = __importDefault(require("./BaseTiposkripto"));
const types_1 = require("./types");
console.log(`[NodeTiposkripto] ${process.argv}`);
const config = process.argv0[2];
class NodeTiposkripto extends BaseTiposkripto_1.default {
    constructor(input, testSpecification, testImplementation, testResourceRequirement, testAdapter) {
        super("node", input, testSpecification, testImplementation, testResourceRequirement, testAdapter, config);
    }
    writeFileSync(filename, payload) {
        // console.log('writeFileSync', filename)
        // const dir = `testeranto/reports/${this.testResourceConfiguration.fs}`;
        // if (!fs.existsSync(dir)) {
        //   fs.mkdirSync(dir, { recursive: true });
        // }
        fs_1.default.writeFileSync(filename, payload);
    }
}
exports.NodeTiposkripto = NodeTiposkripto;
const tiposkripto = async (input, testSpecification, testImplementation, testAdapter, testResourceRequirement = types_1.defaultTestResourceRequirement) => {
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
exports.default = tiposkripto;
