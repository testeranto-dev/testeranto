#!/usr/bin/env bun
// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = import.meta.require;

// node_modules/ansi-colors/symbols.js
var require_symbols = __commonJS((exports, module) => {
  var isHyper = typeof process !== "undefined" && process.env.TERM_PROGRAM === "Hyper";
  var isWindows = typeof process !== "undefined" && process.platform === "win32";
  var isLinux = typeof process !== "undefined" && process.platform === "linux";
  var common = {
    ballotDisabled: "\u2612",
    ballotOff: "\u2610",
    ballotOn: "\u2611",
    bullet: "\u2022",
    bulletWhite: "\u25E6",
    fullBlock: "\u2588",
    heart: "\u2764",
    identicalTo: "\u2261",
    line: "\u2500",
    mark: "\u203B",
    middot: "\xB7",
    minus: "\uFF0D",
    multiplication: "\xD7",
    obelus: "\xF7",
    pencilDownRight: "\u270E",
    pencilRight: "\u270F",
    pencilUpRight: "\u2710",
    percent: "%",
    pilcrow2: "\u2761",
    pilcrow: "\xB6",
    plusMinus: "\xB1",
    question: "?",
    section: "\xA7",
    starsOff: "\u2606",
    starsOn: "\u2605",
    upDownArrow: "\u2195"
  };
  var windows = Object.assign({}, common, {
    check: "\u221A",
    cross: "\xD7",
    ellipsisLarge: "...",
    ellipsis: "...",
    info: "i",
    questionSmall: "?",
    pointer: ">",
    pointerSmall: "\xBB",
    radioOff: "( )",
    radioOn: "(*)",
    warning: "\u203C"
  });
  var other = Object.assign({}, common, {
    ballotCross: "\u2718",
    check: "\u2714",
    cross: "\u2716",
    ellipsisLarge: "\u22EF",
    ellipsis: "\u2026",
    info: "\u2139",
    questionFull: "\uFF1F",
    questionSmall: "\uFE56",
    pointer: isLinux ? "\u25B8" : "\u276F",
    pointerSmall: isLinux ? "\u2023" : "\u203A",
    radioOff: "\u25EF",
    radioOn: "\u25C9",
    warning: "\u26A0"
  });
  module.exports = isWindows && !isHyper ? windows : other;
  Reflect.defineProperty(module.exports, "common", { enumerable: false, value: common });
  Reflect.defineProperty(module.exports, "windows", { enumerable: false, value: windows });
  Reflect.defineProperty(module.exports, "other", { enumerable: false, value: other });
});

// node_modules/ansi-colors/index.js
var require_ansi_colors = __commonJS((exports, module) => {
  var isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
  var ANSI_REGEX = /[\u001b\u009b][[\]#;?()]*(?:(?:(?:[^\W_]*;?[^\W_]*)\u0007)|(?:(?:[0-9]{1,4}(;[0-9]{0,4})*)?[~0-9=<>cf-nqrtyA-PRZ]))/g;
  var hasColor = () => {
    if (typeof process !== "undefined") {
      return process.env.FORCE_COLOR !== "0";
    }
    return false;
  };
  var create = () => {
    const colors = {
      enabled: hasColor(),
      visible: true,
      styles: {},
      keys: {}
    };
    const ansi = (style2) => {
      let open = style2.open = `\x1B[${style2.codes[0]}m`;
      let close = style2.close = `\x1B[${style2.codes[1]}m`;
      let regex = style2.regex = new RegExp(`\\u001b\\[${style2.codes[1]}m`, "g");
      style2.wrap = (input, newline) => {
        if (input.includes(close))
          input = input.replace(regex, close + open);
        let output = open + input + close;
        return newline ? output.replace(/\r*\n/g, `${close}$&${open}`) : output;
      };
      return style2;
    };
    const wrap = (style2, input, newline) => {
      return typeof style2 === "function" ? style2(input) : style2.wrap(input, newline);
    };
    const style = (input, stack) => {
      if (input === "" || input == null)
        return "";
      if (colors.enabled === false)
        return input;
      if (colors.visible === false)
        return "";
      let str = "" + input;
      let nl = str.includes(`
`);
      let n = stack.length;
      if (n > 0 && stack.includes("unstyle")) {
        stack = [...new Set(["unstyle", ...stack])].reverse();
      }
      while (n-- > 0)
        str = wrap(colors.styles[stack[n]], str, nl);
      return str;
    };
    const define = (name, codes, type) => {
      colors.styles[name] = ansi({ name, codes });
      let keys = colors.keys[type] || (colors.keys[type] = []);
      keys.push(name);
      Reflect.defineProperty(colors, name, {
        configurable: true,
        enumerable: true,
        set(value) {
          colors.alias(name, value);
        },
        get() {
          let color = (input) => style(input, color.stack);
          Reflect.setPrototypeOf(color, colors);
          color.stack = this.stack ? this.stack.concat(name) : [name];
          return color;
        }
      });
    };
    define("reset", [0, 0], "modifier");
    define("bold", [1, 22], "modifier");
    define("dim", [2, 22], "modifier");
    define("italic", [3, 23], "modifier");
    define("underline", [4, 24], "modifier");
    define("inverse", [7, 27], "modifier");
    define("hidden", [8, 28], "modifier");
    define("strikethrough", [9, 29], "modifier");
    define("black", [30, 39], "color");
    define("red", [31, 39], "color");
    define("green", [32, 39], "color");
    define("yellow", [33, 39], "color");
    define("blue", [34, 39], "color");
    define("magenta", [35, 39], "color");
    define("cyan", [36, 39], "color");
    define("white", [37, 39], "color");
    define("gray", [90, 39], "color");
    define("grey", [90, 39], "color");
    define("bgBlack", [40, 49], "bg");
    define("bgRed", [41, 49], "bg");
    define("bgGreen", [42, 49], "bg");
    define("bgYellow", [43, 49], "bg");
    define("bgBlue", [44, 49], "bg");
    define("bgMagenta", [45, 49], "bg");
    define("bgCyan", [46, 49], "bg");
    define("bgWhite", [47, 49], "bg");
    define("blackBright", [90, 39], "bright");
    define("redBright", [91, 39], "bright");
    define("greenBright", [92, 39], "bright");
    define("yellowBright", [93, 39], "bright");
    define("blueBright", [94, 39], "bright");
    define("magentaBright", [95, 39], "bright");
    define("cyanBright", [96, 39], "bright");
    define("whiteBright", [97, 39], "bright");
    define("bgBlackBright", [100, 49], "bgBright");
    define("bgRedBright", [101, 49], "bgBright");
    define("bgGreenBright", [102, 49], "bgBright");
    define("bgYellowBright", [103, 49], "bgBright");
    define("bgBlueBright", [104, 49], "bgBright");
    define("bgMagentaBright", [105, 49], "bgBright");
    define("bgCyanBright", [106, 49], "bgBright");
    define("bgWhiteBright", [107, 49], "bgBright");
    colors.ansiRegex = ANSI_REGEX;
    colors.hasColor = colors.hasAnsi = (str) => {
      colors.ansiRegex.lastIndex = 0;
      return typeof str === "string" && str !== "" && colors.ansiRegex.test(str);
    };
    colors.alias = (name, color) => {
      let fn = typeof color === "string" ? colors[color] : color;
      if (typeof fn !== "function") {
        throw new TypeError("Expected alias to be the name of an existing color (string) or a function");
      }
      if (!fn.stack) {
        Reflect.defineProperty(fn, "name", { value: name });
        colors.styles[name] = fn;
        fn.stack = [name];
      }
      Reflect.defineProperty(colors, name, {
        configurable: true,
        enumerable: true,
        set(value) {
          colors.alias(name, value);
        },
        get() {
          let color2 = (input) => style(input, color2.stack);
          Reflect.setPrototypeOf(color2, colors);
          color2.stack = this.stack ? this.stack.concat(fn.stack) : fn.stack;
          return color2;
        }
      });
    };
    colors.theme = (custom) => {
      if (!isObject(custom))
        throw new TypeError("Expected theme to be an object");
      for (let name of Object.keys(custom)) {
        colors.alias(name, custom[name]);
      }
      return colors;
    };
    colors.alias("unstyle", (str) => {
      if (typeof str === "string" && str !== "") {
        colors.ansiRegex.lastIndex = 0;
        return str.replace(colors.ansiRegex, "");
      }
      return "";
    });
    colors.alias("noop", (str) => str);
    colors.none = colors.clear = colors.noop;
    colors.stripColor = colors.unstyle;
    colors.symbols = require_symbols();
    colors.define = define;
    return colors;
  };
  module.exports = create();
  module.exports.create = create;
});

// src/server/serverClasses/Server.ts
import fs3 from "fs";
import readline from "readline";

// src/server/serverClasses/Server_Docker.ts
var import_ansi_colors = __toESM(require_ansi_colors(), 1);
import { execSync, spawn } from "child_process";
import fs2 from "fs";

// node_modules/js-yaml/dist/js-yaml.mjs
/*! js-yaml 4.1.1 https://github.com/nodeca/js-yaml @license MIT */
function isNothing(subject) {
  return typeof subject === "undefined" || subject === null;
}
function isObject(subject) {
  return typeof subject === "object" && subject !== null;
}
function toArray(sequence) {
  if (Array.isArray(sequence))
    return sequence;
  else if (isNothing(sequence))
    return [];
  return [sequence];
}
function extend(target, source) {
  var index, length, key, sourceKeys;
  if (source) {
    sourceKeys = Object.keys(source);
    for (index = 0, length = sourceKeys.length;index < length; index += 1) {
      key = sourceKeys[index];
      target[key] = source[key];
    }
  }
  return target;
}
function repeat(string, count) {
  var result = "", cycle;
  for (cycle = 0;cycle < count; cycle += 1) {
    result += string;
  }
  return result;
}
function isNegativeZero(number) {
  return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
}
var isNothing_1 = isNothing;
var isObject_1 = isObject;
var toArray_1 = toArray;
var repeat_1 = repeat;
var isNegativeZero_1 = isNegativeZero;
var extend_1 = extend;
var common = {
  isNothing: isNothing_1,
  isObject: isObject_1,
  toArray: toArray_1,
  repeat: repeat_1,
  isNegativeZero: isNegativeZero_1,
  extend: extend_1
};
function formatError(exception, compact) {
  var where = "", message = exception.reason || "(unknown reason)";
  if (!exception.mark)
    return message;
  if (exception.mark.name) {
    where += 'in "' + exception.mark.name + '" ';
  }
  where += "(" + (exception.mark.line + 1) + ":" + (exception.mark.column + 1) + ")";
  if (!compact && exception.mark.snippet) {
    where += `

` + exception.mark.snippet;
  }
  return message + " " + where;
}
function YAMLException$1(reason, mark) {
  Error.call(this);
  this.name = "YAMLException";
  this.reason = reason;
  this.mark = mark;
  this.message = formatError(this, false);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = new Error().stack || "";
  }
}
YAMLException$1.prototype = Object.create(Error.prototype);
YAMLException$1.prototype.constructor = YAMLException$1;
YAMLException$1.prototype.toString = function toString(compact) {
  return this.name + ": " + formatError(this, compact);
};
var exception = YAMLException$1;
function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
  var head = "";
  var tail = "";
  var maxHalfLength = Math.floor(maxLineLength / 2) - 1;
  if (position - lineStart > maxHalfLength) {
    head = " ... ";
    lineStart = position - maxHalfLength + head.length;
  }
  if (lineEnd - position > maxHalfLength) {
    tail = " ...";
    lineEnd = position + maxHalfLength - tail.length;
  }
  return {
    str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "\u2192") + tail,
    pos: position - lineStart + head.length
  };
}
function padStart(string, max) {
  return common.repeat(" ", max - string.length) + string;
}
function makeSnippet(mark, options) {
  options = Object.create(options || null);
  if (!mark.buffer)
    return null;
  if (!options.maxLength)
    options.maxLength = 79;
  if (typeof options.indent !== "number")
    options.indent = 1;
  if (typeof options.linesBefore !== "number")
    options.linesBefore = 3;
  if (typeof options.linesAfter !== "number")
    options.linesAfter = 2;
  var re = /\r?\n|\r|\0/g;
  var lineStarts = [0];
  var lineEnds = [];
  var match;
  var foundLineNo = -1;
  while (match = re.exec(mark.buffer)) {
    lineEnds.push(match.index);
    lineStarts.push(match.index + match[0].length);
    if (mark.position <= match.index && foundLineNo < 0) {
      foundLineNo = lineStarts.length - 2;
    }
  }
  if (foundLineNo < 0)
    foundLineNo = lineStarts.length - 1;
  var result = "", i, line;
  var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
  var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
  for (i = 1;i <= options.linesBefore; i++) {
    if (foundLineNo - i < 0)
      break;
    line = getLine(mark.buffer, lineStarts[foundLineNo - i], lineEnds[foundLineNo - i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]), maxLineLength);
    result = common.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line.str + `
` + result;
  }
  line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
  result += common.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + `
`;
  result += common.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^" + `
`;
  for (i = 1;i <= options.linesAfter; i++) {
    if (foundLineNo + i >= lineEnds.length)
      break;
    line = getLine(mark.buffer, lineStarts[foundLineNo + i], lineEnds[foundLineNo + i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]), maxLineLength);
    result += common.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line.str + `
`;
  }
  return result.replace(/\n$/, "");
}
var snippet = makeSnippet;
var TYPE_CONSTRUCTOR_OPTIONS = [
  "kind",
  "multi",
  "resolve",
  "construct",
  "instanceOf",
  "predicate",
  "represent",
  "representName",
  "defaultStyle",
  "styleAliases"
];
var YAML_NODE_KINDS = [
  "scalar",
  "sequence",
  "mapping"
];
function compileStyleAliases(map) {
  var result = {};
  if (map !== null) {
    Object.keys(map).forEach(function(style) {
      map[style].forEach(function(alias) {
        result[String(alias)] = style;
      });
    });
  }
  return result;
}
function Type$1(tag, options) {
  options = options || {};
  Object.keys(options).forEach(function(name) {
    if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
      throw new exception('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
    }
  });
  this.options = options;
  this.tag = tag;
  this.kind = options["kind"] || null;
  this.resolve = options["resolve"] || function() {
    return true;
  };
  this.construct = options["construct"] || function(data) {
    return data;
  };
  this.instanceOf = options["instanceOf"] || null;
  this.predicate = options["predicate"] || null;
  this.represent = options["represent"] || null;
  this.representName = options["representName"] || null;
  this.defaultStyle = options["defaultStyle"] || null;
  this.multi = options["multi"] || false;
  this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
  if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
    throw new exception('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
  }
}
var type = Type$1;
function compileList(schema, name) {
  var result = [];
  schema[name].forEach(function(currentType) {
    var newIndex = result.length;
    result.forEach(function(previousType, previousIndex) {
      if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
        newIndex = previousIndex;
      }
    });
    result[newIndex] = currentType;
  });
  return result;
}
function compileMap() {
  var result = {
    scalar: {},
    sequence: {},
    mapping: {},
    fallback: {},
    multi: {
      scalar: [],
      sequence: [],
      mapping: [],
      fallback: []
    }
  }, index, length;
  function collectType(type2) {
    if (type2.multi) {
      result.multi[type2.kind].push(type2);
      result.multi["fallback"].push(type2);
    } else {
      result[type2.kind][type2.tag] = result["fallback"][type2.tag] = type2;
    }
  }
  for (index = 0, length = arguments.length;index < length; index += 1) {
    arguments[index].forEach(collectType);
  }
  return result;
}
function Schema$1(definition) {
  return this.extend(definition);
}
Schema$1.prototype.extend = function extend2(definition) {
  var implicit = [];
  var explicit = [];
  if (definition instanceof type) {
    explicit.push(definition);
  } else if (Array.isArray(definition)) {
    explicit = explicit.concat(definition);
  } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
    if (definition.implicit)
      implicit = implicit.concat(definition.implicit);
    if (definition.explicit)
      explicit = explicit.concat(definition.explicit);
  } else {
    throw new exception("Schema.extend argument should be a Type, [ Type ], " + "or a schema definition ({ implicit: [...], explicit: [...] })");
  }
  implicit.forEach(function(type$1) {
    if (!(type$1 instanceof type)) {
      throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    }
    if (type$1.loadKind && type$1.loadKind !== "scalar") {
      throw new exception("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
    }
    if (type$1.multi) {
      throw new exception("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
    }
  });
  explicit.forEach(function(type$1) {
    if (!(type$1 instanceof type)) {
      throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    }
  });
  var result = Object.create(Schema$1.prototype);
  result.implicit = (this.implicit || []).concat(implicit);
  result.explicit = (this.explicit || []).concat(explicit);
  result.compiledImplicit = compileList(result, "implicit");
  result.compiledExplicit = compileList(result, "explicit");
  result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
  return result;
};
var schema = Schema$1;
var str = new type("tag:yaml.org,2002:str", {
  kind: "scalar",
  construct: function(data) {
    return data !== null ? data : "";
  }
});
var seq = new type("tag:yaml.org,2002:seq", {
  kind: "sequence",
  construct: function(data) {
    return data !== null ? data : [];
  }
});
var map = new type("tag:yaml.org,2002:map", {
  kind: "mapping",
  construct: function(data) {
    return data !== null ? data : {};
  }
});
var failsafe = new schema({
  explicit: [
    str,
    seq,
    map
  ]
});
function resolveYamlNull(data) {
  if (data === null)
    return true;
  var max = data.length;
  return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
}
function constructYamlNull() {
  return null;
}
function isNull(object) {
  return object === null;
}
var _null = new type("tag:yaml.org,2002:null", {
  kind: "scalar",
  resolve: resolveYamlNull,
  construct: constructYamlNull,
  predicate: isNull,
  represent: {
    canonical: function() {
      return "~";
    },
    lowercase: function() {
      return "null";
    },
    uppercase: function() {
      return "NULL";
    },
    camelcase: function() {
      return "Null";
    },
    empty: function() {
      return "";
    }
  },
  defaultStyle: "lowercase"
});
function resolveYamlBoolean(data) {
  if (data === null)
    return false;
  var max = data.length;
  return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
}
function constructYamlBoolean(data) {
  return data === "true" || data === "True" || data === "TRUE";
}
function isBoolean(object) {
  return Object.prototype.toString.call(object) === "[object Boolean]";
}
var bool = new type("tag:yaml.org,2002:bool", {
  kind: "scalar",
  resolve: resolveYamlBoolean,
  construct: constructYamlBoolean,
  predicate: isBoolean,
  represent: {
    lowercase: function(object) {
      return object ? "true" : "false";
    },
    uppercase: function(object) {
      return object ? "TRUE" : "FALSE";
    },
    camelcase: function(object) {
      return object ? "True" : "False";
    }
  },
  defaultStyle: "lowercase"
});
function isHexCode(c) {
  return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
}
function isOctCode(c) {
  return 48 <= c && c <= 55;
}
function isDecCode(c) {
  return 48 <= c && c <= 57;
}
function resolveYamlInteger(data) {
  if (data === null)
    return false;
  var max = data.length, index = 0, hasDigits = false, ch;
  if (!max)
    return false;
  ch = data[index];
  if (ch === "-" || ch === "+") {
    ch = data[++index];
  }
  if (ch === "0") {
    if (index + 1 === max)
      return true;
    ch = data[++index];
    if (ch === "b") {
      index++;
      for (;index < max; index++) {
        ch = data[index];
        if (ch === "_")
          continue;
        if (ch !== "0" && ch !== "1")
          return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
    if (ch === "x") {
      index++;
      for (;index < max; index++) {
        ch = data[index];
        if (ch === "_")
          continue;
        if (!isHexCode(data.charCodeAt(index)))
          return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
    if (ch === "o") {
      index++;
      for (;index < max; index++) {
        ch = data[index];
        if (ch === "_")
          continue;
        if (!isOctCode(data.charCodeAt(index)))
          return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
  }
  if (ch === "_")
    return false;
  for (;index < max; index++) {
    ch = data[index];
    if (ch === "_")
      continue;
    if (!isDecCode(data.charCodeAt(index))) {
      return false;
    }
    hasDigits = true;
  }
  if (!hasDigits || ch === "_")
    return false;
  return true;
}
function constructYamlInteger(data) {
  var value = data, sign = 1, ch;
  if (value.indexOf("_") !== -1) {
    value = value.replace(/_/g, "");
  }
  ch = value[0];
  if (ch === "-" || ch === "+") {
    if (ch === "-")
      sign = -1;
    value = value.slice(1);
    ch = value[0];
  }
  if (value === "0")
    return 0;
  if (ch === "0") {
    if (value[1] === "b")
      return sign * parseInt(value.slice(2), 2);
    if (value[1] === "x")
      return sign * parseInt(value.slice(2), 16);
    if (value[1] === "o")
      return sign * parseInt(value.slice(2), 8);
  }
  return sign * parseInt(value, 10);
}
function isInteger(object) {
  return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common.isNegativeZero(object));
}
var int = new type("tag:yaml.org,2002:int", {
  kind: "scalar",
  resolve: resolveYamlInteger,
  construct: constructYamlInteger,
  predicate: isInteger,
  represent: {
    binary: function(obj) {
      return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
    },
    octal: function(obj) {
      return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
    },
    decimal: function(obj) {
      return obj.toString(10);
    },
    hexadecimal: function(obj) {
      return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
    }
  },
  defaultStyle: "decimal",
  styleAliases: {
    binary: [2, "bin"],
    octal: [8, "oct"],
    decimal: [10, "dec"],
    hexadecimal: [16, "hex"]
  }
});
var YAML_FLOAT_PATTERN = new RegExp("^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?" + "|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?" + "|[-+]?\\.(?:inf|Inf|INF)" + "|\\.(?:nan|NaN|NAN))$");
function resolveYamlFloat(data) {
  if (data === null)
    return false;
  if (!YAML_FLOAT_PATTERN.test(data) || data[data.length - 1] === "_") {
    return false;
  }
  return true;
}
function constructYamlFloat(data) {
  var value, sign;
  value = data.replace(/_/g, "").toLowerCase();
  sign = value[0] === "-" ? -1 : 1;
  if ("+-".indexOf(value[0]) >= 0) {
    value = value.slice(1);
  }
  if (value === ".inf") {
    return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  } else if (value === ".nan") {
    return NaN;
  }
  return sign * parseFloat(value, 10);
}
var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
function representYamlFloat(object, style) {
  var res;
  if (isNaN(object)) {
    switch (style) {
      case "lowercase":
        return ".nan";
      case "uppercase":
        return ".NAN";
      case "camelcase":
        return ".NaN";
    }
  } else if (Number.POSITIVE_INFINITY === object) {
    switch (style) {
      case "lowercase":
        return ".inf";
      case "uppercase":
        return ".INF";
      case "camelcase":
        return ".Inf";
    }
  } else if (Number.NEGATIVE_INFINITY === object) {
    switch (style) {
      case "lowercase":
        return "-.inf";
      case "uppercase":
        return "-.INF";
      case "camelcase":
        return "-.Inf";
    }
  } else if (common.isNegativeZero(object)) {
    return "-0.0";
  }
  res = object.toString(10);
  return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
}
function isFloat(object) {
  return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common.isNegativeZero(object));
}
var float = new type("tag:yaml.org,2002:float", {
  kind: "scalar",
  resolve: resolveYamlFloat,
  construct: constructYamlFloat,
  predicate: isFloat,
  represent: representYamlFloat,
  defaultStyle: "lowercase"
});
var json = failsafe.extend({
  implicit: [
    _null,
    bool,
    int,
    float
  ]
});
var core = json;
var YAML_DATE_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])" + "-([0-9][0-9])" + "-([0-9][0-9])$");
var YAML_TIMESTAMP_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])" + "-([0-9][0-9]?)" + "-([0-9][0-9]?)" + "(?:[Tt]|[ \\t]+)" + "([0-9][0-9]?)" + ":([0-9][0-9])" + ":([0-9][0-9])" + "(?:\\.([0-9]*))?" + "(?:[ \\t]*(Z|([-+])([0-9][0-9]?)" + "(?::([0-9][0-9]))?))?$");
function resolveYamlTimestamp(data) {
  if (data === null)
    return false;
  if (YAML_DATE_REGEXP.exec(data) !== null)
    return true;
  if (YAML_TIMESTAMP_REGEXP.exec(data) !== null)
    return true;
  return false;
}
function constructYamlTimestamp(data) {
  var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
  match = YAML_DATE_REGEXP.exec(data);
  if (match === null)
    match = YAML_TIMESTAMP_REGEXP.exec(data);
  if (match === null)
    throw new Error("Date resolve error");
  year = +match[1];
  month = +match[2] - 1;
  day = +match[3];
  if (!match[4]) {
    return new Date(Date.UTC(year, month, day));
  }
  hour = +match[4];
  minute = +match[5];
  second = +match[6];
  if (match[7]) {
    fraction = match[7].slice(0, 3);
    while (fraction.length < 3) {
      fraction += "0";
    }
    fraction = +fraction;
  }
  if (match[9]) {
    tz_hour = +match[10];
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 60000;
    if (match[9] === "-")
      delta = -delta;
  }
  date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
  if (delta)
    date.setTime(date.getTime() - delta);
  return date;
}
function representYamlTimestamp(object) {
  return object.toISOString();
}
var timestamp = new type("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve: resolveYamlTimestamp,
  construct: constructYamlTimestamp,
  instanceOf: Date,
  represent: representYamlTimestamp
});
function resolveYamlMerge(data) {
  return data === "<<" || data === null;
}
var merge = new type("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: resolveYamlMerge
});
var BASE64_MAP = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
function resolveYamlBinary(data) {
  if (data === null)
    return false;
  var code, idx, bitlen = 0, max = data.length, map2 = BASE64_MAP;
  for (idx = 0;idx < max; idx++) {
    code = map2.indexOf(data.charAt(idx));
    if (code > 64)
      continue;
    if (code < 0)
      return false;
    bitlen += 6;
  }
  return bitlen % 8 === 0;
}
function constructYamlBinary(data) {
  var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map2 = BASE64_MAP, bits = 0, result = [];
  for (idx = 0;idx < max; idx++) {
    if (idx % 4 === 0 && idx) {
      result.push(bits >> 16 & 255);
      result.push(bits >> 8 & 255);
      result.push(bits & 255);
    }
    bits = bits << 6 | map2.indexOf(input.charAt(idx));
  }
  tailbits = max % 4 * 6;
  if (tailbits === 0) {
    result.push(bits >> 16 & 255);
    result.push(bits >> 8 & 255);
    result.push(bits & 255);
  } else if (tailbits === 18) {
    result.push(bits >> 10 & 255);
    result.push(bits >> 2 & 255);
  } else if (tailbits === 12) {
    result.push(bits >> 4 & 255);
  }
  return new Uint8Array(result);
}
function representYamlBinary(object) {
  var result = "", bits = 0, idx, tail, max = object.length, map2 = BASE64_MAP;
  for (idx = 0;idx < max; idx++) {
    if (idx % 3 === 0 && idx) {
      result += map2[bits >> 18 & 63];
      result += map2[bits >> 12 & 63];
      result += map2[bits >> 6 & 63];
      result += map2[bits & 63];
    }
    bits = (bits << 8) + object[idx];
  }
  tail = max % 3;
  if (tail === 0) {
    result += map2[bits >> 18 & 63];
    result += map2[bits >> 12 & 63];
    result += map2[bits >> 6 & 63];
    result += map2[bits & 63];
  } else if (tail === 2) {
    result += map2[bits >> 10 & 63];
    result += map2[bits >> 4 & 63];
    result += map2[bits << 2 & 63];
    result += map2[64];
  } else if (tail === 1) {
    result += map2[bits >> 2 & 63];
    result += map2[bits << 4 & 63];
    result += map2[64];
    result += map2[64];
  }
  return result;
}
function isBinary(obj) {
  return Object.prototype.toString.call(obj) === "[object Uint8Array]";
}
var binary = new type("tag:yaml.org,2002:binary", {
  kind: "scalar",
  resolve: resolveYamlBinary,
  construct: constructYamlBinary,
  predicate: isBinary,
  represent: representYamlBinary
});
var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;
var _toString$2 = Object.prototype.toString;
function resolveYamlOmap(data) {
  if (data === null)
    return true;
  var objectKeys = [], index, length, pair, pairKey, pairHasKey, object = data;
  for (index = 0, length = object.length;index < length; index += 1) {
    pair = object[index];
    pairHasKey = false;
    if (_toString$2.call(pair) !== "[object Object]")
      return false;
    for (pairKey in pair) {
      if (_hasOwnProperty$3.call(pair, pairKey)) {
        if (!pairHasKey)
          pairHasKey = true;
        else
          return false;
      }
    }
    if (!pairHasKey)
      return false;
    if (objectKeys.indexOf(pairKey) === -1)
      objectKeys.push(pairKey);
    else
      return false;
  }
  return true;
}
function constructYamlOmap(data) {
  return data !== null ? data : [];
}
var omap = new type("tag:yaml.org,2002:omap", {
  kind: "sequence",
  resolve: resolveYamlOmap,
  construct: constructYamlOmap
});
var _toString$1 = Object.prototype.toString;
function resolveYamlPairs(data) {
  if (data === null)
    return true;
  var index, length, pair, keys, result, object = data;
  result = new Array(object.length);
  for (index = 0, length = object.length;index < length; index += 1) {
    pair = object[index];
    if (_toString$1.call(pair) !== "[object Object]")
      return false;
    keys = Object.keys(pair);
    if (keys.length !== 1)
      return false;
    result[index] = [keys[0], pair[keys[0]]];
  }
  return true;
}
function constructYamlPairs(data) {
  if (data === null)
    return [];
  var index, length, pair, keys, result, object = data;
  result = new Array(object.length);
  for (index = 0, length = object.length;index < length; index += 1) {
    pair = object[index];
    keys = Object.keys(pair);
    result[index] = [keys[0], pair[keys[0]]];
  }
  return result;
}
var pairs = new type("tag:yaml.org,2002:pairs", {
  kind: "sequence",
  resolve: resolveYamlPairs,
  construct: constructYamlPairs
});
var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;
function resolveYamlSet(data) {
  if (data === null)
    return true;
  var key, object = data;
  for (key in object) {
    if (_hasOwnProperty$2.call(object, key)) {
      if (object[key] !== null)
        return false;
    }
  }
  return true;
}
function constructYamlSet(data) {
  return data !== null ? data : {};
}
var set = new type("tag:yaml.org,2002:set", {
  kind: "mapping",
  resolve: resolveYamlSet,
  construct: constructYamlSet
});
var _default = core.extend({
  implicit: [
    timestamp,
    merge
  ],
  explicit: [
    binary,
    omap,
    pairs,
    set
  ]
});
var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;
var CONTEXT_FLOW_IN = 1;
var CONTEXT_FLOW_OUT = 2;
var CONTEXT_BLOCK_IN = 3;
var CONTEXT_BLOCK_OUT = 4;
var CHOMPING_CLIP = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP = 3;
var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function _class(obj) {
  return Object.prototype.toString.call(obj);
}
function is_EOL(c) {
  return c === 10 || c === 13;
}
function is_WHITE_SPACE(c) {
  return c === 9 || c === 32;
}
function is_WS_OR_EOL(c) {
  return c === 9 || c === 32 || c === 10 || c === 13;
}
function is_FLOW_INDICATOR(c) {
  return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
}
function fromHexCode(c) {
  var lc;
  if (48 <= c && c <= 57) {
    return c - 48;
  }
  lc = c | 32;
  if (97 <= lc && lc <= 102) {
    return lc - 97 + 10;
  }
  return -1;
}
function escapedHexLen(c) {
  if (c === 120) {
    return 2;
  }
  if (c === 117) {
    return 4;
  }
  if (c === 85) {
    return 8;
  }
  return 0;
}
function fromDecimalCode(c) {
  if (48 <= c && c <= 57) {
    return c - 48;
  }
  return -1;
}
function simpleEscapeSequence(c) {
  return c === 48 ? "\x00" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "\t" : c === 9 ? "\t" : c === 110 ? `
` : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? "\r" : c === 101 ? "\x1B" : c === 32 ? " " : c === 34 ? '"' : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "\x85" : c === 95 ? "\xA0" : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
}
function charFromCodepoint(c) {
  if (c <= 65535) {
    return String.fromCharCode(c);
  }
  return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
}
function setProperty(object, key, value) {
  if (key === "__proto__") {
    Object.defineProperty(object, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value
    });
  } else {
    object[key] = value;
  }
}
var simpleEscapeCheck = new Array(256);
var simpleEscapeMap = new Array(256);
for (i = 0;i < 256; i++) {
  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
  simpleEscapeMap[i] = simpleEscapeSequence(i);
}
var i;
function State$1(input, options) {
  this.input = input;
  this.filename = options["filename"] || null;
  this.schema = options["schema"] || _default;
  this.onWarning = options["onWarning"] || null;
  this.legacy = options["legacy"] || false;
  this.json = options["json"] || false;
  this.listener = options["listener"] || null;
  this.implicitTypes = this.schema.compiledImplicit;
  this.typeMap = this.schema.compiledTypeMap;
  this.length = input.length;
  this.position = 0;
  this.line = 0;
  this.lineStart = 0;
  this.lineIndent = 0;
  this.firstTabInLine = -1;
  this.documents = [];
}
function generateError(state, message) {
  var mark = {
    name: state.filename,
    buffer: state.input.slice(0, -1),
    position: state.position,
    line: state.line,
    column: state.position - state.lineStart
  };
  mark.snippet = snippet(mark);
  return new exception(message, mark);
}
function throwError(state, message) {
  throw generateError(state, message);
}
function throwWarning(state, message) {
  if (state.onWarning) {
    state.onWarning.call(null, generateError(state, message));
  }
}
var directiveHandlers = {
  YAML: function handleYamlDirective(state, name, args) {
    var match, major, minor;
    if (state.version !== null) {
      throwError(state, "duplication of %YAML directive");
    }
    if (args.length !== 1) {
      throwError(state, "YAML directive accepts exactly one argument");
    }
    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
    if (match === null) {
      throwError(state, "ill-formed argument of the YAML directive");
    }
    major = parseInt(match[1], 10);
    minor = parseInt(match[2], 10);
    if (major !== 1) {
      throwError(state, "unacceptable YAML version of the document");
    }
    state.version = args[0];
    state.checkLineBreaks = minor < 2;
    if (minor !== 1 && minor !== 2) {
      throwWarning(state, "unsupported YAML version of the document");
    }
  },
  TAG: function handleTagDirective(state, name, args) {
    var handle, prefix;
    if (args.length !== 2) {
      throwError(state, "TAG directive accepts exactly two arguments");
    }
    handle = args[0];
    prefix = args[1];
    if (!PATTERN_TAG_HANDLE.test(handle)) {
      throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
    }
    if (_hasOwnProperty$1.call(state.tagMap, handle)) {
      throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
    }
    if (!PATTERN_TAG_URI.test(prefix)) {
      throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
    }
    try {
      prefix = decodeURIComponent(prefix);
    } catch (err) {
      throwError(state, "tag prefix is malformed: " + prefix);
    }
    state.tagMap[handle] = prefix;
  }
};
function captureSegment(state, start, end, checkJson) {
  var _position, _length, _character, _result;
  if (start < end) {
    _result = state.input.slice(start, end);
    if (checkJson) {
      for (_position = 0, _length = _result.length;_position < _length; _position += 1) {
        _character = _result.charCodeAt(_position);
        if (!(_character === 9 || 32 <= _character && _character <= 1114111)) {
          throwError(state, "expected valid JSON character");
        }
      }
    } else if (PATTERN_NON_PRINTABLE.test(_result)) {
      throwError(state, "the stream contains non-printable characters");
    }
    state.result += _result;
  }
}
function mergeMappings(state, destination, source, overridableKeys) {
  var sourceKeys, key, index, quantity;
  if (!common.isObject(source)) {
    throwError(state, "cannot merge mappings; the provided source object is unacceptable");
  }
  sourceKeys = Object.keys(source);
  for (index = 0, quantity = sourceKeys.length;index < quantity; index += 1) {
    key = sourceKeys[index];
    if (!_hasOwnProperty$1.call(destination, key)) {
      setProperty(destination, key, source[key]);
      overridableKeys[key] = true;
    }
  }
}
function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
  var index, quantity;
  if (Array.isArray(keyNode)) {
    keyNode = Array.prototype.slice.call(keyNode);
    for (index = 0, quantity = keyNode.length;index < quantity; index += 1) {
      if (Array.isArray(keyNode[index])) {
        throwError(state, "nested arrays are not supported inside keys");
      }
      if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
        keyNode[index] = "[object Object]";
      }
    }
  }
  if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
    keyNode = "[object Object]";
  }
  keyNode = String(keyNode);
  if (_result === null) {
    _result = {};
  }
  if (keyTag === "tag:yaml.org,2002:merge") {
    if (Array.isArray(valueNode)) {
      for (index = 0, quantity = valueNode.length;index < quantity; index += 1) {
        mergeMappings(state, _result, valueNode[index], overridableKeys);
      }
    } else {
      mergeMappings(state, _result, valueNode, overridableKeys);
    }
  } else {
    if (!state.json && !_hasOwnProperty$1.call(overridableKeys, keyNode) && _hasOwnProperty$1.call(_result, keyNode)) {
      state.line = startLine || state.line;
      state.lineStart = startLineStart || state.lineStart;
      state.position = startPos || state.position;
      throwError(state, "duplicated mapping key");
    }
    setProperty(_result, keyNode, valueNode);
    delete overridableKeys[keyNode];
  }
  return _result;
}
function readLineBreak(state) {
  var ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 10) {
    state.position++;
  } else if (ch === 13) {
    state.position++;
    if (state.input.charCodeAt(state.position) === 10) {
      state.position++;
    }
  } else {
    throwError(state, "a line break is expected");
  }
  state.line += 1;
  state.lineStart = state.position;
  state.firstTabInLine = -1;
}
function skipSeparationSpace(state, allowComments, checkIndent) {
  var lineBreaks = 0, ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    while (is_WHITE_SPACE(ch)) {
      if (ch === 9 && state.firstTabInLine === -1) {
        state.firstTabInLine = state.position;
      }
      ch = state.input.charCodeAt(++state.position);
    }
    if (allowComments && ch === 35) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 10 && ch !== 13 && ch !== 0);
    }
    if (is_EOL(ch)) {
      readLineBreak(state);
      ch = state.input.charCodeAt(state.position);
      lineBreaks++;
      state.lineIndent = 0;
      while (ch === 32) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
    } else {
      break;
    }
  }
  if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
    throwWarning(state, "deficient indentation");
  }
  return lineBreaks;
}
function testDocumentSeparator(state) {
  var _position = state.position, ch;
  ch = state.input.charCodeAt(_position);
  if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
    _position += 3;
    ch = state.input.charCodeAt(_position);
    if (ch === 0 || is_WS_OR_EOL(ch)) {
      return true;
    }
  }
  return false;
}
function writeFoldedLines(state, count) {
  if (count === 1) {
    state.result += " ";
  } else if (count > 1) {
    state.result += common.repeat(`
`, count - 1);
  }
}
function readPlainScalar(state, nodeIndent, withinFlowCollection) {
  var preceding, following, captureStart, captureEnd, hasPendingContent, _line, _lineStart, _lineIndent, _kind = state.kind, _result = state.result, ch;
  ch = state.input.charCodeAt(state.position);
  if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
    return false;
  }
  if (ch === 63 || ch === 45) {
    following = state.input.charCodeAt(state.position + 1);
    if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
      return false;
    }
  }
  state.kind = "scalar";
  state.result = "";
  captureStart = captureEnd = state.position;
  hasPendingContent = false;
  while (ch !== 0) {
    if (ch === 58) {
      following = state.input.charCodeAt(state.position + 1);
      if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
        break;
      }
    } else if (ch === 35) {
      preceding = state.input.charCodeAt(state.position - 1);
      if (is_WS_OR_EOL(preceding)) {
        break;
      }
    } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) {
      break;
    } else if (is_EOL(ch)) {
      _line = state.line;
      _lineStart = state.lineStart;
      _lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);
      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      } else {
        state.position = captureEnd;
        state.line = _line;
        state.lineStart = _lineStart;
        state.lineIndent = _lineIndent;
        break;
      }
    }
    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - _line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }
    if (!is_WHITE_SPACE(ch)) {
      captureEnd = state.position + 1;
    }
    ch = state.input.charCodeAt(++state.position);
  }
  captureSegment(state, captureStart, captureEnd, false);
  if (state.result) {
    return true;
  }
  state.kind = _kind;
  state.result = _result;
  return false;
}
function readSingleQuotedScalar(state, nodeIndent) {
  var ch, captureStart, captureEnd;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 39) {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  state.position++;
  captureStart = captureEnd = state.position;
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 39) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);
      if (ch === 39) {
        captureStart = state.position;
        state.position++;
        captureEnd = state.position;
      } else {
        return true;
      }
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, "unexpected end of the document within a single quoted scalar");
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }
  throwError(state, "unexpected end of the stream within a single quoted scalar");
}
function readDoubleQuotedScalar(state, nodeIndent) {
  var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 34) {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  state.position++;
  captureStart = captureEnd = state.position;
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 34) {
      captureSegment(state, captureStart, state.position, true);
      state.position++;
      return true;
    } else if (ch === 92) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);
      if (is_EOL(ch)) {
        skipSeparationSpace(state, false, nodeIndent);
      } else if (ch < 256 && simpleEscapeCheck[ch]) {
        state.result += simpleEscapeMap[ch];
        state.position++;
      } else if ((tmp = escapedHexLen(ch)) > 0) {
        hexLength = tmp;
        hexResult = 0;
        for (;hexLength > 0; hexLength--) {
          ch = state.input.charCodeAt(++state.position);
          if ((tmp = fromHexCode(ch)) >= 0) {
            hexResult = (hexResult << 4) + tmp;
          } else {
            throwError(state, "expected hexadecimal character");
          }
        }
        state.result += charFromCodepoint(hexResult);
        state.position++;
      } else {
        throwError(state, "unknown escape sequence");
      }
      captureStart = captureEnd = state.position;
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, "unexpected end of the document within a double quoted scalar");
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }
  throwError(state, "unexpected end of the stream within a double quoted scalar");
}
function readFlowCollection(state, nodeIndent) {
  var readNext = true, _line, _lineStart, _pos, _tag = state.tag, _result, _anchor = state.anchor, following, terminator, isPair, isExplicitPair, isMapping, overridableKeys = Object.create(null), keyNode, keyTag, valueNode, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 91) {
    terminator = 93;
    isMapping = false;
    _result = [];
  } else if (ch === 123) {
    terminator = 125;
    isMapping = true;
    _result = {};
  } else {
    return false;
  }
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(++state.position);
  while (ch !== 0) {
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if (ch === terminator) {
      state.position++;
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = isMapping ? "mapping" : "sequence";
      state.result = _result;
      return true;
    } else if (!readNext) {
      throwError(state, "missed comma between flow collection entries");
    } else if (ch === 44) {
      throwError(state, "expected the node content, but found ','");
    }
    keyTag = keyNode = valueNode = null;
    isPair = isExplicitPair = false;
    if (ch === 63) {
      following = state.input.charCodeAt(state.position + 1);
      if (is_WS_OR_EOL(following)) {
        isPair = isExplicitPair = true;
        state.position++;
        skipSeparationSpace(state, true, nodeIndent);
      }
    }
    _line = state.line;
    _lineStart = state.lineStart;
    _pos = state.position;
    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if ((isExplicitPair || state.line === _line) && ch === 58) {
      isPair = true;
      ch = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      valueNode = state.result;
    }
    if (isMapping) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
    } else if (isPair) {
      _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
    } else {
      _result.push(keyNode);
    }
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if (ch === 44) {
      readNext = true;
      ch = state.input.charCodeAt(++state.position);
    } else {
      readNext = false;
    }
  }
  throwError(state, "unexpected end of the stream within a flow collection");
}
function readBlockScalar(state, nodeIndent) {
  var captureStart, folding, chomping = CHOMPING_CLIP, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false, tmp, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 124) {
    folding = false;
  } else if (ch === 62) {
    folding = true;
  } else {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  while (ch !== 0) {
    ch = state.input.charCodeAt(++state.position);
    if (ch === 43 || ch === 45) {
      if (CHOMPING_CLIP === chomping) {
        chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
      } else {
        throwError(state, "repeat of a chomping mode identifier");
      }
    } else if ((tmp = fromDecimalCode(ch)) >= 0) {
      if (tmp === 0) {
        throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
      } else if (!detectedIndent) {
        textIndent = nodeIndent + tmp - 1;
        detectedIndent = true;
      } else {
        throwError(state, "repeat of an indentation width identifier");
      }
    } else {
      break;
    }
  }
  if (is_WHITE_SPACE(ch)) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (is_WHITE_SPACE(ch));
    if (ch === 35) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (!is_EOL(ch) && ch !== 0);
    }
  }
  while (ch !== 0) {
    readLineBreak(state);
    state.lineIndent = 0;
    ch = state.input.charCodeAt(state.position);
    while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }
    if (!detectedIndent && state.lineIndent > textIndent) {
      textIndent = state.lineIndent;
    }
    if (is_EOL(ch)) {
      emptyLines++;
      continue;
    }
    if (state.lineIndent < textIndent) {
      if (chomping === CHOMPING_KEEP) {
        state.result += common.repeat(`
`, didReadContent ? 1 + emptyLines : emptyLines);
      } else if (chomping === CHOMPING_CLIP) {
        if (didReadContent) {
          state.result += `
`;
        }
      }
      break;
    }
    if (folding) {
      if (is_WHITE_SPACE(ch)) {
        atMoreIndented = true;
        state.result += common.repeat(`
`, didReadContent ? 1 + emptyLines : emptyLines);
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common.repeat(`
`, emptyLines + 1);
      } else if (emptyLines === 0) {
        if (didReadContent) {
          state.result += " ";
        }
      } else {
        state.result += common.repeat(`
`, emptyLines);
      }
    } else {
      state.result += common.repeat(`
`, didReadContent ? 1 + emptyLines : emptyLines);
    }
    didReadContent = true;
    detectedIndent = true;
    emptyLines = 0;
    captureStart = state.position;
    while (!is_EOL(ch) && ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
    }
    captureSegment(state, captureStart, state.position, false);
  }
  return true;
}
function readBlockSequence(state, nodeIndent) {
  var _line, _tag = state.tag, _anchor = state.anchor, _result = [], following, detected = false, ch;
  if (state.firstTabInLine !== -1)
    return false;
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    if (ch !== 45) {
      break;
    }
    following = state.input.charCodeAt(state.position + 1);
    if (!is_WS_OR_EOL(following)) {
      break;
    }
    detected = true;
    state.position++;
    if (skipSeparationSpace(state, true, -1)) {
      if (state.lineIndent <= nodeIndent) {
        _result.push(null);
        ch = state.input.charCodeAt(state.position);
        continue;
      }
    }
    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    _result.push(state.result);
    skipSeparationSpace(state, true, -1);
    ch = state.input.charCodeAt(state.position);
    if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, "bad indentation of a sequence entry");
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = "sequence";
    state.result = _result;
    return true;
  }
  return false;
}
function readBlockMapping(state, nodeIndent, flowIndent) {
  var following, allowCompact, _line, _keyLine, _keyLineStart, _keyPos, _tag = state.tag, _anchor = state.anchor, _result = {}, overridableKeys = Object.create(null), keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
  if (state.firstTabInLine !== -1)
    return false;
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (!atExplicitKey && state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    following = state.input.charCodeAt(state.position + 1);
    _line = state.line;
    if ((ch === 63 || ch === 58) && is_WS_OR_EOL(following)) {
      if (ch === 63) {
        if (atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }
        detected = true;
        atExplicitKey = true;
        allowCompact = true;
      } else if (atExplicitKey) {
        atExplicitKey = false;
        allowCompact = true;
      } else {
        throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
      }
      state.position += 1;
      ch = following;
    } else {
      _keyLine = state.line;
      _keyLineStart = state.lineStart;
      _keyPos = state.position;
      if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
        break;
      }
      if (state.line === _line) {
        ch = state.input.charCodeAt(state.position);
        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (ch === 58) {
          ch = state.input.charCodeAt(++state.position);
          if (!is_WS_OR_EOL(ch)) {
            throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
          }
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          detected = true;
          atExplicitKey = false;
          allowCompact = false;
          keyTag = state.tag;
          keyNode = state.result;
        } else if (detected) {
          throwError(state, "can not read an implicit mapping pair; a colon is missed");
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true;
        }
      } else if (detected) {
        throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
      } else {
        state.tag = _tag;
        state.anchor = _anchor;
        return true;
      }
    }
    if (state.line === _line || state.lineIndent > nodeIndent) {
      if (atExplicitKey) {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
      }
      if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
        if (atExplicitKey) {
          keyNode = state.result;
        } else {
          valueNode = state.result;
        }
      }
      if (!atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
        keyTag = keyNode = valueNode = null;
      }
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
    }
    if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, "bad indentation of a mapping entry");
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }
  if (atExplicitKey) {
    storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
  }
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = "mapping";
    state.result = _result;
  }
  return detected;
}
function readTagProperty(state) {
  var _position, isVerbatim = false, isNamed = false, tagHandle, tagName, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 33)
    return false;
  if (state.tag !== null) {
    throwError(state, "duplication of a tag property");
  }
  ch = state.input.charCodeAt(++state.position);
  if (ch === 60) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);
  } else if (ch === 33) {
    isNamed = true;
    tagHandle = "!!";
    ch = state.input.charCodeAt(++state.position);
  } else {
    tagHandle = "!";
  }
  _position = state.position;
  if (isVerbatim) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (ch !== 0 && ch !== 62);
    if (state.position < state.length) {
      tagName = state.input.slice(_position, state.position);
      ch = state.input.charCodeAt(++state.position);
    } else {
      throwError(state, "unexpected end of the stream within a verbatim tag");
    }
  } else {
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      if (ch === 33) {
        if (!isNamed) {
          tagHandle = state.input.slice(_position - 1, state.position + 1);
          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
            throwError(state, "named tag handle cannot contain such characters");
          }
          isNamed = true;
          _position = state.position + 1;
        } else {
          throwError(state, "tag suffix cannot contain exclamation marks");
        }
      }
      ch = state.input.charCodeAt(++state.position);
    }
    tagName = state.input.slice(_position, state.position);
    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
      throwError(state, "tag suffix cannot contain flow indicator characters");
    }
  }
  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
    throwError(state, "tag name cannot contain such characters: " + tagName);
  }
  try {
    tagName = decodeURIComponent(tagName);
  } catch (err) {
    throwError(state, "tag name is malformed: " + tagName);
  }
  if (isVerbatim) {
    state.tag = tagName;
  } else if (_hasOwnProperty$1.call(state.tagMap, tagHandle)) {
    state.tag = state.tagMap[tagHandle] + tagName;
  } else if (tagHandle === "!") {
    state.tag = "!" + tagName;
  } else if (tagHandle === "!!") {
    state.tag = "tag:yaml.org,2002:" + tagName;
  } else {
    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
  }
  return true;
}
function readAnchorProperty(state) {
  var _position, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 38)
    return false;
  if (state.anchor !== null) {
    throwError(state, "duplication of an anchor property");
  }
  ch = state.input.charCodeAt(++state.position);
  _position = state.position;
  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }
  if (state.position === _position) {
    throwError(state, "name of an anchor node must contain at least one character");
  }
  state.anchor = state.input.slice(_position, state.position);
  return true;
}
function readAlias(state) {
  var _position, alias, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 42)
    return false;
  ch = state.input.charCodeAt(++state.position);
  _position = state.position;
  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }
  if (state.position === _position) {
    throwError(state, "name of an alias node must contain at least one character");
  }
  alias = state.input.slice(_position, state.position);
  if (!_hasOwnProperty$1.call(state.anchorMap, alias)) {
    throwError(state, 'unidentified alias "' + alias + '"');
  }
  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}
function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
  var allowBlockStyles, allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, typeIndex, typeQuantity, typeList, type2, flowIndent, blockIndent;
  if (state.listener !== null) {
    state.listener("open", state);
  }
  state.tag = null;
  state.anchor = null;
  state.kind = null;
  state.result = null;
  allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
  if (allowToSeek) {
    if (skipSeparationSpace(state, true, -1)) {
      atNewLine = true;
      if (state.lineIndent > parentIndent) {
        indentStatus = 1;
      } else if (state.lineIndent === parentIndent) {
        indentStatus = 0;
      } else if (state.lineIndent < parentIndent) {
        indentStatus = -1;
      }
    }
  }
  if (indentStatus === 1) {
    while (readTagProperty(state) || readAnchorProperty(state)) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        allowBlockCollections = allowBlockStyles;
        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      } else {
        allowBlockCollections = false;
      }
    }
  }
  if (allowBlockCollections) {
    allowBlockCollections = atNewLine || allowCompact;
  }
  if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
    if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
      flowIndent = parentIndent;
    } else {
      flowIndent = parentIndent + 1;
    }
    blockIndent = state.position - state.lineStart;
    if (indentStatus === 1) {
      if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
        hasContent = true;
      } else {
        if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
          hasContent = true;
        } else if (readAlias(state)) {
          hasContent = true;
          if (state.tag !== null || state.anchor !== null) {
            throwError(state, "alias node should not have any properties");
          }
        } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
          hasContent = true;
          if (state.tag === null) {
            state.tag = "?";
          }
        }
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else if (indentStatus === 0) {
      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
    }
  }
  if (state.tag === null) {
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = state.result;
    }
  } else if (state.tag === "?") {
    if (state.result !== null && state.kind !== "scalar") {
      throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
    }
    for (typeIndex = 0, typeQuantity = state.implicitTypes.length;typeIndex < typeQuantity; typeIndex += 1) {
      type2 = state.implicitTypes[typeIndex];
      if (type2.resolve(state.result)) {
        state.result = type2.construct(state.result);
        state.tag = type2.tag;
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
        break;
      }
    }
  } else if (state.tag !== "!") {
    if (_hasOwnProperty$1.call(state.typeMap[state.kind || "fallback"], state.tag)) {
      type2 = state.typeMap[state.kind || "fallback"][state.tag];
    } else {
      type2 = null;
      typeList = state.typeMap.multi[state.kind || "fallback"];
      for (typeIndex = 0, typeQuantity = typeList.length;typeIndex < typeQuantity; typeIndex += 1) {
        if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
          type2 = typeList[typeIndex];
          break;
        }
      }
    }
    if (!type2) {
      throwError(state, "unknown tag !<" + state.tag + ">");
    }
    if (state.result !== null && type2.kind !== state.kind) {
      throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type2.kind + '", not "' + state.kind + '"');
    }
    if (!type2.resolve(state.result, state.tag)) {
      throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
    } else {
      state.result = type2.construct(state.result, state.tag);
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = state.result;
      }
    }
  }
  if (state.listener !== null) {
    state.listener("close", state);
  }
  return state.tag !== null || state.anchor !== null || hasContent;
}
function readDocument(state) {
  var documentStart = state.position, _position, directiveName, directiveArgs, hasDirectives = false, ch;
  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = Object.create(null);
  state.anchorMap = Object.create(null);
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    skipSeparationSpace(state, true, -1);
    ch = state.input.charCodeAt(state.position);
    if (state.lineIndent > 0 || ch !== 37) {
      break;
    }
    hasDirectives = true;
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    directiveName = state.input.slice(_position, state.position);
    directiveArgs = [];
    if (directiveName.length < 1) {
      throwError(state, "directive name must not be less than one character in length");
    }
    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0 && !is_EOL(ch));
        break;
      }
      if (is_EOL(ch))
        break;
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      directiveArgs.push(state.input.slice(_position, state.position));
    }
    if (ch !== 0)
      readLineBreak(state);
    if (_hasOwnProperty$1.call(directiveHandlers, directiveName)) {
      directiveHandlers[directiveName](state, directiveName, directiveArgs);
    } else {
      throwWarning(state, 'unknown document directive "' + directiveName + '"');
    }
  }
  skipSeparationSpace(state, true, -1);
  if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
    state.position += 3;
    skipSeparationSpace(state, true, -1);
  } else if (hasDirectives) {
    throwError(state, "directives end mark is expected");
  }
  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
  skipSeparationSpace(state, true, -1);
  if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
    throwWarning(state, "non-ASCII line breaks are interpreted as content");
  }
  state.documents.push(state.result);
  if (state.position === state.lineStart && testDocumentSeparator(state)) {
    if (state.input.charCodeAt(state.position) === 46) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    }
    return;
  }
  if (state.position < state.length - 1) {
    throwError(state, "end of the stream or a document separator is expected");
  } else {
    return;
  }
}
function loadDocuments(input, options) {
  input = String(input);
  options = options || {};
  if (input.length !== 0) {
    if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
      input += `
