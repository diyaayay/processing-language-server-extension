"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performPreProcessing = performPreProcessing;
exports.getBehavoirType = getBehavoirType;
const parser = require("./parser");
const pStandards = require("./grammar/terms/processingStandards");
const codeRefactoring = require("./codeRefactoring");
const JavaParser_1 = require("java-ast/dist/parser/JavaParser");
const server_1 = require("./server");
let behaviourType;
/**
 * Transforms user code to java compliant code.
 *
 * Method behaviour has functions in the global scope.
 * Setup behaviour has all functions inside classes.
 *
 * @param unProcessedCode code to be processed
 * @returns processed code
 */
function performPreProcessing(unProcessedCode) {
    let processedCode = codeRefactoring.pipeLine(unProcessedCode);
    let higherOrderMethodCount = allMethodsCount(processedCode) - classMethodsCount(processedCode);
    if (higherOrderMethodCount == 0) {
        setBehaviours(true, false);
        server_1.connection.console.log(`Setup Behaviour`);
        server_1.connection.console.log("PreProcessing complete!");
        return pStandards.setupBehaviour(processedCode);
    }
    setBehaviours(false, true);
    server_1.connection.console.log(`Method Behaviour`);
    server_1.connection.console.log("PreProcessing complete!");
    return pStandards.methodBehaviour(processedCode);
}
/**
 * Provides the current behaviour type of a sketch
 * @returns Behavoir type
 */
function getBehavoirType() {
    return behaviourType;
}
/**
 * Change the current behaviour type of a sketch
 * @param _b1 default behaviour
 * @param _b2 method behavior
 */
function setBehaviours(_b1, _b2) {
    behaviourType = {
        defaultEnabled: _b1,
        methodEnabled: _b2
    };
}
/**
 * Counts all methods inside all classes
 * @param code Code to count the amount of methods form
 * @returns Amount of methods inside classes
 */
function classMethodsCount(code) {
    let classMethodNames = [];
    let tokenArray = parser.parseAST(code);
    tokenArray.forEach(function (token, index) {
        if (token[1] instanceof JavaParser_1.MethodDeclarationContext) {
            classMethodNames.push(token[0].text);
        }
    });
    return classMethodNames.length;
}
/**
 * Counts all methods in the code
 * @param code Code to count the amount of methods form
 * @returns Amount of methods
 */
function allMethodsCount(code) {
    let allMethodNames = [];
    let unProcessedLineSplit = code.split(`\n`);
    unProcessedLineSplit.forEach(function (line) {
        let methodName;
        if (methodName = pStandards.methodPattern.exec(line)) {
            allMethodNames.push(methodName[1]);
        }
    });
    return allMethodNames.length;
}
//# sourceMappingURL=preprocessing.js.map