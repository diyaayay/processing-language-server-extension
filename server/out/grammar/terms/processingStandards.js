"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.castingConversionTuples = exports.methodPattern = exports.multiLineCommentComponents = exports.singleLineComment = exports.ifelsePattern = exports.noSmoothPatterns = exports.smoothPattern = exports.fullScreenPattern = exports.sizePattern = exports.removeGeneratedToken = exports.reduceLineMethodBehaviour = exports.reduceLineDefaultBehaviour = exports.defaultClassName = exports.newChecker = exports.classChecker = void 0;
exports.setDefaultClassName = setDefaultClassName;
exports.setupBehaviour = setupBehaviour;
exports.methodBehaviour = methodBehaviour;
exports.preprocessingSettings = preprocessingSettings;
exports.classChecker = `class`;
exports.newChecker = `new`;
exports.defaultClassName = "ProcessingDefault";
const defaultLib = `PApplet`;
//Dynamic Imports should be of the format - `import __.__.__;`
const staticImports = `import processing.core.*\;
import processing.awt.*\;
import processing.data.*\;
import processing.event.*\;
import processing.opengl.*\;
import java.util.*\;
import java.io.*\;
import java.lang.*\;
`;
exports.reduceLineDefaultBehaviour = 13;
exports.reduceLineMethodBehaviour = 12;
//remove duplicate code from stack
exports.removeGeneratedToken = [
    `ProcessingDefault`,
    `main`,
    `args`
];
exports.sizePattern = /(size)\([ ]*[0-9]+[ ]*\,[ ]*[0-9]+[ ]*\,*[ ]*[A-Z 0-9]{0,}[ ]*\)\;/;
exports.fullScreenPattern = /(fullScreen)\([ ]*[A-Z 0-9]{0,}[ ]*\,*[ ]*[0-9]*[ ]*\)\;/;
exports.smoothPattern = /(smooth)\([ ]*[0-9]+[ ]*\)\;/;
exports.noSmoothPatterns = /(noSmooth)\(\)\;/;
exports.ifelsePattern = /[ ]*(else)[ ]*(if)[ ]*\(/g;
exports.singleLineComment = /\/\/(.)*/g;
exports.multiLineCommentComponents = [/\/\*/g, /\*\//g];
exports.methodPattern = /[\w\<\>\[\]]+\s+(\w+) *\([^\)]*\) *(\{)/g;
exports.castingConversionTuples = [
    [/(float\()/g, "PApplet.parseFloat("],
    [/(boolean\()/g, "PApplet.parseBoolean("],
    [/(byte\()/g, "PApplet.parseByte("],
    [/(char\()/g, "PApplet.parseChar("],
    [/(int\()/g, "PApplet.parseInt("],
    [/(color[ ]+)/g, "int "],
    [/(color\[)/g, "int["]
];
function setDefaultClassName(className) {
    exports.defaultClassName = className;
}
// Similar to : https://github.com/processing/processing/blob/37108add372272d7b1fc23d2500dce911c4d1098/java/src/processing/mode/java/preproc/PdePreprocessor.java#L1149
function setupBehaviour(refactoredCode) {
    return `${staticImports} \n` +
        `public class ${exports.defaultClassName} extends ${defaultLib}{\n` +
        `	public void setup(){` +
        `${refactoredCode}` +
        `}` +
        `${preprocessingFooter()}\n` +
        `}`;
}
//Mode.ACTIVE
function methodBehaviour(refactoredCode) {
    return `${staticImports} \n` +
        `public class ${exports.defaultClassName} extends ${defaultLib}{\n` +
        `${refactoredCode}\n` +
        `${preprocessingFooter()}\n` +
        `}`;
}
function preprocessingSettings(settingsContext) {
    return `\n` +
        `	public void settings(){\n` +
        `	${settingsContext}` +
        `	}`;
}
//footer
function preprocessingFooter() {
    return `\n` +
        `	public static void main(String[] args) {\n` +
        `		PApplet.main("${exports.defaultClassName}");\n` +
        `	}`;
}
//# sourceMappingURL=processingStandards.js.map