`;
    }
    if (input.charCodeAt(0) === 65279) {
      input = input.slice(1);
    }
  }
  var state = new State$1(input, options);
  var nullpos = input.indexOf("\x00");
  if (nullpos !== -1) {
    state.position = nullpos;
    throwError(state, "null byte is not allowed in input");
  }
  state.input += "\x00";
  while (state.input.charCodeAt(state.position) === 32) {
    state.lineIndent += 1;
    state.position += 1;
  }
  while (state.position < state.length - 1) {
    readDocument(state);
  }
  return state.documents;
}
function loadAll$1(input, iterator, options) {
  if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
    options = iterator;
    iterator = null;
  }
  var documents = loadDocuments(input, options);
  if (typeof iterator !== "function") {
    return documents;
  }
  for (var index = 0, length = documents.length;index < length; index += 1) {
    iterator(documents[index]);
  }
}
function load$1(input, options) {
  var documents = loadDocuments(input, options);
  if (documents.length === 0) {
    return;
  } else if (documents.length === 1) {
    return documents[0];
  }
  throw new exception("expected a single document in the stream, but found more");
}
var loadAll_1 = loadAll$1;
var load_1 = load$1;
var loader = {
  loadAll: loadAll_1,
  load: load_1
};
var _toString = Object.prototype.toString;
var _hasOwnProperty = Object.prototype.hasOwnProperty;
var CHAR_BOM = 65279;
var CHAR_TAB = 9;
var CHAR_LINE_FEED = 10;
var CHAR_CARRIAGE_RETURN = 13;
var CHAR_SPACE = 32;
var CHAR_EXCLAMATION = 33;
var CHAR_DOUBLE_QUOTE = 34;
var CHAR_SHARP = 35;
var CHAR_PERCENT = 37;
var CHAR_AMPERSAND = 38;
var CHAR_SINGLE_QUOTE = 39;
var CHAR_ASTERISK = 42;
var CHAR_COMMA = 44;
var CHAR_MINUS = 45;
var CHAR_COLON = 58;
var CHAR_EQUALS = 61;
var CHAR_GREATER_THAN = 62;
var CHAR_QUESTION = 63;
var CHAR_COMMERCIAL_AT = 64;
var CHAR_LEFT_SQUARE_BRACKET = 91;
var CHAR_RIGHT_SQUARE_BRACKET = 93;
var CHAR_GRAVE_ACCENT = 96;
var CHAR_LEFT_CURLY_BRACKET = 123;
var CHAR_VERTICAL_LINE = 124;
var CHAR_RIGHT_CURLY_BRACKET = 125;
var ESCAPE_SEQUENCES = {};
ESCAPE_SEQUENCES[0] = "\\0";
ESCAPE_SEQUENCES[7] = "\\a";
ESCAPE_SEQUENCES[8] = "\\b";
ESCAPE_SEQUENCES[9] = "\\t";
ESCAPE_SEQUENCES[10] = "\\n";
ESCAPE_SEQUENCES[11] = "\\v";
ESCAPE_SEQUENCES[12] = "\\f";
ESCAPE_SEQUENCES[13] = "\\r";
ESCAPE_SEQUENCES[27] = "\\e";
ESCAPE_SEQUENCES[34] = "\\\"";
ESCAPE_SEQUENCES[92] = "\\\\";
ESCAPE_SEQUENCES[133] = "\\N";
ESCAPE_SEQUENCES[160] = "\\_";
ESCAPE_SEQUENCES[8232] = "\\L";
ESCAPE_SEQUENCES[8233] = "\\P";
var DEPRECATED_BOOLEANS_SYNTAX = [
  "y",
  "Y",
  "yes",
  "Yes",
  "YES",
  "on",
  "On",
  "ON",
  "n",
  "N",
  "no",
  "No",
  "NO",
  "off",
  "Off",
  "OFF"
];
var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
function compileStyleMap(schema2, map2) {
  var result, keys, index, length, tag, style, type2;
  if (map2 === null)
    return {};
  result = {};
  keys = Object.keys(map2);
  for (index = 0, length = keys.length;index < length; index += 1) {
    tag = keys[index];
    style = String(map2[tag]);
    if (tag.slice(0, 2) === "!!") {
      tag = "tag:yaml.org,2002:" + tag.slice(2);
    }
    type2 = schema2.compiledTypeMap["fallback"][tag];
    if (type2 && _hasOwnProperty.call(type2.styleAliases, style)) {
      style = type2.styleAliases[style];
    }
    result[tag] = style;
  }
  return result;
}
function encodeHex(character) {
  var string, handle, length;
  string = character.toString(16).toUpperCase();
  if (character <= 255) {
    handle = "x";
    length = 2;
  } else if (character <= 65535) {
    handle = "u";
    length = 4;
  } else if (character <= 4294967295) {
    handle = "U";
    length = 8;
  } else {
    throw new exception("code point within a string may not be greater than 0xFFFFFFFF");
  }
  return "\\" + handle + common.repeat("0", length - string.length) + string;
}
var QUOTING_TYPE_SINGLE = 1;
var QUOTING_TYPE_DOUBLE = 2;
function State(options) {
  this.schema = options["schema"] || _default;
  this.indent = Math.max(1, options["indent"] || 2);
  this.noArrayIndent = options["noArrayIndent"] || false;
  this.skipInvalid = options["skipInvalid"] || false;
  this.flowLevel = common.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
  this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
  this.sortKeys = options["sortKeys"] || false;
  this.lineWidth = options["lineWidth"] || 80;
  this.noRefs = options["noRefs"] || false;
  this.noCompatMode = options["noCompatMode"] || false;
  this.condenseFlow = options["condenseFlow"] || false;
  this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
  this.forceQuotes = options["forceQuotes"] || false;
  this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
  this.implicitTypes = this.schema.compiledImplicit;
  this.explicitTypes = this.schema.compiledExplicit;
  this.tag = null;
  this.result = "";
  this.duplicates = [];
  this.usedDuplicates = null;
}
function indentString(string, spaces) {
  var ind = common.repeat(" ", spaces), position = 0, next = -1, result = "", line, length = string.length;
  while (position < length) {
    next = string.indexOf(`
`, position);
    if (next === -1) {
      line = string.slice(position);
      position = length;
    } else {
      line = string.slice(position, next + 1);
      position = next + 1;
    }
    if (line.length && line !== `
`)
      result += ind;
    result += line;
  }
  return result;
}
function generateNextLine(state, level) {
  return `
` + common.repeat(" ", state.indent * level);
}
function testImplicitResolving(state, str2) {
  var index, length, type2;
  for (index = 0, length = state.implicitTypes.length;index < length; index += 1) {
    type2 = state.implicitTypes[index];
    if (type2.resolve(str2)) {
      return true;
    }
  }
  return false;
}
function isWhitespace(c) {
  return c === CHAR_SPACE || c === CHAR_TAB;
}
function isPrintable(c) {
  return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== CHAR_BOM || 65536 <= c && c <= 1114111;
}
function isNsCharOrWhitespace(c) {
  return isPrintable(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
}
function isPlainSafe(c, prev, inblock) {
  var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
  var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
  return (inblock ? cIsNsCharOrWhitespace : cIsNsCharOrWhitespace && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && c !== CHAR_SHARP && !(prev === CHAR_COLON && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || prev === CHAR_COLON && cIsNsChar;
}
function isPlainSafeFirst(c) {
  return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
}
function isPlainSafeLast(c) {
  return !isWhitespace(c) && c !== CHAR_COLON;
}
function codePointAt(string, pos) {
  var first = string.charCodeAt(pos), second;
  if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
    second = string.charCodeAt(pos + 1);
    if (second >= 56320 && second <= 57343) {
      return (first - 55296) * 1024 + second - 56320 + 65536;
    }
  }
  return first;
}
function needIndentIndicator(string) {
  var leadingSpaceRe = /^\n* /;
  return leadingSpaceRe.test(string);
}
var STYLE_PLAIN = 1;
var STYLE_SINGLE = 2;
var STYLE_LITERAL = 3;
var STYLE_FOLDED = 4;
var STYLE_DOUBLE = 5;
function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
  var i2;
  var char = 0;
  var prevChar = null;
  var hasLineBreak = false;
  var hasFoldableLine = false;
  var shouldTrackWidth = lineWidth !== -1;
  var previousLineBreak = -1;
  var plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
  if (singleLineOnly || forceQuotes) {
    for (i2 = 0;i2 < string.length; char >= 65536 ? i2 += 2 : i2++) {
      char = codePointAt(string, i2);
      if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
  } else {
    for (i2 = 0;i2 < string.length; char >= 65536 ? i2 += 2 : i2++) {
      char = codePointAt(string, i2);
      if (char === CHAR_LINE_FEED) {
        hasLineBreak = true;
        if (shouldTrackWidth) {
          hasFoldableLine = hasFoldableLine || i2 - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
          previousLineBreak = i2;
        }
      } else if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
    hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i2 - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
  }
  if (!hasLineBreak && !hasFoldableLine) {
    if (plain && !forceQuotes && !testAmbiguousType(string)) {
      return STYLE_PLAIN;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  if (indentPerLevel > 9 && needIndentIndicator(string)) {
    return STYLE_DOUBLE;
  }
  if (!forceQuotes) {
    return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
  }
  return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
}
function writeScalar(state, string, level, iskey, inblock) {
  state.dump = function() {
    if (string.length === 0) {
      return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
    }
    if (!state.noCompatMode) {
      if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
      }
    }
    var indent = state.indent * Math.max(1, level);
    var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
    var singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
    function testAmbiguity(string2) {
      return testImplicitResolving(state, string2);
    }
    switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity, state.quotingType, state.forceQuotes && !iskey, inblock)) {
      case STYLE_PLAIN:
        return string;
      case STYLE_SINGLE:
        return "'" + string.replace(/'/g, "''") + "'";
      case STYLE_LITERAL:
        return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
      case STYLE_FOLDED:
        return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
      case STYLE_DOUBLE:
        return '"' + escapeString(string) + '"';
      default:
        throw new exception("impossible error: invalid scalar style");
    }
  }();
}
function blockHeader(string, indentPerLevel) {
  var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
  var clip = string[string.length - 1] === `
`;
  var keep = clip && (string[string.length - 2] === `
` || string === `
`);
  var chomp = keep ? "+" : clip ? "" : "-";
  return indentIndicator + chomp + `
`;
}
function dropEndingNewline(string) {
  return string[string.length - 1] === `
` ? string.slice(0, -1) : string;
}
function foldString(string, width) {
  var lineRe = /(\n+)([^\n]*)/g;
  var result = function() {
    var nextLF = string.indexOf(`
`);
    nextLF = nextLF !== -1 ? nextLF : string.length;
    lineRe.lastIndex = nextLF;
    return foldLine(string.slice(0, nextLF), width);
  }();
  var prevMoreIndented = string[0] === `
` || string[0] === " ";
  var moreIndented;
  var match;
  while (match = lineRe.exec(string)) {
    var prefix = match[1], line = match[2];
    moreIndented = line[0] === " ";
    result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? `
` : "") + foldLine(line, width);
    prevMoreIndented = moreIndented;
  }
  return result;
}
function foldLine(line, width) {
  if (line === "" || line[0] === " ")
    return line;
  var breakRe = / [^ ]/g;
  var match;
  var start = 0, end, curr = 0, next = 0;
  var result = "";
  while (match = breakRe.exec(line)) {
    next = match.index;
    if (next - start > width) {
      end = curr > start ? curr : next;
      result += `
` + line.slice(start, end);
      start = end + 1;
    }
    curr = next;
  }
  result += `
`;
  if (line.length - start > width && curr > start) {
    result += line.slice(start, curr) + `
` + line.slice(curr + 1);
  } else {
    result += line.slice(start);
  }
  return result.slice(1);
}
function escapeString(string) {
  var result = "";
  var char = 0;
  var escapeSeq;
  for (var i2 = 0;i2 < string.length; char >= 65536 ? i2 += 2 : i2++) {
    char = codePointAt(string, i2);
    escapeSeq = ESCAPE_SEQUENCES[char];
    if (!escapeSeq && isPrintable(char)) {
      result += string[i2];
      if (char >= 65536)
        result += string[i2 + 1];
    } else {
      result += escapeSeq || encodeHex(char);
    }
  }
  return result;
}
function writeFlowSequence(state, level, object) {
  var _result = "", _tag = state.tag, index, length, value;
  for (index = 0, length = object.length;index < length; index += 1) {
    value = object[index];
    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }
    if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
      if (_result !== "")
        _result += "," + (!state.condenseFlow ? " " : "");
      _result += state.dump;
    }
  }
  state.tag = _tag;
  state.dump = "[" + _result + "]";
}
function writeBlockSequence(state, level, object, compact) {
  var _result = "", _tag = state.tag, index, length, value;
  for (index = 0, length = object.length;index < length; index += 1) {
    value = object[index];
    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }
    if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
      if (!compact || _result !== "") {
        _result += generateNextLine(state, level);
      }
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        _result += "-";
      } else {
        _result += "- ";
      }
      _result += state.dump;
    }
  }
  state.tag = _tag;
  state.dump = _result || "[]";
}
function writeFlowMapping(state, level, object) {
  var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, pairBuffer;
  for (index = 0, length = objectKeyList.length;index < length; index += 1) {
    pairBuffer = "";
    if (_result !== "")
      pairBuffer += ", ";
    if (state.condenseFlow)
      pairBuffer += '"';
    objectKey = objectKeyList[index];
    objectValue = object[objectKey];
    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }
    if (!writeNode(state, level, objectKey, false, false)) {
      continue;
    }
    if (state.dump.length > 1024)
      pairBuffer += "? ";
    pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
    if (!writeNode(state, level, objectValue, false, false)) {
      continue;
    }
    pairBuffer += state.dump;
    _result += pairBuffer;
  }
  state.tag = _tag;
  state.dump = "{" + _result + "}";
}
function writeBlockMapping(state, level, object, compact) {
  var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, explicitPair, pairBuffer;
  if (state.sortKeys === true) {
    objectKeyList.sort();
  } else if (typeof state.sortKeys === "function") {
    objectKeyList.sort(state.sortKeys);
  } else if (state.sortKeys) {
    throw new exception("sortKeys must be a boolean or a function");
  }
  for (index = 0, length = objectKeyList.length;index < length; index += 1) {
    pairBuffer = "";
    if (!compact || _result !== "") {
      pairBuffer += generateNextLine(state, level);
    }
    objectKey = objectKeyList[index];
    objectValue = object[objectKey];
    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }
    if (!writeNode(state, level + 1, objectKey, true, true, true)) {
      continue;
    }
    explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
    if (explicitPair) {
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += "?";
      } else {
        pairBuffer += "? ";
      }
    }
    pairBuffer += state.dump;
    if (explicitPair) {
      pairBuffer += generateNextLine(state, level);
    }
    if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
      continue;
    }
    if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
      pairBuffer += ":";
    } else {
      pairBuffer += ": ";
    }
    pairBuffer += state.dump;
    _result += pairBuffer;
  }
  state.tag = _tag;
  state.dump = _result || "{}";
}
function detectType(state, object, explicit) {
  var _result, typeList, index, length, type2, style;
  typeList = explicit ? state.explicitTypes : state.implicitTypes;
  for (index = 0, length = typeList.length;index < length; index += 1) {
    type2 = typeList[index];
    if ((type2.instanceOf || type2.predicate) && (!type2.instanceOf || typeof object === "object" && object instanceof type2.instanceOf) && (!type2.predicate || type2.predicate(object))) {
      if (explicit) {
        if (type2.multi && type2.representName) {
          state.tag = type2.representName(object);
        } else {
          state.tag = type2.tag;
        }
      } else {
        state.tag = "?";
      }
      if (type2.represent) {
        style = state.styleMap[type2.tag] || type2.defaultStyle;
        if (_toString.call(type2.represent) === "[object Function]") {
          _result = type2.represent(object, style);
        } else if (_hasOwnProperty.call(type2.represent, style)) {
          _result = type2.represent[style](object, style);
        } else {
          throw new exception("!<" + type2.tag + '> tag resolver accepts not "' + style + '" style');
        }
        state.dump = _result;
      }
      return true;
    }
  }
  return false;
}
function writeNode(state, level, object, block, compact, iskey, isblockseq) {
  state.tag = null;
  state.dump = object;
  if (!detectType(state, object, false)) {
    detectType(state, object, true);
  }
  var type2 = _toString.call(state.dump);
  var inblock = block;
  var tagStr;
  if (block) {
    block = state.flowLevel < 0 || state.flowLevel > level;
  }
  var objectOrArray = type2 === "[object Object]" || type2 === "[object Array]", duplicateIndex, duplicate;
  if (objectOrArray) {
    duplicateIndex = state.duplicates.indexOf(object);
    duplicate = duplicateIndex !== -1;
  }
  if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
    compact = false;
  }
  if (duplicate && state.usedDuplicates[duplicateIndex]) {
    state.dump = "*ref_" + duplicateIndex;
  } else {
    if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
      state.usedDuplicates[duplicateIndex] = true;
    }
    if (type2 === "[object Object]") {
      if (block && Object.keys(state.dump).length !== 0) {
        writeBlockMapping(state, level, state.dump, compact);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + state.dump;
        }
      } else {
        writeFlowMapping(state, level, state.dump);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + " " + state.dump;
        }
      }
    } else if (type2 === "[object Array]") {
      if (block && state.dump.length !== 0) {
        if (state.noArrayIndent && !isblockseq && level > 0) {
          writeBlockSequence(state, level - 1, state.dump, compact);
        } else {
          writeBlockSequence(state, level, state.dump, compact);
        }
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + state.dump;
        }
      } else {
        writeFlowSequence(state, level, state.dump);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + " " + state.dump;
        }
      }
    } else if (type2 === "[object String]") {
      if (state.tag !== "?") {
        writeScalar(state, state.dump, level, iskey, inblock);
      }
    } else if (type2 === "[object Undefined]") {
      return false;
    } else {
      if (state.skipInvalid)
        return false;
      throw new exception("unacceptable kind of an object to dump " + type2);
    }
    if (state.tag !== null && state.tag !== "?") {
      tagStr = encodeURI(state.tag[0] === "!" ? state.tag.slice(1) : state.tag).replace(/!/g, "%21");
      if (state.tag[0] === "!") {
        tagStr = "!" + tagStr;
      } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
        tagStr = "!!" + tagStr.slice(18);
      } else {
        tagStr = "!<" + tagStr + ">";
      }
      state.dump = tagStr + " " + state.dump;
    }
  }
  return true;
}
function getDuplicateReferences(object, state) {
  var objects = [], duplicatesIndexes = [], index, length;
  inspectNode(object, objects, duplicatesIndexes);
  for (index = 0, length = duplicatesIndexes.length;index < length; index += 1) {
    state.duplicates.push(objects[duplicatesIndexes[index]]);
  }
  state.usedDuplicates = new Array(length);
}
function inspectNode(object, objects, duplicatesIndexes) {
  var objectKeyList, index, length;
  if (object !== null && typeof object === "object") {
    index = objects.indexOf(object);
    if (index !== -1) {
      if (duplicatesIndexes.indexOf(index) === -1) {
        duplicatesIndexes.push(index);
      }
    } else {
      objects.push(object);
      if (Array.isArray(object)) {
        for (index = 0, length = object.length;index < length; index += 1) {
          inspectNode(object[index], objects, duplicatesIndexes);
        }
      } else {
        objectKeyList = Object.keys(object);
        for (index = 0, length = objectKeyList.length;index < length; index += 1) {
          inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
        }
      }
    }
  }
}
function dump$1(input, options) {
  options = options || {};
  var state = new State(options);
  if (!state.noRefs)
    getDuplicateReferences(input, state);
  var value = input;
  if (state.replacer) {
    value = state.replacer.call({ "": value }, "", value);
  }
  if (writeNode(state, 0, value, true, true))
    return state.dump + `
`;
  return "";
}
var dump_1 = dump$1;
var dumper = {
  dump: dump_1
};
function renamed(from, to) {
  return function() {
    throw new Error("Function yaml." + from + " is removed in js-yaml 4. " + "Use yaml." + to + " instead, which is now safe by default.");
  };
}
var Type = type;
var Schema = schema;
var FAILSAFE_SCHEMA = failsafe;
var JSON_SCHEMA = json;
var CORE_SCHEMA = core;
var DEFAULT_SCHEMA = _default;
var load = loader.load;
var loadAll = loader.loadAll;
var dump = dumper.dump;
var YAMLException = exception;
var types = {
  binary,
  float,
  map,
  null: _null,
  pairs,
  set,
  timestamp,
  bool,
  int,
  merge,
  omap,
  seq,
  str
};
var safeLoad = renamed("safeLoad", "load");
var safeLoadAll = renamed("safeLoadAll", "loadAll");
var safeDump = renamed("safeDump", "dump");
var jsYaml = {
  Type,
  Schema,
  FAILSAFE_SCHEMA,
  JSON_SCHEMA,
  CORE_SCHEMA,
  DEFAULT_SCHEMA,
  load,
  loadAll,
  dump,
  YAMLException,
  types,
  safeLoad,
  safeLoadAll,
  safeDump
};

// src/server/serverClasses/Server_Docker.ts
import path2 from "path";

// src/runtimes.ts
var RUN_TIMES = ["node", "web", "python", "golang", "java", "rust", "ruby"];

// src/server/runtimes/golang/docker.ts
import { join } from "path";

// src/server/runtimes/dockerComposeFile.ts
var dockerComposeFile = (config, container_name, projectConfigPath, nodeConfigPath, testName, command, tests) => {
  return {
    build: {
      context: process.cwd(),
      dockerfile: config.runtimes[container_name].dockerfile
    },
    container_name,
    environment: {
      NODE_ENV: "production",
      ...config.env
    },
    working_dir: "/workspace",
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/testeranto:/workspace/testeranto`
    ],
    command: command(projectConfigPath, nodeConfigPath, testName, tests)
  };
};

// src/server/runtimes/golang/main.go
var main_default = `package main

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"

	// "log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// Package struct maps the fields we need from 'go list'
type Package struct {
	ImportPath   string   \`json:"ImportPath"\`
	Dir          string   \`json:"Dir"\`
	GoFiles      []string \`json:"GoFiles"\`
	CgoFiles     []string \`json:"CgoFiles"\`
	CFiles       []string \`json:"CFiles"\`
	CXXFiles     []string \`json:"CXXFiles"\`
	HFiles       []string \`json:"HFiles"\`
	SFiles       []string \`json:"SFiles"\`
	SwigFiles    []string \`json:"SwigFiles"\`
	SwigCXXFiles []string \`json:"SwigCXXFiles"\`
	SysoFiles    []string \`json:"SysoFiles"\`
	EmbedFiles   []string \`json:"EmbedFiles"\`
	TestGoFiles  []string \`json:"TestGoFiles"\`
	Module       *struct {
		Main bool \`json:"Main"\`
	} \`json:"Module"\`
}

// TestEntry represents a test entry in the metafile
type TestEntry struct {
	Name   string   \`json:"name"\`
	Path   string   \`json:"path"\`
	Inputs []string \`json:"inputs"\`
	Output string   \`json:"output"\`
}

// Metafile structure matching esbuild format
type Metafile struct {
	Inputs  map[string]InputEntry  \`json:"inputs"\`
	Outputs map[string]OutputEntry \`json:"outputs"\`
}

// InputEntry represents an input file
type InputEntry struct {
	Bytes   int      \`json:"bytes"\`
	Imports []string \`json:"imports"\`
}

// OutputEntry represents an output entry
type OutputEntry struct {
	Imports    []string               \`json:"imports"\`
	Exports    []string               \`json:"exports"\`
	EntryPoint string                 \`json:"entryPoint"\`
	Inputs     map[string]InputDetail \`json:"inputs"\`
	Bytes      int                    \`json:"bytes"\`
}

// InputDetail represents input file details in output
type InputDetail struct {
	BytesInOutput int \`json:"bytesInOutput"\`
}

func computeFilesHash(files []string) (string, error) {
	hash := md5.New()
	for _, file := range files {
		absPath := filepath.Join("/workspace", file)
		// Add file path to hash
		hash.Write([]byte(file))

		// Add file stats to hash
		info, err := os.Stat(absPath)
		if err == nil {
			hash.Write([]byte(info.ModTime().String()))
			hash.Write([]byte(fmt.Sprintf("%d", info.Size())))
		} else {
			hash.Write([]byte("missing"))
		}
	}
	return hex.EncodeToString(hash.Sum(nil)), nil
}

func main() {
	// Force output to be visible
	fmt.Fprintln(os.Stdout, "\uD83D\uDE80 Go builder starting...")
	fmt.Fprintln(os.Stderr, "\uD83D\uDE80 Go builder starting (stderr)...")
	os.Stdout.Sync()
	os.Stderr.Sync()

	// Parse command line arguments similar to Rust builder
	// Expected: main.go <project_config> <golang_config> <test_name> <entry_points...>
	args := os.Args
	if len(args) < 4 {
		fmt.Fprintln(os.Stderr, "\u274C Insufficient arguments")
		fmt.Fprintln(os.Stderr, "Usage: main.go <project_config> <golang_config> <test_name> <entry_points...>")
		os.Exit(1)
	}

	// projectConfigPath := args[1]
	// golangConfigPath := args[2]
	testName := args[3]
	entryPoints := args[4:]

	fmt.Printf("Test name: %s\\n", testName)
	fmt.Printf("Entry points: %v\\n", entryPoints)

	if len(entryPoints) == 0 {
		fmt.Fprintln(os.Stderr, "\u274C No entry points provided")
		os.Exit(1)
	}

	// Change to workspace directory
	workspace := "/workspace"
	if err := os.Chdir(workspace); err != nil {
		fmt.Fprintf(os.Stderr, "\u274C Failed to change to workspace directory: %v\\n", err)
		os.Exit(1)
	}

	// Create bundles directory
	bundlesDir := filepath.Join(workspace, "testeranto/bundles", testName)
	if err := os.MkdirAll(bundlesDir, 0755); err != nil {
		fmt.Fprintf(os.Stderr, "\u274C Failed to create bundles directory: %v\\n", err)
		os.Exit(1)
	}

	// Process each entry point
	for _, entryPoint := range entryPoints {
		fmt.Printf("\\n\uD83D\uDCE6 Processing Go test: %s\\n", entryPoint)

		// Get entry point path
		entryPointPath := filepath.Join(workspace, entryPoint)
		if _, err := os.Stat(entryPointPath); err != nil {
			fmt.Fprintf(os.Stderr, "  \u274C Entry point does not exist: %s\\n", entryPointPath)
			os.Exit(1)
		}

		// Get base name (without .go extension)
		fileName := filepath.Base(entryPoint)
		if !strings.HasSuffix(fileName, ".go") {
			fmt.Fprintf(os.Stderr, "  \u274C Entry point is not a Go file: %s\\n", entryPoint)
			os.Exit(1)
		}
		baseName := strings.TrimSuffix(fileName, ".go")
		// Replace dots with underscores to make a valid binary name
		binaryName := strings.ReplaceAll(baseName, ".", "_")

		// Find module root
		moduleRoot := findModuleRoot(entryPointPath)
		if moduleRoot == "" {
			fmt.Fprintf(os.Stderr, "  \u274C Cannot find go.mod in or above %s\\n", entryPointPath)
			os.Exit(1)
		}

		// Change to module root directory
		if err := os.Chdir(moduleRoot); err != nil {
			fmt.Fprintf(os.Stderr, "  \u274C Cannot change to module root %s: %v\\n", moduleRoot, err)
			os.Exit(1)
		}

		// Get relative path from module root to entry point
		relEntryPath, err := filepath.Rel(moduleRoot, entryPointPath)
		if err != nil {
			fmt.Fprintf(os.Stderr, "  \u274C Failed to get relative path: %v\\n", err)
			os.Exit(1)
		}

		// Go modules handle dependencies automatically
		// The build will succeed or fail based on go.mod correctness
		fmt.Printf("  Building with Go modules...\\n")
		
		// Ensure dependencies are up to date, especially for local modules
		// First, remove go.sum to force fresh resolution
		goSumPath := filepath.Join(moduleRoot, "go.sum")
		if _, err := os.Stat(goSumPath); err == nil {
			fmt.Printf("  Removing go.sum to force fresh dependency resolution...\\n")
			os.Remove(goSumPath)
		}
		
		fmt.Printf("  Running go mod tidy...\\n")
		tidyCmd := exec.Command("go", "mod", "tidy")
		tidyCmd.Stdout = os.Stdout
		tidyCmd.Stderr = os.Stderr
		tidyCmd.Dir = moduleRoot
		if err := tidyCmd.Run(); err != nil {
			fmt.Printf("  \u26A0\uFE0F  go mod tidy failed: %v\\n", err)
			// Continue anyway, as the build might still work
		}

		// Collect input files in a simple way, similar to rust builder
		var inputs []string
		
		// Add the entry point file itself
		relEntryToWorkspace, err := filepath.Rel(workspace, entryPointPath)
		if err == nil && !strings.HasPrefix(relEntryToWorkspace, "..") {
			inputs = append(inputs, relEntryToWorkspace)
		} else {
			// Fallback
			inputs = append(inputs, entryPoint)
		}
		
		// Add go.mod and go.sum if they exist
		goModPath := filepath.Join(moduleRoot, "go.mod")
		goSumPath := filepath.Join(moduleRoot, "go.sum")
		fmt.Printf("  Module root: %s\\n", moduleRoot)
		fmt.Printf("  go.mod path: %s\\n", goModPath)
		for _, filePath := range []string{goModPath, goSumPath} {
			if _, err := os.Stat(filePath); err == nil {
				relToWorkspace, err := filepath.Rel(workspace, filePath)
				if err == nil && !strings.HasPrefix(relToWorkspace, "..") {
					inputs = append(inputs, relToWorkspace)
				}
			} else {
				fmt.Printf("  \u26A0\uFE0F  File not found: %s\\n", filePath)
			}
		}
		
		// Add all .go files in the module root and subdirectories
		// This is similar to rust builder which adds all .rs files in src/
		err = filepath.Walk(moduleRoot, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return nil // skip errors
			}
			if !info.IsDir() && strings.HasSuffix(path, ".go") {
				relToWorkspace, err := filepath.Rel(workspace, path)
				if err == nil && !strings.HasPrefix(relToWorkspace, "..") {
					inputs = append(inputs, relToWorkspace)
				}
			}
			return nil
		})
		if err != nil {
			fmt.Printf("  \u26A0\uFE0F  Warning while walking directory: %v\\n", err)
		}
		
		fmt.Printf("  Found %d input files (simplified collection)\\n", len(inputs))

		// Compute hash
		testHash, err := computeFilesHash(inputs)
		if err != nil {
			fmt.Printf("  \u26A0\uFE0F  Failed to compute hash: %v\\n", err)
			testHash = "error"
		}

		// Create inputFiles.json
		inputFilesBasename := strings.ReplaceAll(entryPoint, "/", "_") + "-inputFiles.json"
		inputFilesPath := filepath.Join(bundlesDir, inputFilesBasename)
		inputFilesJSON, err := json.MarshalIndent(inputs, "", "  ")
		if err != nil {
			fmt.Fprintf(os.Stderr, "  \u274C Failed to marshal inputFiles.json: %v\\n", err)
			os.Exit(1)
		}
		if err := os.WriteFile(inputFilesPath, inputFilesJSON, 0644); err != nil {
			fmt.Fprintf(os.Stderr, "  \u274C Failed to write inputFiles.json: %v\\n", err)
			os.Exit(1)
		}
		fmt.Printf("  \u2705 Created inputFiles.json at %s\\n", inputFilesPath)

		// Compile the binary
		outputExePath := filepath.Join(bundlesDir, binaryName)
		fmt.Printf("  \uD83D\uDD28 Compiling %s to %s...\\n", relEntryPath, outputExePath)

		// Build the entire package directory, not just the single file
		// Get the directory containing the entry point
		entryDir := filepath.Dir(relEntryPath)
		if entryDir == "." {
			entryDir = "./"
		}
		
		// List all .go files in the entry directory for debugging
		fmt.Printf("  \uD83D\uDCC1 Building package in directory: %s\\n", entryDir)
		goFiles, _ := filepath.Glob(filepath.Join(entryDir, "*.go"))
		fmt.Printf("  \uD83D\uDCC4 Found %d .go files in package:\\n", len(goFiles))
		for _, f := range goFiles {
			fmt.Printf("    - %s\\n", filepath.Base(f))
		}
		
		// Build the package in that directory
		// Use ./... pattern to build all packages in the directory
		// First, ensure all dependencies are built
		buildDepsCmd := exec.Command("go", "build", "./...")
		buildDepsCmd.Stdout = os.Stdout
		buildDepsCmd.Stderr = os.Stderr
		buildDepsCmd.Dir = moduleRoot
		if err := buildDepsCmd.Run(); err != nil {
			fmt.Printf("  \u26A0\uFE0F  Failed to build dependencies: %v\\n", err)
			// Continue anyway, as the main build might still work
		}
		
		buildCmd := exec.Command("go", "build", "-o", outputExePath, "./"+entryDir)
		buildCmd.Stdout = os.Stdout
		buildCmd.Stderr = os.Stderr
		buildCmd.Dir = moduleRoot

		if err := buildCmd.Run(); err != nil {
			fmt.Fprintf(os.Stderr, "  \u274C Failed to compile: %v\\n", err)
			fmt.Fprintf(os.Stderr, "  \uD83D\uDCA1 Go module dependency error.\\n")
			fmt.Fprintf(os.Stderr, "  \uD83D\uDCA1 This could be due to:\\n")
			fmt.Fprintf(os.Stderr, "  \uD83D\uDCA1 1. Missing or incorrect module structure\\n")
			fmt.Fprintf(os.Stderr, "  \uD83D\uDCA1 2. Network issues downloading modules\\n")
			fmt.Fprintf(os.Stderr, "  \uD83D\uDCA1 3. Version conflicts in go.mod\\n")
			fmt.Fprintf(os.Stderr, "  \uD83D\uDCA1 4. Missing files in the package (trying to build single file instead of package)\\n")
			fmt.Fprintf(os.Stderr, "  \uD83D\uDCA1 5. Inconsistent imports between files\\n")
			fmt.Fprintf(os.Stderr, "  \uD83D\uDCA1 6. Local module replace directives not working\\n")
			fmt.Fprintf(os.Stderr, "  \uD83D\uDCA1 7. Try running 'go mod tidy' manually\\n")
			fmt.Fprintf(os.Stderr, "  \uD83D\uDCA1 8. Dependencies not built\\n")
			fmt.Fprintf(os.Stderr, "  \uD83D\uDCA1 Check that all imported packages exist and are correctly published.\\n")
			os.Exit(1)
		}
		
		fmt.Printf("  \u2705 Successfully compiled to %s\\n", outputExePath)

		// Make executable
		if err := os.Chmod(outputExePath, 0755); err != nil {
			fmt.Printf("  \u26A0\uFE0F  Failed to make binary executable: %v\\n", err)
		}

		// Create dummy bundle file (for consistency with other runtimes)
		dummyPath := filepath.Join(bundlesDir, entryPoint)
		if err := os.MkdirAll(filepath.Dir(dummyPath), 0755); err != nil {
			fmt.Fprintf(os.Stderr, "  \u274C Failed to create dummy bundle directory: %v\\n", err)
			os.Exit(1)
		}

		dummyContent := fmt.Sprintf(\`#!/usr/bin/env bash
# Dummy bundle file generated by testeranto
# Hash: %s
# This file execs the compiled Go binary

exec "%s" "$@"
\`, testHash, outputExePath)

		if err := os.WriteFile(dummyPath, []byte(dummyContent), 0755); err != nil {
			fmt.Fprintf(os.Stderr, "  \u274C Failed to write dummy bundle file: %v\\n", err)
			os.Exit(1)
		}

		fmt.Printf("  \u2705 Created dummy bundle file at %s\\n", dummyPath)

		// Change back to workspace root for next iteration
		if err := os.Chdir(workspace); err != nil {
			fmt.Fprintf(os.Stderr, "  \u26A0\uFE0F  Failed to change back to workspace: %v\\n", err)
		}
	}

	fmt.Println("\\n\uD83C\uDF89 Go builder completed successfully")
}

func getCurrentDir() string {
	dir, err := os.Getwd()
	if err != nil {
		return fmt.Sprintf("Error: %v", err)
	}
	return dir
}

func findConfig() string {
	return "/workspace/testeranto/runtimes/golang/golang.go"
}

// loadConfig is defined in config.go
// findModuleRoot walks up from dir to find a directory containing go.mod
func findModuleRoot(dir string) string {
	current := dir
	for {
		goModPath := filepath.Join(current, "go.mod")
		if _, err := os.Stat(goModPath); err == nil {
			return current
		}
		parent := filepath.Dir(current)
		if parent == current {
			break
		}
		current = parent
	}
	return ""
}

// TestConfig represents configuration for a single test
type TestConfig struct {
	Path string \`json:"path"\`
}

// GolangConfig represents the Go-specific configuration
type GolangConfig struct {
	Tests map[string]TestConfig \`json:"tests"\`
}

// Config represents the overall configuration
type Config struct {
	Golang GolangConfig \`json:"golang"\`
}

func copyFile(src, dst string) error {
	input, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	// Ensure the destination directory exists
	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return err
	}
	return os.WriteFile(dst, input, 0644)
}

func copyDir(src, dst string) error {
	// Get properties of source dir
	info, err := os.Stat(src)
	if err != nil {
		return err
	}

	// Create the destination directory
	if err := os.MkdirAll(dst, info.Mode()); err != nil {
		return err
	}

	// Read the source directory
	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())

		if entry.IsDir() {
			if err := copyDir(srcPath, dstPath); err != nil {
				return err
			}
		} else {
			if err := copyFile(srcPath, dstPath); err != nil {
				return err
			}
		}
	}
	return nil
}

func loadConfig(path string) (*Config, error) {
	fmt.Printf("[INFO] Loading config from: %s\\n", path)

	// Run the Go file to get JSON output
	cmd := exec.Command("go", "run", path)
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to run config program: %w", err)
	}

	var config Config
	if err := json.Unmarshal(output, &config); err != nil {
		return nil, fmt.Errorf("failed to decode config JSON: %w", err)
	}

	fmt.Printf("[INFO] Loaded config with %d Go test(s)\\n", len(config.Golang.Tests))
	for testName, testConfig := range config.Golang.Tests {
		fmt.Printf("[INFO]   - %s (path: %s)\\n", testName, testConfig.Path)
	}

	return &config, nil
}
`;

// src/server/runtimes/golang/docker.ts
var golangScriptPath = join(process.cwd(), "testeranto", "golang_runtime.go");
await Bun.write(golangScriptPath, main_default);
var golangDockerComposeFile = (config, container_name, projectConfigPath, golangConfigPath, testName) => {
  const tests = config.runtimes[testName]?.tests || [];
  return dockerComposeFile(config, container_name, projectConfigPath, golangConfigPath, testName, golangBuildCommand, tests);
};
var golangBuildCommand = (projectConfigPath, golangConfigPath, testName, tests) => {
  return `go run /workspace/testeranto/golang_runtime.go /workspace/${projectConfigPath} /workspace/${golangConfigPath} ${testName} ${tests.join(" ")}`;
};
var golangBddCommand = (fpath, golangConfigPath, configKey) => {
  const jsonStr = JSON.stringify({
    name: "go-test",
    ports: [1111],
    fs: "testeranto/reports/go",
    timeout: 30000,
    retries: 0,
    environment: {}
  });
  const pathParts = fpath.split("/");
  const fileName = pathParts[pathParts.length - 1];
  const binaryName = fileName.replace(".go", "").replace(/\./g, "_");
  return `testeranto/bundles/${configKey}/${binaryName} '${jsonStr}'`;
};

// src/server/runtimes/java/docker.ts
var javaDockerComposeFile = (config, container_name, projectConfigPath, nodeConfigPath, testName) => {
  return dockerComposeFile(config, container_name, projectConfigPath, nodeConfigPath, testName, javaBuildCommand);
};
var javaBuildCommand = (fpath) => {
  return `java src/server/runtimes/java/java.java /workspace/${fpath}`;
};
var javaBddCommand = (fpath) => {
  return `java testeranto/bundles/java/${fpath} /workspace/java.java`;
};

// src/server/runtimes/node/docker.ts
import { join as join2 } from "path";

// dist/prebuild/node/node.mjs
var node_default = `// src/server/runtimes/node/node.ts
import esbuild from "esbuild";

// src/server/runtimes/common.ts
import path from "path";
import fs from "fs";
async function processMetafile(config, metafile, runtime, configKey) {
  for (const [outputFile, outputInfo] of Object.entries(metafile.outputs)) {
    let collectFileDependencies2 = function(filePath) {
      if (collectedFiles.has(filePath)) {
        return;
      }
      collectedFiles.add(filePath);
      const fileInfo = metafile.inputs?.[filePath];
      if (fileInfo?.imports) {
        for (const importInfo of fileInfo.imports) {
          const importPath = importInfo.path;
          if (metafile.inputs?.[importPath]) {
            collectFileDependencies2(importPath);
          }
        }
      }
    };
    var collectFileDependencies = collectFileDependencies2;
    const outputInfoTyped = outputInfo;
    if (!outputInfoTyped.entryPoint) {
      console.log(\`[\${runtime} Builder] Skipping output without entryPoint: \${outputFile}\`);
      continue;
    }
    const entryPoint = outputInfoTyped.entryPoint;
    const isTestFile = /\\.(test|spec)\\.(ts|js)$/.test(entryPoint);
    if (!isTestFile) {
      console.log(\`[\${runtime} Builder] Skipping non-test entryPoint: \${entryPoint}\`);
      continue;
    }
    const outputInputs = outputInfoTyped.inputs || {};
    const collectedFiles = /* @__PURE__ */ new Set();
    for (const inputFile of Object.keys(outputInputs)) {
      collectFileDependencies2(inputFile);
    }
    const allInputFiles = Array.from(collectedFiles).map(
      (filePath) => path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath)
    );
    const workspaceRoot = "/workspace";
    const relativeFiles = allInputFiles.map((file) => {
      const absolutePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
      if (absolutePath.startsWith(workspaceRoot)) {
        return absolutePath.slice(workspaceRoot.length);
      }
      return path.relative(process.cwd(), absolutePath);
    }).filter(Boolean);
    const outputBaseName = entryPoint.split(".").slice(0, -1).join(".");
    const inputFilesPath = \`testeranto/bundles/\${configKey}/\${outputBaseName}.mjs-inputFiles.json\`;
    fs.writeFileSync(inputFilesPath, JSON.stringify(relativeFiles, null, 2));
    console.log(\`[\${runtime} Builder] Wrote \${relativeFiles.length} input files to \${inputFilesPath}\`);
  }
}

// src/esbuildConfigs/featuresPlugin.ts
import path2 from "path";
var featuresPlugin_default = {
  name: "feature-markdown",
  setup(build) {
    build.onResolve({ filter: /\\.md$/ }, (args) => {
      if (args.resolveDir === "") return;
      return {
        path: path2.isAbsolute(args.path) ? args.path : path2.join(args.resolveDir, args.path),
        namespace: "feature-markdown"
      };
    });
    build.onLoad(
      { filter: /.*/, namespace: "feature-markdown" },
      async (args) => {
        return {
          contents: \`file://\${args.path}\`,
          loader: "text"
          // contents: JSON.stringify({ path: args.path }),
          // loader: "json",
          // contents: JSON.stringify({
          //   // html: markdownHTML,
          //   raw: markdownContent,
          //   filename: args.path, //path.basename(args.path),
          // }),
          // loader: "json",
        };
      }
    );
  }
};

// src/esbuildConfigs/index.ts
import "esbuild";
var esbuildConfigs_default = (config) => {
  return {
    // packages: "external",
    target: "esnext",
    format: "esm",
    splitting: true,
    outExtension: { ".js": ".mjs" },
    outbase: ".",
    jsx: "transform",
    bundle: true,
    // minify: config.minify === true,
    write: true,
    loader: {
      ".js": "jsx",
      ".png": "binary",
      ".jpg": "binary"
    }
  };
};

// src/esbuildConfigs/inputFilesPlugin.ts
import fs2 from "fs";
var otherInputs = {};
var register = (entrypoint, sources) => {
  if (!otherInputs[entrypoint]) {
    otherInputs[entrypoint] = /* @__PURE__ */ new Set();
  }
  sources.forEach((s) => otherInputs[entrypoint].add(s));
};
var inputFilesPlugin_default = (platform, testName2) => {
  const f = \`\${testName2}\`;
  return {
    register,
    inputFilesPluginFactory: {
      name: "metafileWriter",
      setup(build) {
        build.onEnd((result) => {
          fs2.writeFileSync(f, JSON.stringify(result, null, 2));
        });
      }
    }
  };
};

// src/esbuildConfigs/rebuildPlugin.ts
import fs3 from "fs";
var rebuildPlugin_default = (r) => {
  return {
    name: "rebuild-notify",
    setup: (build) => {
      build.onEnd((result) => {
        console.log(\`\${r} > build ended with \${result.errors.length} errors\`);
        if (result.errors.length > 0) {
          fs3.writeFileSync(
            \`./testeranto/reports\${r}_build_errors\`,
            JSON.stringify(result, null, 2)
          );
        }
      });
    }
  };
};

// src/server/runtimes/node/esbuild.ts
var esbuild_default = (nodeConfig, testName2, projectConfig) => {
  const entryPoints = projectConfig.runtimes[testName2].tests;
  const { inputFilesPluginFactory, register: register2 } = inputFilesPlugin_default(
    "node",
    testName2
  );
  return {
    ...esbuildConfigs_default(nodeConfig),
    outdir: \`testeranto/bundles/\${testName2}\`,
    outbase: ".",
    // Preserve directory structure relative to outdir
    metafile: true,
    supported: {
      "dynamic-import": true
    },
    define: {
      "process.env.FLUENTFFMPEG_COV": "0",
      ENV: \`node\`
    },
    bundle: true,
    format: "esm",
    absWorkingDir: process.cwd(),
    platform: "node",
    packages: "external",
    entryPoints,
    plugins: [
      featuresPlugin_default,
      inputFilesPluginFactory,
      rebuildPlugin_default("node"),
      ...nodeConfig.plugins?.map((p) => p(register2, entryPoints)) || []
    ]
  };
};

// src/server/runtimes/node/node.ts
var projectConfigPath = process.argv[2];
var nodeConfigPath = process.argv[3];
var testName = process.argv[4];
console.log(\`[NODE BUILDER] projectConfigPath:  \${projectConfigPath}\`);
console.log(\`[NODE BUILDER] nodeConfig:  \${nodeConfigPath}\`);
console.log(\`[NODE BUILDER] testName:  \${testName}\`);
async function startBundling(nodeConfigs, projectConfig) {
  console.log(\`[NODE BUILDER] is now bundling:  \${testName}\`);
  const n = esbuild_default(nodeConfigs, testName, projectConfig);
  const buildResult = await esbuild.build(n);
  if (buildResult.metafile) {
    await processMetafile(projectConfig, buildResult.metafile, "node", testName);
  } else {
    console.warn("No metafile generated by esbuild");
  }
}
async function main() {
  try {
    const nodeConfigs = (await import(nodeConfigPath)).default;
    const projectConfigs = (await import(projectConfigPath)).default;
    await startBundling(nodeConfigs, projectConfigs);
  } catch (error) {
    console.error("NODE BUILDER: Error importing config:", nodeConfigPath, error);
    console.error(error);
    process.exit(1);
  }
}
main();
`;

// src/server/runtimes/node/docker.ts
var nodeScriptPath = join2(process.cwd(), "testeranto", "node_runtime.ts");
await Bun.write(nodeScriptPath, node_default);
var nodeDockerComposeFile = (config, container_name, projectConfigPath, nodeConfigPath, testName) => {
  const tests = config.runtimes[testName]?.tests || [];
  return {
    ...dockerComposeFile(config, container_name, projectConfigPath, nodeConfigPath, testName, nodeBuildCommand, tests),
    environment: { ENV: "node" }
  };
};
var nodeBuildCommand = (projectConfigPath, nodeConfigPath, testName, tests) => {
  return `yarn tsx /workspace/testeranto/node_runtime.ts /workspace/${projectConfigPath} /workspace/${nodeConfigPath} ${testName}`;
};
var nodeBddCommand = (fpath, nodeConfigPath, configKey) => {
  const jsonStr = JSON.stringify({ ports: [1111], fs: "testeranto/reports/node" });
  return `yarn tsx testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
};

// src/server/runtimes/python/docker.ts
import { join as join3 } from "path";

// src/server/runtimes/python/python.py
var python_default = `#!/usr/bin/env python3

import sys
import json
import os
import ast
from typing import Dict, List, Set, Any
import hashlib

import time

def resolve_python_import(import_path: str, current_file: str) -> str | None:
    """Resolve a Python import to a file path."""
    # Handle relative imports
    if import_path.startswith('.'):
        current_dir = os.path.dirname(current_file)
        # Count dots
        dot_count = 0
        remaining = import_path
        while remaining.startswith('.'):
            dot_count += 1
            remaining = remaining[1:]
        
        # Remove leading slash
        if remaining.startswith('/'):
            remaining = remaining[1:]
        
        # Go up appropriate number of directories
        base_dir = current_dir
        for _ in range(1, dot_count):
            base_dir = os.path.dirname(base_dir)
        
        # Handle case with no remaining path
        if not remaining:
            init_path = os.path.join(base_dir, '__init__.py')
            if os.path.exists(init_path):
                return init_path
            return None
        
        # Resolve full path
        resolved = os.path.join(base_dir, remaining)
        
        # Try different extensions
        for ext in ['.py', '/__init__.py']:
            potential = resolved + ext
            if os.path.exists(potential):
                return potential
        
        # Check if it's a directory with __init__.py
        if os.path.exists(resolved) and os.path.isdir(resolved):
            init_path = os.path.join(resolved, '__init__.py')
            if os.path.exists(init_path):
                return init_path
        return None
    
    # Handle absolute imports
    # Look in various directories
    dirs = [
        os.path.dirname(current_file),
        os.getcwd(),
    ] + os.environ.get('PYTHONPATH', '').split(os.pathsep)
    
    for dir_path in dirs:
        if not dir_path:
            continue
        potential_paths = [
            os.path.join(dir_path, import_path + '.py'),
            os.path.join(dir_path, import_path, '__init__.py'),
            os.path.join(dir_path, import_path.replace('.', '/') + '.py'),
            os.path.join(dir_path, import_path.replace('.', '/'), '__init__.py'),
        ]
        for potential in potential_paths:
            if os.path.exists(potential):
                return potential
    return None

def parse_python_imports(file_path: str) -> List[Dict[str, Any]]:
    """Parse import statements from a Python file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Warning: Could not read {file_path}: {e}")
        return []
    
    try:
        tree = ast.parse(content)
    except SyntaxError as e:
        print(f"Warning: Syntax error in {file_path}: {e}")
        return []
    
    imports = []
    
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                import_path = alias.name
                resolved = resolve_python_import(import_path, file_path)
                imports.append({
                    'path': import_path,
                    'kind': 'import-statement',
                    'external': resolved is None,
                })
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                import_path = node.module
                resolved = resolve_python_import(import_path, file_path)
                imports.append({
                    'path': import_path,
                    'kind': 'import-statement',
                    'external': resolved is None,
                })
    return imports

def collect_dependencies(file_path: str, visited: Set[str] = None) -> List[str]:
    """Collect all dependencies of a Python file recursively."""
    if visited is None:
        visited = set()
    
    if file_path in visited:
        return []
    visited.add(file_path)
    
    dependencies = [file_path]
    imports = parse_python_imports(file_path)
    
    for imp in imports:
        if not imp.get('external') and imp['path']:
            resolved = resolve_python_import(imp['path'], file_path)
            if resolved and os.path.exists(resolved):
                dependencies.extend(collect_dependencies(resolved, visited))
    
    # Remove duplicates
    seen = set()
    unique = []
    for dep in dependencies:
        if dep not in seen:
            seen.add(dep)
            unique.append(dep)
    return unique

def topological_sort(files: List[str]) -> List[str]:
    """Sort files based on import dependencies."""
    # Build dependency graph
    graph = {file: set() for file in files}
    for file in files:
        imports = parse_python_imports(file)
        for imp in imports:
            if not imp.get('external') and imp['path']:
                resolved = resolve_python_import(imp['path'], file)
                if resolved and resolved in files:
                    graph[file].add(resolved)
    
    # Kahn's algorithm
    in_degree = {node: 0 for node in graph}
    for node in graph:
        for neighbor in graph[node]:
            in_degree[neighbor] += 1
    
    # Queue of nodes with no incoming edges
    queue = [node for node in graph if in_degree[node] == 0]
    sorted_list = []
    
    while queue:
        node = queue.pop(0)
        sorted_list.append(node)
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    
    # Check for cycles
    if len(sorted_list) != len(files):
        print("Warning: Circular dependencies detected, using original order")
        return files
    
    return sorted_list

def strip_imports(content: str) -> str:
    """Remove import statements from Python code."""
    lines = content.split('\\n')
    result_lines = []
    in_multiline_string = False
    multiline_delimiter = None
    
    for line in lines:
        # Handle multiline strings
        stripped_line = line.strip()
        if not in_multiline_string:
            # Check for start of multiline string
            if stripped_line.startswith('"""') or stripped_line.startswith("'''"):
                # Check if it's a single line or multiline
                if stripped_line.count('"""') == 1 or stripped_line.count("'''") == 1:
                    in_multiline_string = True
                    multiline_delimiter = stripped_line[:3]
                result_lines.append(line)
                continue
            # Check for import statements
            elif stripped_line.startswith('import ') or stripped_line.startswith('from '):
                # Skip this line
                continue
            else:
                result_lines.append(line)
        else:
            # Inside a multiline string
            result_lines.append(line)
            # Check for end of multiline string
            if multiline_delimiter in stripped_line:
                # Count occurrences to handle cases where delimiter appears in the string
                if stripped_line.count(multiline_delimiter) % 2 == 1:
                    in_multiline_string = False
                    multiline_delimiter = None
    
    return '\\n'.join(result_lines)

def bundle_python_files(entry_point: str, test_name: str, output_base_dir: str) -> str:
    """Generate bundle files similar to Ruby runtime."""
    print(f"[Python Builder] Processing: {entry_point}")
    
    # Use the original entry point path to preserve directory structure
    # This matches Ruby's pattern: testeranto/bundles/#{test_name}/#{entry_point}
    # entry_point might be something like "src/python/Calculator.pitono.test.py"
    
    # Create the bundle path: testeranto/bundles/{test_name}/{entry_point}
    # We need to handle both absolute and relative paths
    if os.path.isabs(entry_point):
        # If it's an absolute path, make it relative to current directory
        # But first check if it's under workspace
        workspace_root = '/workspace'
        if entry_point.startswith(workspace_root):
            # Make it relative to workspace root
            rel_entry_path = entry_point[len(workspace_root):]
            if rel_entry_path.startswith('/'):
                rel_entry_path = rel_entry_path[1:]
        else:
            # Make it relative to current directory
            rel_entry_path = os.path.relpath(entry_point, os.getcwd())
    else:
        # It's already a relative path
        rel_entry_path = entry_point
    
    print(f"[Python Builder] Using entry path: {rel_entry_path}")
    
    # Create output directory structure: testeranto/bundles/{test_name}/{dir_of_rel_entry_path}
    output_dir = os.path.join(output_base_dir, test_name, os.path.dirname(rel_entry_path))
    # Remove any empty directory component
    if output_dir.endswith('.'):
        output_dir = os.path.dirname(output_dir)
    os.makedirs(output_dir, exist_ok=True)
    
    # Get entry point filename
    entry_filename = os.path.basename(entry_point)
    
    # 1. Collect all dependencies
    all_deps = collect_dependencies(entry_point)
    # Ensure entry point is included
    if entry_point not in all_deps:
        all_deps.append(entry_point)
    # Sort for consistency
    all_deps = sorted(set(all_deps))
    
    print(f"[Python Builder] Found {len(all_deps)} dependencies")
    
    # 2. Compute hash of input files (similar to Ruby's compute_files_hash)
    files_hash = compute_files_hash(all_deps)
    print(f"[Python Builder] Computed hash: {files_hash}")
    
    # 3. Write input files JSON
    # Convert to workspace-relative paths
    relative_files = []
    for dep in all_deps:
        abs_path = os.path.abspath(dep)
        if abs_path.startswith(workspace_root):
            rel_path = abs_path[len(workspace_root):]
            # Ensure it starts with /
            if not rel_path.startswith('/'):
                rel_path = '/' + rel_path
            relative_files.append(rel_path)
        else:
            # If not under workspace, use relative path from current directory
            rel_path = os.path.relpath(abs_path, os.getcwd())
            relative_files.append(rel_path)
    
    # Create input files path similar to Ruby: testeranto/bundles/{test_name}/{entry_point}-inputFiles.json
    # The Ruby builder uses: "testeranto/bundles/#{test_name}/#{entry_point}-inputFiles.json"
    # We need to handle the path correctly
    # First, normalize the entry point path for use in filename
    input_files_basename = rel_entry_path.replace('/', '_').replace('\\\\', '_') + '-inputFiles.json'
    input_files_path = os.path.join(output_base_dir, test_name, input_files_basename)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(input_files_path), exist_ok=True)
    
    with open(input_files_path, 'w', encoding='utf-8') as f:
        json.dump(relative_files, f, indent=2)
    print(f"[Python Builder] Wrote input files to: {input_files_path}")
    
    # 4. Create dummy bundle file that loads the original test file
    # Similar to Ruby: testeranto/bundles/#{test_name}/#{entry_point}
    bundle_path = os.path.join(output_base_dir, test_name, rel_entry_path)
    
    # Ensure the directory for the bundle exists
    os.makedirs(os.path.dirname(bundle_path), exist_ok=True)
    
    # Create a simple bundle that loads and executes the original test file
    # Use absolute path for the original test file
    original_test_abs = os.path.abspath(entry_point)
    bundle_content = f'''#!/usr/bin/env python3
# Dummy bundle file generated by testeranto
# Hash: {files_hash}
# This file loads and executes the original test file: {original_test_abs}

import sys
import os

# Add the original file's directory to sys.path if needed
original_dir = os.path.dirname(r'{original_test_abs}')
if original_dir not in sys.path:
    sys.path.insert(0, original_dir)

# Load and execute the original test file
# Using exec to ensure execution every time
with open(r'{original_test_abs}', 'r', encoding='utf-8') as f:
    code = f.read()

# Execute the code in the global namespace
exec(code, {{'__name__': '__main__', '__file__': r'{original_test_abs}'}})

# If the test framework requires explicit test execution, add it here
# For example:
#   if 'TestFramework' in locals():
#       TestFramework.run()
'''
    
    with open(bundle_path, 'w', encoding='utf-8') as f:
        f.write(bundle_content)
    
    # Make executable
    try:
        os.chmod(bundle_path, 0o755)
    except:
        pass
    
    print(f"[Python Builder] Created dummy bundle file at: {bundle_path}")
    
    return input_files_path

# Remove generate_metafile function as we're following Ruby pattern

def compute_files_hash(files: List[str]) -> str:
    """Compute a simple hash from file paths and contents, similar to Ruby's compute_files_hash."""
    import hashlib
    
    hash_obj = hashlib.md5()
    
    for file_path in files:
        try:
            if os.path.exists(file_path):
                # Add file path
                hash_obj.update(file_path.encode('utf-8'))
                # Add file stats
                stats = os.stat(file_path)
                hash_obj.update(str(stats.st_mtime).encode('utf-8'))
                hash_obj.update(str(stats.st_size).encode('utf-8'))
            else:
                # File may not exist, include its name anyway
                hash_obj.update(file_path.encode('utf-8'))
                hash_obj.update(b'missing')
        except Exception as error:
            # If we can't stat the file, still include its name
            hash_obj.update(file_path.encode('utf-8'))
            hash_obj.update(b'error')
    
    return hash_obj.hexdigest()

def main():
    print(f"[Python Builder] ARGV: {sys.argv}")
    
    # Parse command line arguments similar to Ruby runtime
    # Expected: python.py project_config_file_path python_config_file_path test_name entryPoints...
    if len(sys.argv) < 4:
        print("[Python Builder] Error: Insufficient arguments")
        print("Usage: python.py <project_config> <python_config> <test_name> <entry_points...>")
        sys.exit(1)
    
    project_config_file_path = sys.argv[1]
    python_config_file_path = sys.argv[2]
    test_name = sys.argv[3]
    entry_points = sys.argv[4:]
    
    print(f"[Python Builder] Project config: {project_config_file_path}")
    print(f"[Python Builder] Python config: {python_config_file_path}")
    print(f"[Python Builder] Test name: {test_name}")
    print(f"[Python Builder] Entry points: {entry_points}")
    
    # Process each entry point
    for entry_point in entry_points:
        print(f"[Python Builder] Processing Python test: {entry_point}")
        
        # Get absolute path to entry point
        entry_point_path = os.path.abspath(entry_point)
        
        # Check if entry point exists
        if not os.path.exists(entry_point_path):
            print(f"[Python Builder] Error: Entry point does not exist: {entry_point_path}")
            sys.exit(1)
        
        # Create bundle files
        # Base directory for bundles: testeranto/bundles/
        output_base_dir = "testeranto/bundles"
        os.makedirs(output_base_dir, exist_ok=True)
        
        # Generate bundle files
        input_files_path = bundle_python_files(entry_point_path, test_name, output_base_dir)
        
        print(f"[Python Builder] Completed processing: {entry_point}")
    
    print("[Python Builder] Python builder completed")

if __name__ == "__main__":
    main()
`;

// src/server/runtimes/python/docker.ts
var pythonScriptPath = join3(process.cwd(), "testeranto", "python_runtime.py");
await Bun.write(pythonScriptPath, python_default);
var pythonDockerComposeFile = (config, container_name, projectConfigPath, pythonConfigPath, testName) => {
  const tests = config.runtimes[testName]?.tests || [];
  return dockerComposeFile(config, container_name, projectConfigPath, pythonConfigPath, testName, pythonBuildCommand, tests);
};
var pythonBuildCommand = (projectConfigPath, pythonConfigPath, testName, tests) => {
  return `python /workspace/testeranto/python_runtime.py /workspace/${projectConfigPath} /workspace/${pythonConfigPath} ${testName}  ${tests.join(" ")} `;
};
var pythonBddCommand = (fpath, pythonConfigPath, configKey) => {
  const jsonStr = JSON.stringify({ ports: [1111], fs: "testeranto/reports/pythontests" });
  return `python testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
};

// src/server/runtimes/ruby/docker.ts
import { join as join4 } from "path";

// src/server/runtimes/ruby/ruby.rb
var ruby_default = `require 'json'
require 'fileutils'
require 'pathname'
require 'set'
require 'digest'

puts "hello ruby builder!", ARGV.inspect


project_config_file_path = ARGV[0]
ruby_config_file_path = ARGV[1]
test_name = ARGV[2]

entryPoints = ARGV[3..-1]

# puts "ruby_config_file_path", ruby_config_file_path
# puts "test_name", test_name
# puts "project_config_file_path", project_config_file_path
# puts "entryPoints", entryPoints

# Ensure the config file path is valid before requiring
# if File.exist?(project_config_file_path)
#   require project_config_file_path
# else
#   puts "Config file not found: #{project_config_file_path}"
#   exit(1)
# end

# Load the ruby config to get test entry points
# ruby_config = nil
# if File.exist?(ruby_config_file_path)
#   require ruby_config_file_path
#   # Try to get the config constant; assuming it's named after the file
#   config_name = File.basename(ruby_config_file_path, '.rb').split('_').map(&:capitalize).join
#   if Object.const_defined?(config_name)
#     ruby_config = Object.const_get(config_name)
#   else
#     puts "Warning: Could not find constant #{config_name} in #{ruby_config_file_path}"
#     # Fallback: assume the config is assigned to a global variable or just loaded
#     # We'll rely on the config being set via some other means
#   end
# else
#   puts "Ruby config file not found: #{ruby_config_file_path}"
#   exit(1)
# end

# Function to extract dependencies from a Ruby file
def extract_dependencies(file_path, base_dir = Dir.pwd)
  dependencies = Set.new
  visited = Set.new
  
  def follow_dependencies(current_file, deps, visited, base_dir)
    return if visited.include?(current_file)
    visited.add(current_file)
    
    # Add the current file to dependencies if it's a local file
    if File.exist?(current_file) && current_file.start_with?(base_dir)
      deps.add(current_file)
    end
    
    # Read the file and look for require statements
    begin
      content = File.read(current_file)
      
      # Match require, require_relative, and load statements
      # This regex captures the path inside quotes
      content.scan(/(?:require|require_relative|load)\\s+(?:\\(\\s*)?['"]([^'"]+)['"]/) do |match|
        dep_path = match[0]
        
        # Determine the absolute path based on the type of require
        absolute_path = nil
        
        if content.match?(/require_relative\\s+(?:\\(\\s*)?['"]#{Regexp.escape(dep_path)}['"]/)
          # require_relative is relative to the current file
          absolute_path = File.expand_path(dep_path, File.dirname(current_file))
        elsif content.match?(/load\\s+(?:\\(\\s*)?['"]#{Regexp.escape(dep_path)}['"]/)
          # load can be relative or absolute
          if Pathname.new(dep_path).absolute?
            absolute_path = dep_path
          else
            # Try to find in load paths
            $LOAD_PATH.each do |load_path|
              potential_path = File.expand_path(dep_path, load_path)
              if File.exist?(potential_path)
                absolute_path = potential_path
                break
              end
            end
            # If not found in load paths, try relative to current file
            absolute_path ||= File.expand_path(dep_path, File.dirname(current_file))
          end
        else
          # regular require - search in load paths
          $LOAD_PATH.each do |load_path|
            potential_path = File.expand_path(dep_path, load_path)
            # Check for .rb extension
            if File.exist?(potential_path) || File.exist?(potential_path + '.rb')
              absolute_path = File.exist?(potential_path) ? potential_path : potential_path + '.rb'
              break
            end
          end
        end
        
        # If we found a path and it's a local file, follow it
        if absolute_path && File.exist?(absolute_path) && absolute_path.start_with?(base_dir)
          # Add .rb extension if missing
          if !absolute_path.end_with?('.rb') && File.exist?(absolute_path + '.rb')
            absolute_path += '.rb'
          end
          
          follow_dependencies(absolute_path, deps, visited, base_dir)
        end
      end
    rescue => e
      puts "Warning: Could not read or parse #{current_file}: #{e.message}"
    end
  end
  
  follow_dependencies(file_path, dependencies, visited, base_dir)
  dependencies.to_a
end

# Function to convert absolute paths to workspace-relative paths
def to_workspace_relative_paths(files, workspace_root = '/workspace')
  files.map do |file|
    absolute_path = File.expand_path(file)
    if absolute_path.start_with?(workspace_root)
      absolute_path.slice(workspace_root.length..-1)
    else
      # If not under workspace, use relative path from current directory
      Pathname.new(absolute_path).relative_path_from(Pathname.new(Dir.pwd)).to_s
    end
  end
end

# Helper to compute a simple hash from file paths and contents
def compute_files_hash(files)
  require 'digest'
  
  hash = Digest::MD5.new
  
  files.each do |file|
    begin
      if File.exist?(file)
        stats = File.stat(file)
        hash.update(file)
        hash.update(stats.mtime.to_f.to_s)
        hash.update(stats.size.to_s)
      else
        # File may not exist, include its name anyway
        hash.update(file)
        hash.update('missing')
      end
    rescue => error
      # If we can't stat the file, still include its name
      hash.update(file)
      hash.update('error')
    end
  end
  
  hash.hexdigest
end

entryPoints.each do |entry_point|
    # Only process test files (files ending with .test.rb, .spec.rb, etc.)
    # next unless entry_point =~ /\\.(test|spec)\\.rb$/
    
    puts "Processing Ruby test: #{entry_point}"
    
    # Get absolute path to entry point
    entry_point_path = File.expand_path(entry_point)
    
    # Extract all dependencies
    all_dependencies = extract_dependencies(entry_point_path)
    
    # Convert to workspace-relative paths
    workspace_root = '/workspace'
    relative_files = to_workspace_relative_paths(all_dependencies, workspace_root)
    
    # Create output directory structure similar to Node builder
    output_base_name = File.basename(entry_point_path, '.rb')
    input_files_path = "testeranto/bundles/#{test_name}/#{entry_point}-inputFiles.json"
    
    # Ensure directory exists
    FileUtils.mkdir_p(File.dirname(input_files_path))
    
    # Write the input files JSON
    File.write(input_files_path, JSON.pretty_generate(relative_files))
    puts "Wrote #{relative_files.length} input files to #{input_files_path}"
    
    # Compute hash of input files
    files_hash = compute_files_hash(all_dependencies)
    
    # Create the dummy bundle file that requires the original test file
    bundle_path = "testeranto/bundles/#{test_name}/#{entry_point}"
    
    # Write a dummy file that loads and executes the original test file
    # Using load ensures the file is executed every time
    dummy_content = <<~RUBY
      # Dummy bundle file generated by testeranto
      # Hash: #{files_hash}
      # This file loads and executes the original test file: #{entry_point}
      
      # Add the original file's directory to load path if needed
      original_dir = File.dirname('#{entry_point_path}')
      $LOAD_PATH.unshift(original_dir) unless $LOAD_PATH.include?(original_dir)
      
      # Load and execute the original test file
      # Using load instead of require ensures execution every time
      load '#{entry_point_path}'
      
      # If the test framework requires explicit test execution, add it here
      # For example:
      #   TestFramework.run if defined?(TestFramework)
      # This depends on the specific test framework being used
    RUBY
    
    File.write(bundle_path, dummy_content)
    puts "Created dummy bundle file at #{bundle_path}"
  end
  



puts "Ruby builder completed"
`;

// src/server/runtimes/ruby/docker.ts
var rubyScriptPath = join4(process.cwd(), "testeranto", "ruby_runtime.rb");
await Bun.write(rubyScriptPath, ruby_default);
var rubyDockerComposeFile = (config, container_name, projectConfigPath, nodeConfigPath, testName) => {
  const tests = config.runtimes[testName]?.tests || [];
  return dockerComposeFile(config, container_name, projectConfigPath, nodeConfigPath, testName, rubyBuildCommand, tests);
};
var rubyBuildCommand = (projectConfigPath, rubyConfigPath, testName, tests) => {
  return `ruby /workspace/testeranto/ruby_runtime.rb /workspace/${projectConfigPath} /workspace/${rubyConfigPath} ${testName} ${tests.join(" ")}`;
};
var rubyBddCommand = (fpath, nodeConfigPath, configKey) => {
  const jsonStr = JSON.stringify({
    name: "ruby-test",
    ports: [1111],
    fs: "testeranto/reports/ruby",
    timeout: 30000,
    retries: 0,
    environment: {}
  });
  return `ruby testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
};

// src/server/runtimes/rust/docker.ts
import { join as join5 } from "path";

// src/server/runtimes/rust/main.rs
var main_default2 = `// The rust builder
// runs in a docker image and produces built rust tests

use std::env;
use std::fs;
use std::path::Path;
use std::process::Command;
use serde_json;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("\uD83D\uDE80 Rust builder starting...");
    
    // Parse command line arguments
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 4 {
        eprintln!("\u274C Insufficient arguments");
        eprintln!("Usage: {} <project_config> <rust_config> <test_name> <entry_points...>", args[0]);
        std::process::exit(1);
    }
    
    let project_config_file_path = &args[1];
    let rust_config_file_path = &args[2];
    let test_name = &args[3];
    let entry_points = &args[4..];
    
    println!("Test name: {}", test_name);
    println!("Entry points: {:?}", entry_points);
    
    if entry_points.is_empty() {
        eprintln!("\u274C No entry points provided");
        std::process::exit(1);
    }
    
    // Change to workspace directory
    let workspace = Path::new("/workspace");
    env::set_current_dir(workspace)?;
    
    // Check if we're in a Cargo project
    let cargo_toml_path = workspace.join("Cargo.toml");
    if !cargo_toml_path.exists() {
        eprintln!("\u274C Not a Cargo project: Cargo.toml not found");
        std::process::exit(1);
    }
    
    // Create bundles directory
    let bundles_dir = workspace.join("testeranto/bundles").join(test_name);
    fs::create_dir_all(&bundles_dir)?;
    
    // Process each entry point
    for entry_point in entry_points {
        println!("\\n\uD83D\uDCE6 Processing Rust test: {}", entry_point);
        
        // Get entry point path
        let entry_point_path = Path::new(entry_point);
        if !entry_point_path.exists() {
            eprintln!("  \u274C Entry point does not exist: {}", entry_point);
            std::process::exit(1);
        }
        
        // Get base name (without .rs extension)
        let file_name = entry_point_path.file_name()
            .unwrap_or_default()
            .to_str()
            .unwrap_or("");
        if !file_name.ends_with(".rs") {
            eprintln!("  \u274C Entry point is not a Rust file: {}", entry_point);
            std::process::exit(1);
        }
        let base_name_with_dots = &file_name[..file_name.len() - 3];
        // Replace dots with underscores to make a valid Rust crate name
        let base_name: String = base_name_with_dots.replace('.', "_");
        
        // Create inputFiles.json
        let input_files = collect_input_files(entry_point_path);
        let input_files_basename = entry_point.replace("/", "_").replace("\\\\", "_") + "-inputFiles.json";
        let input_files_path = bundles_dir.join(input_files_basename);
        fs::write(&input_files_path, serde_json::to_string_pretty(&input_files)?)?;
        println!("  \u2705 Created inputFiles.json");
        
        // Create a temporary directory for this test
        let temp_dir = workspace.join("target").join("testeranto_temp").join(&base_name);
        fs::create_dir_all(&temp_dir)?;
        
        // Create Cargo.toml with necessary dependencies
        let cargo_toml_content = format!(r#"[package]
name = "{}"
version = "0.1.0"
edition = "2021"

[dependencies]
testeranto_rusto = "0.1"
serde = {{ version = "1.0", features = ["derive"] }}
tokio = {{ version = "1.0", features = ["full"] }}
serde_json = "1.0"
"#, base_name);
        
        fs::write(temp_dir.join("Cargo.toml"), cargo_toml_content)?;
        
        // Create src directory and copy the test file as main.rs
        let src_dir = temp_dir.join("src");
        fs::create_dir_all(&src_dir)?;
        fs::copy(entry_point_path, src_dir.join("main.rs"))?;
        
        println!("  \uD83D\uDCDD Created temporary Cargo project");
        
        // Compile the binary
        println!("  \uD83D\uDD28 Compiling with cargo...");
        let status = Command::new("cargo")
            .current_dir(&temp_dir)
            .args(&["build", "--release"])
            .status()?;
        
        if !status.success() {
            eprintln!("  \u274C Cargo build failed for {}", base_name);
            std::process::exit(1);
        }
        
        // Source binary path (cargo output)
        let source_bin = temp_dir.join("target/release").join(&base_name);
        if !source_bin.exists() {
            eprintln!("  \u274C Compiled binary not found at {:?}", source_bin);
            std::process::exit(1);
        }
        
        // Destination binary path in bundle directory
        let dest_bin = bundles_dir.join(&base_name);
        fs::copy(&source_bin, &dest_bin)?;
        
        // Make executable
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = fs::metadata(&dest_bin)?.permissions();
            perms.set_mode(0o755);
            fs::set_permissions(&dest_bin, perms)?;
        }
        
        println!("  \u2705 Compiled binary at: {:?}", dest_bin);
        
        // Create dummy bundle file (for consistency with other runtimes)
        let dummy_path = bundles_dir.join(entry_point);
        if let Some(parent) = dummy_path.parent() {
            fs::create_dir_all(parent)?;
        }
        
        let dummy_content = format!(r#"#!/usr/bin/env bash
# Dummy bundle file generated by testeranto
# This file execs the compiled Rust binary

exec "{}/{}" "$@"
"#, bundles_dir.display(), &base_name);
        
        fs::write(&dummy_path, dummy_content)?;
        
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = fs::metadata(&dummy_path)?.permissions();
            perms.set_mode(0o755);
            fs::set_permissions(&dummy_path, perms)?;
        }
        
        println!("  \u2705 Created dummy bundle file");
        
        // Clean up: remove temporary directory
        let _ = fs::remove_dir_all(temp_dir);
    }
    
    println!("\\n\uD83C\uDF89 Rust builder completed successfully");
    Ok(())
}

fn collect_input_files(test_path: &Path) -> Vec<String> {
    let mut files = Vec::new();
    let workspace = Path::new("/workspace");
    
    // Add the test file itself
    if let Ok(relative) = test_path.strip_prefix(workspace) {
        files.push(relative.to_string_lossy().to_string());
    } else {
        files.push(test_path.to_string_lossy().to_string());
    }
    
    // Add Cargo.toml
    let cargo_toml = workspace.join("Cargo.toml");
    if cargo_toml.exists() {
        files.push("Cargo.toml".to_string());
    }
    
    // Add Cargo.lock if present
    let cargo_lock = workspace.join("Cargo.lock");
    if cargo_lock.exists() {
        files.push("Cargo.lock".to_string());
    }
    
    // Add all .rs files in src/ directory
    let src_dir = workspace.join("src");
    if src_dir.exists() {
        if let Ok(entries) = fs::read_dir(src_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().map(|e| e == "rs").unwrap_or(false) {
                    if let Ok(relative) = path.strip_prefix(workspace) {
                        files.push(relative.to_string_lossy().to_string());
                    }
                }
            }
        }
    }
    
    files
}
`;

// src/server/runtimes/rust/docker.ts
var rustDir = join5(process.cwd(), "testeranto", "rust_builder");
var rustScriptPath = join5(rustDir, "src", "main.rs");
var cargoTomlPath = join5(rustDir, "Cargo.toml");
await Bun.$`mkdir -p ${join5(rustDir, "src")}`;
await Bun.write(rustScriptPath, main_default2);
var cargoTomlContent = `[package]
name = "rust_builder"
version = "0.1.0"
edition = "2021"

[dependencies]
serde_json = "1.0"
serde = { version = "1.0", features = ["derive"] }`;
await Bun.write(cargoTomlPath, cargoTomlContent);
var rustDockerComposeFile = (config, container_name, projectConfigPath, rustConfigPath, testName) => {
  const tests = config.runtimes[testName]?.tests || [];
  return dockerComposeFile(config, container_name, projectConfigPath, rustConfigPath, testName, rustBuildCommand, tests);
};
var rustBuildCommand = (projectConfigPath, rustConfigPath, testName, tests) => {
  return `cargo run --manifest-path /workspace/testeranto/rust_builder/Cargo.toml -- /workspace/${projectConfigPath} /workspace/${rustConfigPath} ${testName} ${tests.join(" ")}`;
};
var rustBddCommand = (fpath, rustConfigPath, configKey) => {
  const jsonStr = JSON.stringify({
    name: "rust-test",
    ports: [1111],
    fs: "testeranto/reports/rust",
    timeout: 30000,
    retries: 0,
    environment: {}
  });
  const pathParts = fpath.split("/");
  const fileName = pathParts[pathParts.length - 1];
  const binaryName = fileName.replace(".rs", "").replace(/\./g, "_");
  return `testeranto/bundles/${configKey}/${binaryName} '${jsonStr}'`;
};

// src/server/runtimes/web/docker.ts
import { join as join6 } from "path";

// dist/prebuild/web/web.mjs
var web_default = `// src/server/runtimes/web/web.ts
import esbuild from "esbuild";
import puppeteer from "puppeteer-core";

// src/esbuildConfigs/featuresPlugin.ts
import path from "path";
var featuresPlugin_default = {
  name: "feature-markdown",
  setup(build) {
    build.onResolve({ filter: /\\.md$/ }, (args) => {
      if (args.resolveDir === "") return;
      return {
        path: path.isAbsolute(args.path) ? args.path : path.join(args.resolveDir, args.path),
        namespace: "feature-markdown"
      };
    });
    build.onLoad(
      { filter: /.*/, namespace: "feature-markdown" },
      async (args) => {
        return {
          contents: \`file://\${args.path}\`,
          loader: "text"
          // contents: JSON.stringify({ path: args.path }),
          // loader: "json",
          // contents: JSON.stringify({
          //   // html: markdownHTML,
          //   raw: markdownContent,
          //   filename: args.path, //path.basename(args.path),
          // }),
          // loader: "json",
        };
      }
    );
  }
};

// src/esbuildConfigs/index.ts
import "esbuild";
var esbuildConfigs_default = (config) => {
  return {
    // packages: "external",
    target: "esnext",
    format: "esm",
    splitting: true,
    outExtension: { ".js": ".mjs" },
    outbase: ".",
    jsx: "transform",
    bundle: true,
    // minify: config.minify === true,
    write: true,
    loader: {
      ".js": "jsx",
      ".png": "binary",
      ".jpg": "binary"
    }
  };
};

// src/esbuildConfigs/inputFilesPlugin.ts
import fs from "fs";
var otherInputs = {};
var register = (entrypoint, sources) => {
  if (!otherInputs[entrypoint]) {
    otherInputs[entrypoint] = /* @__PURE__ */ new Set();
  }
  sources.forEach((s) => otherInputs[entrypoint].add(s));
};
var inputFilesPlugin_default = (platform, testName2) => {
  const f = \`\${testName2}\`;
  return {
    register,
    inputFilesPluginFactory: {
      name: "metafileWriter",
      setup(build) {
        build.onEnd((result) => {
          fs.writeFileSync(f, JSON.stringify(result, null, 2));
        });
      }
    }
  };
};

// src/esbuildConfigs/rebuildPlugin.ts
import fs2 from "fs";
var rebuildPlugin_default = (r) => {
  return {
    name: "rebuild-notify",
    setup: (build) => {
      build.onEnd((result) => {
        console.log(\`\${r} > build ended with \${result.errors.length} errors\`);
        if (result.errors.length > 0) {
          fs2.writeFileSync(
            \`./testeranto/reports\${r}_build_errors\`,
            JSON.stringify(result, null, 2)
          );
        }
      });
    }
  };
};

// src/server/runtimes/web/esbuild.ts
var esbuild_default = (config, testName2, projectConfig) => {
  const entryPoints = projectConfig.runtimes[testName2].tests;
  const { inputFilesPluginFactory, register: register2 } = inputFilesPlugin_default(
    "web",
    testName2
  );
  return {
    ...esbuildConfigs_default(config),
    outdir: \`testeranto/bundles/\${testName2}\`,
    outbase: ".",
    metafile: true,
    supported: {
      "dynamic-import": true
    },
    define: {
      "process.env.FLUENTFFMPEG_COV": "0",
      ENV: \`web\`
    },
    bundle: true,
    format: "esm",
    absWorkingDir: process.cwd(),
    platform: "browser",
    // packages: "external",
    entryPoints,
    plugins: [
      featuresPlugin_default,
      inputFilesPluginFactory,
      rebuildPlugin_default("web"),
      ...config.web?.plugins?.map((p) => p(register2, entryPoints)) || []
    ]
  };
};

// src/server/runtimes/common.ts
import path2 from "path";
import fs3 from "fs";
async function processMetafile(config, metafile, runtime, configKey) {
  for (const [outputFile, outputInfo] of Object.entries(metafile.outputs)) {
    let collectFileDependencies2 = function(filePath) {
      if (collectedFiles.has(filePath)) {
        return;
      }
      collectedFiles.add(filePath);
      const fileInfo = metafile.inputs?.[filePath];
      if (fileInfo?.imports) {
        for (const importInfo of fileInfo.imports) {
          const importPath = importInfo.path;
          if (metafile.inputs?.[importPath]) {
            collectFileDependencies2(importPath);
          }
        }
      }
    };
    var collectFileDependencies = collectFileDependencies2;
    const outputInfoTyped = outputInfo;
    if (!outputInfoTyped.entryPoint) {
      console.log(\`[\${runtime} Builder] Skipping output without entryPoint: \${outputFile}\`);
      continue;
    }
    const entryPoint = outputInfoTyped.entryPoint;
    const isTestFile = /\\.(test|spec)\\.(ts|js)$/.test(entryPoint);
    if (!isTestFile) {
      console.log(\`[\${runtime} Builder] Skipping non-test entryPoint: \${entryPoint}\`);
      continue;
    }
    const outputInputs = outputInfoTyped.inputs || {};
    const collectedFiles = /* @__PURE__ */ new Set();
    for (const inputFile of Object.keys(outputInputs)) {
      collectFileDependencies2(inputFile);
    }
    const allInputFiles = Array.from(collectedFiles).map(
      (filePath) => path2.isAbsolute(filePath) ? filePath : path2.resolve(process.cwd(), filePath)
    );
    const workspaceRoot = "/workspace";
    const relativeFiles = allInputFiles.map((file) => {
      const absolutePath = path2.isAbsolute(file) ? file : path2.resolve(process.cwd(), file);
      if (absolutePath.startsWith(workspaceRoot)) {
        return absolutePath.slice(workspaceRoot.length);
      }
      return path2.relative(process.cwd(), absolutePath);
    }).filter(Boolean);
    const outputBaseName = entryPoint.split(".").slice(0, -1).join(".");
    const inputFilesPath = \`testeranto/bundles/\${configKey}/\${outputBaseName}.mjs-inputFiles.json\`;
    fs3.writeFileSync(inputFilesPath, JSON.stringify(relativeFiles, null, 2));
    console.log(\`[\${runtime} Builder] Wrote \${relativeFiles.length} input files to \${inputFilesPath}\`);
  }
}

// src/server/runtimes/web/web.ts
import * as fs4 from "fs";
import * as path3 from "path";
console.log(process.cwd());
var projectConfigPath = process.argv[2];
var nodeConfigPath = process.argv[3];
var testName = process.argv[4];
async function startBundling(webConfigs, projectConfig) {
  console.log(\`[WEB BUILDER] is now bundling: \${testName}\`);
  const w = esbuild_default(webConfigs, testName, projectConfig);
  const buildResult = await esbuild.build(w);
  if (buildResult.metafile) {
    await processMetafile(projectConfig, buildResult.metafile, "web", testName);
    const outputFiles = Object.keys(buildResult.metafile.outputs);
    for (const outputFile of outputFiles) {
      if (true) {
        const htmlPath = \`testeranto/bundles/webtests/src/ts/Calculator.test.ts.html\`;
        await fs4.promises.mkdir(path3.dirname(htmlPath), { recursive: true });
        const htmlContent = \`<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Test Runner</title>
        <script type="module" src="Calculator.test.mjs"></script>
    </head>
    <body>
        <div id="root"></div>
        
    </body>
    </html>\`;
        await fs4.promises.writeFile(htmlPath, htmlContent);
        console.log(\`Created HTML file: \${htmlPath}\`);
      }
    }
  } else {
    console.warn("No metafile generated by esbuild");
  }
  console.log("WEB BUILDER: Metafiles have been generated");
  if (true) {
    console.log(
      "WEB BUILDER: Running in dev mode, keeping builder alive..."
    );
    const ctx = await esbuild.context(w);
    let { hosts, port } = await ctx.serve({
      host: "webtests",
      // servedir: \`testeranto/bundles/\${testName}\`,
      servedir: ".",
      onRequest: ({ method, path: path4, remoteAddress, status, timeInMS }) => {
        console.log(\`[esbuild] \${remoteAddress} - \${method} \${path4} -> \${status} [\${timeInMS}ms]\`);
      }
    });
    console.log(
      \`[WEB BUILDER]: esbuild server \${hosts}, \${port}\`
    );
    process.on("SIGINT", async () => {
      console.log("WEB BUILDER: Shutting down...");
      process.exit(0);
    });
    try {
      const browser = await puppeteer.launch({
        args: [
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-setuid-sandbox",
          "--no-sandbox",
          "--remote-allow-origins=*",
          // MANDATORY for cross-container access
          "--remote-debugging-address=0.0.0.0",
          "--remote-debugging-port=9222"
        ],
        // Automatically uses ENV PUPPETEER_EXECUTABLE_PATH
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",
        headless: true,
        pipe: false
        // timeout: 60000 // Increase timeout to 60 seconds
      });
      console.log("Puppeteer launched successfully", browser);
    } catch (error) {
      console.error("Failed to launch Puppeteer:", error);
      process.exit(1);
    }
  }
}
async function main() {
  try {
    const nodeConfigs = (await import(nodeConfigPath)).default;
    const projectConfigs = (await import(projectConfigPath)).default;
    await startBundling(nodeConfigs, projectConfigs);
  } catch (error) {
    console.error("NODE BUILDER: Error importing config:", nodeConfigPath, error);
    console.error(error);
    process.exit(1);
  }
}
main();
`;

// dist/prebuild/web/hoist.mjs
var hoist_default = `// src/server/runtimes/web/hoist.ts
import puppeteer from "puppeteer-core";
import http from "http";
var esbuildUrlDomain = \`http://webtests:8000/\`;
async function launchPuppeteer(browserWSEndpoint) {
  const browser = await puppeteer.connect({
    browserWSEndpoint
  });
  const page = await browser.newPage();
  try {
    page.on("console", (log) => {
      const msg = \`\${log.text()}
\`;
      switch (log.type()) {
        case "info":
          break;
        case "warn":
          break;
        case "error":
          break;
        case "debug":
          break;
        default:
          break;
      }
    });
    page.on("close", () => {
    });
    const close = () => {
    };
    page.on("pageerror", (err) => {
      console.error("Page error in web test:", err);
      close();
      throw err;
    });
    page.on("console", (msg) => {
      const text = msg.text();
      console.log(\`Browser console [\${msg.type()}]: \${text} \${JSON.stringify(msg.stackTrace())}\`);
    });
    const htmlUrl = \`\${esbuildUrlDomain}testeranto/bundles/webtests/src/ts/Calculator.test.ts.html\`;
    console.log("htmlUrl", htmlUrl);
    await page.goto(htmlUrl, { waitUntil: "networkidle0" });
    await page.close();
    close();
  } catch (error) {
    console.error(\`Error in web test:\`, error);
    throw error;
  }
}
async function connect() {
  const url = \`http://webtests:9223/json/version\`;
  console.log(\`[CLIENT] Attempting to reach \${url}...\`);
  http.get(url, (res) => {
    let data = "";
    console.log(\`[CLIENT] HTTP Status: \${res.statusCode}\`);
    res.on("data", (chunk) => data += chunk);
    res.on("end", async () => {
      try {
        const json = JSON.parse(data);
        console.log(\`[CLIENT] Successfully fetched WS URL: \${json.webSocketDebuggerUrl}\`);
        launchPuppeteer(json.webSocketDebuggerUrl);
      } catch (e) {
        console.error("[CLIENT] Failed to parse JSON or connect:", e.message);
        console.log("[CLIENT] Raw Data received:", data);
      }
    });
  }).on("error", (err) => {
    console.error("[CLIENT] HTTP Request Failed:", err.message);
    if (err.code === "ECONNREFUSED") {
      console.error("[CLIENT] HINT: The port is closed or Chromium isn't binding to 0.0.0.0");
    } else if (err.code === "ENOTFOUND") {
      console.error('[CLIENT] HINT: Docker cannot find the service name "web-builder"');
    }
  });
}
connect();
`;

// src/server/runtimes/web/docker.ts
var webScriptPath = join6(process.cwd(), "testeranto", "web_runtime.ts");
await Bun.write(webScriptPath, web_default);
var webHoistScriptPath = join6(process.cwd(), "testeranto", "web_hoist.ts");
await Bun.write(webHoistScriptPath, hoist_default);
var webDockerComposeFile = (config, container_name, projectConfigPath, webConfigPath, testName) => {
  const x = {
    ...dockerComposeFile(config, container_name, projectConfigPath, webConfigPath, testName, webBuildCommand),
    ...{
      environment: { ENV: "web" },
      expose: ["9223", "8000"]
    }
  };
  return x;
};
var webBuildCommand = (projectConfigPath, webConfigPath, testName) => {
  return `sh -c "socat TCP-LISTEN:9223,fork,reuseaddr TCP:127.0.0.1:9222 & yarn tsx /workspace/testeranto/web_runtime.ts /workspace/${projectConfigPath} /workspace/${webConfigPath} ${testName} "`;
};
var webBddCommand = (fpath, webConfigPath, configKey) => {
  const jsonStr = JSON.stringify({ ports: [1111], fs: "testeranto/reports/web" });
  return `yarn tsx  /workspace/testeranto/web_hoist testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
};

// src/server/serverClasses/Server_Docker_Utils.ts
var runTimeToCompose = {
  node: [nodeDockerComposeFile, nodeBuildCommand, nodeBddCommand],
  web: [webDockerComposeFile, webBuildCommand, webBddCommand],
  python: [pythonDockerComposeFile, pythonBuildCommand, pythonBddCommand],
  golang: [golangDockerComposeFile, golangBuildCommand, golangBddCommand],
  ruby: [rubyDockerComposeFile, rubyBuildCommand, rubyBddCommand],
  rust: [rustDockerComposeFile, rustBuildCommand, rustBddCommand],
  java: [javaDockerComposeFile, javaBuildCommand, javaBddCommand]
};
var generateUid = (configKey, testName) => {
  const cleanTestName = testName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-").replace(/[^a-z0-9_-]/g, "");
  return `${configKey}-${cleanTestName}`;
};
var getFullReportDir = (cwd, runtime) => {
  return `${cwd}/testeranto/reports/${runtime}`;
};
var getLogFilePath = (cwd, runtime, serviceName) => {
  return `${cwd}/testeranto/reports/${runtime}/${serviceName}.log`;
};
var getExitCodeFilePath = (cwd, runtime, serviceName) => {
  return `${cwd}/testeranto/reports/${runtime}/${serviceName}.exitcode`;
};
var getContainerExitCodeFilePath = (cwd, runtime, serviceName) => {
  return `${cwd}/testeranto/reports/${runtime}/${serviceName}.container.exitcode`;
};
var getStatusFilePath = (cwd, runtime, serviceName) => {
  return `${cwd}/testeranto/reports/${runtime}/${serviceName}.container.status`;
};
var DOCKER_COMPOSE_BASE = 'docker compose -f "testeranto/docker-compose.yml"';
var DOCKER_COMPOSE_UP = `${DOCKER_COMPOSE_BASE} up -d`;
var DOCKER_COMPOSE_DOWN = `${DOCKER_COMPOSE_BASE} down -v --remove-orphans`;
var DOCKER_COMPOSE_PS = `${DOCKER_COMPOSE_BASE} ps`;
var DOCKER_COMPOSE_LOGS = `${DOCKER_COMPOSE_BASE} logs --no-color`;
var DOCKER_COMPOSE_BUILD = `${DOCKER_COMPOSE_BASE} build`;
var DOCKER_COMPOSE_START = `${DOCKER_COMPOSE_BASE} start`;
var DOCKER_COMPOSE_CONFIG = `${DOCKER_COMPOSE_BASE} config --services`;
var RUNTIME_LABELS = {
  node: "Node",
  web: "Web",
  python: "Python",
  golang: "Golang",
  ruby: "Ruby",
  rust: "Rust",
  java: "Java"
};
var getRuntimeLabel = (runtime) => {
  return RUNTIME_LABELS[runtime] || runtime.charAt(0).toUpperCase() + runtime.slice(1);
};
var SERVICE_SUFFIXES = {
  BUILDER: "builder",
  BDD: "bdd",
  AIDER: "aider",
  CHECK: "check"
};
var getBuilderServiceName = (runtime) => {
  return `${runtime}-${SERVICE_SUFFIXES.BUILDER}`;
};
var getBddServiceName = (uid) => {
  return `${uid}-${SERVICE_SUFFIXES.BDD}`;
};
var getAiderServiceName = (uid) => {
  return `${uid}-${SERVICE_SUFFIXES.AIDER}`;
};
var getCheckServiceName = (uid, index) => {
  return `${uid}-${SERVICE_SUFFIXES.CHECK}-${index}`;
};
var INPUT_FILE_PATTERNS = {
  node: (testName) => `testeranto/bundles/node/${testName.split(".").slice(0, -1).concat("mjs").join(".")}-inputFiles.json`,
  ruby: () => `testeranto/bundles/ruby/Calculator.test.rb-inputFiles.json`,
  web: (testName) => `testeranto/bundles/web/${testName.split(".").slice(0, -1).concat("mjs").join(".")}-inputFiles.json`,
  python: (testName) => `testeranto/bundles/python/${testName}-inputFiles.json`,
  rust: (testName) => `testeranto/bundles/rust/${testName}-inputFiles.json`,
  java: (testName) => `testeranto/bundles/java/${testName}-inputFiles.json`,
  golang: (testName) => `testeranto/bundles/golang/${testName}-inputFiles.json`
};
var getInputFilePath = (runtime, testName) => {
  const pattern = INPUT_FILE_PATTERNS[runtime];
  if (!pattern) {
    throw new Error(`Input file pattern not defined for runtime: ${runtime}`);
  }
  return pattern(testName);
};
var COMMON_VOLUMES = [
  `${process.cwd()}/src:/workspace/src`,
  `${process.cwd()}/dist:/workspace/dist`,
  `${process.cwd()}/testeranto:/workspace/testeranto`
];
var isContainerActive = (state) => {
  return state === "running";
};
var getContainerInspectFormat = () => {
  return "{{.State.ExitCode}}|{{.State.StartedAt}}|{{.State.FinishedAt}}|{{.State.Status}}";
};
var cleanTestName = (testName) => {
  return testName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-").replace(/[^a-z0-9_-]/g, "");
};
var BaseCompose = (services) => {
  return {
    services,
    volumes: {
      node_modules: {
        driver: "local"
      }
    },
    networks: {
      allTests_network: {
        driver: "bridge"
      }
    }
  };
};
var staticTestDockerComposeFile = (runtime, container_name, command, config, runtimeTestsName) => {
  return {
    build: {
      context: process.cwd(),
      dockerfile: config.runtimes[runtimeTestsName].dockerfile
    },
    container_name,
    environment: {},
    working_dir: "/workspace",
    command,
    networks: ["allTests_network"]
  };
};
var bddTestDockerComposeFile = (configs, runtime, container_name, command) => {
  let dockerfilePath = "";
  for (const [key, value] of Object.entries(configs.runtimes)) {
    if (value.runtime === runtime) {
      dockerfilePath = value.dockerfile;
      break;
    }
  }
  if (!dockerfilePath) {
    throw `[Docker] [bddTestDockerComposeFile] no dockerfile found for ${dockerfilePath}, ${Object.entries(configs)}`;
  }
  const service = {
    build: {
      context: process.cwd(),
      dockerfile: dockerfilePath
    },
    container_name,
    environment: {},
    working_dir: "/workspace",
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/testeranto:/workspace/testeranto`
    ],
    command,
    networks: ["allTests_network"]
  };
  return service;
};
var aiderDockerComposeFile = (container_name) => {
  return {
    build: {
      context: process.cwd(),
      dockerfile: "aider.Dockerfile"
    },
    container_name,
    environment: {},
    volumes: [
      `${process.cwd()}/.aider.conf.yml:/workspace/.aider.conf.yml`,
      `${process.cwd()}:/workspace`
    ],
    working_dir: "/workspace",
    command: "tail -f /dev/null",
    networks: ["allTests_network"],
    tty: true,
    stdin_open: true
  };
};
var executeDockerComposeCommand = async (command, options) => {
  const useExec = options?.useExec ?? false;
  const execOptions = options?.execOptions ?? { cwd: process.cwd() };
  const errorMessage = options?.errorMessage ?? "Error executing docker compose command";
  try {
    if (useExec) {
      const { exec } = __require("child_process");
      const { promisify } = __require("util");
      const execAsync = promisify(exec);
      const { stdout, stderr } = await execAsync(command, execOptions);
      return {
        exitCode: 0,
        out: stdout,
        err: stderr,
        data: null
      };
    } else {
      return {
        exitCode: 0,
        out: "",
        err: "",
        data: { command, spawn: true }
      };
    }
  } catch (error) {
    console.error(`[Docker] ${errorMessage}: ${error.message}`);
    return {
      exitCode: 1,
      out: "",
      err: `${errorMessage}: ${error.message}`,
      data: null
    };
  }
};
var DC_COMMANDS = {
  up: DOCKER_COMPOSE_UP,
  down: DOCKER_COMPOSE_DOWN,
  ps: DOCKER_COMPOSE_PS,
  logs: (serviceName, tail = 100) => {
    const base = `${DOCKER_COMPOSE_LOGS} --tail=${tail}`;
    return serviceName ? `${base} ${serviceName}` : base;
  },
  config: DOCKER_COMPOSE_CONFIG,
  build: DOCKER_COMPOSE_BUILD,
  start: DOCKER_COMPOSE_START
};

// src/server/WsManager.ts
class WsManager {
  constructor() {}
  escapeXml(unsafe) {
    if (!unsafe)
      return "";
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case "'":
          return "&apos;";
        case '"':
          return "&quot;";
        default:
          return c;
      }
    });
  }
  processMessage(type2, data, getProcessSummary, getProcessLogs) {
    console.log("[WsManager] Processing message:", type2);
    switch (type2) {
      case "ping":
        return {
          type: "pong",
          timestamp: new Date().toISOString()
        };
      case "getProcesses":
        if (getProcessSummary) {
          const summary = getProcessSummary();
          return {
            type: "processes",
            data: summary,
            timestamp: new Date().toISOString()
          };
        } else {
          return {
            type: "processes",
            data: { processes: [], totalProcesses: 0, running: 0 },
            timestamp: new Date().toISOString()
          };
        }
      case "getLogs":
        const { processId } = data || {};
        if (!processId) {
          return {
            type: "logs",
            status: "error",
            message: "Missing processId",
            timestamp: new Date().toISOString()
          };
        }
        if (getProcessLogs) {
          const logs = getProcessLogs(processId);
          return {
            type: "logs",
            processId,
            logs: logs.map((log) => {
              let level = "info";
              let source = "process";
              let message = log;
              const match = log.match(/\[(.*?)\] \[(.*?)\] (.*)/);
              if (match) {
                const timestamp2 = match[1];
                source = match[2];
                message = match[3];
                if (source === "stderr" || source === "error") {
                  level = "error";
                } else if (source === "warn") {
                  level = "warn";
                } else if (source === "debug") {
                  level = "debug";
                } else {
                  level = "info";
                }
              }
              return {
                timestamp: new Date().toISOString(),
                level,
                message,
                source
              };
            }),
            timestamp: new Date().toISOString()
          };
        } else {
          return {
            type: "logs",
            processId,
            logs: [],
            timestamp: new Date().toISOString()
          };
        }
      case "subscribeToLogs":
        const { processId: subProcessId } = data || {};
        if (!subProcessId) {
          return {
            type: "logSubscription",
            status: "error",
            message: "Missing processId",
            timestamp: new Date().toISOString()
          };
        }
        return {
          type: "logSubscription",
          status: "subscribed",
          processId: subProcessId,
          timestamp: new Date().toISOString()
        };
      case "sourceFilesUpdated":
        const { testName, hash, files, runtime } = data || {};
        if (!testName || !hash || !files || !runtime) {
          return {
            type: "sourceFilesUpdated",
            status: "error",
            message: "Missing required fields: testName, hash, files, or runtime",
            timestamp: new Date().toISOString()
          };
        }
        return {
          type: "sourceFilesUpdated",
          status: "success",
          testName,
          runtime,
          message: "Build update processed successfully",
          timestamp: new Date().toISOString()
        };
      case "getBuildListenerState":
        return {
          type: "buildListenerState",
          status: "error",
          message: "Build listener state not available",
          timestamp: new Date().toISOString()
        };
      case "getBuildEvents":
        return {
          type: "buildEvents",
          status: "error",
          message: "Build events not available",
          timestamp: new Date().toISOString()
        };
      default:
        return {
          type: "error",
          message: `Unknown message type: ${type2}`,
          timestamp: new Date().toISOString()
        };
    }
  }
  getProcessesResponse(processSummary) {
    return {
      type: "processes",
      data: processSummary,
      timestamp: new Date().toISOString()
    };
  }
  getLogsResponse(processId, logs) {
    return {
      type: "logs",
      processId,
      logs: logs.map((log) => {
        let level = "info";
        let source = "process";
        let message = log;
        const match = log.match(/\[(.*?)\] \[(.*?)\] (.*)/);
        if (match) {
          const timestamp2 = match[1];
          source = match[2];
          message = match[3];
          if (source === "stderr" || source === "error") {
            level = "error";
          } else if (source === "warn") {
            level = "warn";
          } else if (source === "debug") {
            level = "debug";
          } else {
            level = "info";
          }
        }
        return {
          timestamp: new Date().toISOString(),
          level,
          message,
          source
        };
      }),
      timestamp: new Date().toISOString()
    };
  }
  getSourceFilesUpdatedResponse(testName, runtime, status, message) {
    return {
      type: "sourceFilesUpdated",
      status,
      testName,
      runtime,
      message: message || "Build update processed successfully",
      timestamp: new Date().toISOString()
    };
  }
  getErrorResponse(type2, errorMessage) {
    return {
      type: type2,
      status: "error",
      message: errorMessage,
      timestamp: new Date().toISOString()
    };
  }
  getSuccessResponse(type2, data) {
    return {
      type: type2,
      status: "success",
      data,
      timestamp: new Date().toISOString()
    };
  }
}

// src/server/serverClasses/Server_HTTP.ts
import fs from "fs";
import path from "path";

// src/server/tcp.ts
var CONTENT_TYPES = {
  PLAIN: "text/plain",
  HTML: "text/html",
  JAVASCRIPT: "application/javascript",
  CSS: "text/css",
  JSON: "application/json",
  PNG: "image/png",
  JPEG: "image/jpeg",
  GIF: "image/gif",
  SVG: "image/svg+xml",
  ICO: "image/x-icon",
  WOFF: "font/woff",
  WOFF2: "font/woff2",
  TTF: "font/ttf",
  EOT: "application/vnd.ms-fontobject",
  XML: "application/xml",
  PDF: "application/pdf",
  ZIP: "application/zip",
  OCTET_STREAM: "application/octet-stream"
};
function getContentType(filePath) {
  if (filePath.endsWith(".html"))
    return CONTENT_TYPES.HTML;
  else if (filePath.endsWith(".js") || filePath.endsWith(".mjs"))
    return CONTENT_TYPES.JAVASCRIPT;
  else if (filePath.endsWith(".css"))
    return CONTENT_TYPES.CSS;
  else if (filePath.endsWith(".json"))
    return CONTENT_TYPES.JSON;
  else if (filePath.endsWith(".png"))
    return CONTENT_TYPES.PNG;
  else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg"))
    return CONTENT_TYPES.JPEG;
  else if (filePath.endsWith(".gif"))
    return CONTENT_TYPES.GIF;
  else if (filePath.endsWith(".svg"))
    return CONTENT_TYPES.SVG;
  else
    return CONTENT_TYPES.PLAIN;
}

// src/server/HttpManager.ts
class HttpManager {
  routeName(req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const urlPath = url.pathname;
    return urlPath.slice(3);
  }
  decodedPath(req) {
    const urlPath = new URL(req.url, `http://${req.headers.host}`).pathname;
    const decodedPath = decodeURIComponent(urlPath);
    return decodedPath.startsWith("/") ? decodedPath.slice(1) : decodedPath;
  }
  matchRoute(routeName, routes) {
    if (routes && routes[routeName]) {
      return { handler: routes[routeName], params: {} };
    }
    for (const [pattern, handler] of Object.entries(routes)) {
      if (pattern.includes(":")) {
        const patternParts = pattern.split("/");
        const routeParts = routeName.split("/");
        const lastPatternPart = patternParts[patternParts.length - 1];
        const isLastParamWithExtension = lastPatternPart.includes(":") && lastPatternPart.includes(".xml");
        if (isLastParamWithExtension) {
          let matches = true;
          const params = {};
          for (let i2 = 0;i2 < patternParts.length - 1; i2++) {
            const patternPart = patternParts[i2];
            const routePart = routeParts[i2];
            if (patternPart.startsWith(":")) {
              const paramName = patternPart.slice(1);
              params[paramName] = routePart;
            } else if (patternPart !== routePart) {
              matches = false;
              break;
            }
          }
          if (matches) {
            const lastParamName = lastPatternPart.slice(1, lastPatternPart.indexOf(".xml"));
            const remainingParts = routeParts.slice(patternParts.length - 1);
            let paramValue = remainingParts.join("/");
            if (paramValue.endsWith(".xml")) {
              paramValue = paramValue.slice(0, -4);
            }
            params[lastParamName] = paramValue;
            return { handler, params };
          }
        } else {
          if (patternParts.length !== routeParts.length) {
            continue;
          }
          let matches = true;
          const params = {};
          for (let i2 = 0;i2 < patternParts.length; i2++) {
            const patternPart = patternParts[i2];
            const routePart = routeParts[i2];
            if (patternPart.startsWith(":")) {
              const paramName = patternPart.slice(1);
              params[paramName] = routePart;
            } else if (patternPart !== routePart) {
              matches = false;
              break;
            }
          }
          if (matches) {
            return { handler, params };
          }
        }
      }
    }
    return null;
  }
  extractParams(pattern, routeName) {
    const patternParts = pattern.split("/");
    const routeParts = routeName.split("/");
    if (patternParts.length !== routeParts.length) {
      return null;
    }
    const params = {};
    for (let i2 = 0;i2 < patternParts.length; i2++) {
      const patternPart = patternParts[i2];
      const routePart = routeParts[i2];
      if (patternPart.startsWith(":")) {
        const paramName = patternPart.slice(1);
        params[paramName] = routePart;
      } else if (patternPart !== routePart) {
        return null;
      }
    }
    return params;
  }
}

// src/server/serverClasses/Server_Base.ts
class Server_Base {
  mode;
  configs;
  constructor(configs, mode) {
    this.configs = configs;
    this.mode = mode;
    console.log(`[Base] ${this.configs}`);
  }
  async start() {}
  async stop() {
    console.log(`goodbye testeranto`);
    process.exit();
  }
}

// src/server/serverClasses/Server_HTTP.ts
class Server_HTTP extends Server_Base {
  http;
  bunServer = null;
  routes;
  constructor(configs, mode) {
    super(configs, mode);
    this.http = new HttpManager;
    this.routes = {
      processes: {
        method: "GET",
        handler: () => this.handleHttpGetProcesses()
      }
    };
  }
  handleHttpGetProcesses() {
    console.log(`[HTTP] Checking if getProcessSummary exists...`);
    if (typeof this.getProcessSummary === "function") {
      console.log(`[HTTP] getProcessSummary exists, calling it...`);
      const processSummary = this.getProcessSummary();
      console.log(`[HTTP] getProcessSummary returned:`, processSummary ? "has data" : "null/undefined");
      if (processSummary && processSummary.error) {
        console.log(`[HTTP] Process summary has error:`, processSummary.error);
        return new Response(JSON.stringify({
          error: processSummary.error,
          processes: [],
          total: 0,
          timestamp: new Date().toISOString(),
          message: processSummary.message || "Error retrieving docker processes"
        }), {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      const formattedProcesses = (processSummary?.processes || []).map((process2) => ({
        name: process2.processId || process2.containerId,
        status: process2.status || process2.state,
        state: process2.state,
        image: process2.image,
        ports: process2.ports,
        exitCode: process2.exitCode,
        isActive: process2.isActive,
        runtime: process2.runtime,
        startedAt: process2.startedAt,
        finishedAt: process2.finishedAt
      }));
      const responseData = {
        processes: formattedProcesses,
        total: processSummary?.total || formattedProcesses.length,
        timestamp: processSummary?.timestamp || new Date().toISOString(),
        message: processSummary?.message || "Success"
      };
      console.log(`[HTTP] Returning response with ${formattedProcesses.length} processes`);
      return new Response(JSON.stringify(responseData, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } else {
      console.log(`[HTTP] getProcessSummary does not exist on this instance`);
      console.log(`[HTTP] this.constructor.name:`, this.constructor.name);
      console.log(`[HTTP] this keys:`, Object.keys(this));
      return new Response(JSON.stringify({
        error: "getProcessSummary method not available",
        processes: [],
        total: 0,
        timestamp: new Date().toISOString(),
        message: "Server does not support process listing"
      }), {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
  handleHttpGetOutputFiles(request, url) {
    const runtime = url.searchParams.get("runtime");
    const testName = url.searchParams.get("testName");
    if (!runtime || !testName) {
      return new Response(JSON.stringify({
        error: "Missing runtime or testName query parameters",
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    console.log(`[HTTP] Getting output files for runtime: ${runtime}, testName: ${testName}`);
    if (typeof this.getOutputFiles === "function") {
      console.log(`[HTTP] getOutputFiles exists, calling it...`);
      const outputFiles = this.getOutputFiles(runtime, testName);
      console.log(`[HTTP] getOutputFiles returned:`, outputFiles ? `${outputFiles.length} files` : "null/undefined");
      const responseData = {
        runtime,
        testName,
        outputFiles: outputFiles || [],
        timestamp: new Date().toISOString(),
        message: "Success"
      };
      return new Response(JSON.stringify(responseData, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } else {
      console.log(`[HTTP] getOutputFiles does not exist on this instance`);
      const fs2 = __require("fs");
      const path2 = __require("path");
      const outputDir = path2.join(process.cwd(), "testeranto", "reports", runtime);
      if (fs2.existsSync(outputDir)) {
        const files = fs2.readdirSync(outputDir);
        const testFiles = files.filter((file) => file.includes(testName.replace("/", "_").replace(".", "-")));
        const projectRoot = process.cwd();
        const relativePaths = testFiles.map((file) => {
          const absolutePath = path2.join(outputDir, file);
          let relativePath = path2.relative(projectRoot, absolutePath);
          relativePath = relativePath.split(path2.sep).join("/");
          return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
        });
        const responseData = {
          runtime,
          testName,
          outputFiles: relativePaths || [],
          timestamp: new Date().toISOString(),
          message: "Success (from directory)"
        };
        return new Response(JSON.stringify(responseData, null, 2), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } else {
        return new Response(JSON.stringify({
          error: "getOutputFiles method not available and directory not found",
          runtime,
          testName,
          outputFiles: [],
          timestamp: new Date().toISOString(),
          message: "No output files found"
        }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }
  }
  handleHttpGetInputFiles(request, url) {
    const runtime = url.searchParams.get("runtime");
    const testName = url.searchParams.get("testName");
    if (!runtime || !testName) {
      return new Response(JSON.stringify({
        error: "Missing runtime or testName query parameters",
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    console.log(`[HTTP] Getting input files for runtime: ${runtime}, testName: ${testName}`);
    if (typeof this.getInputFiles === "function") {
      console.log(`[HTTP] getInputFiles exists, calling it...`);
      const inputFiles = this.getInputFiles(runtime, testName);
      console.log(`[HTTP] getInputFiles returned:`, inputFiles ? `${inputFiles.length} files` : "null/undefined");
      const responseData = {
        runtime,
        testName,
        inputFiles: inputFiles || [],
        timestamp: new Date().toISOString(),
        message: "Success"
      };
      return new Response(JSON.stringify(responseData, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } else {
      throw `[HTTP] getInputFiles does not exist on this instance`;
    }
  }
  handleHttpGetAiderProcesses() {
    console.log(`[HTTP] handleHttpGetAiderProcesses() called`);
    try {
      if (typeof this.handleAiderProcesses === "function") {
        console.log(`[HTTP] handleAiderProcesses exists, calling it...`);
        const result = this.handleAiderProcesses();
        console.log(`[HTTP] handleAiderProcesses returned:`, result ? `has data` : "null/undefined");
        const responseData = {
          aiderProcesses: result.aiderProcesses || [],
          timestamp: result.timestamp || new Date().toISOString(),
          message: result.message || "Success"
        };
        console.log(`[HTTP] Returning aider processes response with ${responseData.aiderProcesses.length} processes`);
        return new Response(JSON.stringify(responseData, null, 2), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } else if (typeof this.getAiderProcesses === "function") {
        console.log(`[HTTP] getAiderProcesses exists (fallback), calling it...`);
        const aiderProcesses = this.getAiderProcesses();
        console.log(`[HTTP] getAiderProcesses returned:`, aiderProcesses ? `${aiderProcesses.length} processes` : "null/undefined");
        const responseData = {
          aiderProcesses: aiderProcesses || [],
          timestamp: new Date().toISOString(),
          message: "Success"
        };
        console.log(`[HTTP] Returning aider processes response with ${aiderProcesses?.length || 0} processes`);
        return new Response(JSON.stringify(responseData, null, 2), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } else {
        console.log(`[HTTP] Neither handleAiderProcesses nor getAiderProcesses exists on this instance`);
        const responseData = {
          aiderProcesses: [],
          timestamp: new Date().toISOString(),
          message: "Aider processes not available"
        };
        return new Response(JSON.stringify(responseData, null, 2), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    } catch (error) {
      console.error(`[HTTP] Error in GET /~/aider-processes:`, error);
      console.error(`[HTTP] Error stack:`, error.stack);
      return new Response(JSON.stringify({
        error: error.message,
        aiderProcesses: [],
        timestamp: new Date().toISOString(),
        message: "Internal server error"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
  handleHttpGetConfigs() {
    console.log(`[HTTP] handleHttpGetConfigs() called`);
    try {
      console.log(`[HTTP] Checking if configs exists...`);
      if (this.configs) {
        console.log(`[HTTP] configs exists, returning it...`);
        console.log(`[HTTP] configs type:`, typeof this.configs);
        console.log(`[HTTP] configs keys:`, Object.keys(this.configs));
        const responseData = {
          configs: this.configs,
          timestamp: new Date().toISOString(),
          message: "Success"
        };
        console.log(`[HTTP] Returning configs response`);
        return new Response(JSON.stringify(responseData, null, 2), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } else {
        console.log(`[HTTP] configs does not exist on this instance`);
        console.log(`[HTTP] this.constructor.name:`, this.constructor.name);
        console.log(`[HTTP] this keys:`, Object.keys(this));
        return new Response(JSON.stringify({
          error: "configs property not available",
          timestamp: new Date().toISOString(),
          message: "Server does not have configs"
        }), {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    } catch (error) {
      console.error(`[HTTP] Error in GET /~/configs:`, error);
      console.error(`[HTTP] Error stack:`, error.stack);
      return new Response(JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
        message: "Internal server error"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
  async start() {
    await super.start();
    const port = 3000;
    try {
      const serverOptions = {
        port,
        fetch: async (request, server) => {
          console.log(`[HTTP] Received request: ${request.method} ${request.url}`);
          try {
            console.log(`[HTTP] Calling handleRequest...`);
            const response = this.handleRequest(request, server);
            if (response instanceof Response) {
              console.log(`[HTTP] handleRequest returned Response with status:`, response.status);
              return response;
            } else if (response && typeof response.then === "function") {
              console.log(`[HTTP] handleRequest returned a Promise, awaiting...`);
              const awaitedResponse = await response;
              console.log(`[HTTP] Promise resolved to Response with status:`, awaitedResponse.status);
              return awaitedResponse;
            } else if (response === undefined || response === null) {
              console.log(`[HTTP] handleRequest returned undefined/null, assuming WebSocket upgrade was handled`);
              return;
            } else {
              console.error(`[HTTP] handleRequest returned non-Response:`, response);
              return new Response(`Server Error: handleRequest did not return a Response`, {
                status: 500,
                headers: { "Content-Type": "text/plain" }
              });
            }
          } catch (error) {
            console.error(`[HTTP] Error handling request ${request.url}:`, error);
            console.error(`[HTTP] Error stack:`, error.stack);
            return new Response(`Internal Server Error: ${error.message}`, {
              status: 500,
              headers: { "Content-Type": "text/plain" }
            });
          }
        },
        error: (error) => {
          console.error(`[HTTP] Server error:`, error);
          return new Response(`Server Error: ${error.message}`, {
            status: 500,
            headers: { "Content-Type": "text/plain" }
          });
        }
      };
      if (this instanceof Server_WS) {
        console.log(`[Server_HTTP] Adding WebSocket configuration`);
        serverOptions.websocket = {
          open: (ws) => {
            console.log(`[WebSocket] New connection`);
            this.wsClients.add(ws);
            ws.send(JSON.stringify({
              type: "connected",
              message: "Connected to Process Manager WebSocket",
              timestamp: new Date().toISOString()
            }));
            console.log("[WebSocket] Connection established, waiting for resource change notifications");
          },
          message: (ws, message) => {
            try {
              const data = typeof message === "string" ? JSON.parse(message) : JSON.parse(message.toString());
              if (ws && typeof ws.send === "function") {
                this.handleWebSocketMessage(ws, data);
              } else {
                console.error("[WebSocket] Invalid WebSocket instance in message handler");
              }
            } catch (error) {
              console.error("[WebSocket] Error parsing message:", error);
              if (ws && typeof ws.send === "function") {
                ws.send(JSON.stringify({
                  type: "error",
                  message: "Invalid JSON message",
                  timestamp: new Date().toISOString()
                }));
              }
            }
          },
          close: (ws) => {
            console.log("[WebSocket] Client disconnected");
            this.wsClients.delete(ws);
          },
          error: (ws, error) => {
            console.error("[WebSocket] Error:", error);
            this.wsClients.delete(ws);
          }
        };
      }
      this.bunServer = Bun.serve(serverOptions);
      console.log(`[HTTP] Bun HTTP server is now listening on http://localhost:${port}`);
      console.log(`[HTTP] Server URL: http://localhost:${port}/~/processes`);
    } catch (error) {
      console.error(`[HTTP] Failed to start server:`, error);
      throw error;
    }
  }
  async stop() {
    if (this.bunServer) {
      this.bunServer.stop();
    }
    await super.stop();
  }
  handleRequest(request, server) {
    const url = new URL(request.url);
    console.log(`[Server_HTTP] handleRequest(${url.pathname}) from ${request.url}`);
    console.log(`[Server_HTTP] Request method: ${request.method}`);
    if (request.headers.get("upgrade") === "websocket") {
      console.log(`[Server_HTTP] WebSocket upgrade request detected for path: ${url.pathname}`);
      if (this instanceof Server_WS && server) {
        console.log(`[Server_HTTP] Upgrading to WebSocket`);
        const success = server.upgrade(request);
        if (success) {
          console.log(`[Server_HTTP] WebSocket upgrade successful`);
          return;
        } else {
          console.error(`[Server_HTTP] WebSocket upgrade failed`);
          return new Response("WebSocket upgrade failed", { status: 500 });
        }
      } else {
        console.log(`[Server_HTTP] WebSocket not supported`);
        return new Response("WebSocket not supported", { status: 426 });
      }
    }
    if (url.pathname.startsWith("/~/")) {
      console.log(`[Server_HTTP] Matched route pattern: ${url.pathname}`);
      return this.handleRouteRequest(request, url);
    } else {
      console.log(`[Server_HTTP] Serving static file: ${url.pathname}`);
      return this.serveStaticFile(request, url);
    }
  }
  handleRouteRequest(request, url) {
    const routeName = url.pathname.slice(3);
    console.log(`[HTTP] Handling route: /~/${routeName}, method: ${request.method}, full pathname: ${url.pathname}`);
    if (routeName === "processes") {
      console.log(`[HTTP] Matched /processes route`);
      if (request.method === "GET") {
        console.log(`[HTTP] Handling GET /~/processes`);
        console.log(`[HTTP] Checking if handleHttpGetProcesses exists:`, typeof this.handleHttpGetProcesses);
        if (typeof this.handleHttpGetProcesses === "function") {
          console.log(`[HTTP] Calling handleHttpGetProcesses`);
          return this.handleHttpGetProcesses();
        } else {
          console.error(`[HTTP] handleHttpGetProcesses is not a function`);
          return new Response(`Server Error: handleHttpGetProcesses not found`, {
            status: 500,
            headers: { "Content-Type": "text/plain" }
          });
        }
      } else if (request.method === "OPTIONS") {
        console.log(`[HTTP] Handling OPTIONS /~/processes`);
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400"
          }
        });
      } else {
        console.log(`[HTTP] Method not allowed: ${request.method} for /~/processes`);
        return new Response(`Method ${request.method} not allowed`, {
          status: 405,
          headers: {
            Allow: "GET, OPTIONS",
            "Content-Type": "text/plain"
          }
        });
      }
    }
    if (routeName === "configs") {
      console.log(`[HTTP] Matched /configs route`);
      if (request.method === "GET") {
        console.log(`[HTTP] Handling GET /~/configs`);
        console.log(`[HTTP] Checking if handleHttpGetConfigs exists:`, typeof this.handleHttpGetConfigs);
        if (typeof this.handleHttpGetConfigs === "function") {
          console.log(`[HTTP] Calling handleHttpGetConfigs`);
          return this.handleHttpGetConfigs();
        } else {
          console.error(`[HTTP] handleHttpGetConfigs is not a function`);
          return new Response(`Server Error: handleHttpGetConfigs not found`, {
            status: 500,
            headers: { "Content-Type": "text/plain" }
          });
        }
      } else if (request.method === "OPTIONS") {
        console.log(`[HTTP] Handling OPTIONS /~/configs`);
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400"
          }
        });
      } else {
        console.log(`[HTTP] Method not allowed: ${request.method} for /~/configs`);
        return new Response(`Method ${request.method} not allowed`, {
          status: 405,
          headers: {
            Allow: "GET, OPTIONS",
            "Content-Type": "text/plain"
          }
        });
      }
    }
    if (routeName === "outputfiles") {
      console.log(`[HTTP] Matched /outputfiles route`);
      if (request.method === "GET") {
        console.log(`[HTTP] Handling GET /~/outputfiles`);
        return this.handleHttpGetOutputFiles(request, url);
      } else if (request.method === "OPTIONS") {
        console.log(`[HTTP] Handling OPTIONS /~/outputfiles`);
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400"
          }
        });
      } else {
        console.log(`[HTTP] Method not allowed: ${request.method} for /~/outputfiles`);
        return new Response(`Method ${request.method} not allowed`, {
          status: 405,
          headers: {
            Allow: "GET, OPTIONS",
            "Content-Type": "text/plain"
          }
        });
      }
    }
    if (routeName === "aider-processes") {
      console.log(`[HTTP] Matched /aider-processes route`);
      if (request.method === "GET") {
        console.log(`[HTTP] Handling GET /~/aider-processes`);
        return this.handleHttpGetAiderProcesses();
      } else if (request.method === "OPTIONS") {
        console.log(`[HTTP] Handling OPTIONS /~/aider-processes`);
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400"
          }
        });
      } else {
        console.log(`[HTTP] Method not allowed: ${request.method} for /~/aider-processes`);
        return new Response(`Method ${request.method} not allowed`, {
          status: 405,
          headers: {
            Allow: "GET, OPTIONS",
            "Content-Type": "text/plain"
          }
        });
      }
    }
    if (routeName === "inputfiles") {
      console.log(`[HTTP] Matched /inputfiles route`);
      if (request.method === "GET") {
        console.log(`[HTTP] Handling GET /~/inputfiles`);
        return this.handleHttpGetInputFiles(request, url);
      } else if (request.method === "OPTIONS") {
        console.log(`[HTTP] Handling OPTIONS /~/inputfiles`);
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400"
          }
        });
      } else {
        console.log(`[HTTP] Method not allowed: ${request.method} for /~/inputfiles`);
        return new Response(`Method ${request.method} not allowed`, {
          status: 405,
          headers: {
            Allow: "GET, OPTIONS",
            "Content-Type": "text/plain"
          }
        });
      }
    }
    const match = this.http.matchRoute(routeName, this.routes);
    if (match) {
      console.log(`[HTTP] Found route match for ${routeName}`);
      try {
        const nodeReq = {
          url: url.pathname,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body: request.body,
          params: match.params
        };
        const response = {
          writeHead: (status, headers) => {
            return new Response(null, { status, headers });
          },
          end: (body) => {
            return new Response(body, {
              status: 200,
              headers: { "Content-Type": "text/plain" }
            });
          }
        };
        const result = match.handler(nodeReq, response);
        if (result instanceof Response) {
          return result;
        }
        return result;
      } catch (error) {
        console.error(`[HTTP] Error in route handler for /~/${routeName}:`, error);
        return new Response(`Internal Server Error: ${error}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" }
        });
      }
    }
    console.log(`[HTTP] No route found for: /~/${routeName}`);
    return new Response(`Route not found: /~/${routeName}`, {
      status: 404,
      headers: { "Content-Type": "text/plain" }
    });
  }
  async serveStaticFile(request, url) {
    console.log(`[Server_HTTP] serveStaticFile(${url.pathname})`);
    const normalizedPath = decodeURIComponent(url.pathname);
    if (normalizedPath.includes("..")) {
      return new Response("Forbidden: Directory traversal not allowed", {
        status: 403,
        headers: { "Content-Type": "text/plain" }
      });
    }
    const projectRoot = process.cwd();
    const filePath = path.join(projectRoot, normalizedPath);
    if (!filePath.startsWith(path.resolve(projectRoot))) {
      return new Response("Forbidden", {
        status: 403,
        headers: { "Content-Type": "text/plain" }
      });
    }
    try {
      const stats = await fs.promises.stat(filePath);
      if (stats.isDirectory()) {
        const files = await fs.promises.readdir(filePath);
        const items = await Promise.all(files.map(async (file) => {
          try {
            const stat = await fs.promises.stat(path.join(filePath, file));
            const isDir = stat.isDirectory();
            const slash = isDir ? "/" : "";
            return `<li><a href="${path.join(normalizedPath, file)}${slash}">${file}${slash}</a></li>`;
          } catch {
            return `<li><a href="${path.join(normalizedPath, file)}">${file}</a></li>`;
          }
        }));
        const html = `
          <!DOCTYPE html>
          <html>
          <head><title>Directory listing for ${normalizedPath}</title></head>
          <body>
            <h1>Directory listing for ${normalizedPath}</h1>
            <ul>
              ${items.join("")}
            </ul>
          </body>
          </html>
        `;
        return new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html" }
        });
      } else {
        return this.serveFile(filePath);
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        return new Response(`File not found: ${normalizedPath}`, {
          status: 404,
          headers: { "Content-Type": "text/plain" }
        });
      } else {
        return new Response(`Server Error: ${error.message}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" }
        });
      }
    }
  }
  async serveFile(filePath) {
    console.log(`[Server_HTTP] serveFile(${filePath})`);
    const contentType = getContentType(filePath) || CONTENT_TYPES.OCTET_STREAM;
    try {
      const file = await Bun.file(filePath).arrayBuffer();
      return new Response(file, {
        status: 200,
        headers: { "Content-Type": contentType }
      });
    } catch (error) {
      if (error.code === "ENOENT") {
        return new Response(`File not found: ${filePath}`, {
          status: 404,
          headers: { "Content-Type": "text/plain" }
        });
      } else {
        return new Response(`Server Error: ${error.message}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" }
        });
      }
    }
  }
  router(a) {
    return a;
  }
}

// src/server/serverClasses/Server_WS.ts
class Server_WS extends Server_HTTP {
  wsClients = new Set;
  wsManager;
  constructor(configs, mode) {
    super(configs, mode);
    this.wsManager = new WsManager;
  }
  async start() {
    console.log(`[Server_WS] start()`);
    await super.start();
  }
  async stop() {
    console.log(`[Server_WS] stop()`);
    this.wsClients.forEach((client) => {
      client.close();
    });
    this.wsClients.clear();
    await super.stop();
  }
  escapeXml(unsafe) {
    return this.wsManager.escapeXml(unsafe);
  }
  resourceChanged(url) {
    console.log(`[WebSocket] Resource changed: ${url}, broadcasting to ${this.wsClients.size} clients`);
    const message = {
      type: "resourceChanged",
      url,
      timestamp: new Date().toISOString(),
      message: `Resource at ${url} has been updated`
    };
    console.log(`[WebSocket] Broadcasting message:`, message);
    this.broadcast(message);
  }
  broadcast(message) {
    const data = typeof message === "string" ? message : JSON.stringify(message);
    console.log(`[WebSocket] Broadcasting to ${this.wsClients.size} clients:`, message.type || message);
    let sentCount = 0;
    let errorCount = 0;
    this.wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(data);
          sentCount++;
        } catch (error) {
          console.error(`[WebSocket] Error sending to client:`, error);
          errorCount++;
        }
      } else {
        console.log(`[WebSocket] Client not open, state: ${client.readyState}`);
      }
    });
    console.log(`[WebSocket] Sent to ${sentCount} clients, ${errorCount} errors`);
  }
  handleWebSocketMessage(ws, message) {
    console.log("[WebSocket] Received message:", message.type);
    if (message.type === "getProcesses") {
      this.handleGetProcesses(ws);
      return;
    }
    const response = this.wsManager.processMessage(message.type, message.data, () => this.getProcessSummary(), (processId) => {
      const processManager = this;
      if (typeof processManager.getProcessLogs === "function") {
        return processManager.getProcessLogs(processId);
      }
      return [];
    });
    ws.send(JSON.stringify(response));
    switch (message.type) {
      case "sourceFilesUpdated":
        this.handleSourceFilesUpdatedSideEffects(ws, message.data, response);
        break;
      case "getBuildListenerState":
        this.handleGetBuildListenerStateSideEffects(ws);
        break;
      case "getBuildEvents":
        this.handleGetBuildEventsSideEffects(ws);
        break;
    }
  }
  handleSourceFilesUpdatedSideEffects(ws, data, response) {
    const { testName, hash, files, runtime } = data || {};
    if (!testName || !hash || !files || !runtime) {
      return;
    }
    console.log(`[WebSocket] Forwarding source files update to build listener for test: ${testName} (runtime: ${runtime})`);
    if (typeof this.sourceFilesUpdated === "function") {
      console.log(`[WebSocket] sourceFilesUpdated method found, calling it`);
      try {
        this.sourceFilesUpdated(testName, hash, files, runtime);
        console.log(`[WebSocket] sourceFilesUpdated called successfully`);
        this.broadcast({
          type: "sourceFilesUpdated",
          testName,
          hash,
          files,
          runtime,
          status: "processed",
          timestamp: new Date().toISOString(),
          message: "Source files update processed successfully"
        });
        if (response.status === "success") {
          ws.send(JSON.stringify({
            type: "sourceFilesUpdated",
            status: "processed",
            testName,
            runtime,
            message: "Build update processed and broadcasted successfully",
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.error("[WebSocket] Error processing source files update:", error);
        ws.send(JSON.stringify({
          type: "sourceFilesUpdated",
          status: "error",
          testName,
          runtime,
          message: `Error processing build update: ${error}`,
          timestamp: new Date().toISOString()
        }));
      }
    } else {
      console.warn("[WebSocket] sourceFilesUpdated method not available on this instance");
    }
  }
  handleGetBuildListenerStateSideEffects(ws) {
    console.log("[WebSocket] Handling getBuildListenerState request");
    if (typeof this.getBuildListenerState === "function") {
      try {
        const state = this.getBuildListenerState();
        ws.send(JSON.stringify({
          type: "buildListenerState",
          data: state,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error("[WebSocket] Error getting build listener state:", error);
        ws.send(JSON.stringify({
          type: "buildListenerState",
          status: "error",
          message: `Error getting build listener state: ${error}`,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }
  handleGetBuildEventsSideEffects(ws) {
    console.log("[WebSocket] Handling getBuildEvents request");
    if (typeof this.getBuildEvents === "function") {
      try {
        const events = this.getBuildEvents();
        ws.send(JSON.stringify({
          type: "buildEvents",
          events,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error("[WebSocket] Error getting build events:", error);
        ws.send(JSON.stringify({
          type: "buildEvents",
          status: "error",
          message: `Error getting build events: ${error}`,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }
  handleGetProcesses(ws) {
    if (!ws || typeof ws.send !== "function") {
      console.error("[WebSocket] Invalid WebSocket instance in handleGetProcesses");
      return;
    }
    console.log("[WebSocket] Received getProcesses request, telling client to use HTTP");
    ws.send(JSON.stringify({
      type: "useHttp",
      message: "Please use HTTP GET /~/processes to fetch processes",
      timestamp: new Date().toISOString()
    }));
  }
}

// src/server/serverClasses/Server_Docker.ts
class Server_Docker extends Server_WS {
  logProcesses = new Map;
  inputFiles = {};
  outputFiles = {};
  constructor(configs, mode) {
    super(configs, mode);
  }
  generateServices() {
    const services = {};
    const processedRuntimes = new Set;
    for (const [runtimeTestsName, runtimeTests] of Object.entries(this.configs.runtimes)) {
      const runtime = runtimeTests.runtime;
      const dockerfile = runtimeTests.dockerfile;
      const buildOptions = runtimeTests.buildOptions;
      const testsObj = runtimeTests.tests;
      const checks = runtimeTests.checks;
      if (!RUN_TIMES.includes(runtime)) {
        throw `unknown runtime ${runtime}`;
      }
      if (!processedRuntimes.has(runtime)) {
        const builderServiceName = getBuilderServiceName(runtime);
        const buildCommand = runTimeToCompose[runtime][1]("testeranto/testeranto.ts", buildOptions, runtimeTestsName, runtimeTests.tests);
        console.log(`[Server_Docker] [generateServices] ${runtime} build command: "${buildCommand}"`);
        console.log("mark1", runtimeTestsName, this.configs.runtimes[runtimeTestsName]);
        services[builderServiceName] = runTimeToCompose[runtime][0](this.configs, runtimeTestsName, "testeranto/testeranto.ts", this.configs.runtimes[runtimeTestsName].buildOptions, runtimeTestsName);
        processedRuntimes.add(runtime);
      }
      for (const tName of testsObj) {
        const cleanedTestName = cleanTestName(tName);
        const uid = `${runtimeTestsName.toLowerCase()}-${cleanedTestName}`;
        const bddCommandFunc = runTimeToCompose[runtime][2];
        let f;
        if (runtime === "node") {
          f = tName.split(".").slice(0, -1).concat("mjs").join(".");
        } else if (runtime === "web") {
          f = tName.split(".").slice(0, -1).concat("mjs").join(".");
        } else {
          f = tName;
        }
        const bddCommand = bddCommandFunc(f, buildOptions, runtimeTestsName);
        console.log(`[Server_Docker] [generateServices] ${runtimeTestsName} BDD command: "${bddCommand}"`);
        services[getBddServiceName(uid)] = bddTestDockerComposeFile(this.configs, runtime, getBddServiceName(uid), bddCommand);
        services[getAiderServiceName(uid)] = aiderDockerComposeFile(getAiderServiceName(uid));
        if (runtime === "web") {
          services[getBddServiceName(uid)].expose = ["9222"];
        }
        checks.forEach((check, ndx) => {
          const command = check([]);
          services[getCheckServiceName(uid, ndx)] = staticTestDockerComposeFile(runtime, getCheckServiceName(uid, ndx), command, this.configs, runtimeTestsName);
        });
      }
    }
    for (const serviceName in services) {
      if (!services[serviceName].networks) {
        services[serviceName].networks = ["allTests_network"];
      }
    }
    return services;
  }
  async start() {
    await super.start();
    this.writeConfigForExtension();
    await this.setupDockerCompose();
    const baseReportsDir = path2.join(process.cwd(), "testeranto", "reports");
    try {
      fs2.mkdirSync(baseReportsDir, { recursive: true });
      console.log(`[Server_Docker] Created base reports directory: ${baseReportsDir}`);
    } catch (error) {
      console.error(`[Server_Docker] Failed to create base reports directory ${baseReportsDir}: ${error.message}`);
    }
    const downCmd = DOCKER_COMPOSE_DOWN;
    await this.spawnPromise(downCmd);
    const buildResult = await this.DC_build();
    for (const runtimeName in this.configs.runtimes) {
      const runtime = this.configs.runtimes[runtimeName].runtime;
      const serviceName = getBuilderServiceName(runtime);
      await this.spawnPromise(`${DOCKER_COMPOSE_UP} ${serviceName}`);
      await this.captureExistingLogs(serviceName, runtime);
      this.startServiceLogging(serviceName, runtime).catch((error) => console.error(`[Server_Docker] Failed to start logging for ${serviceName}:`, error));
      this.resourceChanged("/~/processes");
    }
    for (const [configKey, configValue] of Object.entries(this.configs.runtimes)) {
      const runtime = configValue.runtime;
      const tests = configValue.tests;
      if (!this.inputFiles[configKey]) {
        this.inputFiles[configKey] = {};
      }
      for (const testName of tests) {
        if (!this.inputFiles[configKey][testName]) {
          this.inputFiles[configKey][testName] = [];
        }
        this.watchInputFile(runtime, testName);
        this.watchOutputFile(runtime, testName, configKey);
        this.launchBddTest(runtime, testName, configKey, configValue);
        this.launchChecks(runtime, testName, configKey, configValue);
      }
    }
  }
  async watchOutputFile(runtime, testName, configKey) {
    const outputDir = getFullReportDir(process.cwd(), runtime);
    if (!this.outputFiles[configKey]) {
      this.outputFiles[configKey] = {};
    }
    if (!this.outputFiles[configKey][testName]) {
      this.outputFiles[configKey][testName] = [];
    }
    console.log(`[Server_Docker] Setting up output file watcher for: ${outputDir} (configKey: ${configKey}, test: ${testName})`);
    this.updateOutputFilesList(configKey, testName, outputDir);
    fs2.watch(outputDir, (eventType, filename) => {
      if (filename) {
        console.log(`[Server_Docker] Output directory changed: ${eventType} ${filename} in ${outputDir}`);
        this.updateOutputFilesList(configKey, testName, outputDir);
        this.resourceChanged("/~/outputfiles");
      }
    });
  }
  updateOutputFilesList(configKey, testName, outputDir) {
    try {
      const files = fs2.readdirSync(outputDir);
      const testFiles = files.filter((file) => file.includes(testName.replace("/", "_").replace(".", "-")) || file.includes(`${configKey}-${testName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-")}`));
      const projectRoot = process.cwd();
      const relativePaths = testFiles.map((file) => {
        const absolutePath = path2.join(outputDir, file);
        let relativePath = path2.relative(projectRoot, absolutePath);
        relativePath = relativePath.split(path2.sep).join("/");
        return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
      });
      this.outputFiles[configKey][testName] = relativePaths;
      console.log(`[Server_Docker] Updated output files for ${configKey}/${testName}: ${relativePaths.length} files`);
      if (relativePaths.length > 0) {
        console.log(`[Server_Docker] Sample output file: ${relativePaths[0]}`);
      }
    } catch (error) {
      console.error(`[Server_Docker] Failed to read output directory ${outputDir}:`, error.message);
      this.outputFiles[configKey][testName] = [];
    }
  }
  async watchInputFile(runtime, testsName) {
    let configKey = "";
    for (const [key, configValue] of Object.entries(this.configs.runtimes)) {
      if (configValue.runtime === runtime && configValue.tests.includes(testsName)) {
        configKey = key;
        break;
      }
    }
    let inputFilePath;
    try {
      inputFilePath = getInputFilePath(runtime, testsName);
    } catch (error) {
      throw `not yet implemented: ${error.message}`;
    }
    console.log(`[Server_Docker] Setting up file watcher for: ${inputFilePath} (configKey: ${configKey})`);
    if (!this.inputFiles[configKey]) {
      this.inputFiles[configKey] = {};
    }
    if (fs2.existsSync(inputFilePath)) {
      const fileContent = fs2.readFileSync(inputFilePath, "utf-8");
      const inputFiles = JSON.parse(fileContent);
      this.inputFiles[configKey][testsName] = inputFiles;
      console.log(`[Server_Docker] Loaded ${inputFiles.length} input files from ${inputFilePath}`);
    }
    try {
      fs2.watchFile(inputFilePath, (curr, prev) => {
        console.log(`[Server_Docker] Input file changed: ${inputFilePath}`);
        const fileContent = fs2.readFileSync(inputFilePath, "utf-8");
        const inputFiles = JSON.parse(fileContent);
        this.inputFiles[configKey][testsName] = inputFiles;
        console.log(`[Server_Docker] Updated input files for ${configKey}/${testsName}: ${inputFiles.length} files`);
        this.resourceChanged("/~/inputfiles");
        for (const [ck, configValue] of Object.entries(this.configs.runtimes)) {
          if (configValue.runtime === runtime && configValue.tests.includes(testsName)) {
            this.launchBddTest(runtime, testsName, ck, configValue);
            this.launchChecks(runtime, testsName, ck, configValue);
            this.informAider(runtime, testsName, ck, configValue, inputFiles);
            break;
          }
        }
      });
    } catch (e) {
      console.error(e);
    }
  }
  async informAider(runtime, testName, configKey, configValue, inputFiles) {
    const uid = generateUid(configKey, testName);
    const aiderServiceName = getAiderServiceName(uid);
    console.log(`[Server_Docker] Informing aider service: ${aiderServiceName} about updated input files`);
    try {
      const containerIdCmd = `docker compose -f "testeranto/docker-compose.yml" ps -q ${aiderServiceName}`;
      const containerId = execSync(containerIdCmd, {
        encoding: "utf-8"
      }).toString().trim();
      if (!containerId) {
        console.error(`[Server_Docker] No container found for aider service: ${aiderServiceName}`);
        return;
      }
      console.log(`[Server_Docker] Found container ID: ${containerId} for ${aiderServiceName}`);
      const inputFilesPath = `testeranto/bundles/${runtime}/${testName}-inputFiles.json`;
      let inputContent = "";
      try {
        inputContent = fs2.readFileSync(inputFilesPath, "utf-8");
        console.log(`[Server_Docker] Read input files from ${inputFilesPath}, length: ${inputContent.length}`);
      } catch (error) {
        console.error(`[Server_Docker] Failed to read input files: ${error.message}`);
      }
      const sendInputCmd = `echo ${JSON.stringify(inputContent)} | docker exec -i ${containerId} sh -c 'cat > /proc/1/fd/0'`;
      console.log(`[Server_Docker] Executing command to send input to aider process`);
      try {
        execSync(sendInputCmd, {
          encoding: "utf-8",
          stdio: "pipe"
        });
        console.log(`[Server_Docker] Successfully sent input to aider process`);
      } catch (error) {
        console.error(`[Server_Docker] Failed to send input via docker exec: ${error.message}`);
      }
    } catch (error) {
      console.error(`[Server_Docker] Failed to inform aider service ${aiderServiceName}: ${error.message}`);
      this.captureExistingLogs(aiderServiceName, runtime).catch((err) => console.error(`[Server_Docker] Also failed to capture logs:`, err));
    }
  }
  async launchBddTest(runtime, testName, configKey, configValue) {
    const uid = generateUid(configKey, testName);
    const bddServiceName = getBddServiceName(uid);
    console.log(`[Server_Docker] Starting BDD service: ${bddServiceName}, ${configKey}, ${testName}`);
    try {
      await this.spawnPromise(`docker compose -f "testeranto/docker-compose.yml" up -d ${bddServiceName}`);
      await this.captureExistingLogs(bddServiceName, runtime);
      this.startServiceLogging(bddServiceName, runtime).catch((error) => console.error(`[Server_Docker] Failed to start logging for ${bddServiceName}:`, error));
      this.resourceChanged("/~/processes");
      this.writeConfigForExtension();
    } catch (error) {
      console.error(`[Server_Docker] Failed to start ${bddServiceName}: ${error.message}`);
      this.captureExistingLogs(bddServiceName, runtime).catch((err) => console.error(`[Server_Docker] Also failed to capture logs:`, err));
      this.writeConfigForExtension();
    }
  }
  async launchChecks(runtime, testName, configKey, configValue) {
    const uid = generateUid(configKey, testName);
    const checks = configValue.checks || [];
    for (let i2 = 0;i2 < checks.length; i2++) {
      const checkServiceName = getCheckServiceName(uid, i2);
      console.log(`[Server_Docker] Starting check service: ${checkServiceName}`);
      try {
        await this.spawnPromise(`docker compose -f "testeranto/docker-compose.yml" up -d ${checkServiceName}`);
        this.startServiceLogging(checkServiceName, runtime).catch((error) => console.error(`[Server_Docker] Failed to start logging for ${checkServiceName}:`, error));
        this.captureExistingLogs(checkServiceName, runtime).catch((error) => console.error(`[Server_Docker] Failed to capture existing logs for ${checkServiceName}:`, error));
        this.resourceChanged("/~/processes");
      } catch (error) {
        console.error(`[Server_Docker] Failed to start ${checkServiceName}: ${error.message}`);
        this.captureExistingLogs(checkServiceName, runtime).catch((err) => console.error(`[Server_Docker] Also failed to capture logs:`, err));
      }
    }
    this.writeConfigForExtension();
  }
  async captureExistingLogs(serviceName, runtime) {
    const reportDir = getFullReportDir(process.cwd(), runtime);
    const logFilePath = getLogFilePath(process.cwd(), runtime, serviceName);
    try {
      const checkCmd = `${DOCKER_COMPOSE_BASE} ps -a -q ${serviceName}`;
      const containerId = execSync(checkCmd, {
        encoding: "utf-8"
      }).toString().trim();
      if (!containerId) {
        console.debug(`[Server_Docker] No container found for service ${serviceName}`);
        return;
      }
      const cmd = `${DOCKER_COMPOSE_LOGS} ${serviceName} 2>/dev/null || true`;
      const existingLogs = execSync(cmd, {
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024
      });
      if (existingLogs && existingLogs.trim().length > 0) {
        fs2.writeFileSync(logFilePath, existingLogs);
        console.log(`[Server_Docker] Captured ${existingLogs.length} bytes of existing logs for ${serviceName}`);
      } else {
        fs2.writeFileSync(logFilePath, "");
      }
      this.captureContainerExitCode(serviceName, runtime);
    } catch (error) {
      console.debug(`[Server_Docker] No existing logs for ${serviceName}: ${error.message}`);
    }
  }
  async stop() {
    for (const [containerId, logProcess] of this.logProcesses.entries()) {
      try {
        logProcess.process.kill("SIGTERM");
        console.log(`[Server_Docker] Stopped log process for container ${containerId} (${logProcess.serviceName})`);
      } catch (error) {
        console.error(`[Server_Docker] Error stopping log process for ${containerId}:`, error);
      }
    }
    this.logProcesses.clear();
    const result = await this.DC_down();
    this.resourceChanged("/~/processes");
    this.writeConfigForExtensionOnStop();
    super.stop();
  }
  async setupDockerCompose() {
    const composeDir = path2.join(process.cwd(), "testeranto", "bundles");
    try {
      const requiredDirs = [
        path2.join(process.cwd(), "src"),
        path2.join(process.cwd(), "dist"),
        path2.join(process.cwd(), "testeranto"),
        composeDir
      ];
      const services = this.generateServices();
      this.writeComposeFile(services);
    } catch (err) {
      console.error(`Error in setupDockerCompose:`, err);
      throw err;
    }
  }
  writeConfigForExtension() {
    try {
      const configDir = path2.join(process.cwd(), "testeranto");
      const configPath = path2.join(configDir, "extension-config.json");
      if (!fs2.existsSync(configDir)) {
        fs2.mkdirSync(configDir, { recursive: true });
        console.log(`[Server_Docker] Created directory: ${configDir}`);
      }
      const runtimesArray = [];
      if (this.configs.runtimes && typeof this.configs.runtimes === "object") {
        for (const [key, value] of Object.entries(this.configs.runtimes)) {
          const runtimeObj = value;
          if (runtimeObj && typeof runtimeObj === "object") {
            const runtime = runtimeObj.runtime;
            const tests = runtimeObj.tests || [];
            console.log(`[Server_Docker] Found runtime: ${runtime}, tests:`, tests);
            if (runtime) {
              runtimesArray.push({
                key,
                runtime,
                label: this.getRuntimeLabel(runtime),
                tests: Array.isArray(tests) ? tests : []
              });
            } else {
              console.warn(`[Server_Docker] No runtime property found for key: ${key}`, runtimeObj);
            }
          } else {
            console.warn(`[Server_Docker] Invalid runtime configuration for key: ${key}, value type: ${typeof value}`);
          }
        }
      } else {
        console.warn(`[Server_Docker] No runtimes found in config`);
      }
      const processSummary = this.getProcessSummary();
      const configData = {
        runtimes: runtimesArray,
        timestamp: new Date().toISOString(),
        source: "testeranto.ts",
        serverStarted: true,
        processes: processSummary.processes || [],
        totalProcesses: processSummary.total || 0,
        lastUpdated: new Date().toISOString()
      };
      const configJson = JSON.stringify(configData, null, 2);
      fs2.writeFileSync(configPath, configJson);
      console.log(`[Server_Docker] Updated extension config with ${processSummary.total || 0} processes`);
    } catch (error) {
      console.error(`[Server_Docker] Failed to write extension config:`, error);
    }
  }
  getRuntimeLabel(runtime) {
    return getRuntimeLabel(runtime);
  }
  writeConfigForExtensionOnStop() {
    try {
      const configDir = path2.join(process.cwd(), "testeranto");
      const configPath = path2.join(configDir, "extension-config.json");
      if (!fs2.existsSync(configDir)) {
        fs2.mkdirSync(configDir, { recursive: true });
        console.log(`[Server_Docker] Created directory: ${configDir}`);
      }
      const configData = {
        runtimes: [],
        timestamp: new Date().toISOString(),
        source: "testeranto.ts",
        serverStarted: false
      };
      const configJson = JSON.stringify(configData, null, 2);
      fs2.writeFileSync(configPath, configJson);
      console.log(`[Server_Docker] Updated extension config to indicate server stopped`);
    } catch (error) {
      console.error(`[Server_Docker] Failed to write extension config on stop:`, error);
    }
  }
  writeComposeFile(services) {
    const dockerComposeFileContents = BaseCompose(services);
    fs2.writeFileSync("testeranto/docker-compose.yml", jsYaml.dump(dockerComposeFileContents, {
      lineWidth: -1,
      noRefs: true
    }));
  }
  getInputFiles(runtime, testName) {
    console.log(`[Server_Docker] getInputFiles called for ${runtime}/${testName}`);
    let configKey = null;
    for (const [key, configValue] of Object.entries(this.configs.runtimes)) {
      if (configValue.runtime === runtime && configValue.tests.includes(testName)) {
        configKey = key;
        break;
      }
    }
    if (!configKey) {
      console.log(`[Server_Docker] No config found for runtime ${runtime} and test ${testName}`);
      return [];
    }
    console.log(`[Server_Docker] Found config key: ${configKey} for ${runtime}/${testName}`);
    console.log("INPUT FILES", this.inputFiles);
    if (this.inputFiles && typeof this.inputFiles === "object" && this.inputFiles[configKey] && typeof this.inputFiles[configKey] === "object" && this.inputFiles[configKey][testName]) {
      const files = this.inputFiles[configKey][testName];
      console.log(`[Server_Docker] Found ${files.length} input files in memory for ${configKey}/${testName}`);
      return Array.isArray(files) ? files : [];
    }
    console.log(`[Server_Docker] No input files in memory for ${configKey}/${testName}`);
    console.log(`[Server_Docker] Available config keys:`, Object.keys(this.inputFiles || {}));
    if (this.inputFiles && this.inputFiles[configKey]) {
      console.log(`[Server_Docker] Tests in ${configKey}:`, Object.keys(this.inputFiles[configKey]));
    }
    return [];
  }
  getOutputFiles(runtime, testName) {
    console.log(`[Server_Docker] getOutputFiles called for ${runtime}/${testName}`);
    let configKey = null;
    for (const [key, configValue] of Object.entries(this.configs.runtimes)) {
      if (configValue.runtime === runtime && configValue.tests.includes(testName)) {
        configKey = key;
        break;
      }
    }
    if (!configKey) {
      console.log(`[Server_Docker] No config found for runtime ${runtime} and test ${testName}`);
      return [];
    }
    console.log(`[Server_Docker] Found config key: ${configKey} for ${runtime}/${testName}`);
    if (this.outputFiles && typeof this.outputFiles === "object" && this.outputFiles[configKey] && typeof this.outputFiles[configKey] === "object" && this.outputFiles[configKey][testName]) {
      const files = this.outputFiles[configKey][testName];
      console.log(`[Server_Docker] Found ${files.length} output files in memory for ${configKey}/${testName}`);
      return Array.isArray(files) ? files : [];
    }
    console.log(`[Server_Docker] No output files in memory for ${configKey}/${testName}`);
    return [];
  }
  getAiderProcesses() {
    try {
      const summary = this.getProcessSummary();
      const aiderProcesses = summary.processes.filter((process2) => process2.name && process2.name.includes("-aider"));
      return aiderProcesses.map((process2) => {
        let runtime = "";
        let testName = "";
        let configKey = "";
        const name = process2.name || process2.containerName || "";
        if (name.includes("-aider")) {
          const match = name.match(/^(.+?)-(.+)-aider$/);
          if (match) {
            configKey = match[1];
            const testPart = match[2];
            for (const [key, configValue] of Object.entries(this.configs.runtimes)) {
              if (key === configKey) {
                runtime = configValue.runtime;
                for (const t of configValue.tests) {
                  const cleanedTestName = cleanTestName(t);
                  if (cleanedTestName === testPart) {
                    testName = t;
                    break;
                  }
                }
                break;
              }
            }
          }
        }
        const connectCommand = `docker exec -it ${process2.containerId} aider`;
        return {
          ...process2,
          name,
          containerId: process2.containerId || "",
          runtime,
          testName,
          configKey,
          status: process2.status || "",
          state: process2.state || "",
          isActive: process2.isActive || false,
          exitCode: process2.exitCode || null,
          startedAt: process2.startedAt || null,
          finishedAt: process2.finishedAt || null,
          connectCommand,
          terminalCommand: connectCommand,
          containerName: name,
          timestamp: new Date().toISOString()
        };
      });
    } catch (error) {
      console.error(`[Server_Docker] Error getting aider processes: ${error.message}`);
      return [];
    }
  }
  handleAiderProcesses() {
    try {
      const aiderProcesses = this.getAiderProcesses();
      return {
        aiderProcesses,
        timestamp: new Date().toISOString(),
        message: "Success"
      };
    } catch (error) {
      console.error(`[Server_Docker] Error in handleAiderProcesses: ${error.message}`);
      return {
        aiderProcesses: [],
        timestamp: new Date().toISOString(),
        message: `Error: ${error.message}`
      };
    }
  }
  getProcessSummary() {
    try {
      const cmd = 'docker ps -a --format "{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}|{{.State}}|{{.Command}}|{{.ID}}"';
      let output;
      try {
        output = execSync(cmd).toString();
      } catch (dockerError) {
        console.error(`[Server_Docker] Error running docker ps: ${dockerError.message}`);
        return {
          processes: [],
          total: 0,
          timestamp: new Date().toISOString(),
          error: `Docker not available: ${dockerError.message}`
        };
      }
      if (!output || output.trim() === "") {
        return {
          processes: [],
          total: 0,
          timestamp: new Date().toISOString(),
          message: "No docker containers found"
        };
      }
      const lines = output.trim().split(`
`).filter((line) => line.trim());
      if (lines.length === 0) {
        return {
          processes: [],
          total: 0,
          timestamp: new Date().toISOString(),
          message: "No docker containers found"
        };
      }
      const processes = lines.map((line) => {
        const parts = line.split("|");
        const [name = "", image = "", status = "", ports = "", state = "", command = "", containerId = ""] = parts;
        let exitCode = null;
        let startedAt = null;
        let finishedAt = null;
        if (containerId && containerId.trim()) {
          try {
            const inspectCmd = `docker inspect --format='${getContainerInspectFormat()}' ${containerId} 2>/dev/null || echo ""`;
            const inspectOutput = execSync(inspectCmd).toString().trim();
            if (inspectOutput && inspectOutput !== "") {
              const [exitCodeStr, startedAtStr, finishedAtStr] = inspectOutput.split("|");
              if (exitCodeStr && exitCodeStr !== "" && exitCodeStr !== "<no value>") {
                exitCode = parseInt(exitCodeStr, 10);
              }
              if (startedAtStr && startedAtStr !== "" && startedAtStr !== "<no value>") {
                startedAt = startedAtStr;
              }
              if (finishedAtStr && finishedAtStr !== "" && finishedAtStr !== "<no value>") {
                finishedAt = finishedAtStr;
              }
            }
          } catch (error) {
            console.debug(`[Server_Docker] Could not inspect container ${containerId}: ${error}`);
          }
        }
        const isActive = isContainerActive(state);
        return {
          processId: name || containerId,
          containerId,
          command: command || image,
          image,
          timestamp: new Date().toISOString(),
          status,
          state,
          ports,
          exitCode,
          startedAt,
          finishedAt,
          isActive,
          health: "unknown"
        };
      });
      return {
        processes,
        total: processes.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`[Server_Docker] Unexpected error in getProcessSummary: ${error.message}`);
      return {
        processes: [],
        total: 0,
        timestamp: new Date().toISOString(),
        error: `Unexpected error: ${error.message}`
      };
    }
  }
  async startServiceLogging(serviceName, runtime) {
    const reportDir = getFullReportDir(process.cwd(), runtime);
    try {
      fs2.mkdirSync(reportDir, { recursive: true });
    } catch (error) {
      console.error(`[Server_Docker] Failed to create report directory ${reportDir}: ${error.message}`);
      return;
    }
    const logFilePath = getLogFilePath(process.cwd(), runtime, serviceName);
    const exitCodeFilePath = getExitCodeFilePath(process.cwd(), runtime, serviceName);
    const logScript = `
      # Wait for container to exist
      for i in {1..30}; do
        if docker compose -f "testeranto/docker-compose.yml" ps -q ${serviceName} > /dev/null 2>&1; then
          break
        fi
        sleep 1
      done
      # Capture logs from the beginning
      docker compose -f "testeranto/docker-compose.yml" logs --no-color -f ${serviceName}
    `;
    console.log(`[Server_Docker] Starting log capture for ${serviceName} to ${logFilePath}`);
    const logStream = fs2.createWriteStream(logFilePath, { flags: "a" });
    const timestamp2 = new Date().toISOString();
    logStream.write(`
=== Log started at ${timestamp2} for service ${serviceName} ===

`);
    const child = spawn("bash", ["-c", logScript], {
      stdio: ["ignore", "pipe", "pipe"]
    });
    let containerId = null;
    try {
      const containerIdCmd = `${DOCKER_COMPOSE_BASE} ps -q ${serviceName}`;
      containerId = execSync(containerIdCmd, {}).toString().trim();
    } catch (error) {
      console.warn(`[Server_Docker] Could not get container ID for ${serviceName}, will track by service name`);
    }
    child.stdout?.on("data", (data) => {
      logStream.write(data);
    });
    child.stderr?.on("data", (data) => {
      logStream.write(data);
    });
    child.on("error", (error) => {
      console.error(`[Server_Docker] Log process error for ${serviceName}:`, error);
      logStream.write(`
=== Log process error: ${error.message} ===
`);
      logStream.end();
      fs2.writeFileSync(exitCodeFilePath, "-1");
    });
    child.on("close", (code) => {
      const endTimestamp = new Date().toISOString();
      logStream.write(`
=== Log ended at ${endTimestamp}, process exited with code ${code} ===
`);
      logStream.end();
      console.log(`[Server_Docker] Log process for ${serviceName} exited with code ${code}`);
      fs2.writeFileSync(exitCodeFilePath, code?.toString() || "0");
      this.captureContainerExitCode(serviceName, runtime);
      if (containerId) {
        this.logProcesses.delete(containerId);
      } else {
        for (const [id, proc] of this.logProcesses.entries()) {
          if (proc.serviceName === serviceName) {
            this.logProcesses.delete(id);
            break;
          }
        }
      }
    });
    const trackingKey = containerId || serviceName;
    this.logProcesses.set(trackingKey, { process: child, serviceName });
    this.writeConfigForExtension();
  }
  async captureContainerExitCode(serviceName, runtime) {
    const containerIdCmd = `docker compose -f "testeranto/docker-compose.yml" ps -a -q ${serviceName}`;
    const containerId = execSync(containerIdCmd, {}).toString().trim();
    if (containerId) {
      const inspectCmd = `docker inspect --format='{{.State.ExitCode}}' ${containerId}`;
      const exitCode = execSync(inspectCmd, {}).toString().trim();
      const containerExitCodeFilePath = getContainerExitCodeFilePath(process.cwd(), runtime, serviceName);
      fs2.writeFileSync(containerExitCodeFilePath, exitCode);
      console.log(`[Server_Docker] Container ${serviceName} (${containerId.substring(0, 12)}) exited with code ${exitCode}`);
      const statusCmd = `docker inspect --format='{{.State.Status}}' ${containerId}`;
      const status = execSync(statusCmd, {}).toString().trim();
      const statusFilePath = getStatusFilePath(process.cwd(), runtime, serviceName);
      fs2.writeFileSync(statusFilePath, status);
      this.resourceChanged("/~/processes");
      this.writeConfigForExtension();
    } else {
      console.debug(`[Server_Docker] No container found for service ${serviceName}`);
    }
  }
  spawnPromise(command) {
    console.log(`[spawnPromise] Executing: ${command}`);
    return new Promise((resolve, reject) => {
      const child = spawn(command, {
        stdio: "inherit",
        shell: true
      });
      child.on("error", (error) => {
        console.error(`[spawnPromise] Failed to start process: ${error.message}`);
        reject(error);
      });
      child.on("close", (code) => {
        if (code === 0) {
          console.log(`[spawnPromise] Process completed successfully`);
          resolve(code);
        } else {
          console.error(`[spawnPromise] Process exited with code ${code}`);
          reject(new Error(`Process exited with code ${code}`));
        }
      });
    });
  }
  async DC_upAll() {
    const result = await executeDockerComposeCommand(DC_COMMANDS.up, {
      errorMessage: "docker compose up"
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await this.spawnPromise(DC_COMMANDS.up);
        return { exitCode: 0, out: "", err: "", data: null };
      } catch (error) {
        console.error(`[Docker] docker compose up \u274C ${import_ansi_colors.default.bgBlue(error.message.replaceAll("\\n", `
`))}`);
        return { exitCode: 1, out: "", err: `Error starting services: ${error.message}`, data: null };
      }
    }
    return result;
  }
  async DC_down() {
    const result = await executeDockerComposeCommand(DC_COMMANDS.down, {
      errorMessage: "docker compose down"
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await this.spawnPromise(DC_COMMANDS.down);
        return { exitCode: 0, out: "", err: "", data: null };
      } catch (error) {
        console.log(`[DC_down] Error during down: ${error.message}`);
        return { exitCode: 1, out: "", err: `Error stopping services: ${error.message}`, data: null };
      }
    }
    return result;
  }
  async DC_ps() {
    return executeDockerComposeCommand(DC_COMMANDS.ps, {
      useExec: true,
      execOptions: { cwd: process.cwd() },
      errorMessage: "Error getting service status"
    });
  }
  async DC_logs(serviceName, options) {
    const tail = options?.tail ?? 100;
    const command = DC_COMMANDS.logs(serviceName, tail);
    return executeDockerComposeCommand(command, {
      useExec: true,
      execOptions: { cwd: process.cwd() },
      errorMessage: `Error getting logs for ${serviceName}`
    });
  }
  async DC_configServices() {
    return executeDockerComposeCommand(DC_COMMANDS.config, {
      useExec: true,
      execOptions: { cwd: process.cwd() },
      errorMessage: "Error getting services from config"
    });
  }
  async DC_start() {
    const result = await executeDockerComposeCommand(DC_COMMANDS.start, {
      errorMessage: "docker compose start"
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await this.spawnPromise(DC_COMMANDS.start);
        return { exitCode: 0, out: "", err: "", data: null };
      } catch (error) {
        console.error(`[Docker] docker compose start \u274C ${import_ansi_colors.default.bgBlue(error.message.replaceAll("\\n", `
`))}`);
        return { exitCode: 1, out: "", err: `Error starting services: ${error.message}`, data: null };
      }
    }
    return result;
  }
  async DC_build() {
    const result = await executeDockerComposeCommand(DC_COMMANDS.build, {
      errorMessage: "docker-compose build"
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await this.spawnPromise(DC_COMMANDS.build);
        console.log(`[DC_build] Build completed successfully`);
        return { exitCode: 0, out: "", err: "", data: null };
      } catch (error) {
        console.error(`[Docker] docker-compose build \u274C ${import_ansi_colors.default.bgBlue(error.message.replaceAll("\\n", `
`))}`);
        return { exitCode: 1, out: "", err: `Error building services: ${error.message}`, data: null };
      }
    }
    return result;
  }
  autogenerateStamp(x) {
    return `# This file is autogenerated. Do not edit it directly
${x}
    `;
  }
  getLogsCommand(serviceName, tail = 100) {
    const base = `${DOCKER_COMPOSE_LOGS} --tail=${tail}`;
    return serviceName ? `${base} ${serviceName}` : base;
  }
}

// src/server/serverClasses/Server.ts
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY)
  process.stdin.setRawMode(true);

class Server extends Server_Docker {
  constructor(configs, mode) {
    super(configs, mode);
    console.log("[Server] Press 'q' to initiate a graceful shutdown.");
    console.log("[Server] Press 'CTRL + c' to quit forcefully.");
    process.stdin.on("keypress", async (str2, key) => {
      if (key.name === "q") {
        console.log("Testeranto is shutting down gracefully...");
        await this.stop();
        process.exit(0);
      }
      if (key.ctrl && key.name === "c") {
        console.log(`
Force quitting...`);
        process.exit(1);
      }
    });
    process.on("SIGINT", async () => {
      console.log(`
Force quitting...`);
      process.exit(1);
    });
  }
  async start() {
    console.log(`[Server] start()`);
    const runtimesDir = `testeranto/runtimes/`;
    fs3.mkdirSync(runtimesDir, { recursive: true });
    await super.start();
  }
  async stop() {
    console.log(`[Server] stop()`);
    await super.stop();
  }
}

// src/index.ts
var mode = process.argv[2];
if (mode !== "once" && mode !== "dev") {
  console.error(`The 3rd argument should be 'dev' or 'once', not '${mode}'.`);
  console.error(`you passed '${process.argv}'.`);
  process.exit(-1);
}
var config = (await import(process.cwd() + "/testeranto/testeranto.ts")).default;
var server = new Server(config, "dev");
server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
console.log("hello testeranto v0.224.4");
